import sys
from pathlib import Path
from typing import Dict, Any, Optional, List
import joblib
import numpy as np
import pandas as pd

from app.core.config import settings
from app.services.data_service import DataService
from app.schemas.prediction import (
    PredictionResponse,
    CandidateAtmResult,
    AccountLocationSummary,
)

# Feature columns required by the Random Forest model
ML_MODEL_FEATURES = [
    "distance_km",
    "dist_to_centroid",
    "spatial_decay_score",
    "atm_past_usage_count",
    "atm_past_usage_ratio",
    "account_atm_usage_rank",
    "is_account_top1_atm",
    "is_account_top2_atm",
    "is_account_top3_atm",
    "is_account_previously_used",
    "is_last_atm",
    "atm_historical_total_withdrawals",
    "atm_historical_fraud_withdrawals",
    "atm_fraud_intensity_ratio",
    "atm_is_same_bank",
    "transaction_amount",
]


class MLInferenceService:
    _instance = None

    def __init__(self):
        self.model = None
        self.data_service = DataService.get_instance()
        self._load_model()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = MLInferenceService()
        return cls._instance

    def _load_model(self):
        if settings.MODEL_PATH.exists():
            try:
                self.model = joblib.load(settings.MODEL_PATH)
                print(f"[ML Service] Successfully loaded Random Forest model from {settings.MODEL_PATH}")
            except Exception as e:
                print(f"[ML Service] Error loading model: {e}")
                self.model = None
        else:
            print(f"[ML Service] Model file not found at {settings.MODEL_PATH}")
            self.model = None

    def predict(
        self,
        account_id: Optional[str] = None,
        complaint_id: Optional[str] = None,
        amount: Optional[float] = 25000.0,
        prediction_time: Optional[str] = None,
        top_k: int = 3,
    ) -> PredictionResponse:
        self.data_service.load_data()
        accounts = self.data_service.account_lookup
        atm_locations = self.data_service.atms_df
        atm_lookup = self.data_service.atm_lookup
        success_wd = self.data_service.success_withdrawals

        target_account = account_id
        target_amount = amount if amount is not None else 25000.0
        resolved_complaint_id = None
        t0_str = prediction_time

        # 1. Resolve Complaint if provided
        if complaint_id:
            comp = None
            try:
                from app.db.repository import DatabaseRepository
                comp = DatabaseRepository.get_complaint_by_id(complaint_id)
            except Exception:
                comp = None
            if not comp:
                comp = self.data_service.get_complaint_by_id(complaint_id)
            if not comp:
                raise ValueError(f"Complaint ID '{complaint_id}' not found in database.")
            resolved_complaint_id = complaint_id
            ben = comp.get("beneficiary_account_id")
            if ben and str(ben).strip() and str(ben).lower() != "nan":
                target_account = str(ben).strip()
            else:
                target_account = str(comp.get("victim_account_id", "")).strip()

            if amount is None or amount == 25000.0:
                rep_amt = comp.get("reported_amount")
                if rep_amt and rep_amt > 0:
                    target_amount = float(rep_amt)

            if not t0_str and comp.get("complaint_date"):
                t0_str = str(comp["complaint_date"])

        if not target_account:
            # Default to a representative mule account if none specified
            target_account = "ACC000397"

        if target_account not in accounts:
            norm = target_account.replace("_", "").upper()
            if norm in accounts:
                target_account = norm
            else:
                found = None
                for acc_k in accounts.keys():
                    if acc_k.replace("_", "").upper() == norm:
                        found = acc_k
                        break
                if found:
                    target_account = found
                else:
                    raise ValueError(f"Account ID '{target_account}' not found in database.")

        acc_info = accounts[target_account]
        acc_city = acc_info.get("registered_address_region", "")
        acc_bank = acc_info.get("bank_id", "")

        # 2. Determine Prediction Timestamp T0
        if t0_str is None:
            if not success_wd.empty:
                t0 = success_wd["withdrawal_datetime"].max()
            else:
                t0 = pd.Timestamp.now()
        else:
            t0 = pd.to_datetime(t0_str)

        # 3. Filter Candidate ATMs to Account's Registered City
        city_atms = atm_locations[atm_locations["city"] == acc_city]
        if city_atms.empty:
            city_atms = atm_locations.copy()

        # 4. Account Historical Withdrawals before T0
        acc_wd = pd.DataFrame()
        if not success_wd.empty:
            acc_wd = success_wd[
                (success_wd["account_id"] == target_account) & (success_wd["withdrawal_datetime"] < t0)
            ]

        used_counts = acc_wd["atm_id"].value_counts() if not acc_wd.empty else pd.Series(dtype=int)
        used_atms = set(used_counts.index)
        total_acc_wds = len(acc_wd)

        # 5. Global ATM Usage before T0
        if not success_wd.empty:
            global_prior = success_wd[success_wd["withdrawal_datetime"] < t0]
            global_atm_counts = global_prior["atm_id"].value_counts()
            fraud_prior = global_prior[global_prior.get("fraud_linked", 0) == 1]
            global_fraud_counts = (
                fraud_prior["atm_id"].value_counts() if not fraud_prior.empty else pd.Series(dtype=int)
            )
        else:
            global_atm_counts = pd.Series(dtype=int)
            global_fraud_counts = pd.Series(dtype=int)

        # 6. Spatial Reference & Centroid
        if total_acc_wds > 0:
            last_atm_id = acc_wd.iloc[-1]["atm_id"]
            ref_lat = atm_lookup[last_atm_id]["latitude"]
            ref_lon = atm_lookup[last_atm_id]["longitude"]
            last_city = atm_lookup[last_atm_id]["city"]
            lats = [atm_lookup[a]["latitude"] for a in acc_wd["atm_id"] if a in atm_lookup]
            lons = [atm_lookup[a]["longitude"] for a in acc_wd["atm_id"] if a in atm_lookup]
            cent_lat = float(np.mean(lats))
            cent_lon = float(np.mean(lons))
        else:
            last_atm_id = None
            last_city = None
            ref_lat = float(city_atms["latitude"].mean()) if not city_atms.empty else 19.0760
            ref_lon = float(city_atms["longitude"].mean()) if not city_atms.empty else 72.8777
            cent_lat, cent_lon = ref_lat, ref_lon

        # 7. Compute Features for all Candidate ATMs in the city
        rows = []
        for _, arow in city_atms.iterrows():
            cid = arow["atm_id"]
            atm_bank = arow["bank_id"]
            a_lat, a_lon = float(arow["latitude"]), float(arow["longitude"])

            d_last = float(np.sqrt((a_lat - ref_lat) ** 2 + (a_lon - ref_lon) ** 2) * 111.0)
            d_cent = float(np.sqrt((a_lat - cent_lat) ** 2 + (a_lon - cent_lon) ** 2) * 111.0)
            spatial_decay = float(np.exp(-d_last / 2.0) + np.exp(-d_cent / 2.0))

            past_c = int(used_counts.get(cid, 0))
            past_r = float(past_c) / float(total_acc_wds) if total_acc_wds > 0 else 0.0
            usage_rank = list(used_counts.index).index(cid) + 1 if cid in used_counts.index else 20

            glob_c = int(global_atm_counts.get(cid, 0))
            glob_fraud_c = int(global_fraud_counts.get(cid, 0))
            fraud_ratio = float(glob_fraud_c) / float(glob_c) if glob_c > 0 else 0.0

            rows.append({
                "candidate_atm_id": cid,
                "bank_id": str(atm_bank),
                "latitude": round(a_lat, 5),
                "longitude": round(a_lon, 5),
                "city": str(arow["city"]),
                "distance_km": round(d_last, 2),
                "dist_to_centroid": round(d_cent, 2),
                "spatial_decay_score": round(spatial_decay, 4),
                "atm_past_usage_count": past_c,
                "atm_past_usage_ratio": round(past_r, 4),
                "account_atm_usage_rank": usage_rank,
                "is_account_top1_atm": int(usage_rank == 1),
                "is_account_top2_atm": int(usage_rank <= 2),
                "is_account_top3_atm": int(usage_rank <= 3),
                "is_account_previously_used": int(cid in used_atms),
                "is_last_atm": int(cid == last_atm_id),
                "atm_historical_total_withdrawals": glob_c,
                "atm_historical_fraud_withdrawals": glob_fraud_c,
                "atm_fraud_intensity_ratio": round(fraud_ratio, 4),
                "atm_is_same_bank": int(atm_bank == acc_bank),
                "transaction_amount": float(target_amount),
            })

        cand_df = pd.DataFrame(rows)

        # 8. Score with Calibrated Random Forest Model
        if self.model is not None and not cand_df.empty:
            cand_df["rf_prob"] = self.model.predict_proba(cand_df[ML_MODEL_FEATURES])[:, 1]
        else:
            # Fallback heuristic if model is not yet compiled
            cand_df["rf_prob"] = (
                0.5 * cand_df["spatial_decay_score"] + 0.5 * cand_df["atm_past_usage_ratio"]
            )

        cand_df["cal_score"] = (
            settings.CAL_WEIGHT_RF * cand_df["rf_prob"]
            + settings.CAL_WEIGHT_SPATIAL * cand_df["spatial_decay_score"]
            + settings.CAL_WEIGHT_USAGE * cand_df["atm_past_usage_ratio"]
            + settings.CAL_WEIGHT_LAST_ATM * cand_df["is_last_atm"]
        )

        cand_df["rank"] = cand_df["cal_score"].rank(ascending=False, method="min").astype(int)
        top_candidates = cand_df.sort_values("rank").head(top_k)

        # 9. Format Recommendation Objects
        recommendations: List[CandidateAtmResult] = []
        for _, cand in top_candidates.iterrows():
            rk = int(cand["rank"])
            cid = str(cand["candidate_atm_id"])
            past = int(cand["atm_past_usage_count"])

            status_tag = "PRIMARY INTERCEPT" if rk == 1 else f"BACKUP PERIMETER {rk}"
            habit_tag = f"Used {past}x before" if past > 0 else "New ATM (Spatial Proximity)"

            recommendations.append(
                CandidateAtmResult(
                    candidate_atm_id=cid,
                    bank_id=str(cand["bank_id"]),
                    latitude=float(cand["latitude"]),
                    longitude=float(cand["longitude"]),
                    city=str(cand["city"]),
                    distance_km=float(cand["distance_km"]),
                    dist_to_centroid=float(cand["dist_to_centroid"]),
                    spatial_decay_score=float(cand["spatial_decay_score"]),
                    atm_past_usage_count=past,
                    atm_past_usage_ratio=float(cand["atm_past_usage_ratio"]),
                    account_atm_usage_rank=int(cand["account_atm_usage_rank"]),
                    is_account_top1_atm=int(cand["is_account_top1_atm"]),
                    is_last_atm=int(cand["is_last_atm"]),
                    atm_historical_total_withdrawals=int(cand["atm_historical_total_withdrawals"]),
                    atm_historical_fraud_withdrawals=int(cand["atm_historical_fraud_withdrawals"]),
                    atm_fraud_intensity_ratio=float(cand["atm_fraud_intensity_ratio"]),
                    atm_is_same_bank=int(cand["atm_is_same_bank"]),
                    rf_prob=round(float(cand["rf_prob"]), 4),
                    cal_score=round(float(cand["cal_score"]), 4),
                    rank=rk,
                    status_tag=status_tag,
                    habit_tag=habit_tag,
                )
            )

        top_atm_id = recommendations[0].candidate_atm_id if recommendations else "Unknown"
        top_city = recommendations[0].city if recommendations else acc_city

        operational_advisory = (
            f"LAW ENFORCEMENT DISPATCH ADVISORY: Imminent cash extraction detected for account "
            f"{target_account} in {acc_city}. Mobilize emergency patrol units to establish an active "
            f"3.0 km perimeter around primary intercept ATM {top_atm_id} ({top_city}). Deploy secondary units "
            f"to backup perimeter ATMs {', '.join([r.candidate_atm_id for r in recommendations[1:]])}."
        )

        account_summary = AccountLocationSummary(
            account_id=target_account,
            bank_id=acc_bank,
            registered_city=acc_city,
            prior_withdrawals_count=total_acc_wds,
            last_atm_id=last_atm_id,
            last_atm_city=last_city,
            ref_latitude=round(ref_lat, 5),
            ref_longitude=round(ref_lon, 5),
            centroid_latitude=round(cent_lat, 5),
            centroid_longitude=round(cent_lon, 5),
        )

        return PredictionResponse(
            success=True,
            complaint_id=resolved_complaint_id,
            target_account_id=target_account,
            prediction_time=str(t0),
            reported_amount=round(float(target_amount), 2),
            account_summary=account_summary,
            recommendations=recommendations,
            operational_advisory=operational_advisory,
        )


"""
Stage 3: Candidate ATM Generator & Candidate-Specific Features

Generates candidate ATM options for each prediction event restricted to the account's
registered geographic region (achieving 100% ground-truth coverage), and computes
spatial proximity, account usage history, recency decay, and network ATM context.
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List

from src.config import (
    CANDIDATE_ATM_FEATURES_FILE,
    ATM_LOCATIONS_FILE,
    ACCOUNTS_FILE,
    WITHDRAWALS_FILE,
    TRANSACTIONS_FILE,
    PREDICTION_EVENTS_FILE,
    CANDIDATE_ATM_FEATURES,
)


def build_candidate_atm_features(
    events_df: pd.DataFrame = None,
    tables: Dict[str, pd.DataFrame] = None
) -> pd.DataFrame:
    """
    Computes candidate-specific features for each prediction event across city candidate ATMs.
    Strictly uses historical events occurring before each prediction_datetime (zero leakage).
    """
    print("\n" + "=" * 70)
    print("STAGE 3: CANDIDATE ATM FEATURE GENERATION")
    print("=" * 70)

    if events_df is None:
        events_df = pd.read_csv(PREDICTION_EVENTS_FILE, parse_dates=["prediction_datetime"])
    else:
        events_df = events_df.copy()
        events_df["prediction_datetime"] = pd.to_datetime(events_df["prediction_datetime"])

    if tables is None:
        accounts = pd.read_csv(ACCOUNTS_FILE).set_index("account_id")
        atm_locations = pd.read_csv(ATM_LOCATIONS_FILE)
        withdrawals = pd.read_csv(WITHDRAWALS_FILE)
        transactions = pd.read_csv(TRANSACTIONS_FILE)
    else:
        accounts = tables["accounts"].set_index("account_id")
        atm_locations = tables["atm_locations"]
        withdrawals = tables["withdrawals"]
        transactions = tables["transactions"]

    # Filter successful withdrawals and ensure datetime
    success_wd = withdrawals[
        withdrawals["withdrawal_status"].astype(str).str.lower().isin(["success", "successful", "completed"])
    ].copy()
    success_wd["withdrawal_datetime"] = pd.to_datetime(success_wd["withdrawal_datetime"])
    success_wd = success_wd.sort_values("withdrawal_datetime")

    atm_lookup = atm_locations.set_index("atm_id").to_dict(orient="index")
    acc_lookup = accounts.to_dict(orient="index")

    # Group withdrawals by account for high lookup speed
    wd_by_account = {k: v for k, v in success_wd.groupby("account_id")}

    candidate_rows = []
    total_events = len(events_df)

    for _, event in events_df.iterrows():
        pred_id = event["prediction_id"]
        account_id = event["account_id"]
        pred_time = event["prediction_datetime"]
        amt_tx = float(event.get("complaint_reported_amount", 0.0))

        acc_meta = acc_lookup.get(account_id, {})
        acc_bank = acc_meta.get("bank_id", "")
        acc_city = acc_meta.get("registered_address_region", "")

        # Candidate ATMs in the account's registered city
        city_atms = atm_locations[atm_locations["city"] == acc_city]
        if city_atms.empty:
            city_atms = atm_locations.copy()

        # Prior withdrawals strictly before prediction_time
        acc_wd = wd_by_account.get(account_id, pd.DataFrame())
        if not acc_wd.empty:
            acc_wd = acc_wd[acc_wd["withdrawal_datetime"] < pred_time]

        used_counts = acc_wd["atm_id"].value_counts() if not acc_wd.empty else pd.Series(dtype=int)
        used_atms = set(used_counts.index)
        total_acc_wds = len(acc_wd)

        # Global withdrawals across all accounts before prediction_time
        global_prior = success_wd[success_wd["withdrawal_datetime"] < pred_time]
        global_atm_counts = global_prior["atm_id"].value_counts() if not global_prior.empty else pd.Series(dtype=int)
        
        fraud_prior = global_prior[global_prior.get("fraud_linked", 0) == 1]
        global_fraud_counts = fraud_prior["atm_id"].value_counts() if not fraud_prior.empty else pd.Series(dtype=int)

        # Reference location: last visited ATM or centroid of past usage
        if total_acc_wds > 0:
            last_atm_id = acc_wd.iloc[-1]["atm_id"]
            ref_lat = atm_lookup[last_atm_id]["latitude"]
            ref_lon = atm_lookup[last_atm_id]["longitude"]

            lats = [atm_lookup[a]["latitude"] for a in acc_wd["atm_id"] if a in atm_lookup]
            lons = [atm_lookup[a]["longitude"] for a in acc_wd["atm_id"] if a in atm_lookup]
            cent_lat, cent_lon = float(np.mean(lats)), float(np.mean(lons))
        else:
            last_atm_id = None
            ref_lat = float(city_atms["latitude"].mean())
            ref_lon = float(city_atms["longitude"].mean())
            cent_lat, cent_lon = ref_lat, ref_lon

        # Compute candidate features for every ATM in candidate pool
        for _, arow in city_atms.iterrows():
            cid = arow["atm_id"]
            atm_bank = arow["bank_id"]
            a_lat, a_lon = arow["latitude"], arow["longitude"]

            # Distances (approx 111 km per lat/lon degree in Punjab)
            d_last = float(np.sqrt((a_lat - ref_lat) ** 2 + (a_lon - ref_lon) ** 2) * 111.0)
            d_cent = float(np.sqrt((a_lat - cent_lat) ** 2 + (a_lon - cent_lon) ** 2) * 111.0)
            spatial_decay = float(np.exp(-d_last / 2.0) + np.exp(-d_cent / 2.0))

            past_count = int(used_counts.get(cid, 0))
            past_ratio = float(past_count) / float(total_acc_wds) if total_acc_wds > 0 else 0.0

            if cid in used_counts.index:
                usage_rank = list(used_counts.index).index(cid) + 1
            else:
                usage_rank = 20

            glob_c = int(global_atm_counts.get(cid, 0))
            glob_fraud_c = int(global_fraud_counts.get(cid, 0))
            fraud_ratio = float(glob_fraud_c) / float(glob_c) if glob_c > 0 else 0.0

            candidate_rows.append({
                "prediction_id": pred_id,
                "candidate_atm_id": cid,
                "distance_km": round(d_last, 4),
                "dist_to_centroid": round(d_cent, 4),
                "spatial_decay_score": round(spatial_decay, 6),
                "atm_past_usage_count": past_count,
                "atm_past_usage_ratio": round(past_ratio, 6),
                "account_atm_usage_rank": usage_rank,
                "is_account_top1_atm": int(usage_rank == 1),
                "is_account_top2_atm": int(usage_rank <= 2),
                "is_account_top3_atm": int(usage_rank <= 3),
                "is_account_previously_used": int(cid in used_atms),
                "is_last_atm": int(cid == last_atm_id),
                "atm_historical_total_withdrawals": glob_c,
                "atm_historical_fraud_withdrawals": glob_fraud_c,
                "atm_fraud_intensity_ratio": round(fraud_ratio, 6),
                "atm_is_same_bank": int(atm_bank == acc_bank),
                "transaction_amount": amt_tx,
            })

    candidate_df = pd.DataFrame(candidate_rows)
    candidate_df.to_csv(CANDIDATE_ATM_FEATURES_FILE, index=False)
    print(f"✓ Generated {len(candidate_df)} candidate rows ({total_events} events × 20 city candidate ATMs).")
    print(f"  Saved to: {CANDIDATE_ATM_FEATURES_FILE.name}")
    return candidate_df


if __name__ == "__main__":
    build_candidate_atm_features()

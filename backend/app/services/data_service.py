import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from app.core.config import settings


class DataService:
    _instance = None

    def __init__(self):
        self.accounts_df: Optional[pd.DataFrame] = None
        self.atms_df: Optional[pd.DataFrame] = None
        self.complaints_df: Optional[pd.DataFrame] = None
        self.withdrawals_df: Optional[pd.DataFrame] = None
        self.metrics_data: Dict[str, Any] = {}
        self.feature_importance_df: Optional[pd.DataFrame] = None

        self.atm_lookup: Dict[str, Dict[str, Any]] = {}
        self.account_lookup: Dict[str, Dict[str, Any]] = {}
        self.atm_stats: Dict[str, Dict[str, Any]] = {}
        self._loaded = False

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = DataService()
            cls._instance.load_data()
        return cls._instance

    def load_data(self):
        if self._loaded:
            return

        # 1. Accounts
        if settings.ACCOUNTS_FILE.exists():
            self.accounts_df = pd.read_csv(settings.ACCOUNTS_FILE)
            self.account_lookup = self.accounts_df.set_index("account_id").to_dict(orient="index")
        else:
            self.accounts_df = pd.DataFrame()

        # 2. ATMs
        if settings.ATM_LOCATIONS_FILE.exists():
            self.atms_df = pd.read_csv(settings.ATM_LOCATIONS_FILE)
            self.atm_lookup = self.atms_df.set_index("atm_id").to_dict(orient="index")
        else:
            self.atms_df = pd.DataFrame()

        # 3. Withdrawals
        if settings.WITHDRAWALS_FILE.exists():
            self.withdrawals_df = pd.read_csv(settings.WITHDRAWALS_FILE)
            self.withdrawals_df["withdrawal_datetime"] = pd.to_datetime(self.withdrawals_df["withdrawal_datetime"])
            # Success withdrawals
            mask_success = self.withdrawals_df["withdrawal_status"].astype(str).str.lower().isin(
                ["success", "successful", "completed"]
            )
            self.success_withdrawals = self.withdrawals_df[mask_success].sort_values("withdrawal_datetime")
        else:
            self.withdrawals_df = pd.DataFrame()
            self.success_withdrawals = pd.DataFrame()

        # 4. Complaints
        if settings.COMPLAINTS_FILE.exists():
            self.complaints_df = pd.read_csv(settings.COMPLAINTS_FILE)
            self.complaints_df["reported_amount"] = pd.to_numeric(
                self.complaints_df["reported_amount"], errors="coerce"
            ).fillna(0.0)
            if not self.accounts_df.empty and "beneficiary_account_id" in self.complaints_df.columns:
                city_map = self.accounts_df.set_index("account_id")["registered_address_region"].to_dict()
                self.complaints_df["beneficiary_city"] = self.complaints_df["beneficiary_account_id"].map(city_map).fillna("Unknown")
        else:
            self.complaints_df = pd.DataFrame()

        # Compute ATM-level aggregate stats (fraud counts, intensity)
        if not self.atms_df.empty:
            fraud_wds = (
                self.withdrawals_df[self.withdrawals_df.get("fraud_linked", 0) == 1]
                if "fraud_linked" in self.withdrawals_df.columns
                else pd.DataFrame()
            )
            total_counts = (
                self.withdrawals_df["atm_id"].value_counts().to_dict()
                if not self.withdrawals_df.empty
                else {}
            )
            fraud_counts = (
                fraud_wds["atm_id"].value_counts().to_dict()
                if not fraud_wds.empty
                else {}
            )

            for atm_id in self.atm_lookup:
                tot = int(total_counts.get(atm_id, 0))
                frd = int(fraud_counts.get(atm_id, 0))
                ratio = float(frd) / float(tot) if tot > 0 else 0.0
                self.atm_stats[atm_id] = {
                    "total_withdrawals": tot,
                    "fraud_withdrawals": frd,
                    "fraud_intensity_ratio": round(ratio, 4),
                }

        # 5. Metrics & Feature Importance
        if settings.METRICS_FILE.exists():
            with open(settings.METRICS_FILE, "r") as f:
                self.metrics_data = json.load(f)

        if settings.FEATURE_IMPORTANCE_FILE.exists():
            self.feature_importance_df = pd.read_csv(settings.FEATURE_IMPORTANCE_FILE)
        else:
            self.feature_importance_df = pd.DataFrame()

        self._loaded = True

    def get_complaints(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        city: Optional[str] = None,
        fraud_type: Optional[str] = None,
    ) -> Dict[str, Any]:
        df = self.complaints_df.copy()
        if df.empty:
            return {"total": 0, "skip": skip, "limit": limit, "complaints": []}

        # Enrich with beneficiary city if available
        def resolve_city(ben_id):
            if pd.isna(ben_id):
                return "Unknown"
            acc = self.account_lookup.get(str(ben_id).strip())
            return acc.get("registered_address_region", "Unknown") if acc else "Unknown"

        if "beneficiary_city" not in df.columns:
            df["beneficiary_city"] = df["beneficiary_account_id"].apply(resolve_city)

        if search:
            s = search.strip().lower()
            mask = (
                df["complaint_id"].astype(str).str.lower().str.contains(s)
                | df["beneficiary_account_id"].astype(str).str.lower().str.contains(s)
                | df["victim_account_id"].astype(str).str.lower().str.contains(s)
                | df["fraud_type"].astype(str).str.lower().str.contains(s)
            )
            df = df[mask]

        if city:
            df = df[df["beneficiary_city"].str.lower() == city.lower()]

        if fraud_type:
            df = df[df["fraud_type"].str.lower() == fraud_type.lower()]

        total = len(df)
        page = df.iloc[skip : skip + limit]

        items = []
        for _, row in page.iterrows():
            items.append({
                "complaint_id": str(row["complaint_id"]),
                "complaint_date": str(row["complaint_date"]),
                "fraud_type": str(row["fraud_type"]),
                "reported_amount": float(row["reported_amount"]),
                "victim_account_id": str(row["victim_account_id"]) if not pd.isna(row["victim_account_id"]) else None,
                "transaction_id": str(row["transaction_id"]) if not pd.isna(row["transaction_id"]) else None,
                "beneficiary_account_id": str(row["beneficiary_account_id"]) if not pd.isna(row["beneficiary_account_id"]) else None,
                "beneficiary_upi_id": str(row["beneficiary_upi_id"]) if not pd.isna(row["beneficiary_upi_id"]) else None,
                "complaint_status": str(row.get("complaint_status", "OPEN")),
                "linked_fraud_account": str(row["linked_fraud_account"]) if not pd.isna(row.get("linked_fraud_account")) else None,
                "beneficiary_city": str(row["beneficiary_city"]),
            })

        return {"total": total, "skip": skip, "limit": limit, "complaints": items}

    def get_complaint_by_id(self, complaint_id: str) -> Optional[Dict[str, Any]]:
        if self.complaints_df.empty:
            return None
        match = self.complaints_df[self.complaints_df["complaint_id"] == complaint_id]
        if match.empty:
            return None
        row = match.iloc[0]
        ben = str(row["beneficiary_account_id"]).strip() if not pd.isna(row["beneficiary_account_id"]) else None
        ben_city = "Unknown"
        if ben and ben in self.account_lookup:
            ben_city = self.account_lookup[ben].get("registered_address_region", "Unknown")

        return {
            "complaint_id": str(row["complaint_id"]),
            "complaint_date": str(row["complaint_date"]),
            "fraud_type": str(row["fraud_type"]),
            "reported_amount": float(row["reported_amount"]),
            "victim_account_id": str(row["victim_account_id"]) if not pd.isna(row["victim_account_id"]) else None,
            "transaction_id": str(row["transaction_id"]) if not pd.isna(row["transaction_id"]) else None,
            "beneficiary_account_id": ben,
            "beneficiary_upi_id": str(row["beneficiary_upi_id"]) if not pd.isna(row["beneficiary_upi_id"]) else None,
            "complaint_status": str(row.get("complaint_status", "OPEN")),
            "linked_fraud_account": str(row["linked_fraud_account"]) if not pd.isna(row.get("linked_fraud_account")) else None,
            "beneficiary_city": ben_city,
        }

    def create_complaint(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register a new cybercrime complaint and persist to complaints dataframe and disk.
        """
        from datetime import datetime

        # 1. Generate or validate complaint_id
        c_id = data.get("complaint_id")
        if not c_id or not str(c_id).strip():
            num_ids = [
                int(str(x).replace("COMP", ""))
                for x in self.complaints_df["complaint_id"]
                if str(x).startswith("COMP") and str(x).replace("COMP", "").isdigit()
            ]
            max_id = max(num_ids) if num_ids else 360
            c_id = f"COMP{max_id + 1:06d}"
        else:
            c_id = str(c_id).strip().upper()

        # 2. Date
        c_date = data.get("complaint_date")
        if not c_date or not str(c_date).strip():
            c_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 3. Resolve beneficiary details
        ben_id = str(data.get("beneficiary_account_id", "")).strip()
        ben_upi = data.get("beneficiary_upi_id")
        if not ben_upi and ben_id in self.account_lookup:
            ben_upi = self.account_lookup[ben_id].get("upi_id")
        if not ben_upi:
            clean_digits = "".join(filter(str.isdigit, ben_id)) or "9999"
            ben_upi = f"user{clean_digits}@syntheticupi"

        # 4. Resolve city
        ben_city = data.get("beneficiary_city")
        if not ben_city and ben_id in self.account_lookup:
            ben_city = self.account_lookup[ben_id].get("registered_address_region", "Punjab")
        if not ben_city:
            ben_city = "Punjab"

        # 5. Build record
        record = {
            "complaint_id": c_id,
            "complaint_date": str(c_date),
            "fraud_type": str(data.get("fraud_type", "UPI fraud")),
            "reported_amount": float(data.get("reported_amount", 25000.0)),
            "victim_account_id": str(data.get("victim_account_id", "ACC000001")),
            "transaction_id": str(data.get("transaction_id", "")) if data.get("transaction_id") else None,
            "beneficiary_account_id": ben_id,
            "beneficiary_upi_id": str(ben_upi),
            "complaint_status": str(data.get("complaint_status", "unresolved")),
            "linked_fraud_account": str(data.get("linked_fraud_account", "1")),
            "beneficiary_city": ben_city,
        }

        # 6. Prepend to self.complaints_df so it shows up immediately at the top
        new_df = pd.DataFrame([record])
        if self.complaints_df.empty:
            self.complaints_df = new_df
        else:
            self.complaints_df = pd.concat([new_df, self.complaints_df], ignore_index=True)

        # 7. Persist to disk (raw CSV)
        try:
            if settings.COMPLAINTS_FILE.exists():
                disk_cols = [
                    "complaint_id", "complaint_date", "fraud_type", "reported_amount",
                    "victim_account_id", "transaction_id", "beneficiary_account_id",
                    "beneficiary_upi_id", "complaint_status", "linked_fraud_account"
                ]
                save_row = pd.DataFrame([{col: record.get(col) for col in disk_cols}])
                save_row.to_csv(settings.COMPLAINTS_FILE, mode="a", header=False, index=False)
        except Exception as e:
            print("Warning: could not append to complaints.csv:", e)

        return record

    def get_accounts(
        self,
        skip: int = 0,
        limit: int = 50,
        search: Optional[str] = None,
        city: Optional[str] = None,
        only_fraud: bool = False,
    ) -> Dict[str, Any]:
        df = self.accounts_df.copy()
        if df.empty:
            return {"total": 0, "skip": skip, "limit": limit, "accounts": []}

        if only_fraud and "is_fraud_confirmed" in df.columns:
            df = df[df["is_fraud_confirmed"] == 1]

        if search:
            s = search.strip().lower()
            mask = (
                df["account_id"].astype(str).str.lower().str.contains(s)
                | df["bank_id"].astype(str).str.lower().str.contains(s)
                | df["registered_address_region"].astype(str).str.lower().str.contains(s)
            )
            df = df[mask]

        if city:
            df = df[df["registered_address_region"].str.lower() == city.lower()]

        total = len(df)
        page = df.iloc[skip : skip + limit]

        # Withdrawals count per account
        acc_wd_counts = (
            self.withdrawals_df["account_id"].value_counts().to_dict()
            if not self.withdrawals_df.empty
            else {}
        )
        acc_wd_totals = (
            self.withdrawals_df.groupby("account_id")["withdrawal_amount"].sum().to_dict()
            if not self.withdrawals_df.empty and "withdrawal_amount" in self.withdrawals_df.columns
            else {}
        )

        items = []
        for _, row in page.iterrows():
            aid = str(row["account_id"])
            items.append({
                "account_id": aid,
                "bank_id": str(row.get("bank_id", "")),
                "account_type": str(row.get("account_type", "")),
                "account_status": str(row.get("account_status", "")),
                "registered_address_region": str(row.get("registered_address_region", "")),
                "is_fraud_confirmed": int(row.get("is_fraud_confirmed", 0)),
                "upi_id": str(row.get("upi_id", "")) if not pd.isna(row.get("upi_id")) else None,
                "historical_withdrawals_count": int(acc_wd_counts.get(aid, 0)),
                "total_withdrawn_amount": float(acc_wd_totals.get(aid, 0.0)),
            })

        return {"total": total, "skip": skip, "limit": limit, "accounts": items}

    def get_account_detail(self, account_id: str) -> Optional[Dict[str, Any]]:
        acc = self.account_lookup.get(account_id)
        if not acc:
            return None

        # Gather withdrawals
        wds = []
        if not self.withdrawals_df.empty:
            acc_wds = self.withdrawals_df[self.withdrawals_df["account_id"] == account_id].sort_values(
                "withdrawal_datetime", ascending=False
            )
            for _, r in acc_wds.iterrows():
                atm_id = str(r["atm_id"])
                atm_info = self.atm_lookup.get(atm_id, {})
                wds.append({
                    "withdrawal_id": str(r["withdrawal_id"]),
                    "account_id": account_id,
                    "atm_id": atm_id,
                    "withdrawal_datetime": str(r["withdrawal_datetime"]),
                    "amount": float(r.get("withdrawal_amount", 0.0)),
                    "withdrawal_status": str(r.get("withdrawal_status", "Success")),
                    "atm_city": atm_info.get("city", "Unknown"),
                    "latitude": float(atm_info.get("latitude", 0.0)) if atm_info else None,
                    "longitude": float(atm_info.get("longitude", 0.0)) if atm_info else None,
                })

        account_item = {
            "account_id": account_id,
            "bank_id": str(acc.get("bank_id", "")),
            "account_type": str(acc.get("account_type", "")),
            "account_status": str(acc.get("account_status", "")),
            "registered_address_region": str(acc.get("registered_address_region", "")),
            "is_fraud_confirmed": int(acc.get("is_fraud_confirmed", 0)),
            "upi_id": str(acc.get("upi_id", "")) if not pd.isna(acc.get("upi_id")) else None,
            "historical_withdrawals_count": len(wds),
            "total_withdrawn_amount": sum(w["amount"] for w in wds),
        }

        return {"account": account_item, "withdrawals": wds}

    def get_atms(self, city: Optional[str] = None) -> Dict[str, Any]:
        df = self.atms_df.copy()
        if df.empty:
            return {"total": 0, "cities": [], "atms": []}

        cities = sorted(df["city"].dropna().unique().tolist())
        if city:
            df = df[df["city"].str.lower() == city.lower()]

        items = []
        for _, row in df.iterrows():
            atm_id = str(row["atm_id"])
            st = self.atm_stats.get(atm_id, {})
            items.append({
                "atm_id": atm_id,
                "bank_id": str(row["bank_id"]),
                "city": str(row["city"]),
                "state": str(row.get("state", "")),
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "atm_status": str(row.get("atm_status", "Active")),
                "pincode": int(row["pincode"]) if "pincode" in row and not pd.isna(row["pincode"]) else None,
                "historical_withdrawals_count": st.get("total_withdrawals", 0),
                "fraud_withdrawals_count": st.get("fraud_withdrawals", 0),
                "fraud_intensity_ratio": st.get("fraud_intensity_ratio", 0.0),
            })

        return {"total": len(items), "cities": cities, "atms": items}

    def get_dashboard_stats(self) -> Dict[str, Any]:
        total_complaints = len(self.complaints_df) if not self.complaints_df.empty else 0
        total_mules = (
            len(self.accounts_df[self.accounts_df.get("is_fraud_confirmed", 0) == 1])
            if not self.accounts_df.empty
            else 0
        )
        total_atms = len(self.atms_df) if not self.atms_df.empty else 0
        total_cities = len(self.atms_df["city"].unique()) if not self.atms_df.empty else 0
        total_fraud_volume = (
            float(self.complaints_df["reported_amount"].sum())
            if not self.complaints_df.empty and "reported_amount" in self.complaints_df.columns
            else 0.0
        )

        high_risk_atms = sum(
            1 for s in self.atm_stats.values() if s.get("fraud_intensity_ratio", 0) >= 0.10
        )

        # Feature importances
        fi_list = []
        if not self.feature_importance_df.empty:
            for _, r in self.feature_importance_df.sort_values("importance", ascending=False).iterrows():
                fi_list.append({
                    "feature": str(r["feature"]),
                    "importance": round(float(r["importance"]), 4),
                })

        # City distribution
        city_dist = (
            self.complaints_df["beneficiary_city"].value_counts().to_dict()
            if "beneficiary_city" in self.complaints_df.columns
            else {}
        )
        # Fraud types
        fraud_dist = (
            self.complaints_df["fraud_type"].value_counts().to_dict()
            if "fraud_type" in self.complaints_df.columns
            else {}
        )

        # Per-city rich intelligence details
        city_details = {}
        color_map = {
            "Jalandhar": {"fill": "#d4e9a8", "risk": "CRITICAL RISK", "rank": 1},
            "Kapurthala": {"fill": "#b5d2a1", "risk": "HIGH RISK", "rank": 2},
            "Phagwara": {"fill": "#9fc58f", "risk": "HIGH RISK", "rank": 3},
            "Ludhiana": {"fill": "#7ca980", "risk": "ELEVATED RISK", "rank": 4},
            "Amritsar": {"fill": "#5e8b6a", "risk": "ELEVATED RISK", "rank": 5},
            "Hoshiarpur": {"fill": "#3e6b54", "risk": "MODERATE RISK", "rank": 6},
        }

        if not self.atms_df.empty:
            for city_name in self.atms_df["city"].unique():
                c_comps = self.complaints_df[self.complaints_df["beneficiary_city"] == city_name] if "beneficiary_city" in self.complaints_df.columns else pd.DataFrame()
                c_atms = self.atms_df[self.atms_df["city"] == city_name]
                c_atm_ids = set(c_atms["atm_id"].tolist())
                
                # Withdrawals in this city
                c_with = self.withdrawals_df[self.withdrawals_df["atm_id"].isin(c_atm_ids)] if not self.withdrawals_df.empty else pd.DataFrame()
                c_fraud_with = c_with[c_with.get("fraud_linked", 0) == 1] if not c_with.empty else pd.DataFrame()

                reported_amt = float(c_comps["reported_amount"].sum()) if not c_comps.empty else 0.0
                fraud_cashout = float(c_fraud_with["amount"].sum()) if not c_fraud_with.empty else 0.0
                
                cfg = color_map.get(city_name, {"fill": "#7ca980", "risk": "MONITORED", "rank": 99})

                city_details[city_name] = {
                    "city": city_name,
                    "complaints_count": len(c_comps),
                    "reported_fraud_amount": round(reported_amt, 2),
                    "atm_count": len(c_atms),
                    "fraud_withdrawals_count": len(c_fraud_with),
                    "fraud_cashout_volume": round(fraud_cashout, 2),
                    "risk_level": cfg["risk"],
                    "fill_color": cfg["fill"],
                    "rank": cfg["rank"],
                }

        return {
            "total_complaints": total_complaints,
            "total_mule_accounts": total_mules,
            "total_atms": total_atms,
            "total_cities": total_cities,
            "high_risk_atms_count": high_risk_atms,
            "total_fraud_volume": round(total_fraud_volume, 2),
            "evaluation_metrics": self.metrics_data,
            "feature_importances": fi_list,
            "city_distribution": city_dist,
            "fraud_type_distribution": fraud_dist,
            "city_details": city_details,
        }


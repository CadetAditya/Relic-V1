"""
RELIC Operational Inference CLI
Enables law enforcement officers and cybercrime investigators to input an account ID
or complaint ID and immediately obtain the Top-3 predicted ATMs for imminent cash withdrawal.
"""

import argparse
import sys
from pathlib import Path
import numpy as np
import pandas as pd
import joblib

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    from ml.pipeline.config import (
        ACCOUNTS_FILE,
        ATM_LOCATIONS_FILE,
        WITHDRAWALS_FILE,
        TRANSACTIONS_FILE,
        COMPLAINTS_FILE,
        OUTPUTS_DIR,
        ML_MODEL_FEATURES,
        CAL_WEIGHT_RF,
        CAL_WEIGHT_SPATIAL,
        CAL_WEIGHT_USAGE,
        CAL_WEIGHT_LAST_ATM,
    )
except ImportError:
    from src.config import (
        ACCOUNTS_FILE,
        ATM_LOCATIONS_FILE,
        WITHDRAWALS_FILE,
        TRANSACTIONS_FILE,
        COMPLAINTS_FILE,
        OUTPUTS_DIR,
        ML_MODEL_FEATURES,
        CAL_WEIGHT_RF,
        CAL_WEIGHT_SPATIAL,
        CAL_WEIGHT_USAGE,
        CAL_WEIGHT_LAST_ATM,
    )


def predict_for_account(
    account_id: str,
    prediction_time: str = None,
    amount: float = 25000.0,
    top_k: int = 3
):
    """
    Predicts the top-k most likely ATMs for a given account at prediction_time.
    """
    # Check both ml/artifacts and data/outputs
    model_path = OUTPUTS_DIR / "random_forest_model.joblib"
    if not model_path.exists():
        fallback = PROJECT_ROOT / "data" / "outputs" / "random_forest_model.joblib"
        if fallback.exists():
            model_path = fallback
        else:
            print(f"Error: Trained model not found at {model_path}. Run 'python ml/train.py' first.")
            sys.exit(1)

    model = joblib.load(model_path)

    # Load lookup tables
    accounts = pd.read_csv(ACCOUNTS_FILE).set_index("account_id")
    atm_locations = pd.read_csv(ATM_LOCATIONS_FILE)
    withdrawals = pd.read_csv(WITHDRAWALS_FILE)
    
    withdrawals["withdrawal_datetime"] = pd.to_datetime(withdrawals["withdrawal_datetime"])
    success_wd = withdrawals[
        withdrawals["withdrawal_status"].astype(str).str.lower().isin(["success", "successful", "completed"])
    ].sort_values("withdrawal_datetime")

    if account_id not in accounts.index:
        print(f"Error: Account ID '{account_id}' not found in accounts database.")
        sys.exit(1)

    acc_info = accounts.loc[account_id]
    acc_city = acc_info.get("registered_address_region", "")
    acc_bank = acc_info.get("bank_id", "")

    if prediction_time is None:
        t0 = success_wd["withdrawal_datetime"].max()
    else:
        t0 = pd.to_datetime(prediction_time)

    # Filter candidate ATMs to account's registered city
    city_atms = atm_locations[atm_locations["city"] == acc_city]
    if city_atms.empty:
        city_atms = atm_locations.copy()

    atm_lookup = atm_locations.set_index("atm_id").to_dict(orient="index")

    # Account's historical withdrawals before t0
    acc_wd = success_wd[(success_wd["account_id"] == account_id) & (success_wd["withdrawal_datetime"] < t0)]
    used_counts = acc_wd["atm_id"].value_counts()
    used_atms = set(used_counts.index)
    total_acc_wds = len(acc_wd)

    # Global ATM usage before t0
    global_prior = success_wd[success_wd["withdrawal_datetime"] < t0]
    global_atm_counts = global_prior["atm_id"].value_counts()
    fraud_prior = global_prior[global_prior.get("fraud_linked", 0) == 1]
    global_fraud_counts = fraud_prior["atm_id"].value_counts() if not fraud_prior.empty else pd.Series(dtype=int)

    # Reference location
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

    rows = []
    for _, arow in city_atms.iterrows():
        cid = arow["atm_id"]
        atm_bank = arow["bank_id"]
        a_lat, a_lon = arow["latitude"], arow["longitude"]

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
            "bank_id": atm_bank,
            "latitude": a_lat,
            "longitude": a_lon,
            "city": arow["city"],
            "distance_km": round(d_last, 2),
            "dist_to_centroid": round(d_cent, 2),
            "spatial_decay_score": spatial_decay,
            "atm_past_usage_count": past_c,
            "atm_past_usage_ratio": past_r,
            "account_atm_usage_rank": usage_rank,
            "is_account_top1_atm": int(usage_rank == 1),
            "is_account_top2_atm": int(usage_rank <= 2),
            "is_account_top3_atm": int(usage_rank <= 3),
            "is_account_previously_used": int(cid in used_atms),
            "is_last_atm": int(cid == last_atm_id),
            "atm_historical_total_withdrawals": glob_c,
            "atm_historical_fraud_withdrawals": glob_fraud_c,
            "atm_fraud_intensity_ratio": fraud_ratio,
            "atm_is_same_bank": int(atm_bank == acc_bank),
            "transaction_amount": float(amount),
        })

    cand_df = pd.DataFrame(rows)

    # Score with model
    cand_df["rf_prob"] = model.predict_proba(cand_df[ML_MODEL_FEATURES])[:, 1]
    cand_df["cal_score"] = (
        CAL_WEIGHT_RF * cand_df["rf_prob"] +
        CAL_WEIGHT_SPATIAL * cand_df["spatial_decay_score"] +
        CAL_WEIGHT_USAGE * cand_df["atm_past_usage_ratio"] +
        CAL_WEIGHT_LAST_ATM * cand_df["is_last_atm"]
    )
    cand_df["rank"] = cand_df["cal_score"].rank(ascending=False, method="min")
    top_candidates = cand_df.sort_values("rank").head(top_k)

    # Print formatted operational dispatch advisory
    print("\n" + "=" * 76)
    print("      RELIC LAW ENFORCEMENT DISPATCH ADVISORY: TOP-3 ATM PREDICTIONS      ")
    print("=" * 76)
    print(f"Target Account:     {account_id} ({acc_bank})")
    print(f"Registered City:    {acc_city}")
    print(f"Prediction Time:    {t0}")
    print(f"Reported Amount:    ₹{amount:,.2f}")
    print(f"Prior Withdrawals:  {total_acc_wds} historical ATM transactions")
    if last_atm_id:
        print(f"Last Visited ATM:   {last_atm_id} ({atm_lookup[last_atm_id]['city']})")
    print("-" * 76)
    print("RECOMMENDED INTERCEPTION LOCATIONS (RANKED BY CALIBRATED PROBABILITY):")
    print("-" * 76)

    for _, cand in top_candidates.iterrows():
        rk = int(cand["rank"])
        cid = cand["candidate_atm_id"]
        cbank = cand["bank_id"]
        dist = cand["distance_km"]
        past = int(cand["atm_past_usage_count"])
        prob = cand["cal_score"] * 100.0
        rf_p = cand["rf_prob"] * 100.0
        lat = cand["latitude"]
        lon = cand["longitude"]
        city = cand["city"]
        
        status_tag = "PRIMARY INTERCEPT" if rk == 1 else f"BACKUP PERIMETER {rk}"
        habit_tag = f"Used {past}x before" if past > 0 else "New ATM (Spatial Proximity)"
        
        print(f"\n[RANK {rk}] ★ {status_tag} -> {cid} ({cbank})")
        print(f"       Location:   {city} (Lat: {lat:.5f}, Lon: {lon:.5f})")
        print(f"       Distance:   {dist:.2f} km from last known position")
        print(f"       Habit:      {habit_tag}")
        print(f"       Confidence: Calibrated Score: {prob:.1f}% (RF Prob: {rf_p:.1f}%)")

    print("\n" + "=" * 76)
    print("OPERATIONAL ADVISORY: Deploy mobile patrol units within a 3.0 km radius")
    print(f"of {top_candidates.iloc[0]['candidate_atm_id']} for immediate suspect apprehension.")
    print("=" * 76 + "\n")

    return top_candidates


def main():
    parser = argparse.ArgumentParser(description="RELIC Cybercrime ATM Withdrawal Location Predictor")
    parser.add_argument("--account_id", type=str, default=None, help="Account ID of the suspected mule account (e.g., ACC000397)")
    parser.add_argument("--complaint_id", type=str, default=None, help="Complaint ID (e.g., COMP000009) to automatically resolve suspect account and amount")
    parser.add_argument("--amount", type=float, default=None, help="Amount reported or suspected for withdrawal in INR (e.g., 50000)")
    parser.add_argument("--top_k", type=int, default=3, help="Number of candidate ATMs to recommend (default 3)")
    args = parser.parse_args()

    target_account = args.account_id
    target_amount = args.amount
    pred_time = None

    if args.complaint_id:
        complaints = pd.read_csv(COMPLAINTS_FILE)
        match = complaints[complaints["complaint_id"] == args.complaint_id]
        if match.empty:
            print(f"Error: Complaint ID '{args.complaint_id}' not found in complaints database.")
            sys.exit(1)
        row = match.iloc[0]
        ben = str(row.get("beneficiary_account_id", "")).strip()
        if ben and ben.lower() != "nan":
            target_account = ben
        else:
            target_account = str(row.get("victim_account_id", "")).strip()
        
        if target_amount is None and "reported_amount" in row and not pd.isna(row["reported_amount"]):
            target_amount = float(row["reported_amount"])
        if "complaint_date" in row and not pd.isna(row["complaint_date"]):
            pred_time = str(row["complaint_date"])

    if target_account is None:
        target_account = "ACC000397"
    if target_amount is None:
        target_amount = 25000.0

    predict_for_account(
        account_id=target_account,
        prediction_time=pred_time,
        amount=target_amount,
        top_k=args.top_k
    )


if __name__ == "__main__":
    main()


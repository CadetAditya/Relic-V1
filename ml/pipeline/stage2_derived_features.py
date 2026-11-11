"""
Stage 2: Derived Features Engine

Extracts prediction events from cybercrime complaints / fraud credits and calculates
the 34 derived behavioural features defined in D.pdf strictly using data available
before each prediction timestamp (no future data leakage).
"""

import numpy as np
import pandas as pd
from typing import Dict, Any, List

try:
    from ml.pipeline.config import (
        PREDICTION_EVENTS_FILE,
        DERIVED_ACCOUNT_FEATURES_FILE,
        ALL_DERIVED_SPEC_FEATURES,
        RECENT_ACTIVITY_WINDOW_MINUTES,
        FAST_WITHDRAWAL_THRESHOLD_MINUTES,
        SAME_DAY_WITHDRAWAL_THRESHOLD_MINUTES,
        NIGHT_START_HOUR,
        NIGHT_END_HOUR,
    )
    from ml.pipeline.stage1_raw_loader import load_and_validate_raw_tables
except ImportError:
    from src.config import (
        PREDICTION_EVENTS_FILE,
        DERIVED_ACCOUNT_FEATURES_FILE,
        ALL_DERIVED_SPEC_FEATURES,
        RECENT_ACTIVITY_WINDOW_MINUTES,
        FAST_WITHDRAWAL_THRESHOLD_MINUTES,
        SAME_DAY_WITHDRAWAL_THRESHOLD_MINUTES,
        NIGHT_START_HOUR,
        NIGHT_END_HOUR,
    )
    from src.stage1_raw_loader import load_and_validate_raw_tables


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Safe division preventing ZeroDivisionError and NaN propagation."""
    if denominator == 0 or pd.isna(denominator) or pd.isna(numerator):
        return default
    return float(numerator) / float(denominator)


def extract_prediction_events(tables: Dict[str, pd.DataFrame]) -> pd.DataFrame:
    """
    Extracts prediction events for supervised learning and behavioral feature derivation.
    Connects incoming fraud credits to subsequent ATM cash extractions, enriched with
    complaints metadata from complaints.csv.
    Ensures prediction timestamp T is the incoming credit moment, strictly prior
    to the ATM cash withdrawal (zero data leakage).
    """
    complaints = tables["complaints"]
    withdrawals = tables["withdrawals"]
    transactions = tables["transactions"]
    
    # 1. Episodes with explicit fraud transaction link in withdrawals
    wd_linked = withdrawals[withdrawals["transaction_id"].notna()].copy()
    merged = wd_linked.merge(
        transactions,
        on="transaction_id",
        suffixes=("_wd", "_tx")
    ).sort_values("transaction_datetime").reset_index(drop=True)
    
    # Lookup for complaints by transaction_id or beneficiary account
    comp_tx_lookup = (
        complaints.dropna(subset=["transaction_id"])
        .drop_duplicates("transaction_id")
        .set_index("transaction_id")
        .to_dict("index")
    )
    comp_acc_lookup = (
        complaints.dropna(subset=["beneficiary_account_id"])
        .drop_duplicates("beneficiary_account_id")
        .set_index("beneficiary_account_id")
        .to_dict("index")
    )
    
    events = []
    for idx, row in merged.iterrows():
        tx_id = row["transaction_id"]
        acc_id = row["account_id"]
        pred_time = row["transaction_datetime"]
        target_wd_time = row["withdrawal_datetime"]
        
        # Link complaint details where available
        comp_info = comp_tx_lookup.get(tx_id, comp_acc_lookup.get(acc_id, {}))
        comp_id = comp_info.get("complaint_id", f"COMP_{tx_id}")
        fraud_type = comp_info.get("fraud_type", "cybercrime_mule_transfer")
        reported_amt = comp_info.get("reported_amount", row["amount_tx"])
        victim_acc = comp_info.get("victim_account_id", row.get("sender_account_id", ""))
        
        events.append({
            "prediction_id": f"P{idx + 1:04d}",
            "complaint_id": comp_id,
            "account_id": acc_id,
            "victim_account_id": victim_acc,
            "prediction_datetime": pred_time,
            "complaint_reported_amount": reported_amt,
            "complaint_fraud_type": fraud_type,
            "linked_transaction_id": tx_id,
            "has_next_withdrawal": True,
            "target_atm_id": row["atm_id"],
            "target_withdrawal_id": row["withdrawal_id"],
            "target_withdrawal_datetime": target_wd_time,
            "target_withdrawal_amount": row["amount_wd"],
        })
        
    events_df = pd.DataFrame(events)
    events_df.to_csv(PREDICTION_EVENTS_FILE, index=False)
    print(f"✓ Extracted {len(events_df)} chronological prediction events (all with confirmed ground-truth next withdrawal).")
    return events_df


def compute_derived_features_for_event(
    account_id: str,
    prediction_time: pd.Timestamp,
    linked_tx_id: str,
    acc_row: pd.Series,
    tx_by_receiver: Dict[str, pd.DataFrame],
    tx_by_sender: Dict[str, pd.DataFrame],
    all_tx_by_acc: Dict[str, pd.DataFrame],
    wd_by_account: Dict[str, pd.DataFrame],
    comp_by_account: Dict[str, pd.DataFrame],
) -> Dict[str, Any]:
    """
    Computes the 34 features specified in D.pdf for one account at prediction_time.
    Uses ONLY events strictly prior to prediction_time.
    """
    # --------------------------------------------------------------------------
    # 1. Historical Data Slicing (strictly <= prediction_time)
    # --------------------------------------------------------------------------
    # Incoming transactions (credit)
    in_tx = tx_by_receiver.get(account_id, pd.DataFrame())
    if not in_tx.empty:
        in_tx = in_tx[in_tx["transaction_datetime"] <= prediction_time]
        
    # Outgoing transactions (debit)
    out_tx = tx_by_sender.get(account_id, pd.DataFrame())
    if not out_tx.empty:
        out_tx = out_tx[out_tx["transaction_datetime"] <= prediction_time]
        
    # All account transactions
    all_acc_tx = all_tx_by_acc.get(account_id, pd.DataFrame())
    if not all_acc_tx.empty:
        all_acc_tx = all_acc_tx[all_acc_tx["transaction_datetime"] <= prediction_time]

    # Account withdrawals (strictly before prediction_time)
    acc_wd = wd_by_account.get(account_id, pd.DataFrame())
    if not acc_wd.empty:
        acc_wd = acc_wd[acc_wd["withdrawal_datetime"] < prediction_time]

    # Account complaints
    acc_comp = comp_by_account.get(account_id, pd.DataFrame())
    if not acc_comp.empty:
        acc_comp = acc_comp[acc_comp["complaint_date"] <= prediction_time]

    # --------------------------------------------------------------------------
    # 2. Account Features (10 features)
    # --------------------------------------------------------------------------
    acc_open_date = acc_row.get("account_open_date", pd.NaT)
    if pd.notna(acc_open_date):
        account_age_days = (prediction_time - pd.to_datetime(acc_open_date)).days
    else:
        account_age_days = np.nan

    incoming_transaction_count = len(in_tx)
    outgoing_transaction_count = len(out_tx)
    unique_sender_count = in_tx["sender_account_id"].nunique() if not in_tx.empty else 0
    unique_receiver_count = out_tx["receiver_account_id"].nunique() if not out_tx.empty else 0
    total_amount_received = float(in_tx["amount"].sum()) if not in_tx.empty else 0.0
    total_amount_sent = float(out_tx["amount"].sum()) if not out_tx.empty else 0.0
    average_received_amount = safe_divide(total_amount_received, incoming_transaction_count)
    average_sent_amount = safe_divide(total_amount_sent, outgoing_transaction_count)
    complaint_count = len(acc_comp)

    # --------------------------------------------------------------------------
    # 3. Current Transaction Features (7 features)
    # --------------------------------------------------------------------------
    # Find relevant transaction: linked_tx_id if present, else latest transaction
    curr_tx = None
    if linked_tx_id and not all_acc_tx.empty:
        match = all_acc_tx[all_acc_tx["transaction_id"] == linked_tx_id]
        if not match.empty:
            curr_tx = match.iloc[-1]
            
    if curr_tx is None and not all_acc_tx.empty:
        curr_tx = all_acc_tx.iloc[-1]

    if curr_tx is not None:
        # Latest balance available at prediction time
        current_amount = float(curr_tx["balance_after"])
        transaction_channel = str(curr_tx["transaction_type"])
        curr_tx_time = curr_tx["transaction_datetime"]
        transaction_hour = curr_tx_time.hour
        transaction_day = curr_tx_time.dayofweek
        
        # Time since previous transaction
        if len(all_acc_tx) >= 2:
            prev_tx_time = all_acc_tx.iloc[-2]["transaction_datetime"]
            time_since_previous_transaction = max(0.0, (curr_tx_time - prev_tx_time).total_seconds() / 60.0)
        else:
            time_since_previous_transaction = np.nan
            
        # Is sender new to this account?
        curr_sender = curr_tx.get("sender_account_id", "")
        if curr_sender and not in_tx.empty and len(in_tx) > 1:
            prior_senders = set(in_tx.iloc[:-1]["sender_account_id"])
            sender_is_new = int(curr_sender not in prior_senders)
        else:
            sender_is_new = 1
    else:
        current_amount = 0.0
        transaction_channel = "UNKNOWN"
        transaction_hour = prediction_time.hour
        transaction_day = prediction_time.dayofweek
        time_since_previous_transaction = np.nan
        sender_is_new = 1

    current_amount_vs_avg_received = safe_divide(current_amount, average_received_amount)

    # --------------------------------------------------------------------------
    # 4. Withdrawal Behaviour Features (9 features)
    # --------------------------------------------------------------------------
    previous_withdrawal_count = len(acc_wd)
    total_withdrawal_amount = float(acc_wd["amount"].sum()) if not acc_wd.empty else 0.0
    average_withdrawal_amount = safe_divide(total_withdrawal_amount, previous_withdrawal_count)
    unique_atm_count = acc_wd["atm_id"].nunique() if not acc_wd.empty else 0

    if not acc_wd.empty:
        atm_counts = acc_wd["atm_id"].value_counts()
        most_frequent_atm_ratio = float(atm_counts.iloc[0]) / previous_withdrawal_count
        
        last_wd_time = acc_wd.iloc[-1]["withdrawal_datetime"]
        time_since_last_withdrawal = max(0.0, (prediction_time - last_wd_time).total_seconds() / 60.0)
        
        wd_hours = acc_wd["withdrawal_datetime"].dt.hour
        typical_withdrawal_hour = float(wd_hours.mode().iloc[0])
        night_withdrawals = ((wd_hours < NIGHT_END_HOUR) | (wd_hours >= NIGHT_START_HOUR)).sum()
        night_withdrawal_ratio = float(night_withdrawals) / previous_withdrawal_count
        
        if len(acc_wd) >= 2:
            wd_times_sorted = acc_wd["withdrawal_datetime"].sort_values()
            gaps = (wd_times_sorted.diff().dt.total_seconds() / 60.0).dropna()
            average_time_between_withdrawals = float(gaps.mean())
        else:
            average_time_between_withdrawals = np.nan
    else:
        most_frequent_atm_ratio = 0.0
        time_since_last_withdrawal = np.nan
        average_time_between_withdrawals = np.nan
        typical_withdrawal_hour = np.nan
        night_withdrawal_ratio = 0.0

    # --------------------------------------------------------------------------
    # 5. Receive -> Withdrawal Behaviour (4 features)
    # --------------------------------------------------------------------------
    receive_to_withdraw_deltas = []
    if not in_tx.empty and not acc_wd.empty:
        in_tx_sorted = in_tx.sort_values("transaction_datetime")
        for _, wd_row in acc_wd.iterrows():
            wd_t = wd_row["withdrawal_datetime"]
            prior_deposits = in_tx_sorted[in_tx_sorted["transaction_datetime"] <= wd_t]
            if not prior_deposits.empty:
                latest_dep_t = prior_deposits.iloc[-1]["transaction_datetime"]
                delta_m = (wd_t - latest_dep_t).total_seconds() / 60.0
                if delta_m >= 0:
                    receive_to_withdraw_deltas.append(delta_m)

    if receive_to_withdraw_deltas:
        avg_receive_to_withdraw_time = float(np.mean(receive_to_withdraw_deltas))
        fast_withdrawal_ratio = float(np.mean(np.array(receive_to_withdraw_deltas) <= FAST_WITHDRAWAL_THRESHOLD_MINUTES))
        same_day_withdrawal_ratio = float(np.mean(np.array(receive_to_withdraw_deltas) <= SAME_DAY_WITHDRAWAL_THRESHOLD_MINUTES))
    else:
        avg_receive_to_withdraw_time = np.nan
        fast_withdrawal_ratio = 0.0
        same_day_withdrawal_ratio = 0.0

    received_to_withdrawal_ratio = safe_divide(total_withdrawal_amount, total_amount_received)

    # --------------------------------------------------------------------------
    # 6. Recent Activity Features (4 features)
    # --------------------------------------------------------------------------
    recent_cutoff = prediction_time - pd.Timedelta(minutes=RECENT_ACTIVITY_WINDOW_MINUTES)
    
    recent_in = in_tx[in_tx["transaction_datetime"] >= recent_cutoff] if not in_tx.empty else pd.DataFrame()
    recent_wd = acc_wd[acc_wd["withdrawal_datetime"] >= recent_cutoff] if not acc_wd.empty else pd.DataFrame()

    recent_incoming_count = len(recent_in)
    recent_incoming_amount = float(recent_in["amount"].sum()) if not recent_in.empty else 0.0
    recent_withdrawal_count = len(recent_wd)
    recent_withdrawal_amount = float(recent_wd["amount"].sum()) if not recent_wd.empty else 0.0

    return {
        # Account
        "account_age_days": account_age_days,
        "incoming_transaction_count": incoming_transaction_count,
        "outgoing_transaction_count": outgoing_transaction_count,
        "unique_sender_count": unique_sender_count,
        "unique_receiver_count": unique_receiver_count,
        "total_amount_received": total_amount_received,
        "total_amount_sent": total_amount_sent,
        "average_received_amount": average_received_amount,
        "average_sent_amount": average_sent_amount,
        "complaint_count": complaint_count,
        # Current Transaction
        "current_amount": current_amount,
        "transaction_channel": transaction_channel,
        "transaction_hour": transaction_hour,
        "transaction_day": transaction_day,
        "current_amount_vs_avg_received": current_amount_vs_avg_received,
        "time_since_previous_transaction": time_since_previous_transaction,
        "sender_is_new": sender_is_new,
        # Withdrawal Behaviour
        "previous_withdrawal_count": previous_withdrawal_count,
        "total_withdrawal_amount": total_withdrawal_amount,
        "average_withdrawal_amount": average_withdrawal_amount,
        "unique_atm_count": unique_atm_count,
        "most_frequent_atm_ratio": most_frequent_atm_ratio,
        "time_since_last_withdrawal": time_since_last_withdrawal,
        "average_time_between_withdrawals": average_time_between_withdrawals,
        "typical_withdrawal_hour": typical_withdrawal_hour,
        "night_withdrawal_ratio": night_withdrawal_ratio,
        # Receive -> Withdrawal Behaviour
        "avg_receive_to_withdraw_time": avg_receive_to_withdraw_time,
        "fast_withdrawal_ratio": fast_withdrawal_ratio,
        "same_day_withdrawal_ratio": same_day_withdrawal_ratio,
        "received_to_withdrawal_ratio": received_to_withdrawal_ratio,
        # Recent Activity
        "recent_incoming_count": recent_incoming_count,
        "recent_incoming_amount": recent_incoming_amount,
        "recent_withdrawal_count": recent_withdrawal_count,
        "recent_withdrawal_amount": recent_withdrawal_amount,
    }


def generate_all_derived_features(tables: Dict[str, pd.DataFrame] = None) -> pd.DataFrame:
    """
    Master function for Stage 2: builds the derived account features table for all
    extracted prediction events.
    """
    print("\n" + "=" * 70)
    print("STAGE 2: COMPUTING DERIVED BEHAVIOURAL FEATURES (D.PDF)")
    print("=" * 70)

    if tables is None:
        tables = load_and_validate_raw_tables(verbose=False)

    accounts_df = tables["accounts"].set_index("account_id")
    transactions = tables["transactions"]
    withdrawals = tables["withdrawals"]
    complaints = tables["complaints"]

    # Pre-index tables for high efficiency
    success_tx = transactions[transactions["_is_success"]]
    tx_by_receiver = {k: v for k, v in success_tx.groupby("receiver_account_id")}
    tx_by_sender = {k: v for k, v in success_tx.groupby("sender_account_id")}
    
    # Combined transactions per account (either sender or receiver)
    all_tx_by_acc = {}
    for acc_id in accounts_df.index:
        parts = []
        if acc_id in tx_by_receiver:
            parts.append(tx_by_receiver[acc_id])
        if acc_id in tx_by_sender:
            parts.append(tx_by_sender[acc_id])
        if parts:
            comb = pd.concat(parts).drop_duplicates(subset=["transaction_id"]).sort_values("transaction_datetime")
            all_tx_by_acc[acc_id] = comb

    success_wd = withdrawals[withdrawals["_is_success"]]
    wd_by_account = {k: v for k, v in success_wd.groupby("account_id")}
    comp_by_account = {k: v for k, v in complaints.groupby("beneficiary_account_id")}

    events_df = extract_prediction_events(tables)

    derived_rows = []
    for _, event in events_df.iterrows():
        pred_id = event["prediction_id"]
        acc_id = event["account_id"]
        pred_time = event["prediction_datetime"]
        linked_tx = event["linked_transaction_id"]
        acc_row = accounts_df.loc[acc_id] if acc_id in accounts_df.index else pd.Series()

        features = compute_derived_features_for_event(
            account_id=acc_id,
            prediction_time=pred_time,
            linked_tx_id=linked_tx,
            acc_row=acc_row,
            tx_by_receiver=tx_by_receiver,
            tx_by_sender=tx_by_sender,
            all_tx_by_acc=all_tx_by_acc,
            wd_by_account=wd_by_account,
            comp_by_account=comp_by_account,
        )
        features["prediction_id"] = pred_id
        features["account_id"] = acc_id
        features["prediction_datetime"] = pred_time
        derived_rows.append(features)

    derived_df = pd.DataFrame(derived_rows)
    # Ensure exact column ordering with prediction_id & account_id first
    cols = ["prediction_id", "account_id", "prediction_datetime"] + ALL_DERIVED_SPEC_FEATURES
    derived_df = derived_df[cols]
    
    derived_df.to_csv(DERIVED_ACCOUNT_FEATURES_FILE, index=False)
    print(f"✓ Generated derived feature table with {len(derived_df)} rows and {len(ALL_DERIVED_SPEC_FEATURES)} specification features.")
    print(f"  Saved to: {DERIVED_ACCOUNT_FEATURES_FILE.name}")
    return derived_df


if __name__ == "__main__":
    generate_all_derived_features()

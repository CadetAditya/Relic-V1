"""
Stage 4: ML Training Table Builder & Temporal Splitting

Pairs derived account and candidate features with the ground-truth target label
(target = 1 if candidate_atm == actual_next_atm else 0) and performs temporal
chronological splits (Train / Validation / Test) keeping prediction events intact.
"""

import pandas as pd
from typing import Tuple

from src.config import (
    PREDICTION_EVENTS_FILE,
    DERIVED_ACCOUNT_FEATURES_FILE,
    CANDIDATE_ATM_FEATURES_FILE,
    ML_TRAINING_TABLE_FILE,
    TRAIN_FILE,
    VAL_FILE,
    TEST_FILE,
    TRAIN_EVENTS_COUNT,
    TEST_EVENTS_COUNT,
    TARGET_COLUMN,
)


def build_ml_training_table() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """
    Constructs the candidate-level ML training table and splits it chronologically.
    """
    print("\n" + "=" * 70)
    print("STAGE 4: BUILDING ML TRAINING TABLE & TEMPORAL SPLITS")
    print("=" * 70)

    # 1. Load intermediate tables
    events_df = pd.read_csv(PREDICTION_EVENTS_FILE, parse_dates=["prediction_datetime"])
    account_features_df = pd.read_csv(DERIVED_ACCOUNT_FEATURES_FILE, parse_dates=["prediction_datetime"])
    candidate_features_df = pd.read_csv(CANDIDATE_ATM_FEATURES_FILE)

    # 2. Filter to events with a confirmed next withdrawal for supervised learning
    eligible_events = events_df[events_df["has_next_withdrawal"]].copy()
    print(f"✓ Filtering to {len(eligible_events)} eligible prediction events with observed next withdrawal.")

    # 3. Merge Account Features + Candidate ATM Features
    merged_df = candidate_features_df.merge(
        account_features_df,
        on="prediction_id",
        how="inner"
    )

    # 4. Attach Event Ground-Truth Metadata
    target_lookup = eligible_events.set_index("prediction_id")[
        ["target_atm_id", "target_withdrawal_id", "target_withdrawal_datetime", "target_withdrawal_amount"]
    ]
    
    # Keep only eligible events in the ML training dataset
    ml_df = merged_df[merged_df["prediction_id"].isin(eligible_events["prediction_id"])].copy()
    ml_df = ml_df.merge(target_lookup, on="prediction_id", how="left")

    # 5. Create Binary Supervised Target Label
    ml_df[TARGET_COLUMN] = (ml_df["candidate_atm_id"] == ml_df["target_atm_id"]).astype(int)

    # Reorder columns logically
    id_cols = [
        "prediction_id",
        "account_id",
        "prediction_datetime",
        "candidate_atm_id",
        "target_atm_id",
        "target_withdrawal_id",
        "target_withdrawal_datetime",
        "target_withdrawal_amount",
        TARGET_COLUMN,
    ]
    other_cols = [c for c in ml_df.columns if c not in id_cols]
    ml_df = ml_df[id_cols + other_cols]

    # Save full combined table
    ml_df.to_csv(ML_TRAINING_TABLE_FILE, index=False)
    print(f"✓ Full ML Training Table created: {len(ml_df)} candidate rows ({ml_df[TARGET_COLUMN].sum()} positive targets).")
    print(f"  Saved to: {ML_TRAINING_TABLE_FILE.name}")

    # 6. Chronological Temporal Split
    # Sort distinct prediction events strictly by prediction_datetime
    event_order = eligible_events.sort_values("prediction_datetime")["prediction_id"].tolist()
    total_events = len(event_order)

    train_end = TRAIN_EVENTS_COUNT
    test_end = TRAIN_EVENTS_COUNT + TEST_EVENTS_COUNT

    train_ids = set(event_order[:train_end])
    test_ids = set(event_order[train_end:test_end])
    val_ids = set(event_order[test_end:])

    train_df = ml_df[ml_df["prediction_id"].isin(train_ids)].copy()
    test_df = ml_df[ml_df["prediction_id"].isin(test_ids)].copy()
    val_df = ml_df[ml_df["prediction_id"].isin(val_ids)].copy()

    # Save splits
    train_df.to_csv(TRAIN_FILE, index=False)
    test_df.to_csv(TEST_FILE, index=False)
    val_df.to_csv(VAL_FILE, index=False)

    print(f"✓ Chronological Temporal Splits Generated:")
    print(f"  • Train Set: {len(train_ids)} events ({len(train_df)} rows) -> {TRAIN_FILE.name}")
    print(f"  • Test Set:  {len(test_ids)} events ({len(test_df)} rows) -> {TEST_FILE.name}")
    print(f"  • Val Set:   {len(val_ids)} events ({len(val_df)} rows) -> {VAL_FILE.name}")

    return ml_df, train_df, val_df, test_df


if __name__ == "__main__":
    build_ml_training_table()

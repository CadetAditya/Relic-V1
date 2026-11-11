"""
RELIC Configuration Module
Centralized configuration, file paths, feature categories, and hyperparameters.
"""

from pathlib import Path

# Base Paths
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
SPLITS_DIR = PROCESSED_DIR / "splits"
ML_DIR = PROJECT_ROOT / "ml"
ARTIFACTS_DIR = ML_DIR / "artifacts"
OUTPUTS_DIR = ARTIFACTS_DIR if ARTIFACTS_DIR.exists() else DATA_DIR / "outputs"

# Raw Data Files
ACCOUNTS_FILE = RAW_DIR / "accounts.csv"
ATM_LOCATIONS_FILE = RAW_DIR / "atm_locations.csv"
COMPLAINTS_FILE = RAW_DIR / "complaints.csv"
TRANSACTIONS_FILE = RAW_DIR / "transactions.csv"
WITHDRAWALS_FILE = RAW_DIR / "withdrawals.csv"

# Processed / Intermediate Files
PREDICTION_EVENTS_FILE = PROCESSED_DIR / "prediction_events.csv"
DERIVED_ACCOUNT_FEATURES_FILE = PROCESSED_DIR / "derived_account_features.csv"
CANDIDATE_ATM_FEATURES_FILE = PROCESSED_DIR / "candidate_atm_features.csv"
ML_TRAINING_TABLE_FILE = PROCESSED_DIR / "ml_training_table.csv"

# Split Files
TRAIN_FILE = SPLITS_DIR / "train.csv"
VAL_FILE = SPLITS_DIR / "val.csv"
TEST_FILE = SPLITS_DIR / "test.csv"

# Output Files
PREDICTIONS_RANKED_FILE = OUTPUTS_DIR / "test_predictions_ranked.csv"
TOP3_RECOMMENDATIONS_FILE = OUTPUTS_DIR / "top3_recommendations.csv"
FEATURE_IMPORTANCE_FILE = OUTPUTS_DIR / "feature_importance.csv"
EVALUATION_METRICS_FILE = OUTPUTS_DIR / "evaluation_metrics.json"

# ==============================================================================
# FEATURE CATEGORIES SPECIFIED IN D.PDF (ALL 34 DERIVED FEATURES)
# ==============================================================================

ACCOUNT_FEATURES = [
    "account_age_days",
    "incoming_transaction_count",
    "outgoing_transaction_count",
    "unique_sender_count",
    "unique_receiver_count",
    "total_amount_received",
    "total_amount_sent",
    "average_received_amount",
    "average_sent_amount",
    "complaint_count",
]

CURRENT_TRANSACTION_FEATURES = [
    "current_amount",
    "transaction_channel",
    "transaction_hour",
    "transaction_day",
    "current_amount_vs_avg_received",
    "time_since_previous_transaction",
    "sender_is_new",
]

WITHDRAWAL_BEHAVIOR_FEATURES = [
    "previous_withdrawal_count",
    "total_withdrawal_amount",
    "average_withdrawal_amount",
    "unique_atm_count",
    "most_frequent_atm_ratio",
    "time_since_last_withdrawal",
    "average_time_between_withdrawals",
    "typical_withdrawal_hour",
    "night_withdrawal_ratio",
]

RECEIVE_WITHDRAWAL_BEHAVIOR_FEATURES = [
    "avg_receive_to_withdraw_time",
    "fast_withdrawal_ratio",
    "same_day_withdrawal_ratio",
    "received_to_withdrawal_ratio",
]

RECENT_ACTIVITY_FEATURES = [
    "recent_incoming_count",
    "recent_incoming_amount",
    "recent_withdrawal_count",
    "recent_withdrawal_amount",
]

ALL_DERIVED_SPEC_FEATURES = (
    ACCOUNT_FEATURES
    + CURRENT_TRANSACTION_FEATURES
    + WITHDRAWAL_BEHAVIOR_FEATURES
    + RECEIVE_WITHDRAWAL_BEHAVIOR_FEATURES
    + RECENT_ACTIVITY_FEATURES
)

# Candidate ATM features (spatial proximity, account usage history, network context)
CANDIDATE_ATM_FEATURES = [
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

# Features passed into the candidate ranking ML model (X)
ML_MODEL_FEATURES = CANDIDATE_ATM_FEATURES

# Target column
TARGET_COLUMN = "target"

# Metadata / Key columns (not used directly as features in X)
IDENTIFIER_COLUMNS = [
    "prediction_id",
    "complaint_id",
    "account_id",
    "prediction_datetime",
    "candidate_atm_id",
    "target_atm_id",
    "target_withdrawal_id",
    "target_withdrawal_datetime",
]

# ==============================================================================
# PIPELINE HYPERPARAMETERS & CONSTANTS
# ==============================================================================

# Time window parameters (in minutes or hours)
RECENT_ACTIVITY_WINDOW_MINUTES = 24 * 60  # 24 hours
FAST_WITHDRAWAL_THRESHOLD_MINUTES = 60    # 1 hour
SAME_DAY_WITHDRAWAL_THRESHOLD_MINUTES = 24 * 60 # 1440 minutes / 24 hours
NIGHT_START_HOUR = 22
NIGHT_END_HOUR = 6

# Temporal chronological split event cutoffs (Total = 352 events)
# Train: first 254 events (Jan 2025 - Apr 2026, 72.2%)
# Test: next 52 events (Apr 2026 - Jul 2026, 14.8%)
# Val: remaining 46 events (Jul 2026 - Nov 2026, 13.0%)
TRAIN_EVENTS_COUNT = 254
TEST_EVENTS_COUNT = 52

# Random Forest parameters
RANDOM_STATE = 42
RF_N_ESTIMATORS = 300
RF_MAX_DEPTH = 10
RF_MIN_SAMPLES_SPLIT = 5
RF_MIN_SAMPLES_LEAF = 2
RF_CLASS_WEIGHT = None

# Probability & Prior Score Calibration Weights (Tuned on Historical Data)
CAL_WEIGHT_RF = 1.0
CAL_WEIGHT_SPATIAL = 0.10
CAL_WEIGHT_USAGE = 0.10
CAL_WEIGHT_LAST_ATM = 0.0

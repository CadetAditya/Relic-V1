"""
RELIC ML Master Pipeline Runner
Executes Stages 1 through 7 end-to-end:
  - Stage 1: Load & validate raw tables
  - Stage 2: Derive 34 behavioral features (Account, Transaction, Withdrawal, Receive-Withdrawal, Recent)
  - Stage 3: Candidate ATM generation & spatial/historical candidate features
  - Stage 4: Supervised labeling (target = 1/0) & chronological split (Train/Val/Test)
  - Stage 5: Train Random Forest classifier & extract feature importances
  - Stage 6 & 7: Candidate scoring, Top-3 predictions ranking, and comprehensive evaluation
"""

import sys
import time
from pathlib import Path

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.pipeline.stage1_raw_loader import load_and_validate_raw_tables
from ml.pipeline.stage2_derived_features import generate_all_derived_features
from ml.pipeline.stage3_candidate_generator import build_candidate_atm_features
from ml.pipeline.stage4_ml_dataset_builder import build_ml_training_table
from ml.pipeline.stage5_train_random_forest import train_random_forest
from ml.pipeline.stage6_evaluate_and_predict import evaluate_and_predict


def run_full_pipeline():
    start_time = time.time()
    print("=" * 75)
    print("      RELIC: FROM RAW TABLES TO RANDOM FOREST PREDICTIONS PIPELINE      ")
    print("=" * 75)

    # Stage 1: Load and Validate Raw Data
    tables = load_and_validate_raw_tables(verbose=True)

    # Stage 2: Derived Features (Account & Behavioural from D.pdf)
    derived_df = generate_all_derived_features(tables=tables)

    # Stage 3: Candidate ATM Features
    candidate_df = build_candidate_atm_features(tables=tables)

    # Stage 4: ML Training Table Construction & Temporal Splitting
    ml_df, train_df, val_df, test_df = build_ml_training_table()

    # Stage 5: Random Forest Classifier Training
    model, features = train_random_forest()

    # Stage 6 & 7: Model Evaluation, Ranking & Top-3 Recommendations
    metrics = evaluate_and_predict()

    elapsed = round(time.time() - start_time, 2)
    print("\n" + "=" * 75)
    print(f"PIPELINE COMPLETED SUCCESSFULLY IN {elapsed} SECONDS!")
    print("=" * 75)


if __name__ == "__main__":
    run_full_pipeline()


"""
Stage 5: Random Forest Model Training & Probability Calibration

Trains a Random Forest classifier on historical candidate examples to learn
non-linear patterns distinguishing true withdrawal ATMs from negative candidates.
Applies Isotonic probability calibration to yield accurate posterior probabilities.
"""

import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV

from src.config import (
    TRAIN_FILE,
    VAL_FILE,
    FEATURE_IMPORTANCE_FILE,
    OUTPUTS_DIR,
    ML_MODEL_FEATURES,
    TARGET_COLUMN,
    RF_N_ESTIMATORS,
    RF_MAX_DEPTH,
    RF_MIN_SAMPLES_SPLIT,
    RF_MIN_SAMPLES_LEAF,
    RF_CLASS_WEIGHT,
    RANDOM_STATE,
)


def train_random_forest():
    """
    Trains the Random Forest model with probability calibration and saves feature importances.
    """
    print("\n" + "=" * 70)
    print("STAGE 5: TRAINING RANDOM FOREST CLASSIFIER WITH CALIBRATION")
    print("=" * 70)

    train_df = pd.read_csv(TRAIN_FILE)
    val_df = pd.read_csv(VAL_FILE)

    # Validate feature presence
    available_features = [c for c in ML_MODEL_FEATURES if c in train_df.columns]
    print(f"✓ Training on {len(available_features)} candidate ranking features ({len(train_df)} candidate rows).")

    X_train = train_df[available_features]
    y_train = train_df[TARGET_COLUMN]

    # 1. Base Random Forest
    rf_base = RandomForestClassifier(
        n_estimators=RF_N_ESTIMATORS,
        max_depth=RF_MAX_DEPTH,
        min_samples_split=RF_MIN_SAMPLES_SPLIT,
        min_samples_leaf=RF_MIN_SAMPLES_LEAF,
        class_weight=RF_CLASS_WEIGHT,
        random_state=RANDOM_STATE,
        n_jobs=-1
    )

    print("Fitting Base Random Forest ensemble...")
    rf_base.fit(X_train, y_train)

    # 2. Probability Calibration with 3-fold cross validation
    print("Fitting Isotonic Probability Calibration...")
    calibrated_model = CalibratedClassifierCV(rf_base, cv=3, method="isotonic")
    calibrated_model.fit(X_train, y_train)
    print("✓ Model training and calibration complete.")

    # 3. Extract feature importances from the base Random Forest
    importances = rf_base.feature_importances_
    fi_df = pd.DataFrame({
        "feature": available_features,
        "importance": importances
    }).sort_values("importance", ascending=False)

    fi_df.to_csv(FEATURE_IMPORTANCE_FILE, index=False)
    print(f"✓ Feature importance exported to: {FEATURE_IMPORTANCE_FILE.name}")
    print("\nTop Predictive Features:")
    for rank, (_, row) in enumerate(fi_df.iterrows(), 1):
        print(f"  {rank:>2}. {row['feature']:<35} (importance = {row['importance']:.4f})")

    # 4. Save model
    model_path = OUTPUTS_DIR / "random_forest_model.joblib"
    joblib.dump(calibrated_model, model_path)
    print(f"\n✓ Calibrated model saved to: {model_path.name}")

    return calibrated_model, available_features


if __name__ == "__main__":
    train_random_forest()

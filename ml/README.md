# RELIC Machine Learning Core

This directory encapsulates all Machine Learning components for the **RELIC** Cybercrime Cash Extraction Location Prediction framework.

---

## Directory Organization

```
ml/
├── artifacts/                           # Serialized model & evaluation outputs
│   ├── random_forest_model.joblib       # Trained Calibrated Random Forest Model
│   ├── evaluation_metrics.json          # Test metrics (Recall@3: 88.46%, MRR: 0.648)
│   ├── feature_importance.csv           # Gini & permutation feature importances
│   ├── test_predictions_ranked.csv      # Ranked evaluation dataset
│   └── top3_recommendations.csv         # Top-3 predictions for test episodes
│
├── pipeline/                            # Modular pipeline stages (Stage 1 to 6)
│   ├── __init__.py
│   ├── config.py                        # Hyperparameters, feature subsets, file paths
│   ├── stage1_raw_loader.py             # Data loading & schema integrity checks
│   ├── stage2_derived_features.py       # 34 Behavioral & money-trail derived features
│   ├── stage3_candidate_generator.py    # City-level spatial decay & ATM candidate scoring
│   ├── stage4_ml_dataset_builder.py     # Supervised dataset construction & temporal split
│   ├── stage5_train_random_forest.py    # Random Forest training with isotonic probability calibration
│   └── stage6_evaluate_and_predict.py   # Test evaluation, ranking, Recall@k & MRR metrics
│
├── predict.py                           # Operational inference CLI for law enforcement
└── train.py                             # Master pipeline runner executing Stages 1-6
```

---

## Quick Usage

### 1. Run Real-Time ATM Prediction CLI
```bash
# Predict by mule account ID
python ml/predict.py --account_id ACC000397 --amount 25000

# Predict by cybercrime complaint ID (auto-resolves suspect account and amount)
python ml/predict.py --complaint_id COMP000009
```

### 2. Retrain ML Pipeline End-to-End
```bash
python ml/train.py
```


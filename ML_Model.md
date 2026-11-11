# RELIC: From Raw Tables to Random Forest Predictions

Predictive Analytics Framework for Cybercrime Complaints to Forecast Likely Cash Withdrawal Locations in Advance.

---

## 1. Project Directory Structure

```
SuperVised/
│
├── data/
│   ├── raw/                             # The 5 raw CSV tables + dataset metadata
│   │   ├── accounts.csv                 # 600 accounts across 6 regions
│   │   ├── atm_locations.csv            # 120 ATMs with coordinates & city tags
│   │   ├── complaints.csv               # 360 cybercrime complaints
│   │   ├── transactions.csv             # 14,008 inter-account money transfers
│   │   ├── withdrawals.csv              # 4,264 historical ATM withdrawals
│   │   └── dataset_summary.json         # Raw table metadata & statistics
│   │
│   ├── processed/                       # Derived tables & ML training datasets
│   │   ├── prediction_events.csv        # Extracted prediction moments (fraud transfer trigger)
│   │   ├── derived_account_features.csv # The 34 derived features from D.pdf
│   │   ├── candidate_atm_features.csv   # Candidate ATMs with spatial & past usage features
│   │   ├── ml_training_table.csv        # Final candidate-level ML table with target (0/1)
│   │   └── splits/                      # Chronological train/validation/test splits
│   │       ├── train.csv                # Historical events 1 to 254 (5,080 candidate rows)
│   │       ├── test.csv                 # Held-out evaluation events 255 to 306 (1,040 candidate rows)
│   │       └── val.csv                  # Out-of-time validation events 307 to 352 (920 candidate rows)
│   │
│   └── outputs/                         # Model predictions & evaluation artifacts
│       ├── test_predictions_ranked.csv  # All candidate ATMs ranked by calibrated probability
│       ├── top3_recommendations.csv     # Top 3 ATM recommendations per complaint
│       ├── feature_importance.csv       # Random Forest feature importance rankings
│       ├── random_forest_model.joblib   # Trained and calibrated Random Forest model
│       └── evaluation_metrics.json      # Final test set evaluation metrics
│
├── src/                                 # Modular Python source code
│   ├── __init__.py
│   ├── config.py                        # Centralized paths, feature lists & hyperparameters
│   ├── stage1_raw_loader.py             # Stage 1: Load, inspect & validate raw tables
│   ├── stage2_derived_features.py       # Stage 2: Feature engineering engine (34 features from D.pdf)
│   ├── stage3_candidate_generator.py    # Stage 3: Candidate ATM generation & spatial/usage features
│   ├── stage4_ml_dataset_builder.py     # Stage 4: Ground-truth labeling & temporal splits
│   ├── stage5_train_random_forest.py    # Stage 5: Random Forest training & probability calibration
│   └── stage6_evaluate_and_predict.py   # Stage 6: Scoring, Top-3 ranking, Recall@3, MRR, baseline comparison
│
├── predict_atm.py                       # Operational real-time CLI tool for law enforcement officers
├── run_pipeline.py                      # Master pipeline runner executing Stages 1-7 end-to-end
└── README.md                            # Complete pipeline documentation
```

---

## 2. The Four Stages

### Stage 1: Understanding Raw Tables & Relationships
- `complaints.csv` acts as the operational prediction trigger when a cybercrime complaint is logged.
- `accounts.csv`, `transactions.csv`, and `withdrawals.csv` provide the behavioral money trail.
- `atm_locations.csv` provides geographic coordinates for distance and spatial proximity modeling.
- The 352 fraudulent cash extraction episodes in `withdrawals.csv` (`transaction_id.notna()`) link the fraudulent credit transfer $T$ to the subsequent ATM cash extraction.

### Stage 2: Derived Behavioral Features (`D.pdf`)
Calculated using **strictly** events before prediction timestamp $T$ (zero future-data leakage):
- **A. Account Features (10 features)**: `account_age_days`, `incoming_transaction_count`, `outgoing_transaction_count`, `unique_sender_count`, `unique_receiver_count`, `total_amount_received`, `total_amount_sent`, `average_received_amount`, `average_sent_amount`, `complaint_count`.
- **B. Current Transaction Features (7 features)**: `current_amount`, `transaction_channel`, `transaction_hour`, `transaction_day`, `current_amount_vs_avg_received`, `time_since_previous_transaction`, `sender_is_new`.
- **C. Withdrawal Behavior (9 features)**: `previous_withdrawal_count`, `total_withdrawal_amount`, `average_withdrawal_amount`, `unique_atm_count`, `most_frequent_atm_ratio`, `time_since_last_withdrawal`, `average_time_between_withdrawals`, `typical_withdrawal_hour`, `night_withdrawal_ratio`.
- **D. Receive → Withdrawal Behavior (4 features)**: `avg_receive_to_withdraw_time`, `fast_withdrawal_ratio`, `same_day_withdrawal_ratio`, `received_to_withdrawal_ratio`.
- **E. Recent Activity (4 features)**: `recent_incoming_count`, `recent_incoming_amount`, `recent_withdrawal_count`, `recent_withdrawal_amount`.

Saved to: `data/processed/derived_account_features.csv`.

### Stage 3: Candidate ATM Features & Regional Filtering
- Candidates are filtered to the account's registered city (20 ATMs per event), providing **100% ground-truth coverage** while eliminating out-of-city noise.
- Features computed per candidate ATM:
  - `distance_km`: Euclidean distance from account's last known withdrawal ATM.
  - `dist_to_centroid`: Distance from the centroid of all historical account withdrawals.
  - `spatial_decay_score`: $\exp(-d_{\text{last}}/2.0) + \exp(-d_{\text{cent}}/2.0)$.
  - `atm_past_usage_count` and `atm_past_usage_ratio`: Frequency and fraction of historical withdrawals by this account at this ATM.
  - `account_atm_usage_rank`, `is_account_top1_atm`, `is_account_top2_atm`, `is_account_top3_atm`.
  - `is_account_previously_used`, `is_last_atm`.
  - `atm_historical_total_withdrawals`, `atm_historical_fraud_withdrawals`, `atm_fraud_intensity_ratio`.
  - `atm_is_same_bank`, `transaction_amount`.

Saved to: `data/processed/candidate_atm_features.csv`.

### Stage 4: ML Training Table & Chronological Splitting
- Candidate features are combined with account-level derived features.
- Supervised target: `target = 1` if `candidate_atm_id == actual_next_atm_id` else `0`.
- Strict chronological temporal split:
  - **Train Set**: Events 1 to 254 (Jan 2025 – Apr 2026, 72.2%)
  - **Test Set**: Events 255 to 306 (Apr 2026 – Jul 2026, 14.8%)
  - **Validation Set**: Events 307 to 352 (Jul 2026 – Nov 2026, 13.0%)

Saved to: `data/processed/ml_training_table.csv` and `data/processed/splits/`.

### Stage 5: Random Forest Model & Probability Calibration
- Random Forest Classifier with `n_estimators=300`, `max_depth=10`, `min_samples_leaf=2`.
- Probability calibration using `CalibratedClassifierCV(method='isotonic', cv=3)`.
- Feature importance analysis reveals spatial proximity decay, centroid distance, fraud intensity ratio, and past usage ratio as the strongest predictors.

### Stage 6 & 7: Candidate Ranking & Top-3 Recommendations
- Model scores are calibrated with domain priors derived from the raw data:
  $$S_{\text{cal}} = P_{\text{RF}}(\text{target}=1 \mid X) + 0.10 \cdot \text{spatial\_decay\_score} + 0.10 \cdot \text{atm\_past\_usage\_ratio}$$
- Candidates are ranked per complaint to output the **Top 3 ATM recommendations** for field law enforcement intercept teams.

---

## 3. Evaluation Results on Unseen Chronological Test Events

| Metric | Random Forest (Calibrated) | Basic Baseline (Heuristic) | Model Lift |
| :--- | :---: | :---: | :---: |
| **Recall@1 (Top-1)** | **44.23%** | **30.77%** | **+13.46%** |
| **Recall@3 (Top-3)** | **88.46%** | **50.00%** | **+38.46%** |
| **Recall@5 (Top-5)** | **90.38%** | **57.69%** | **+32.69%** |
| **Recall@10 (Top-10)** | **96.15%** | **65.38%** | **+30.77%** |
| **MRR (Mean Reciprocal Rank)** | **0.6480** | **0.4420** | **+0.2060** |
| **Candidate Coverage** | **100.00%** | **100.00%** | Parity |

> **Benchmarking Highlights**:
> - **Basic Baseline**: A standard non-ML operational heuristic combining physical proximity to the registered region and general ATM volume achieves **30.77% in Recall@1**, **50.00% in Recall@3**, and **65.38% in Recall@10**.
> - **Random Forest (Calibrated)**: Demonstrates a decisive **+38.46% absolute improvement**, achieving **88.46% Recall@3** and **96.15% Recall@10** on unseen chronological events.

---

## 4. Running the Pipeline & Operational Tool

Execute the master runner from the repository root:
```bash
python run_pipeline.py
```
*Total execution time: ~9.0 seconds.*

### Real-Time Dispatch CLI Tool:
Query top-3 ATM predictions for any suspect account:
```bash
python predict_atm.py --account_id ACC000397 --amount 60000
```

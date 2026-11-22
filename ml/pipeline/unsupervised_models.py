"""
Unsupervised Feature Engineering Module for RELIC
Integrates DBSCAN (Spatial Hotspot Clustering) and Isolation Forest (Velocity & Liquidity Anomaly)
Strictly Leakage-Free: Fitted exclusively on historical training events (Events 1-254).
"""

from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.cluster import DBSCAN
from sklearn.ensemble import IsolationForest


class UnsupervisedFeatureEngine:
    """
    Manages the offline training and real-time inference of:
      1. DBSCAN Spatial Fraud Hotspot Clustering
      2. Account Velocity Anomaly Scorer (Isolation Forest)
      3. ATM Temporal Liquidity Anomaly Scorer (Isolation Forest)
    """

    def __init__(self, artifacts_dir: Path = None):
        self.artifacts_dir = artifacts_dir
        self.dbscan_core_points_deg = None  # (N, 2) [latitude, longitude] in degrees
        self.iforest_acc = None
        self.iforest_atm = None

    def fit(
        self,
        tables: dict,
        events_df: pd.DataFrame,
        train_events_count: int = 254
    ):
        """
        Fits all unsupervised models strictly on historical training events (Events 1-254).
        Guarantees zero data leakage into evaluation or production test sets.
        """
        print("\n" + "=" * 70)
        print("FITTING LEAKAGE-FREE UNSUPERVISED FEATURE MODELS (EVENTS 1-254)")
        print("=" * 70)

        # 1. Determine training cutoff
        eligible_events = events_df[events_df["has_next_withdrawal"]].sort_values("prediction_datetime")
        train_events = eligible_events.iloc[:train_events_count]
        train_cutoff = train_events["prediction_datetime"].max()
        print(f"✓ Training window cutoff datetime: {train_cutoff} ({len(train_events)} events)")

        withdrawals = tables["withdrawals"].copy()
        withdrawals["withdrawal_datetime"] = pd.to_datetime(withdrawals["withdrawal_datetime"])
        atm_locations = tables["atm_locations"].copy()
        transactions = tables["transactions"].copy()
        transactions["transaction_datetime"] = pd.to_datetime(transactions["transaction_datetime"])

        # ----------------------------------------------------------------------
        # A. DBSCAN: Spatial Fraud Hotspot Clustering
        # ----------------------------------------------------------------------
        print("\n[Component A] Fitting DBSCAN on verified fraud coordinates...")
        train_fraud_wd = withdrawals[
            (withdrawals["fraud_linked"] == 1) &
            (withdrawals["withdrawal_datetime"] <= train_cutoff)
        ]

        fraud_geo = train_fraud_wd.merge(
            atm_locations[["atm_id", "latitude", "longitude"]],
            on="atm_id",
            how="inner"
        ).dropna(subset=["latitude", "longitude"])

        coords_deg = fraud_geo[["latitude", "longitude"]].values
        coords_rad = np.radians(coords_deg)

        # eps = 1.5 km in radians; min_samples = 4
        dbscan = DBSCAN(eps=1.5 / 6371.0, min_samples=4, metric="haversine")
        dbscan.fit(coords_rad)

        core_indices = dbscan.core_sample_indices_
        if len(core_indices) > 0:
            self.dbscan_core_points_deg = np.unique(coords_deg[core_indices], axis=0)
            n_clusters = len(set(dbscan.labels_)) - (1 if -1 in dbscan.labels_ else 0)
            print(f"✓ DBSCAN identified {n_clusters} spatial clusters with {len(self.dbscan_core_points_deg)} unique core cashpoints.")
        else:
            self.dbscan_core_points_deg = np.empty((0, 2))
            print("! Warning: No DBSCAN core points found with current eps/min_samples.")

        # ----------------------------------------------------------------------
        # B1. Isolation Forest: Account Velocity Anomaly
        # Features: [tx_count_last_2h, incoming_amount_sum, unique_senders_count, avg_inter_tx_seconds]
        # ----------------------------------------------------------------------
        print("\n[Component B1] Fitting Account Velocity Isolation Forest...")
        acc_feat_rows = []
        for _, ev in train_events.iterrows():
            acc_id = ev["account_id"]
            t0 = ev["prediction_datetime"]
            t_start = t0 - pd.Timedelta(hours=2)

            sub_tx = transactions[
                (transactions["receiver_account_id"] == acc_id) &
                (transactions["transaction_datetime"] >= t_start) &
                (transactions["transaction_datetime"] <= t0)
            ]

            tx_count = len(sub_tx)
            amount_sum = float(sub_tx["amount"].sum()) if not sub_tx.empty else 0.0
            unique_senders = int(sub_tx["sender_account_id"].nunique()) if not sub_tx.empty else 0
            if tx_count > 1:
                diffs = sub_tx.sort_values("transaction_datetime")["transaction_datetime"].diff().dt.total_seconds().dropna()
                avg_inter = float(diffs.mean()) if not diffs.empty else 0.0
            else:
                avg_inter = 0.0

            acc_feat_rows.append([tx_count, amount_sum, unique_senders, avg_inter])

        acc_feat_df = pd.DataFrame(
            acc_feat_rows,
            columns=["tx_count_last_2h", "incoming_amount_sum", "unique_senders_count", "avg_inter_tx_seconds"]
        )

        self.iforest_acc = IsolationForest(
            n_estimators=100,
            contamination="auto",
            random_state=42,
            n_jobs=-1
        )
        self.iforest_acc.fit(acc_feat_df)
        print(f"✓ Account Velocity Isolation Forest fitted on {len(acc_feat_df)} training instances.")

        # ----------------------------------------------------------------------
        # B2. Isolation Forest: ATM Temporal Liquidity Anomaly
        # Features: [withdrawals_last_3h, off_peak_night_ratio, avg_withdrawal_size_at_atm]
        # ----------------------------------------------------------------------
        print("\n[Component B2] Fitting ATM Temporal Liquidity Isolation Forest...")
        atm_feat_rows = []
        # Sample across active train events and ATMs to capture baseline liquidity profiles
        for _, ev in train_events.iloc[::3].iterrows():
            t0 = ev["prediction_datetime"]
            t_3h = t0 - pd.Timedelta(hours=3)
            for atm_id in atm_locations["atm_id"].unique():
                sub_wd = withdrawals[
                    (withdrawals["atm_id"] == atm_id) &
                    (withdrawals["withdrawal_datetime"] <= t0)
                ]
                w_3h = len(sub_wd[sub_wd["withdrawal_datetime"] >= t_3h])
                if not sub_wd.empty:
                    hours = sub_wd["withdrawal_datetime"].dt.hour
                    night_ratio = float(((hours >= 22) | (hours < 6)).mean())
                    avg_size = float(sub_wd["amount"].mean())
                else:
                    night_ratio = 0.0
                    avg_size = 0.0
                atm_feat_rows.append([w_3h, night_ratio, avg_size])

        atm_feat_df = pd.DataFrame(
            atm_feat_rows,
            columns=["withdrawals_last_3h", "off_peak_night_ratio", "avg_withdrawal_size_at_atm"]
        )

        self.iforest_atm = IsolationForest(
            n_estimators=100,
            contamination="auto",
            random_state=42,
            n_jobs=-1
        )
        self.iforest_atm.fit(atm_feat_df)
        print(f"✓ ATM Liquidity Isolation Forest fitted on {len(atm_feat_df)} baseline terminal records.")

        if self.artifacts_dir:
            self.save(self.artifacts_dir)

    def save(self, artifacts_dir: Path):
        """Saves fitted unsupervised models to disk."""
        artifacts_dir = Path(artifacts_dir)
        artifacts_dir.mkdir(parents=True, exist_ok=True)

        joblib.dump(self.dbscan_core_points_deg, artifacts_dir / "dbscan_fraud_clusters.joblib")
        joblib.dump(self.iforest_acc, artifacts_dir / "iforest_account_velocity.joblib")
        joblib.dump(self.iforest_atm, artifacts_dir / "iforest_atm_liquidity.joblib")
        print(f"✓ Unsupervised model artifacts saved to {artifacts_dir}")

    def load(self, artifacts_dir: Path):
        """Loads fitted unsupervised models from disk."""
        artifacts_dir = Path(artifacts_dir)
        dbscan_path = artifacts_dir / "dbscan_fraud_clusters.joblib"
        if_acc_path = artifacts_dir / "iforest_account_velocity.joblib"
        if_atm_path = artifacts_dir / "iforest_atm_liquidity.joblib"

        if not dbscan_path.exists() or not if_acc_path.exists() or not if_atm_path.exists():
            raise FileNotFoundError(f"Unsupervised artifacts missing in {artifacts_dir}")

        self.dbscan_core_points_deg = joblib.load(dbscan_path)
        self.iforest_acc = joblib.load(if_acc_path)
        self.iforest_atm = joblib.load(if_atm_path)

    def compute_dbscan_features(self, lats: np.ndarray, lons: np.ndarray):
        """
        Vectorized computation of:
          - dist_to_nearest_hotspot_km: Min Haversine distance to nearest DBSCAN core point
          - is_in_fraud_hotspot: 1 if distance <= 1.5 km, else 0
        """
        if self.dbscan_core_points_deg is None or len(self.dbscan_core_points_deg) == 0:
            return np.full(len(lats), 99.0), np.zeros(len(lats), dtype=int)

        core_lats = self.dbscan_core_points_deg[:, 0]
        core_lons = self.dbscan_core_points_deg[:, 1]

        phi1 = np.radians(lats)[:, None]
        phi2 = np.radians(core_lats)[None, :]
        dphi = phi2 - phi1
        dlambda = np.radians(core_lons)[None, :] - np.radians(lons)[:, None]

        a = np.sin(dphi / 2.0) ** 2 + np.cos(phi1) * np.cos(phi2) * np.sin(dlambda / 2.0) ** 2
        dists_km = 6371.0 * 2.0 * np.arcsin(np.clip(np.sqrt(a), 0, 1))

        min_dists = dists_km.min(axis=1)
        is_hotspot = (min_dists <= 1.5).astype(int)

        return np.round(min_dists, 4), is_hotspot

    def compute_account_velocity_score(
        self,
        account_id: str,
        pred_time: pd.Timestamp,
        transactions_df: pd.DataFrame
    ) -> float:
        """
        Computes shifted anomaly score -iforest_acc.decision_function(...) for an account.
        Higher positive score indicates higher velocity anomaly.
        """
        if self.iforest_acc is None:
            return 0.0

        if not isinstance(pred_time, pd.Timestamp):
            pred_time = pd.to_datetime(pred_time)

        t_start = pred_time - pd.Timedelta(hours=2)

        if not pd.api.types.is_datetime64_any_dtype(transactions_df["transaction_datetime"]):
            tx_dt = pd.to_datetime(transactions_df["transaction_datetime"])
        else:
            tx_dt = transactions_df["transaction_datetime"]

        sub_mask = (
            (transactions_df["receiver_account_id"] == account_id) &
            (tx_dt >= t_start) &
            (tx_dt <= pred_time)
        )
        sub_tx = transactions_df[sub_mask]

        tx_count = len(sub_tx)
        amount_sum = float(sub_tx["amount"].sum()) if not sub_tx.empty else 0.0
        unique_senders = int(sub_tx["sender_account_id"].nunique()) if not sub_tx.empty else 0
        if tx_count > 1:
            diffs = tx_dt[sub_mask].sort_values().diff().dt.total_seconds().dropna()
            avg_inter = float(diffs.mean()) if not diffs.empty else 0.0
        else:
            avg_inter = 0.0

        sample_df = pd.DataFrame(
            [[tx_count, amount_sum, unique_senders, avg_inter]],
            columns=["tx_count_last_2h", "incoming_amount_sum", "unique_senders_count", "avg_inter_tx_seconds"]
        )
        score = - float(self.iforest_acc.decision_function(sample_df)[0])
        return round(score, 4)

    def compute_atm_liquidity_scores(
        self,
        atm_ids: list,
        pred_time: pd.Timestamp,
        withdrawals_df: pd.DataFrame,
        wd_by_atm: Optional[dict] = None
    ) -> np.ndarray:
        """
        Batch computes shifted anomaly scores for candidate ATMs at pred_time.
        """
        if self.iforest_atm is None or len(atm_ids) == 0:
            return np.zeros(len(atm_ids))

        if not isinstance(pred_time, pd.Timestamp):
            pred_time = pd.to_datetime(pred_time)

        t_3h = pred_time - pd.Timedelta(hours=3)
        atm_samples = []

        if wd_by_atm is None:
            if not pd.api.types.is_datetime64_any_dtype(withdrawals_df["withdrawal_datetime"]):
                withdrawals_df = withdrawals_df.copy()
                withdrawals_df["withdrawal_datetime"] = pd.to_datetime(withdrawals_df["withdrawal_datetime"])
            wd_by_atm = {k: v for k, v in withdrawals_df.groupby("atm_id")}

        for aid in atm_ids:
            sub_wd = wd_by_atm.get(aid)
            if sub_wd is not None and not sub_wd.empty:
                sub_prior = sub_wd[sub_wd["withdrawal_datetime"] <= pred_time]
                if not sub_prior.empty:
                    w_3h = int((sub_prior["withdrawal_datetime"] >= t_3h).sum())
                    hours = sub_prior["withdrawal_datetime"].dt.hour
                    night_ratio = float(((hours >= 22) | (hours < 6)).mean())
                    avg_size = float(sub_prior["amount"].mean())
                else:
                    w_3h, night_ratio, avg_size = 0, 0.0, 0.0
            else:
                w_3h, night_ratio, avg_size = 0, 0.0, 0.0
            atm_samples.append([w_3h, night_ratio, avg_size])

        samples_df = pd.DataFrame(
            atm_samples,
            columns=["withdrawals_last_3h", "off_peak_night_ratio", "avg_withdrawal_size_at_atm"]
        )
        raw_scores = - self.iforest_atm.decision_function(samples_df)
        return np.round(raw_scores, 4)

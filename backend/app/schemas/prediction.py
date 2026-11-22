from typing import Optional, List
from pydantic import BaseModel, Field


class PredictionRequest(BaseModel):
    account_id: Optional[str] = Field(None, description="Suspected mule account ID (e.g., ACC000397)")
    complaint_id: Optional[str] = Field(None, description="Optional Complaint ID (e.g., COMP000009) to auto-resolve account and amount")
    amount: Optional[float] = Field(25000.0, description="Reported or suspected withdrawal amount in INR")
    prediction_time: Optional[str] = Field(None, description="Timestamp of fraud alert / complaint trigger")
    top_k: int = Field(3, ge=1, le=20, description="Number of candidate ATMs to rank and return")


class CandidateAtmResult(BaseModel):
    candidate_atm_id: str
    bank_id: str
    latitude: float
    longitude: float
    city: str
    distance_km: float
    dist_to_centroid: float
    spatial_decay_score: float
    is_in_fraud_hotspot: Optional[int] = Field(0, description="DBSCAN fraud hotspot indicator")
    dist_to_nearest_hotspot_km: Optional[float] = Field(0.0, description="Distance to nearest DBSCAN core point (km)")
    atm_past_usage_count: int
    atm_past_usage_ratio: float
    account_atm_usage_rank: int
    is_account_top1_atm: int
    is_last_atm: int
    account_velocity_anomaly_score: Optional[float] = Field(0.0, description="Account incoming velocity anomaly score (Isolation Forest)")
    atm_historical_total_withdrawals: int
    atm_historical_fraud_withdrawals: int
    atm_fraud_intensity_ratio: float
    atm_is_same_bank: int
    atm_liquidity_anomaly_score: Optional[float] = Field(0.0, description="ATM liquidity surge anomaly score (Isolation Forest)")
    rf_prob: float
    cal_score: float
    rank: int
    status_tag: str
    habit_tag: str


class AccountLocationSummary(BaseModel):
    account_id: str
    bank_id: str
    registered_city: str
    prior_withdrawals_count: int
    last_atm_id: Optional[str] = None
    last_atm_city: Optional[str] = None
    ref_latitude: float
    ref_longitude: float
    centroid_latitude: float
    centroid_longitude: float


class PredictionResponse(BaseModel):
    success: bool
    complaint_id: Optional[str] = None
    target_account_id: str
    prediction_time: str
    reported_amount: float
    account_summary: AccountLocationSummary
    recommendations: List[CandidateAtmResult]
    operational_advisory: str


from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class MetricComparison(BaseModel):
    recall_at_1: float
    recall_at_3: float
    recall_at_5: float
    recall_at_10: float
    mrr: float
    candidate_coverage: float = 1.0


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class DashboardStatsResponse(BaseModel):
    total_complaints: int
    total_mule_accounts: int
    total_atms: int
    total_cities: int
    high_risk_atms_count: int
    total_fraud_volume: float
    evaluation_metrics: Dict[str, Any]
    feature_importances: List[FeatureImportanceItem]
    city_distribution: Dict[str, int]
    fraud_type_distribution: Dict[str, int]
    city_details: Optional[Dict[str, Any]] = None


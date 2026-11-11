from fastapi import APIRouter
from app.schemas.stats import DashboardStatsResponse
from app.services.data_service import DataService

router = APIRouter()


@router.get("", response_model=DashboardStatsResponse)
def get_dashboard_statistics():
    """
    Get aggregated system statistics, model evaluation benchmarks, and fraud distributions.
    """
    service = DataService.get_instance()
    res = service.get_dashboard_stats()
    return DashboardStatsResponse(**res)


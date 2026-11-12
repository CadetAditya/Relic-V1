from fastapi import APIRouter, Query
from typing import Optional, Dict, Any
from app.schemas.stats import DashboardStatsResponse
from app.services.data_service import DataService
from app.db.repository import DatabaseRepository

router = APIRouter()


@router.get("", response_model=DashboardStatsResponse)
def get_dashboard_statistics(
    role: Optional[str] = Query("Head Admin", description="Officer role (Head Admin, Regional/Zonal Admin, Investigator)"),
    zone: Optional[str] = Query("All Zones", description="Operational zone (All Zones, Jalandhar, Ludhiana, etc.)"),
    officer_id: Optional[str] = Query(None, description="Current officer badge ID")
):
    """
    Get aggregated system statistics, role-based dashboard KPIs, ATM hotspots, and recent activity.
    """
    service = DataService.get_instance()
    base_res = service.get_dashboard_stats()

    # Query role-based live metrics from SQLite database
    role_stats = DatabaseRepository.get_role_dashboard_stats(
        role=role or "Head Admin",
        zone=zone or "All Zones",
        officer_id=officer_id
    )

    # Merge
    merged = {**base_res, **role_stats}
    return DashboardStatsResponse(**merged)


@router.get("/regional/{zone_name}", response_model=Dict[str, Any])
def get_regional_monitoring(zone_name: str):
    """
    Get dedicated regional/zonal command intelligence: complaints, predictions, ATM hotspots, investigator workload.
    """
    return DatabaseRepository.get_role_dashboard_stats(
        role="Regional/Zonal Admin",
        zone=zone_name
    )

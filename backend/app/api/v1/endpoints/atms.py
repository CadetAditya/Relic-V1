from fastapi import APIRouter, Query
from typing import Optional

from app.schemas.atm import AtmListResponse
from app.services.data_service import DataService

router = APIRouter()


@router.get("", response_model=AtmListResponse)
def list_atms(
    city: Optional[str] = Query(None, description="Filter ATMs by city (e.g. Mumbai, Delhi, Phagwara)")
):
    """
    Get all registered ATMs with coordinates, bank details, and historical fraud intensity ratios.
    """
    service = DataService.get_instance()
    res = service.get_atms(city=city)
    return AtmListResponse(**res)


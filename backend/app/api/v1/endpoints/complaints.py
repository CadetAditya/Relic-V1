from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.schemas.complaint import ComplaintListResponse, ComplaintItem
from app.services.data_service import DataService

router = APIRouter()


@router.get("", response_model=ComplaintListResponse)
def list_complaints(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search by complaint, account, or fraud type"),
    city: Optional[str] = Query(None, description="Filter by beneficiary city"),
    fraud_type: Optional[str] = Query(None, description="Filter by cybercrime fraud type"),
):
    """
    Search and paginate cybercrime complaints.
    """
    service = DataService.get_instance()
    res = service.get_complaints(skip=skip, limit=limit, search=search, city=city, fraud_type=fraud_type)
    return ComplaintListResponse(**res)


@router.get("/{complaint_id}", response_model=ComplaintItem)
def get_complaint(complaint_id: str):
    """
    Retrieve single complaint details by Complaint ID.
    """
    service = DataService.get_instance()
    comp = service.get_complaint_by_id(complaint_id)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Complaint '{complaint_id}' not found")
    return ComplaintItem(**comp)


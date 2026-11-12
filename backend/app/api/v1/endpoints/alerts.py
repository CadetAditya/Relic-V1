from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, Dict, Any
from pydantic import BaseModel
from app.db.repository import DatabaseRepository

router = APIRouter()

class AlertCreateRequest(BaseModel):
    alert_type: str = "HIGH_PRIORITY_COMPLAINT"
    title: str
    message: str
    complaint_id: Optional[str] = None
    atm_id: Optional[str] = None
    zone: Optional[str] = None
    severity: str = "HIGH"

@router.get("", response_model=Dict[str, Any])
def list_alerts(
    zone: Optional[str] = Query(None, description="Filter by operational zone"),
    unread_only: bool = Query(False, description="Filter unread alerts only"),
    limit: int = Query(50, ge=1, le=200)
):
    """
    Retrieve live operational alerts, approaching withdrawal windows, and urgent high-priority flags.
    """
    return DatabaseRepository.get_alerts(zone=zone, unread_only=unread_only, limit=limit)

@router.post("", status_code=status.HTTP_201_CREATED)
def create_operational_alert(req: AlertCreateRequest):
    """
    Publish a tactical alert to patrol units and zonal command desks.
    """
    alert_id = DatabaseRepository.create_alert(
        alert_type=req.alert_type,
        title=req.title,
        message=req.message,
        complaint_id=req.complaint_id,
        atm_id=req.atm_id,
        zone=req.zone,
        severity=req.severity
    )
    return {"id": alert_id, "status": "published"}

@router.patch("/{alert_id}/read")
def mark_alert_as_read(alert_id: int):
    """
    Acknowledge and mark an operational alert as read.
    """
    ok = DatabaseRepository.mark_alert_read(alert_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"id": alert_id, "is_read": True}


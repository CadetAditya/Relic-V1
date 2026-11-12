from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.db.repository import DatabaseRepository

router = APIRouter()

class OfficerCreateRequest(BaseModel):
    badge_id: str
    name: str
    password: str = "relic2026"
    role: str = "Investigator"
    zone: str = "Punjab Zone"
    email: Optional[str] = None
    phone: Optional[str] = None
    rank: Optional[str] = "Inspector"
    status: Optional[str] = "active"

class OfficerUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    zone: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    rank: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None

@router.get("", response_model=List[Dict[str, Any]])
def list_officers(
    zone: Optional[str] = Query(None, description="Filter by operational zone"),
    role: Optional[str] = Query(None, description="Filter by RBAC role")
):
    """
    Retrieve roster of law enforcement officers, their assigned zones, and RBAC roles.
    """
    return DatabaseRepository.get_all_officers(zone=zone, role=role)

@router.post("", status_code=status.HTTP_201_CREATED)
def create_officer_account(req: OfficerCreateRequest):
    """
    Provision a new law enforcement officer account with role and zone permissions.
    """
    existing = DatabaseRepository.get_officer_by_badge(req.badge_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Officer with Badge ID '{req.badge_id}' already exists."
        )
    created = DatabaseRepository.create_officer(req.dict(), created_by_officer={"badge_id": "ADMIN", "name": "Head Admin"})
    return created

@router.put("/{badge_id}")
def update_officer_account(badge_id: str, req: OfficerUpdateRequest):
    """
    Update officer role, jurisdiction zone, or status.
    """
    existing = DatabaseRepository.get_officer_by_badge(badge_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Officer not found")
    updated = DatabaseRepository.update_officer(badge_id, req.dict(exclude_unset=True), updated_by_officer={"badge_id": "ADMIN", "name": "Head Admin"})
    return updated

@router.get("/audit/logs", response_model=List[Dict[str, Any]])
def get_system_audit_logs(
    officer_id: Optional[str] = Query(None, description="Filter by officer ID"),
    module: Optional[str] = Query(None, description="Filter by action module"),
    limit: int = Query(100, ge=1, le=500)
):
    """
    Retrieve security audit trail tracking officer actions, predictions, and status changes.
    """
    return DatabaseRepository.get_audit_logs(officer_id=officer_id, module=module, limit=limit)


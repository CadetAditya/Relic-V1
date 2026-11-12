from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from app.schemas.complaint import (
    ComplaintListResponse,
    ComplaintItem,
    ComplaintCreateRequest,
)
from app.db.repository import DatabaseRepository

router = APIRouter()

class StatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = None
    officer_id: Optional[str] = "OFFICER_007"
    officer_name: Optional[str] = "Officer"

class AssignmentRequest(BaseModel):
    investigator_badge_id: str
    assigned_by_id: Optional[str] = "ADMIN"
    assigned_by_name: Optional[str] = "Admin"

class NoteCreateRequest(BaseModel):
    note_text: str
    action_type: Optional[str] = "NOTE_ADDED"
    officer_id: Optional[str] = "OFFICER_007"
    officer_name: Optional[str] = "Officer"

class EvidenceCreateRequest(BaseModel):
    title: str
    evidence_type: str = "CCTV Footage Reference"
    description: Optional[str] = None
    atm_id: Optional[str] = None
    cctv_camera_id: Optional[str] = None
    footage_window_start: Optional[str] = None
    footage_window_end: Optional[str] = None
    bank_contact_person: Optional[str] = None
    request_status: Optional[str] = "REQUESTED"
    file_reference: Optional[str] = None
    officer_id: Optional[str] = "OFFICER_007"
    officer_name: Optional[str] = "Officer"

class EvidenceStatusUpdateRequest(BaseModel):
    status: str
    officer_id: Optional[str] = "OFFICER_007"
    officer_name: Optional[str] = "Officer"


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def register_complaint(req: ComplaintCreateRequest):
    """
    Register a new cybercrime complaint into the RELIC database.
    Auto-computes sequential complaint ID, city mapping, and updates active surveillance feeds.
    """
    new_comp = DatabaseRepository.create_complaint(
        req.dict(),
        officer={"badge_id": "OFFICER_007", "name": "Reporting Officer"}
    )
    return new_comp


@router.get("")
def list_complaints(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    search: Optional[str] = Query(None, description="Search by complaint, account, or fraud type"),
    status: Optional[str] = Query(None, description="Filter by status (unresolved, under investigation, confirmed, cleared)"),
    priority: Optional[str] = Query(None, description="Filter by priority (HIGH, MEDIUM, LOW)"),
    city: Optional[str] = Query(None, description="Filter by beneficiary city"),
    assigned_officer_id: Optional[str] = Query(None, description="Filter by assigned investigator"),
    date_from: Optional[str] = Query(None, description="Filter by starting complaint date"),
    date_to: Optional[str] = Query(None, description="Filter by ending complaint date"),
):
    """
    Search and paginate cybercrime complaints with multi-field filter support.
    """
    return DatabaseRepository.get_complaints(
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        priority=priority,
        city=city,
        assigned_officer_id=assigned_officer_id,
        date_from=date_from,
        date_to=date_to,
    )


@router.get("/{complaint_id}")
def get_complaint(complaint_id: str):
    """
    Retrieve single complaint details by Complaint ID including linked transactions, timeline notes, evidence, and predictions.
    """
    comp = DatabaseRepository.get_complaint_by_id(complaint_id)
    if not comp:
        raise HTTPException(status_code=404, detail=f"Complaint '{complaint_id}' not found")
    return comp


@router.patch("/{complaint_id}")
def update_complaint_status(complaint_id: str, req: StatusUpdateRequest):
    """
    Update complaint investigation status and append an auditable case note.
    """
    res = DatabaseRepository.update_complaint_status(
        complaint_id=complaint_id,
        new_status=req.status,
        officer={"badge_id": req.officer_id, "name": req.officer_name},
        notes=req.notes
    )
    if not res:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return res


@router.post("/{complaint_id}/assign")
def assign_investigator_to_case(complaint_id: str, req: AssignmentRequest):
    """
    Assign an investigator to a complaint case.
    """
    res = DatabaseRepository.assign_investigator(
        complaint_id=complaint_id,
        investigator_badge_id=req.investigator_badge_id,
        assigned_by_officer={"badge_id": req.assigned_by_id, "name": req.assigned_by_name}
    )
    if not res:
        raise HTTPException(status_code=404, detail="Complaint or Investigator not found")
    return res


@router.get("/{complaint_id}/notes")
def get_investigation_timeline(complaint_id: str):
    """
    Get auditable activity timeline and case notes for this complaint.
    """
    comp = DatabaseRepository.get_complaint_by_id(complaint_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return comp.get("timeline", [])


@router.post("/{complaint_id}/notes", status_code=status.HTTP_201_CREATED)
def add_case_note(complaint_id: str, req: NoteCreateRequest):
    """
    Add an investigation note or operational finding to a complaint case.
    """
    return DatabaseRepository.add_investigation_note(
        complaint_id=complaint_id,
        officer={"badge_id": req.officer_id, "name": req.officer_name},
        note_text=req.note_text,
        action_type=req.action_type
    )


@router.get("/{complaint_id}/evidence")
def list_case_evidence(complaint_id: str):
    """
    Retrieve all attached evidence documents and CCTV reference requests for a complaint.
    """
    comp = DatabaseRepository.get_complaint_by_id(complaint_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return comp.get("evidence", [])


@router.post("/{complaint_id}/evidence", status_code=status.HTTP_201_CREATED)
def attach_case_evidence(complaint_id: str, req: EvidenceCreateRequest):
    """
    Attach an evidence document or record a bank CCTV footage reference request.
    """
    return DatabaseRepository.add_evidence_record(
        complaint_id=complaint_id,
        officer={"badge_id": req.officer_id, "name": req.officer_name},
        data=req.dict()
    )


@router.patch("/evidence/{evidence_id}")
def update_evidence_record_status(evidence_id: int, req: EvidenceStatusUpdateRequest):
    """
    Update request status of a CCTV reference or evidence artifact (e.g. REQUESTED -> PRESERVED -> COLLECTED -> ANALYZED).
    """
    ok = DatabaseRepository.update_evidence_status(
        evidence_id=evidence_id,
        new_status=req.status,
        officer={"badge_id": req.officer_id, "name": req.officer_name}
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Evidence record not found")
    return {"id": evidence_id, "status": req.status, "updated": True}

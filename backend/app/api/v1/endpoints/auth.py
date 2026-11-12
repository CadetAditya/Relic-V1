from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import LoginRequest, LoginResponse, OfficerProfile
from app.db.repository import DatabaseRepository

router = APIRouter()


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """
    Authenticate law enforcement officer using database credentials and RBAC permissions.
    """
    badge_key = request.badge_id.strip()
    password = request.password.strip()

    officer = DatabaseRepository.authenticate_officer(badge_key, password)

    if not officer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed. Invalid Officer Badge ID or password, or account inactive.",
        )

    profile = OfficerProfile(
        badge_id=officer["badge_id"],
        name=officer["name"],
        rank=officer.get("rank") or "Inspector",
        unit=f"{officer.get('role')} - {officer.get('zone')}",
        city=officer.get("zone") or "Punjab Zone",
        clearance_level=f"RESTRICTED ACCESS - {officer.get('role', '').upper()}",
        role=officer.get("role", "Investigator"),
        zone=officer.get("zone", "All Zones"),
        email=officer.get("email"),
        phone=officer.get("phone"),
    )

    return LoginResponse(
        success=True,
        access_token=f"relic_token_{officer['badge_id']}_{officer.get('role', 'Investigator')}",
        token_type="bearer",
        officer=profile,
        message=f"Welcome {officer['name']}. Clearance granted for {officer.get('role')} ({officer.get('zone')}).",
    )

from fastapi import APIRouter, HTTPException, status
from app.schemas.auth import LoginRequest, LoginResponse, OfficerProfile

router = APIRouter()

# Static authorized officer credentials
STATIC_OFFICERS = {
    "OFFICER_007": {
        "password": "relic2026",
        "profile": {
            "badge_id": "OFFICER_007",
            "name": "Inspector Vikram Sen",
            "rank": "Cybercrime Nodal Officer",
            "unit": "Financial Cyber Fraud Cell",
            "city": "Phagwara / Punjab",
            "clearance_level": "LEVEL 4 - LAW ENFORCEMENT DISPATCH",
        },
    },
    "OFFICER_704": {
        "password": "relic2026",
        "profile": {
            "badge_id": "OFFICER_704",
            "name": "ACP Ananya Roy",
            "rank": "Assistant Commissioner of Police",
            "unit": "Cyber Intelligence & Rapid Response",
            "city": "Mumbai",
            "clearance_level": "LEVEL 5 - COMMAND DIRECTOR",
        },
    },
    "admin": {
        "password": "admin",
        "profile": {
            "badge_id": "ADMIN_01",
            "name": "Chief Technical Investigator",
            "rank": "Superintendent of Police",
            "unit": "Cyber Analytics & Machine Intelligence",
            "city": "National Headquarters",
            "clearance_level": "LEVEL 5 - FULL CLEARANCE",
        },
    },
}


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """
    Authenticate law enforcement officer using static credentials.
    """
    badge_key = request.badge_id.strip()

    # Look up by exact badge ID or lowercase match
    matched_officer = None
    for k, v in STATIC_OFFICERS.items():
        if k.lower() == badge_key.lower():
            matched_officer = v
            break

    if not matched_officer:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Badge ID. Access denied by RELIC Security Gateway.",
        )

    if request.password != matched_officer["password"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Passcode. Access denied by RELIC Security Gateway.",
        )

    profile = matched_officer["profile"]
    mock_token = f"relic_sec_token_{profile['badge_id']}_auth_ok"

    return LoginResponse(
        success=True,
        access_token=mock_token,
        token_type="bearer",
        officer=OfficerProfile(**profile),
        message=f"Access Granted. Welcome, {profile['rank']} {profile['name']}.",
    )





from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    badge_id: str = Field(..., description="Officer Badge ID or Username")
    password: str = Field(..., description="Officer Password")


class OfficerProfile(BaseModel):
    badge_id: str
    name: str
    rank: str
    unit: str
    city: str
    clearance_level: str


class LoginResponse(BaseModel):
    success: bool
    access_token: str
    token_type: str = "bearer"
    officer: OfficerProfile
    message: str


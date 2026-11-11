from typing import Optional, List
from pydantic import BaseModel


class AtmItem(BaseModel):
    atm_id: str
    bank_id: str
    city: str
    state: str
    latitude: float
    longitude: float
    atm_status: str
    pincode: Optional[int] = None
    historical_withdrawals_count: int = 0
    fraud_withdrawals_count: int = 0
    fraud_intensity_ratio: float = 0.0


class AtmListResponse(BaseModel):
    total: int
    cities: List[str]
    atms: List[AtmItem]


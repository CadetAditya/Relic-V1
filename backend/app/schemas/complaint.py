from typing import Optional, List
from pydantic import BaseModel


class ComplaintItem(BaseModel):
    complaint_id: str
    complaint_date: str
    fraud_type: str
    reported_amount: float
    victim_account_id: Optional[str] = None
    transaction_id: Optional[str] = None
    beneficiary_account_id: Optional[str] = None
    beneficiary_upi_id: Optional[str] = None
    complaint_status: Optional[str] = None
    linked_fraud_account: Optional[str] = None
    beneficiary_city: Optional[str] = None


class ComplaintListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    complaints: List[ComplaintItem]


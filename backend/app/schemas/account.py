from typing import Optional, List
from pydantic import BaseModel


class AccountItem(BaseModel):
    account_id: str
    bank_id: str
    account_type: str
    account_status: str
    registered_address_region: str
    is_fraud_confirmed: int
    upi_id: Optional[str] = None
    historical_withdrawals_count: Optional[int] = 0
    total_withdrawn_amount: Optional[float] = 0.0


class AccountListResponse(BaseModel):
    total: int
    skip: int
    limit: int
    accounts: List[AccountItem]


class WithdrawalRecord(BaseModel):
    withdrawal_id: str
    account_id: str
    atm_id: str
    withdrawal_datetime: str
    amount: float
    withdrawal_status: str
    atm_city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class AccountDetailResponse(BaseModel):
    account: AccountItem
    withdrawals: List[WithdrawalRecord]


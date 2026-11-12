from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any

from app.schemas.account import AccountListResponse, AccountDetailResponse
from app.services.data_service import DataService
from app.db.repository import DatabaseRepository

router = APIRouter()


@router.get("", response_model=AccountListResponse)
def list_accounts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None, description="Search by account ID or bank"),
    city: Optional[str] = Query(None, description="Filter by registered region/city"),
    only_fraud: bool = Query(False, description="Filter only fraud-confirmed accounts"),
):
    """
    List accounts with transaction and withdrawal frequency aggregates.
    """
    service = DataService.get_instance()
    res = service.get_accounts(skip=skip, limit=limit, search=search, city=city, only_fraud=only_fraud)
    return AccountListResponse(**res)


@router.get("/{account_id}", response_model=AccountDetailResponse)
def get_account_detail(account_id: str):
    """
    Get detailed profile of an account including full historical ATM withdrawal records.
    """
    service = DataService.get_instance()
    detail = service.get_account_detail(account_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"Account '{account_id}' not found")
    return AccountDetailResponse(**detail)


@router.get("/{account_id}/network", response_model=Dict[str, Any])
def get_account_network_analysis(account_id: str):
    """
    Analyze account transaction network, counterparty relationships, money trail flow, and linked mule activities.
    """
    network = DatabaseRepository.get_account_network(account_id)
    if not network.get("account"):
        raise HTTPException(status_code=404, detail=f"Account '{account_id}' not found")
    return network

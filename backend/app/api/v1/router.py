from fastapi import APIRouter

from app.api.v1.endpoints import (
    predict,
    complaints,
    accounts,
    atms,
    stats,
)

api_router = APIRouter()

api_router.include_router(predict.router, prefix="/predict", tags=["Prediction & Dispatch"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["Complaints Explorer"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["Mule Accounts"])
api_router.include_router(atms.router, prefix="/atms", tags=["ATM Geospatial Network"])
api_router.include_router(stats.router, prefix="/stats", tags=["System Analytics & KPIs"])


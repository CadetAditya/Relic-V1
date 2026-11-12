from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    predict,
    complaints,
    accounts,
    atms,
    stats,
    officers,
    alerts,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Officer Authentication"])
api_router.include_router(predict.router, prefix="/predict", tags=["Prediction & Dispatch"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["Complaints & Investigation"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["Mule Accounts & Network Analysis"])
api_router.include_router(atms.router, prefix="/atms", tags=["ATM Geospatial Network"])
api_router.include_router(stats.router, prefix="/stats", tags=["System Analytics & Regional Monitoring"])
api_router.include_router(officers.router, prefix="/officers", tags=["Officer Management & Audit Logs"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Tactical Alerts & Notifications"])

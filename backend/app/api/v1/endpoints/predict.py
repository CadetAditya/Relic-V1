from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.ml_service import MLInferenceService

router = APIRouter()


@router.post("", response_model=PredictionResponse)
def generate_prediction(request: PredictionRequest):
    """
    Generate Top-K predicted ATM extraction locations for law enforcement dispatch.
    Accepts either an Account ID or Complaint ID, with amount and optional timestamp.
    """
    try:
        service = MLInferenceService.get_instance()
        return service.predict(
            account_id=request.account_id,
            complaint_id=request.complaint_id,
            amount=request.amount,
            prediction_time=request.prediction_time,
            top_k=request.top_k,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/sample", response_model=PredictionResponse)
def get_sample_prediction(
    complaint_id: Optional[str] = Query("COMP000009", description="Sample complaint to predict"),
    top_k: int = Query(3, ge=1, le=10)
):
    """
    Convenience endpoint returning a live prediction for a sample complaint.
    """
    try:
        service = MLInferenceService.get_instance()
        return service.predict(complaint_id=complaint_id, top_k=top_k)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


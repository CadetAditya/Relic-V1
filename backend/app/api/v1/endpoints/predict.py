from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any

from app.schemas.prediction import PredictionRequest, PredictionResponse
from app.services.ml_service import MLInferenceService
from app.db.repository import DatabaseRepository

router = APIRouter()


@router.post("", response_model=PredictionResponse)
def generate_prediction(request: PredictionRequest):
    """
    Generate Top-K predicted ATM extraction locations for law enforcement dispatch.
    Accepts either an Account ID or Complaint ID, with amount and optional timestamp.
    Saves prediction to database and creates a high-priority dispatch alert.
    """
    try:
        service = MLInferenceService.get_instance()
        pred = service.predict(
            account_id=request.account_id,
            complaint_id=request.complaint_id,
            amount=request.amount,
            prediction_time=request.prediction_time,
            top_k=request.top_k,
        )

        # Save to predictions table & log audit trail
        try:
            pred_dict = pred.dict() if hasattr(pred, "dict") else dict(pred)
            DatabaseRepository.save_prediction(
                pred_dict,
                officer={"badge_id": "OFFICER_007", "name": "Operating Officer"}
            )
        except Exception as err:
            print("Warning: could not persist prediction:", err)

        return pred
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/history", response_model=List[Dict[str, Any]])
def get_prediction_history(
    complaint_id: Optional[str] = Query(None, description="Filter by complaint ID"),
    account_id: Optional[str] = Query(None, description="Filter by suspect mule account"),
    zone: Optional[str] = Query(None, description="Filter by jurisdiction zone"),
    limit: int = Query(50, ge=1, le=200)
):
    """
    Retrieve historical machine learning predictions, ranked ATM locations, and confidence scores.
    """
    return DatabaseRepository.get_prediction_history(
        complaint_id=complaint_id,
        account_id=account_id,
        zone=zone,
        limit=limit
    )


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

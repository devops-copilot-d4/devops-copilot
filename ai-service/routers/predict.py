from fastapi import APIRouter, HTTPException
from models.schemas import TelemetryPayload, PredictResponse, LogAnalysisRequest
from services.ml_predictor import ml_predictor
from services.log_bundler import clean_and_deduplicate_logs

router = APIRouter(tags=["ML Prediction & Log Analysis"])

@router.post("/predict", response_model=PredictResponse)
async def predict_failure(telemetry: TelemetryPayload):
    """
    ML-based numerical failure prediction endpoint.
    Computes failure probability, risk level (LOW/MEDIUM/HIGH), and predicted class.
    """
    try:
        return ml_predictor.predict(telemetry)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analyze-logs")
async def analyze_logs(request: LogAnalysisRequest):
    """
    Log preprocessing endpoint: deduplication, error extraction, and timestamp normalization.
    """
    errors = clean_and_deduplicate_logs(request.raw_logs, max_lines=request.max_entries)
    return {
        "extracted_error_count": len(errors),
        "errors": errors
    }

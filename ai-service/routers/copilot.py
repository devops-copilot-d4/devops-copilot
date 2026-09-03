from fastapi import APIRouter, HTTPException
from models.schemas import CopilotAnalysisRequest, CopilotDiagnosisResponse
from services.ml_predictor import ml_predictor
from services.log_bundler import create_compact_context_bundle
from services.llm_agent import diagnose_failure

router = APIRouter(tags=["AI DevOps Copilot"])

@router.post("/copilot/analyze", response_model=CopilotDiagnosisResponse)
async def analyze_copilot_state(request: CopilotAnalysisRequest):
    """
    End-to-End Hybrid AI Analysis:
    1. Runs ML Failure Prediction on numerical telemetry
    2. Builds compact context bundle from logs, events & deployment state
    3. Runs LLM Root Cause Analysis & selects pre-approved recovery action
    """
    try:
        # Step 1: ML Numerical Prediction
        ml_prediction = ml_predictor.predict(request.telemetry)
        
        # Step 2: Preprocess and bundle logs + telemetry
        context_bundle = create_compact_context_bundle(
            telemetry=request.telemetry,
            prediction=ml_prediction,
            logs=request.logs or "",
            recent_deployment_info=request.recent_deployment_info or "v1.0"
        )
        
        # Step 3: LLM Root Cause Diagnosis & Recovery Recommendation
        diagnosis = await diagnose_failure(context_bundle)
        return diagnosis
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Copilot analysis failed: {str(e)}")

@router.post("/diagnose", response_model=CopilotDiagnosisResponse)
async def diagnose(request: CopilotAnalysisRequest):
    return await analyze_copilot_state(request)

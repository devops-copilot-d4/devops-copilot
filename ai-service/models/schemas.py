from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class TelemetryPayload(BaseModel):
    cpu_usage: float = Field(..., description="CPU utilization percentage (0-100)")
    memory_usage: float = Field(..., description="Memory utilization percentage (0-100)")
    restart_count: int = Field(0, description="Pod restart count")
    error_rate: float = Field(0.0, description="HTTP or application error rate percentage")
    response_time: float = Field(0.2, description="Response time or latency in seconds")
    recent_deployment: int = Field(0, description="1 if deployed in last 15 mins, 0 otherwise")
    pod_status: str = Field("Running", description="Current Kubernetes pod phase")
    deployment_status: str = Field("Healthy", description="Deployment rollout status")
    log_error_count: int = Field(0, description="Count of ERROR/FATAL occurrences in logs")
    event_count: int = Field(0, description="Count of warning Kubernetes events")
    health_status: str = Field("Healthy", description="Health probe status")

class PredictResponse(BaseModel):
    failure_probability: float = Field(..., description="ML model probability of failure (0.0 - 1.0)")
    risk_level: str = Field(..., description="LOW, MEDIUM, or HIGH risk")
    predicted_failure_type: str = Field(..., description="Predicted failure scenario name")
    is_failure_predicted: bool
    feature_signals: Dict[str, Any] = Field(default_factory=dict)

class LogAnalysisRequest(BaseModel):
    raw_logs: str = Field(..., description="Raw container/deployment log stream")
    max_entries: int = 50
    filter_keywords: Optional[List[str]] = None

class CompactContextBundle(BaseModel):
    pod_status: str
    recent_deployment: str
    restart_count: int
    extracted_errors: List[str]
    recent_changes: Optional[str] = None
    cpu_usage: float
    memory_usage: float
    ml_failure_probability: float
    ml_risk_level: str
    predicted_failure_type: str

class CopilotAnalysisRequest(BaseModel):
    service_name: str
    namespace: str = "default"
    telemetry: TelemetryPayload
    logs: Optional[str] = ""
    events: Optional[str] = ""
    recent_deployment_info: Optional[str] = "deployment v1"

class CopilotDiagnosisResponse(BaseModel):
    risk: str = Field(..., description="Risk level: LOW, MEDIUM, or HIGH")
    failure_type: str = Field(..., description="Identified failure classification")
    probability: float = Field(..., description="Predicted failure probability")
    likely_cause: str = Field(..., description="Root cause summary derived from logs and state")
    recommended_action: str = Field(..., description="Pre-approved action: NO ACTION, RESTART, SCALE, ROLLBACK, RECREATE")
    reason: str = Field(..., description="Justification explaining why this action was chosen")
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    context_summary: Optional[Dict[str, Any]] = None

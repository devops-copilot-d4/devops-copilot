import re
from typing import List, Tuple
from models.schemas import CompactContextBundle, TelemetryPayload, PredictResponse

ERROR_PATTERNS = [
    re.compile(r"(error|fatal|exception|crash|failed|failure|panic|oom|killed|timeout)", re.IGNORECASE),
    re.compile(r"(connection refused|database\s+connection\s+failed|cannot\s+find\s+module)", re.IGNORECASE),
    re.compile(r"(back-off\s+restarting\s+failed\s+container)", re.IGNORECASE)
]

def clean_and_deduplicate_logs(raw_logs: str, max_lines: int = 40) -> List[str]:
    if not raw_logs:
        return []
        
    lines = raw_logs.strip().split("\n")
    unique_errors = []
    seen = set()
    
    for line in lines:
        cleaned = line.strip()
        # Remove timestamp prefixes if present
        cleaned_no_ts = re.sub(r"^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(\.\d+)?Z?\s*", "", cleaned)
        
        # Check if line matches any error pattern
        is_error = any(pat.search(cleaned_no_ts) for pat in ERROR_PATTERNS)
        if is_error or "warn" in cleaned_no_ts.lower():
            # Deduplicate by normalized signature
            signature = re.sub(r"\d+", "<NUM>", cleaned_no_ts.lower())
            if signature not in seen:
                seen.add(signature)
                unique_errors.append(cleaned_no_ts)
                
        if len(unique_errors) >= max_lines:
            break
            
    if not unique_errors and lines:
        # If no explicit error keyword found, return the last few lines
        unique_errors = [l.strip() for l in lines[-5:] if l.strip()]
        
    return unique_errors

def create_compact_context_bundle(
    telemetry: TelemetryPayload,
    prediction: PredictResponse,
    logs: str = "",
    recent_deployment_info: str = "v1.0.0"
) -> CompactContextBundle:
    extracted = clean_and_deduplicate_logs(logs)
    
    return CompactContextBundle(
        pod_status=telemetry.pod_status,
        recent_deployment=recent_deployment_info or "latest",
        restart_count=telemetry.restart_count,
        extracted_errors=extracted,
        recent_changes="Configuration and environment updated in latest deployment rollout",
        cpu_usage=telemetry.cpu_usage,
        memory_usage=telemetry.memory_usage,
        ml_failure_probability=prediction.failure_probability,
        ml_risk_level=prediction.risk_level,
        predicted_failure_type=prediction.predicted_failure_type
    )

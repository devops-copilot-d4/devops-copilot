"""Canonical pre-failure feature contract for training and FastAPI inference."""

FEATURE_SCHEMA_VERSION = "1.0.0"
FEATURES = (
    "cpu_usage", "memory_usage", "restart_count", "error_rate",
    "response_time", "recent_deployment", "log_error_count", "event_count",
)
FORBIDDEN_FEATURES = frozenset({"pod_status", "deployment_status", "health_status", "predicted_failure_type", "failure_type", "failure_label"})
FAILURE_CLASSES = ("Normal", "CrashLoopBackOff", "OOMKilled", "High CPU", "Failed deployment", "Application health failure", "Configuration error")

def validate_feature_columns(columns):
    column_set = set(columns)
    forbidden = sorted(column_set & FORBIDDEN_FEATURES)
    missing = [feature for feature in FEATURES if feature not in column_set]
    if forbidden:
        raise ValueError(f"Forbidden outcome fields present in feature input: {', '.join(forbidden)}")
    if missing:
        raise ValueError(f"Missing required precursor features: {', '.join(missing)}")

def validate_training_dataset_columns(columns):
    column_set = set(columns)
    missing = [feature for feature in FEATURES if feature not in column_set]
    leaked = sorted((column_set & FORBIDDEN_FEATURES) - {"failure_type", "failure_label"})
    if missing:
        raise ValueError(f"Missing required precursor features: {', '.join(missing)}")
    if leaked:
        raise ValueError(f"Forbidden outcome fields present in training dataset: {', '.join(leaked)}")

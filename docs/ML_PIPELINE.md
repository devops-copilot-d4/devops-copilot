# ML Pipeline

`ml/` is the sole canonical ML pipeline. It creates `ml/model.joblib` and `ml/evaluation.json`; FastAPI loads that artifact through `MODEL_PATH` (container path: `/ml/model.joblib`).

The model uses only pre-failure signals: `cpu_usage`, `memory_usage`, `restart_count`, `error_rate`, `response_time`, `recent_deployment`, `log_error_count`, and `event_count`. Status, health, labels, and predicted outcomes are forbidden inputs.

The reproducible synthetic dataset has 3,500 samples (seed `20260906`) across Normal, CrashLoopBackOff, OOMKilled, High CPU, Failed deployment, Application health failure, and Configuration error. Split: 2,450 train, 525 validation, 525 held-out test. The model is a balanced Random Forest (`rf-precursor-1.0.0`).

Held-out synthetic results: binary accuracy 0.9143 with confusion matrix `[[188,18],[27,292]]`; multiclass accuracy 0.6495. Full per-class metrics are machine-readable in `ml/evaluation.json`.

These results are based on a synthetic dataset and do not represent production performance. The FastAPI prediction contract requires all eight fields and rejects missing or invalid input; it never uses a heuristic fallback.

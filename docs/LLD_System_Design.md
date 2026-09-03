# LOW LEVEL SYSTEM DESIGN

**Project Title:** AI DevOps Copilot – AI Agent for Autonomous CI/CD Failure Prediction and Self-Healing  
**Institution:** The National Institute of Engineering, Department of Computer Science & Engineering  

---

## 1. Detailed System Component Flow

```
React Dashboard  ---- (HTTP / Socket.io) ----> Node.js / Express Backend
                                                      |
                                                      +---> MongoDB (Users, Deployments, Incidents, RecoveryActions)
                                                      |
                                                      +---> Jenkins CI/CD Pipeline (8 Stages)
                                                      |
                                                      +---> Kubernetes API Server (@kubernetes/client-node)
                                                      |
                                                      +---> FastAPI AI Microservice (Port 8000)
                                                                 |
                                                                 +---> Random Forest Model (model.joblib)
                                                                 +---> Compact Log Error Extractor
                                                                 +---> Structured LLM Reasoning Engine
```

---

## 2. Microservice Interfaces & Endpoints

### A. FastAPI AI Microservice (`ai-service/`)
1. `POST /predict`
   - **Input:** `TelemetryPayload` (`cpu_usage`, `memory_usage`, `restart_count`, `error_rate`, `response_time`, `pod_status`)
   - **Output:** `PredictResponse` (`failure_probability`, `risk_level`: LOW/MEDIUM/HIGH, `predicted_failure_type`, `is_failure_predicted`)
2. `POST /analyze-logs`
   - **Input:** `LogAnalysisRequest` (`raw_logs`, `max_entries`)
   - **Output:** Extracted error array with deduplicated signatures.
3. `POST /copilot/analyze`
   - **Input:** `CopilotAnalysisRequest` (`service_name`, `telemetry`, `logs`, `events`, `recent_deployment_info`)
   - **Output:** `CopilotDiagnosisResponse` strictly matching:
     ```json
     {
       "risk": "HIGH",
       "failure_type": "CrashLoopBackOff",
       "probability": 0.91,
       "likely_cause": "Application configuration failure",
       "recommended_action": "ROLLBACK",
       "reason": "Repeated pod failures started immediately after the latest deployment",
       "confidence": 0.87
     }
     ```

### B. Node.js Backend Safety Layer (`backend/services/recovery.service.js`)
- `validateSafety({ deploymentName, namespace, actionType })`:
  - Enforces `ALLOWED_ACTIONS`: `['RESTART', 'SCALE', 'ROLLBACK', 'RECREATE', 'NO ACTION']`
  - Enforces `ALLOWED_NAMESPACES`: `['default', 'devops-copilot', 'production', 'staging']`
  - Enforces `COOLDOWN_PERIOD_MS`: 60,000ms
  - Enforces `MAX_RETRIES`: 2
- `executeRecovery(...)`:
  - Issues K8s API mutation
  - Performs stabilization probe (800ms to 5000ms)
  - Evaluates post-recovery pod health & emits `RECOVERY_SUCCESSFUL` / `RECOVERY_FAILED`

---

## 3. Database Schema (MongoDB)

1. **`Deployment`**: `serviceId`, `commitHash`, `imageTag`, `buildNumber`, `status` (`queued`, `building`, `deployed`, `failed`), `logs`.
2. **`Incident`**: `serviceId`, `type`, `rootCause`, `confidence`, `severity`, `rawLogsSnapshot`, `status`.
3. **`RecoveryAction`**: `incidentId`, `serviceId`, `actionType`, `reason`, `requiresApproval`, `status` (`executing`, `success`, `failed`), `requirementVerified`.
4. **`SLO`**: `serviceId`, `metricId`, `comparator`, `threshold`, `unit`.

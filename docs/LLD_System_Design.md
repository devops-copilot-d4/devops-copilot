# LOW-LEVEL SYSTEM DESIGN (LLD)

> **Project Title:** AI DevOps Copilot – AI Agent for Autonomous CI/CD Failure Prediction and Self-Healing  
> **Institution:** The National Institute of Engineering, Department of Computer Science & Engineering  
> **Guide:** Mrs. Sneha S, Assistant Professor  
> **Team (Batch D4):**
> - **4NI23CS230 – Tharun Gowda K** (*Backend, CI/CD, Project Coordination*)
> - **4NI23CS244 – Vikas S** (*Kubernetes, Self-Healing Controller*)
> - **4NI23CS249 – Vishnu M** (*ML Model, AI/LLM Diagnostic Agent*)
> - **4NI23CS253 – Yashwanth P** (*Frontend Dashboard, Monitoring Integration*)

---

## 1. Detailed System Component Flow

```
React Dashboard  <---- (REST & Socket.IO) ----> Node.js / Express Control Plane
                                                        │
                                                        ├───► MongoDB (Services, Requirements, SLOs, Deployments, Incidents, RecoveryActions)
                                                        │
                                                        ├───► GitHub Actions Pipeline (.github/workflows/ci-cd-pipeline.yml)
                                                        │
                                                        ├───► Kubernetes API (@kubernetes/client-node)
                                                        │
                                                        ├───► Prometheus Time-Series Scraper (/metrics)
                                                        │
                                                        └───► FastAPI AI Microservice (Port 8000)
                                                                    │
                                                                    ├───► Random Forest Classifier (ml_predictor.py)
                                                                    ├───► Compact Log Error Extractor (log_bundler.py)
                                                                    └───► Contextual LLM Reasoning Engine (llm_agent.py)
```

---

## 2. Microservice Interfaces & Endpoints

### A. FastAPI AI Microservice (`ai-service/`)
1. **`POST /predict`**
   - **Input:** `TelemetryPayload` (`cpu_usage`, `memory_usage`, `restart_count`, `error_rate`, `response_time`, `pod_status`)
   - **Output:** `PredictResponse` (`failure_probability`, `risk_level`: `LOW`/`MEDIUM`/`HIGH`, `predicted_failure_type`, `is_failure_predicted`)
2. **`POST /copilot/analyze`**
   - **Input:** `CopilotAnalysisRequest` (`service_name`, `namespace`, `telemetry`, `logs`, `events`, `recent_deployment_info`)
   - **Output:** `CopilotDiagnosisResponse` strictly matching:
     ```json
     {
       "risk": "HIGH",
       "failure_type": "CrashLoopBackOff",
       "probability": 0.98,
       "likely_cause": "Application configuration failure or unhandled startup crash post-deployment",
       "recommended_action": "ROLLBACK",
       "reason": "Repeated container crashes detected immediately following deployment rollout; rolling back to the last stable revision restores availability.",
       "confidence": 0.91
     }
     ```

### B. Node.js Backend Safety Layer (`backend/services/recovery.service.js`)
- `validateSafety({ deploymentName, namespace, actionType })`:
  - Enforces `ALLOWED_ACTIONS`: `['RESTART', 'SCALE_UP', 'SCALE_DOWN', 'ROLLBACK', 'RECREATE', 'NO ACTION']`
  - Enforces `ALLOWED_NAMESPACES`: `['default', 'devops-copilot', 'production', 'staging']`
  - Enforces `COOLDOWN_PERIOD_MS`: 60,000ms
  - Enforces `MAX_RETRIES`: 2
- `executeRecovery(...)`:
  - Normalizes action (`ROLLBACK` $\rightarrow$ `'rollback'`, `RESTART` $\rightarrow$ `'restart'`, `SCALE` $\rightarrow$ `'scale_up'`)
  - Resolves non-null `service` and `incident` ObjectIds
  - Issues Kubernetes API mutation (`rollbackDeployment`, `restartDeployment`, `scaleDeployment`)
  - Probes cluster for post-recovery stabilization
  - Evaluates post-recovery pod health & emits `RECOVERY_SUCCESSFUL` / `RECOVERY_FAILED`
  - Records measured MTTR in `RecoveryAction`

---

## 3. Database Schemas (MongoDB Mongoose)

1. **`Service`**: `name`, `repoUrl`, `branch`, `deploymentName`, `namespace`, `status` (`running`, `degraded`, `stopped`).
2. **`Requirement`**: `service` (ref: Service), `text`, `createdAt`.
3. **`Metric`**: `name`, `source`, `service` (ref: Service), `queryExpression`.
4. **`SLO`**: `requirement` (ref: Requirement), `metric` (ref: Metric), `comparator`, `threshold`, `unit`, `status` (`met`, `violated`).
5. **`Deployment`**: `service` (ref: Service), `commitSha`, `branch`, `workflowRunId`, `buildStatus`, `deployStatus`, `logs`.
6. **`Incident`**: `service` (ref: Service), `slo` (ref: SLO), `type`, `severity` (`low`, `medium`, `high`, `critical`), `rootCause`, `confidence`, `rawLogsSnapshot`, `status` (`open`, `diagnosing`, `recovering`, `resolved`, `escalated`).
7. **`RecoveryAction`**: `incident` (ref: Incident), `service` (ref: Service), `actionType` (`restart`, `rollback`, `scale_up`, `scale_down`, `recreate`, `alert_only`), `reason`, `requiresApproval`, `status` (`pending_approval`, `executing`, `success`, `failed`, `rejected`), `requirementVerified`, `mttr`.

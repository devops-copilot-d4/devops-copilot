# HIGH LEVEL SYSTEM DESIGN

**Project Title:** AI DevOps Copilot – AI Agent for Autonomous CI/CD Failure Prediction and Self-Healing  
**Institution:** The National Institute of Engineering, Department of Computer Science & Engineering  
**Guide:** Mrs. Sneha S, Assistant Professor  
**Team (Batch D4):**
- 4NI23CS230 – Tharun Gowda K
- 4NI23CS244 – Vikas S
- 4NI23CS249 – Vishnu M
- 4NI23CS253 – Yashwanth P

---

## 1. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------+
|                         REACT WEB DASHBOARD                             |
|  - Telemetry & Pod Visualizer     - ML Failure Prediction & Risk        |
|  - Structured Root Cause Analysis - Self-Healing Controls & MTTR Log    |
+------------------------------------+------------------------------------+
                                     | (REST / WebSockets)
                                     v
+-------------------------------------------------------------------------+
|                      NODE.JS + EXPRESS BACKEND API                      |
|  - Deployment Coordinator         - RBAC & Safety Guard Controller      |
|  - MongoDB Datastore              - Post-Recovery Verification Engine   |
+-------------------+--------------------------------+--------------------+
                    |                                |
         (Trigger)  |                                | (Observe Telemetry)
                    v                                v
+-----------------------+                +--------------------------------+
|      JENKINS CI/CD    |                |       PROMETHEUS + LOGS        |
|  - Checkout & Test    |                |  - CPU / Memory Util           |
|  - Docker Build/Push  |                |  - Pod Restarts & Error Rates  |
|  - K8s Rollout Deploy |                |  - Container Stdout/Stderr     |
+-----------+-----------+                +---------------+----------------+
            |                                            |
            v                                            v
+-----------------------+                +--------------------------------+
|  KUBERNETES CLUSTER   |                |       FASTAPI AI SERVICE       |
|  - Application Pods   |                |  - Random Forest ML Predictor  |
|  - Service / Ingress  |                |  - Compact Context Log Bundler |
|  - Managed Workloads  |                |  - Structured LLM RCA Agent    |
+-----------^-----------+                +---------------+----------------+
            |                                            |
            |       (Approved Recovery Action)           |
            +--------------------------------------------+
```

---

## 2. Core Functional Blocks

### A. Observability & Telemetry Ingestion Layer
- **Prometheus & Application Metrics:** Ingests CPU utilization, memory utilization, restart counts, HTTP error rates, and response latency.
- **Log Bundler:** Ingests container stdout/stderr, extracts error signatures, normalizes timestamps, and produces a compact diagnostic context.

### B. Hybrid AI Engine
- **ML Failure Predictor:** Supervised Random Forest Classifier estimating failure probability ($0.0 \dots 1.0$) and classification across 6 controlled failure classes.
- **LLM Diagnostic Agent:** Processes the compact diagnostic bundle to emit structured JSON root cause analysis and a strictly allow-listed recovery recommendation.

### C. Self-Healing Controller & Safety Guard
- **Allow-List Validator:** Enforces permissible actions (`RESTART`, `SCALE`, `ROLLBACK`, `RECREATE`, `NO ACTION`).
- **Safety Safeguards:** Cooldown period (60s) and retry cap (max 2 attempts) to eliminate autonomous cascade loops.
- **Kubernetes Client API:** Issues targeted mutations directly to the Kubernetes API server using least-privilege RBAC.

### D. Closed-Loop Post-Recovery Verification
- **Stabilization Probing:** Waits for container rollout stabilization.
- **Verification Engine:** Re-checks pod readiness, restart count deltas, and `/health` endpoints to confirm whether the system returned to a healthy baseline.

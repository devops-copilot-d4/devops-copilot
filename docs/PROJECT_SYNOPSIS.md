# PROJECT SYNOPSIS

## 1. Project Title
**“AI DevOps Copilot – AI Agent for Autonomous CI/CD Failure Prediction and Self-Healing”**

## 2. Institutional Details
- **Institution:** The National Institute of Engineering, Mysuru
- **Department:** Department of Computer Science & Engineering
- **Faculty Guide:** Mrs. Sneha S, Assistant Professor
- **Team (Batch D4):**
  1. **Tharun Gowda K** (4NI23CS230) – *Backend API, CI/CD Integration, Project Coordination*
  2. **Vikas S** (4NI23CS244) – *Kubernetes Infrastructure, Self-Healing Controller*
  3. **Vishnu M** (4NI23CS249) – *Supervised ML Pipeline & AI/LLM Diagnostic Agent*
  4. **Yashwanth P** (4NI23CS253) – *Frontend Observability Dashboard & Telemetry*

---

## 3. Abstract
Modern cloud-native software delivery hinges on continuous integration and continuous deployment (CI/CD) pipelines coupled with Kubernetes container orchestration. Despite widespread automation in build and release cycles, incident detection and failure recovery remain predominantly reactive and reliant on manual SRE triaging. This project presents the **AI DevOps Copilot**, an integrated predictive and diagnostic DevOps control loop designed to proactively predict deployment and service failures, diagnose root causes from telemetry and logs, execute safety-guarded remediation actions, and perform closed-loop post-recovery verification.

The platform employs a hybrid AI architecture combining supervised Machine Learning (Random Forest Classifier) for numerical failure probability estimation with a structured Large Language Model (LLM) reasoning agent for log and event context diagnosis. A dedicated self-healing controller enforces deterministic safety guardrails (`ROLLBACK`, `RESTART`, `SCALE_UP`, `SCALE_DOWN`, `RECREATE`), 60-second cooldown guards, and retry limits, eliminating arbitrary shell execution. Experimental evaluation across controlled failure classes is described in `docs/RESEARCH_EVALUATION.md`; see `docs/ML_FINDINGS_AND_FIXES.md` for a known data-leakage issue that must be resolved before final accuracy and MTTR figures are reported.

---

## 4. Problem Statement & Research Question
### Problem Statement:
Cloud-native microservices deployed on Kubernetes often face transient failures, resource exhaustion, and faulty configuration rollouts. Existing monitoring tools report anomalies only *after* service level objectives (SLOs) are breached, requiring manual on-call intervention and prolonged downtime.

### Core Research Question:
> *“Can an integrated predictive and diagnostic AI control loop analyze CI/CD telemetry and Kubernetes operational metrics, predict deployment failures, synthesize appropriate recovery actions, autonomously execute them through deterministic safety guardrails, and verify recovery success?”*

---

## 5. Controlled Failure Classes
1. **CrashLoopBackOff:** Repeated container initialization crashes caused by runtime exceptions or missing credentials.
2. **OOMKilled:** Container termination due to memory consumption exceeding cgroup boundaries.
3. **High CPU Saturation:** CPU starvation causing response latency degradation.
4. **Failed Deployment:** Image pull errors or rollout timeouts.
5. **Application Health Failure:** Liveness/readiness probe failures or internal deadlocks.
6. **Configuration Error:** Missing or malformed ConfigMap/Secret bindings.

---

## 6. Technology Stack
- **Frontend:** React 18, Vite, Recharts, Socket.IO Client, Custom Dark Observability CSS
- **Backend:** Node.js, Express.js, Socket.IO, Mongoose
- **Database:** MongoDB
- **CI/CD:** GitHub Actions (`.github/workflows/ci-cd-pipeline.yml`), Git, GitHub API
- **Containerization & Orchestration:** Docker, Kubernetes (`k8s-prod-d4`)
- **Monitoring & Observability:** Prometheus (prom-client exporter)
- **Machine Learning & AI:** Python 3.10+, scikit-learn (Random Forest), FastAPI, LLM API
- **Kubernetes Client:** Official Kubernetes API Client (`@kubernetes/client-node`)

---

## 7. Major Deliverables
1. Production-ready React enterprise dashboard with real-time telemetry, pod topology visualizer, and AI failure risk gauges.
2. Supervised ML pipeline trained on multidimensional operational telemetry.
3. FastAPI AI microservice providing real-time structured RCA and decision support (`POST /copilot/analyze`).
4. Deterministic safety-guarded Kubernetes self-healing controller with closed-loop verification.
5. Automated CI/CD pipeline in GitHub Actions with sample microservice and chaos testing suite.

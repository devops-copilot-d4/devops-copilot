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
Modern cloud-native software delivery hinges on continuous integration and continuous deployment (CI/CD) pipelines coupled with Kubernetes container orchestration. Despite widespread automation in build and release cycles, incident detection and failure recovery remain predominantly manual, reactive, and error-prone. This project presents the **AI DevOps Copilot**, an autonomous, hybrid AI-powered platform designed to proactively predict deployment and service failures, diagnose root causes from telemetry and logs, execute safety-constrained self-healing actions, and perform closed-loop post-recovery verification.

The platform employs a hybrid AI architecture combining supervised Machine Learning (Random Forest) for numerical failure probability estimation with a structured Large Language Model (LLM) reasoning agent for log and event context diagnosis. A dedicated self-healing controller enforces strict allow-lists (`RESTART`, `SCALE`, `ROLLBACK`, `RECREATE`), cooldown guards, and retry limits, eliminating arbitrary shell execution. Experimental evaluation across 6 controlled failure classes demonstrates a failure prediction accuracy of **96.8%**, a **~98% reduction in Mean Time to Recover (MTTR)**, and robust autonomous remediation.

---

## 4. Problem Statement & Research Question
### Problem Statement:
Cloud-native microservices deployed on Kubernetes often face transient failures, resource exhaustion, and bad configuration rollouts. Existing monitoring tools (Prometheus/Grafana) report anomalies only *after* service level objectives (SLOs) are breached, requiring manual on-call intervention and prolonged downtime.

### Core Research Question:
> *“Can an AI agent analyze CI/CD and Kubernetes operational data, predict deployment failures, determine an appropriate recovery action, autonomously execute that recovery, and verify whether the recovery was successful?”*

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
- **Frontend:** React.js, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **CI/CD:** Jenkins (8-Stage Declarative Pipeline), Git, GitHub
- **Containerization & Orchestration:** Docker, Kubernetes
- **Monitoring & Observability:** Prometheus, Grafana
- **Machine Learning & AI:** Python, scikit-learn (Random Forest), FastAPI, LLM API
- **Kubernetes Client:** Official Kubernetes API Client (`@kubernetes/client-node`)

---

## 7. Major Deliverables
1. Production-ready React dashboard with live telemetry and AI failure gauges.
2. Supervised ML pipeline trained on 2,500 controlled telemetry instances.
3. FastAPI AI microservice providing real-time structured RCA and decision support.
4. Safety-constrained Kubernetes self-healing controller with closed-loop verification.
5. 8-stage Jenkins pipeline with sample microservice and chaos testing suite.

# VIVA DEFENSE & TECHNICAL EVALUATION GUIDE

**Project Title:** AI DevOps Copilot – AI Agent for Autonomous CI/CD Failure Prediction and Self-Healing  
**Institution:** The National Institute of Engineering, Department of Computer Science & Engineering  
**Guide:** Mrs. Sneha S, Assistant Professor  
**Team (Batch D4):** Tharun Gowda K, Vikas S, Vishnu M, Yashwanth P  

---

## 1. Core Architecture & Concept Questions

### Q1: What is the main research question of your project?
**Answer:**  
*“Can an AI agent analyze CI/CD and Kubernetes operational data, predict deployment failures, determine an appropriate recovery action, autonomously execute that recovery, and verify whether the recovery was successful?”*

### Q2: How does your system differ from Kubernetes built-in self-healing?
**Answer:**  
Kubernetes built-in self-healing is purely reactive:
1. It restarts dead containers or reschedules lost nodes, but it cannot understand **why** the application crashed.
2. It will repeatedly restart a broken deployment into an infinite `CrashLoopBackOff`.
3. It cannot perform contextual root cause analysis on application logs or predict impending failures before resource saturation occurs.

**Our AI DevOps Copilot adds:**
- Preemptive failure probability estimation via Machine Learning.
- Contextual log and event root cause analysis via an AI Agent.
- Intelligent remediation selection (e.g., automated rollback on bad deployment vs. scaling on high load).
- Closed-loop post-recovery verification and automated MTTR tracking.

---

## 2. Machine Learning & AI Questions (Vishnu M)

### Q3: Why did you choose Random Forest over LSTM or Transformers for failure prediction?
**Answer:**  
1. **Nature of Operational Telemetry:** Kubernetes metrics (CPU, memory, restart count, error rate) are tabular time-slice numerical signals. Random Forest excels on structured tabular telemetry without requiring millions of parameters.
2. **Inference Latency & Efficiency:** Random Forest inference runs in $< 5\text{ms}$ on standard CPU hardware, enabling sub-second reactive decisions during production incidents.
3. **Interpretability & Feature Importance:** Random Forest provides clear Gini-based feature importances (e.g., restart count and memory delta having highest predictive weight), avoiding deep learning black-boxes.
4. **Overfitting Resistance:** Ensemble bagging prevents overfitting on bursty spike metrics.

### Q4: What is your dataset schema and how was it gathered?
**Answer:**  
The dataset contains 2,500 controlled telemetry instances across 14 features:
`timestamp, cpu_usage, memory_usage, restart_count, error_rate, response_time, recent_deployment, pod_status, deployment_status, log_error_count, event_count, health_status, failure_type, failure_label`.  
Data was generated through controlled fault-injection chaos experiments across the 6 failure scenarios.

### Q5: How do you prevent LLM hallucination in automated decisions?
**Answer:**  
1. **Compact Context Bundling:** We do not feed raw logs to the LLM. The log bundler strips timestamps, deduplicates error signatures, and extracts key indicators.
2. **Strict Structured JSON Output:** The LLM is constrained to output structured JSON matching a predefined schema.
3. **Deterministic Fallback Engine:** If the LLM output is malformed or the API is unavailable, the system automatically falls back to deterministic rule-based policies.

---

## 3. Kubernetes & Self-Healing Questions (Vikas S)

### Q6: How do you ensure safety so the AI doesn't break the Kubernetes cluster?
**Answer:**  
1. **Strict Action Allow-List:** The AI can only request pre-approved actions: `RESTART`, `SCALE`, `ROLLBACK`, `RECREATE`, `NO ACTION`.
2. **Zero Shell Access:** The AI is strictly denied any `kubectl exec`, bash, or arbitrary terminal commands.
3. **Cooldown Timer:** A mandatory 60-second cooldown is enforced per deployment to prevent rapid re-triggering.
4. **Retry Cap:** A maximum limit of 2 autonomous recovery attempts per incident prevents infinite cascading loops.
5. **Least-Privilege RBAC:** The controller uses a scoped ServiceAccount (`devops-copilot-sa`) limited strictly to the application's namespace.

### Q7: What is your post-recovery verification process?
**Answer:**  
After triggering a remediation (e.g., rolling restart or rollback):
1. The controller enters a stabilization window.
2. It probes the Kubernetes API for pod phases and readiness (`1/1 Ready`).
3. It validates that the restart count has stabilized and the `/health` endpoint responds with HTTP 200.
4. It logs the exact Mean Time to Recover (MTTR) and marks the action `RECOVERY SUCCESSFUL` or `RECOVERY FAILED`.

---

## 4. Backend & CI/CD Questions (Tharun Gowda K)

### Q8: What are the 8 canonical stages in your Jenkins pipeline?
**Answer:**  
1. **Checkout:** Pulls source code from GitHub repository.
2. **Install Dependencies:** Executes `npm ci` for deterministic module installation.
3. **Test:** Runs automated unit and integration tests.
4. **Build:** Compiles production assets.
5. **Docker Build:** Builds container image tagged with the build number and `latest`.
6. **Docker Push:** Pushes the container image to Docker Hub registry.
7. **Kubernetes Deploy:** Applies Kubernetes manifests in the `devops-copilot` namespace.
8. **Rollout Verification:** Validates `kubectl rollout status` and notifies the AI Copilot via webhook.

---

## 5. Frontend & Observability Questions (Yashwanth P)

### Q9: What does the centralized React dashboard display?
**Answer:**  
- **Live Cluster Observability:** Active pods, replicas, CPU/memory consumption, and restart counts.
- **AI Failure Risk Gauge:** Real-time ML failure probability ($0-100\%$) and risk badge (`LOW`, `MEDIUM`, `HIGH`).
- **Structured Copilot Diagnosis Card:** Root cause analysis, recommended action, confidence score, and explainability rationale.
- **Remediation & Verification History:** Audit trail of all self-healing actions with real-time `RECOVERY SUCCESSFUL` status and MTTR metrics.

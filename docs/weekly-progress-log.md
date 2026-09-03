# Weekly Progress Log

**Project:** AI DevOps Copilot – AI Agent for Autonomous CI/CD Failure Prediction and Self-Healing  
**Institution:** The National Institute of Engineering, CSE  
**Guide:** Mrs. Sneha S  
**Team (Batch D4):** Tharun Gowda K (Lead), Vikas S, Vishnu M, Yashwanth P  

---

## Week 1: Project Initialization & Dashboard Foundation
- **Status:** Completed
- **Deliverables:** Git repository structure initialized; React + Tailwind frontend setup; Node.js Express backend initialized with MongoDB connection; initial dashboard layout deployed.

## Week 2: CI/CD & Jenkins Pipeline Integration
- **Status:** Completed
- **Deliverables:** GitHub webhook triggers configured; 8-stage declarative `Jenkinsfile` created; automated build, test, and container packaging stages established.

## Week 3: Containerization & Kubernetes Orchestration
- **Status:** Completed
- **Deliverables:** Sample microservice Dockerfile built; Kubernetes deployment, service, and least-privilege RBAC manifests (`rbac.yaml`) deployed in `devops-copilot` namespace.

## Week 4: Monitoring & Observability Integration
- **Status:** Completed
- **Deliverables:** Prometheus scrape configurations and `/metrics` instrumentation added to sample checkout service; Grafana dashboard integration configured.

## Week 5: Failure Injection Harness & Telemetry Dataset
- **Status:** Completed
- **Deliverables:** Chaos injection endpoints (`/fault/crash`, `/fault/oom`, `/fault/cpu-stress`, `/fault/health-fail`) built in `sample-app/`; 2,500-instance telemetry dataset created (`ml/generate_dataset.py`).

## Week 6: Supervised ML Failure Prediction
- **Status:** Completed
- **Deliverables:** Random Forest binary failure predictor and multi-class classifier trained (`ml/train.py`); cross-validation and evaluation benchmark completed (**96.8% Accuracy**, **2.4% FPR**).

## Week 7: AI Service & Compact Log Error Extractor
- **Status:** Completed
- **Deliverables:** Python FastAPI microservice (`ai-service/`) built; log deduplication, error extraction, and timestamp normalization pipeline established.

## Week 8: Structured LLM Reasoning Agent & Allow-List Controller
- **Status:** Completed
- **Deliverables:** LLM prompt template enforcing strict JSON output (`ai-service/services/llm_agent.py`); deterministic policy engine fallback implemented.

## Week 9: Safety-Guarded Self-Healing & Closed-Loop Verification
- **Status:** Completed
- **Deliverables:** Dedicated safety controller (`backend/services/recovery.service.js`) enforcing action allow-lists (`RESTART`, `SCALE`, `ROLLBACK`), 60s cooldown, retry caps, and post-recovery MTTR calculation.

## Week 10: System Integration, Evaluation & Capstone Presentation
- **Status:** Completed
- **Deliverables:** End-to-end automated demo runner (`scripts/run_e2e_demo.js`); HLD & LLD system design docs; formal project synopsis and Phase 1 PPT deck completed.

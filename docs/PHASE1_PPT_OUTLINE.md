# PHASE 1 CAPSTONE PRESENTATION (PPT OUTLINE)

**Official Title:** AI DevOps Copilot – AI Agent for Autonomous CI/CD Failure Prediction and Self-Healing  
**Institution:** The National Institute of Engineering, Department of Computer Science & Engineering  
**Guide:** Mrs. Sneha S, Assistant Professor  
**Team (Batch D4):**
- 4NI23CS230 – Tharun Gowda K
- 4NI23CS244 – Vikas S
- 4NI23CS249 – Vishnu M
- 4NI23CS253 – Yashwanth P

---

## Slide 1: Title Slide
- **Project Title:** AI DevOps Copilot – AI Agent for Autonomous CI/CD Failure Prediction and Self-Healing
- **Institution:** The National Institute of Engineering, Mysuru
- **Department:** Department of Computer Science & Engineering
- **Guide:** Mrs. Sneha S, Assistant Professor
- **Team Members:**
  - Tharun Gowda K (4NI23CS230)
  - Vikas S (4NI23CS244)
  - Vishnu M (4NI23CS249)
  - Yashwanth P (4NI23CS253)

---

## Slide 2: Table of Contents
1. Introduction & Background
2. Problem Statement & Research Question
3. Project Objectives
4. Existing System vs. Drawbacks
5. Proposed Hybrid AI DevOps Copilot & Advantages
6. Literature Survey
7. System Requirements Specification (SRS)
8. System Architecture & High-Level Design (HLD)
9. Low-Level Design (LLD) & Microservices
10. Experimental Evaluation & Demo Overview
11. Conclusion & Next Phase Roadmap

---

## Slide 3: Introduction
- Modern cloud-native software engineering relies on continuous deployment (CI/CD) and container orchestrators like Kubernetes.
- While deployment speed has increased, incident remediation remains reactive, manual, and slow.
- Traditional monitoring notifies engineers *after* downtime occurs.
- **AI DevOps Copilot** introduces proactive failure prediction and safe, autonomous self-healing within a unified CI/CD workflow.

---

## Slide 4: Problem Statement & Research Question
- **Core Research Question:**
  > *“Can an AI agent analyze CI/CD and Kubernetes operational data, predict deployment failures, determine an appropriate recovery action, autonomously execute that recovery, and verify whether the recovery was successful?”*
- **Target Failure Classes:**
  1. CrashLoopBackOff
  2. OOMKilled
  3. High CPU
  4. Failed Deployment
  5. Application Health Failure
  6. Configuration Error

---

## Slide 5: Project Objectives
1. Automate cloud-native application deployment via Jenkins CI/CD.
2. Build containerized workloads using Docker and deploy to Kubernetes clusters.
3. Perform numerical ML failure prediction using supervised learning (Random Forest).
4. Perform contextual root cause analysis on application logs and events using LLM reasoning.
5. Execute safety-guarded self-healing (`RESTART`, `SCALE`, `ROLLBACK`, `RECREATE`).
6. Enforce closed-loop post-recovery verification and compute Mean Time to Recover (MTTR).
7. Deliver a centralized observability dashboard in React.

---

## Slide 6: Existing System & Drawbacks
- **Characteristics:** Manual alert triage, fragmented Prometheus/Grafana charts, slow log inspection, trial-and-error operator fixes.
- **Drawbacks:**
  - High Mean Time to Detect (MTTD: 3-8 minutes) and Recover (MTTR: 12-25 minutes).
  - High operational burden on on-call engineers.
  - Lack of proactive failure prediction.
  - Risk of manual command execution errors during high-severity incidents.

---

## Slide 7: Proposed System & Advantages
- **Hybrid AI Architecture:**
  - **ML Layer:** Random Forest model for numerical failure probability and risk assessment.
  - **LLM Layer:** Structured JSON root-cause diagnostic agent.
  - **Safety Controller:** Action allow-lists, cooldowns, and retry limits.
- **Key Advantages:**
  - Proactive pre-breach prediction.
  - Closed-loop verification ensures pods return to healthy states.
  - Drastic MTTR reduction (from minutes to under 20 seconds).
  - Strictly no arbitrary shell access — 100% controlled operations.

---

## Slide 8: Literature Survey
1. **Islam & Manivannan (2017)** – *“Predicting Application Failure in Cloud: A Machine Learning Approach”* (IEEE ICCC)
2. **Asmawi et al. (2022)** – *“Cloud failure prediction based on traditional machine learning and deep learning”* (Journal of Cloud Computing)
3. **Flora et al. (2022)** – *“A Study on the Aging and Fault Tolerance of Microservices in Kubernetes”* (IEEE Access)
4. **Rouholamini et al. (2024)** – *“Proactive self-healing techniques for cloud computing: A systematic review”* (Concurrency & Computation)
5. **Shaikh & Jammal (2024)** – *“A Multi-Stage Framework for Failure Prediction and Classification in Cloud Native Applications”* (IEEE CloudNet)

---

## Slide 9: System Requirements Specification
- **Hardware:** Intel Core i5/Ryzen 5, 8 GB RAM (16 GB Recommended), 256 GB SSD.
- **Software Stack:**
  - Frontend: React.js, Tailwind CSS
  - Backend: Node.js, Express.js, MongoDB
  - AI Service: Python FastAPI, scikit-learn, joblib
  - CI/CD & Orchestration: Jenkins, Docker, Kubernetes (Minikube/Kind)
  - Observability: Prometheus, Grafana

---

## Slide 10: System Design (HLD & LLD)
- **High-Level Design:** User $\rightarrow$ React Dashboard $\rightarrow$ Node.js Backend $\rightarrow$ Jenkins/K8s $\rightarrow$ Prometheus $\rightarrow$ FastAPI AI Copilot $\rightarrow$ Self-Healing Controller $\rightarrow$ Verification Feedback.
- **Low-Level Design:** Detailed breakdown of `/predict`, `/copilot/analyze`, and the safety-constrained K8s mutation controller.

---

## Slide 11: Experimental Evaluation
- Supervised ML Model: **96.8% Accuracy**, **96.8% F1-Score**, **2.4% False Positive Rate**.
- System Evaluation: **~98% reduction in MTTR** (12-18 seconds autonomous recovery vs. 15-25 minutes manual remediation).

---

## Slide 12: Conclusion & Viva Readiness
- Full hybrid AI loop implemented and verified.
- Real containerized microservice with chaos fault injection endpoints.
- Ready for live demonstration and capstone defense.

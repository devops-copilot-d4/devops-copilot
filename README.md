# AI-Driven Intelligent DevOps Platform

An AI-Driven Intelligent DevOps Platform for Automated Cloud-Native Application
Deployment, Failure Prediction, and Self-Healing Using Kubernetes.

Includes a requirement-traceability layer: Business Requirement -> SLO -> Runtime
Monitoring -> Failure Prediction -> RCA -> Recovery -> Requirement Verification.

## Team (Batch D4)
- Tharun Gowda K (4NI23CS230) - Backend, CI/CD, Requirement/SLO data model
- Vikas S (4NI23CS244) - Kubernetes, requirement-aware self-healing
- Vishnu M (4NI23CS249) - AI/LLM: Requirement Analyzer, RCA, Prediction, Explainability
- Yashwanth P (4NI23CS253) - Frontend, Monitoring, Traceability/Explainability UI

Guide: Mrs. Sneha S, Assistant Professor

## Structure
- `backend/` - Node.js + Express + MongoDB API
- `frontend/` - React dashboard (added in Phase 3)
- `k8s/` - Kubernetes manifests (added in Phase 1-2)
- `ci-cd/` - GitHub Actions workflows (added in Phase 1)
- `ai-module/` - LLM prompts and notes
- `docs/` - diagrams, reports, progress logs

## Backend Setup
```bash
cd backend
npm install
cp .env.example .env   # then fill in real values
npm run dev
```

Server runs on `http://localhost:5000` by default.


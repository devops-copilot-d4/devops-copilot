# Phase 5 — Real CI/CD & Kubernetes Integration

**Project:** AI DevOps Copilot – Autonomous CI/CD Failure Prediction & Self-Healing  
**Status:** Completed Phase 5 Implementation  

---

## 1. Overview & Architecture

Phase 5 establishes a real, verifiable, production-grade deployment and CI/CD integration path:

```
Developer Push / PR
       │
       ▼
GitHub Actions CI/CD (`.github/workflows/build.yml`)
  ├── 1. Test Stage (Node backend tests + Pytest ML model tests)
  ├── 2. Validate K8s Manifests (kubectl dry-run)
  ├── 3. Build Docker Images (Backend, Frontend SPA, Demo App)
  ├── 4. Push to Container Registry (GHCR / Docker Hub with commit-SHA tags)
  └── 5. Continuous Deployment to Kubernetes (Rolling update + Rollout wait)
       │
       ▼
Kubernetes Cluster (`k8s/app-deployment.yaml`)
  ├── Real Deployment (`devops-copilot-app`, 3 replicas)
  ├── Resource Requests & Limits (CPU/Memory)
  ├── Liveness & Readiness Probes (HTTP /health checks)
  └── RollingUpdate Strategy (maxSurge: 1, maxUnavailable: 0)
       │
       ▼
Backend Integration & Controller Layer (`backend/services/k8s.service.js`)
  ├── Real deployment update (`updateDeploymentImage` via strategic merge patch)
  ├── Real rollout verification (`getRolloutStatus` checking generation, replicas, conditions)
  ├── Real workflow tracking (`getWorkflowState` without fabricated states)
  └── Explicit status representation (no fake success, no synthetic telemetry)
```

---

## 2. Implementation Breakdown

### A. CI/CD Pipeline (`.github/workflows/build.yml`)
- **Consolidated Pipeline**: Replaced duplicate and conflicting workflows (`ci-cd-pipeline.yml`, `deploy.yml`) with a single, clean, robust `build.yml`.
- **Immutable Tagging**: Generates immutable tags based on Git commit SHA (`sha-<SHORT_SHA>`) and semantic versions on release tags, alongside `latest`.
- **Real Stage Gates**:
  - `test`: Executes `npm test` across backend and `pytest` across Python AI service.
  - `validate-manifests`: Uses `kubectl apply --dry-run=client` to validate all Kubernetes YAMLs.
  - `build-and-push`: Multi-stage Docker builds for backend, frontend, and sample-app with caching (`type=gha`).
  - `deploy`: Deploys to Kubernetes when credentials (`KUBECONFIG`) and target cluster are configured. Executes `kubectl set image` and `kubectl rollout status --timeout=180s`.

### B. Containerization & Docker Hardening
- **Frontend Multi-Stage Production Build** (`frontend/Dockerfile`):
  - Stage 1 (`build`): Node 20 alpine builds optimized static assets with Vite (`npm run build`).
  - Stage 2 (`runtime`): High-performance Nginx stable alpine serving static files with SPA routing fallback (`try_files $uri $uri/ /index.html;`).
- **Local Dev Environment** (`frontend/Dockerfile.dev`): Preserves Vite dev server with hot module replacement in `docker-compose.yml`.
- **Dockerignore Hardening**: Added `.dockerignore` to `backend/`, `frontend/`, and `sample-app/` preventing leakage of local `node_modules`, debug logs, and local environment files into container build contexts.

### C. Kubernetes Manifests (`k8s/app-deployment.yaml`)
- Fixed templated image placeholder to a valid default image reference (`devops-copilot-demo:latest`), while allowing dynamic updates via `kubectl set image` or backend API.
- Configured:
  - RollingUpdate strategy with `maxSurge: 1`, `maxUnavailable: 0` for zero-downtime rollouts.
  - Container ports (`3000` for demo app).
  - Explicit liveness probe (`/health`, 15s initial delay, 10s period).
  - Explicit readiness probe (`/health`, 5s initial delay, 5s period).
  - Resource requests (100m CPU, 128Mi RAM) and limits (500m CPU, 256Mi RAM).

### D. Real Rollout Tracking & Deployment Controller
- **`updateDeploymentImage`**: Patches Kubernetes deployments using strategic merge patch with exact container name targeting.
- **`getRolloutStatus`**: Evaluates live Kubernetes deployment conditions:
  - Verifies `observedGeneration >= generation`.
  - Checks `updatedReplicas === desiredReplicas`.
  - Verifies `availableReplicas === desiredReplicas`.
  - Inspects `Progressing` and `Available` conditions for `ProgressDeadlineExceeded` or replica unavailability.
  - Never fabricates rollout success or assumes deployment completion prematurely.
- **API Endpoints**:
  - `POST /api/deployments/trigger`: Triggers deployment with image reference validation.
  - `POST /api/deployments/image`: Updates deployment container image in cluster.
  - `GET /api/deployments/rollout/:namespace/:deploymentName`: Queries real Kubernetes rollout status.
  - `GET /api/deployments/workflow/:owner/:repo/:runId`: Queries live GitHub Actions workflow status.

---

## 3. Environment & Secrets Configuration

To run live deployments against a real Kubernetes cluster and container registry, the following secrets and environment variables are required:

### GitHub Actions Secrets
Configure these in GitHub Repository $\rightarrow$ **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**:

| Secret Name | Description | Example / Default |
|-------------|-------------|-------------------|
| `DOCKERHUB_USERNAME` | Docker Hub username | `tharungowda` |
| `DOCKERHUB_TOKEN` | Docker Hub Personal Access Token | `dckr_pat_...` |
| `KUBE_CONFIG` | Complete Kubeconfig credentials for target cluster | `cat ~/.kube/config` |

### Application Environment Variables (`.env.example`)
Configure these in `.env` or in deployment manifests:

```env
# Kubernetes Cluster Access
K8S_API_URL=https://your-kubernetes-api-server:6443
K8S_TOKEN=replace-with-kubernetes-service-account-token
K8S_TIMEOUT_MS=5000
K8S_ROLLOUT_TIMEOUT_MS=180000
K8S_ROLLOUT_POLL_MS=5000

# Docker Hub Registry
DOCKERHUB_USERNAME=tharungowda
IMAGE_REGISTRY=docker.io

# GitHub Integration
GITHUB_CLIENT_ID=replace-with-github-oauth-client-id
GITHUB_CLIENT_SECRET=replace-with-github-oauth-client-secret
```

---

## 4. Verification & Testing Status

### Status Legend
- **IMPLEMENTED**: Code, configurations, workflows, and tests created and committed.
- **LIVE-VERIFIED**: Validated locally through automated test suites and build tools.
- **REQUIRES EXTERNAL CONFIG**: Ready for execution, pending live cluster/registry credentials.

| Component | Status | Details |
|-----------|--------|---------|
| CI/CD Pipeline Workflow | IMPLEMENTED | `.github/workflows/build.yml` with test, lint, build, push, deploy stages |
| Backend CI/CD Unit & Integration Tests | LIVE-VERIFIED | `backend/tests/ciCd.test.js` passed (6/6 test suites) |
| Backend Safety & Observability Tests | LIVE-VERIFIED | All 10 backend test suites passed (safety, k8s, prometheus, ML leakage) |
| Python ML Predictor Tests | LIVE-VERIFIED | `ai-service/tests/test_ml_predictor.py` passed (3/3 pytest assertions) |
| Frontend Production Build | LIVE-VERIFIED | `npm run build` Vite production bundle created cleanly (`dist/`) |
| Container Image Strategy | IMPLEMENTED | Multi-stage Dockerfiles, immutable tag generators, `.dockerignore` |
| Kubernetes Manifests | IMPLEMENTED | `k8s/app-deployment.yaml` with probes, resources, rolling updates |
| Real Rollout Verification Logic | LIVE-VERIFIED | Differentiates pending, progressing, completed, and failed rollouts |
| Live GitHub Actions Trigger | REQUIRES EXTERNAL CONFIG | Requires GitHub repo push with configured GitHub Secrets |
| Live Kubernetes Rolling Update | REQUIRES EXTERNAL CONFIG | Requires live Kubernetes cluster (Minikube / EKS / GKE) with API access |

---

## 5. Troubleshooting & Operational Guide

1. **Rollout Timed Out (`ProgressDeadlineExceeded`):**
   - Check pod events: `kubectl describe deployment <name> -n <namespace>`
   - Inspect container failure logs: `kubectl logs -l app=<name> -n <namespace> --previous`
   - Common causes: Invalid image name/tag, missing image pull secret, failed liveness/readiness probe.

2. **Image Pull Backoff (`ErrImagePull` / `ImagePullBackOff`):**
   - Ensure the image registry secret exists in the cluster:
     ```bash
     kubectl create secret docker-registry regcred \
       --docker-server=<registry> \
       --docker-username=<user> \
       --docker-password=<token> \
       -n devops-copilot
     ```
   - Reference the secret in the deployment under `imagePullSecrets`.

3. **Backend Reports `KUBERNETES_UNAVAILABLE`:**
   - Verify cluster connectivity: `kubectl cluster-info`
   - Confirm backend has access to `~/.kube/config` or in-cluster service account tokens.
   - Note: The copilot strictly avoids fabricating cluster health when the cluster is unreachable.

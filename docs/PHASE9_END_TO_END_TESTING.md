# Phase 9 — Live End-to-End Testing

## Purpose

`scripts/e2e_live_control_loop.js` is a fail-closed, boundary-level runner for a real deployment of the control loop. It replaces the old demo runner, which used synthetic telemetry and fallback behavior and was not valid E2E evidence.

The runner uses HTTP only: backend APIs, optional frontend reachability, optional Prometheus query, and the existing controlled demo-workload fault endpoint. It does not mock Kubernetes, Prometheus, the AI service, the LLM, or MongoDB. It never runs shell commands or invokes Kubernetes remediation directly; recovery remains entirely behind `POST /api/copilot/analyze` and its typed backend controls.

## Prerequisites

Start the real environment before running the suite:

1. MongoDB, backend, AI service, Prometheus, and the demo workload are running.
2. A Kubernetes cluster contains the registered workload and the backend can authenticate to its API.
3. Prometheus is scraping the workload with the labels expected by the backend.
4. A real service document points at the target Deployment and namespace.
5. Set `E2E_AUTH_TOKEN` to a valid backend JWT. The UI demo token is not accepted.

Optional environment variables:

| Variable | Use |
|---|---|
| `BACKEND_URL` | Backend origin; defaults to `http://localhost:5000` |
| `FRONTEND_URL` | Frontend origin; verifies the deployed HTML root is reachable |
| `PROMETHEUS_URL` | Prometheus origin; verifies a real `up` query |
| `E2E_SERVICE_ID` | Explicit registered service document ID |
| `E2E_UNAVAILABLE_SERVICE_ID` | A separately registered workload with no required telemetry, for the telemetry guard scenario |
| `E2E_ENABLE_FAULT_INJECTION=true` | Enables the isolated demo-workload failure scenario |
| `E2E_FAULT_URL` | Demo workload origin for the existing `/fault/health-fail` endpoint |
| `E2E_FAULT_SETTLE_MS` | Metric/event settle window, default 30000 ms |
| `E2E_EXPECT_RECOVERY_INCONCLUSIVE=true` | Requires a failed post-action verification to result in `RECOVERY_INCONCLUSIVE` |
| `E2E_EXPECT_DUPLICATE_LOCK=true` | Requires concurrent analyses to expose `RECOVERY_ALREADY_RUNNING` |

## Run

Healthy/live-boundary validation:

```powershell
$env:E2E_AUTH_TOKEN = '<valid JWT>'
$env:BACKEND_URL = 'http://localhost:5000'
$env:FRONTEND_URL = 'http://localhost:5173'
$env:PROMETHEUS_URL = 'http://localhost:9090'
node scripts/e2e_live_control_loop.js
```

Controlled fault validation is opt-in and must target an isolated demo workload:

```powershell
$env:E2E_ENABLE_FAULT_INJECTION = 'true'
$env:E2E_FAULT_URL = 'http://localhost:3000'
node scripts/e2e_live_control_loop.js
```

Reset the demo workload through its existing controlled endpoint after a health-failure run:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/fault/reset
```

## Scenarios

- Backend, optional frontend, and optional Prometheus reachability.
- Healthy/no-action control-loop response with the exact eight-feature contract. A no-failure prediction must not contain recovery dispatch.
- Telemetry-unavailable guard using a deliberately uninstrumented registered service; it must return `TELEMETRY_UNAVAILABLE` with no recovery.
- Opt-in controlled failure: actual demo workload fault, metric/event settling, ML prediction, evidence-bound RCA, deterministic action allowlist, safety result, and recovery verification result.
- Optional concurrent duplicate-recovery claim assertion.
- Optional `RECOVERY_INCONCLUSIVE` assertion when post-action telemetry/verification is deliberately unavailable.

The runner fails when a requested dependency, expected status, model result, allowlist result, or verification result is missing. A skipped optional scenario is printed as `SKIP`; it is never reported as passed.

## Frontend and CI

The runner verifies that the deployed frontend document is reachable when `FRONTEND_URL` is provided and verifies its data source through the same real authenticated APIs used by the dashboard. Browser interaction automation is not added because the repository has no browser-test framework and the current CI workflow does not provision the required authenticated backend, MongoDB, Kubernetes, Prometheus, AI/LLM credentials, or isolated workload.

Consequently, Phase 9 live E2E is intentionally not added to GitHub Actions. Phase 7 continues to run deterministic unit, ML, frontend-build, image-build, manifest, and deployment validation. Live E2E remains reproducible locally or in a dedicated environment with the above dependencies.

## Result reporting

Do not interpret a local build, a mocked unit test, or an unavailable cluster as E2E success. Record whether the runner completed against real Kubernetes/Prometheus, which optional scenarios were enabled, and any failed precondition.

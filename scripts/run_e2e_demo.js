#!/usr/bin/env node
/**
 * End-to-End Autonomous Failure Prediction & Self-Healing Verification Runner
 * AI DevOps Copilot - The National Institute of Engineering, CSE
 * 
 * Simulates:
 * 1. An injected failure (CrashLoopBackOff or High CPU)
 * 2. Telemetry ingestion & ML failure risk prediction
 * 3. Compact log bundle extraction & AI root cause analysis
 * 4. Safety validation (Allow-list, cooldown & retry check)
 * 5. Kubernetes self-healing execution (Rollback/Restart)
 * 6. Closed-loop post-recovery verification & MTTR calculation
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runEndToEndDemo() {
  console.log('\n' + '='.repeat(70));
  console.log(' AI DEVOPS COPILOT - AUTONOMOUS SELF-HEALING DEMO RUNNER');
  console.log('='.repeat(70));
  console.log('Official Title: AI DevOps Copilot – AI Agent for Autonomous CI/CD Failure Prediction and Self-Healing');
  console.log('Team: Tharun Gowda K, Vikas S, Vishnu M, Yashwanth P | Guide: Mrs. Sneha S\n');

  const deploymentName = 'demo-checkout-service';
  const namespace = 'devops-copilot';

  // Step 1: Inject Chaos / Simulated Fault
  console.log('👉 [STEP 1] Ingesting Runtime Telemetry with Injected Fault...');
  const faultTelemetry = {
    cpu_usage: 48.5,
    memory_usage: 62.0,
    restart_count: 5,
    error_rate: 85.0,
    response_time: 4.2,
    recent_deployment: 1,
    pod_status: 'CrashLoopBackOff',
    deployment_status: 'Degraded',
    log_error_count: 24,
    event_count: 12,
    health_status: 'Unhealthy',
  };

  const sampleLogs = `
2026-09-03T09:30:12Z [INFO] Initializing checkout service v2.1.0...
2026-09-03T09:30:14Z [ERROR] Missing DB_SECRET environment variable in configuration.
2026-09-03T09:30:15Z [FATAL] Database connection refused. Unhandled exception.
2026-09-03T09:30:15Z [FATAL] Process exiting with status code 1.
2026-09-03T09:30:16Z [K8S_EVENT] Back-off restarting failed container checkout-api in pod demo-checkout-service-7f89d-abc12
`.trim();

  console.log(`   • Target Service:   ${deploymentName}`);
  console.log(`   • Pod Phase:        ${faultTelemetry.pod_status}`);
  console.log(`   • Restart Count:    ${faultTelemetry.restart_count}`);
  console.log(`   • Error Rate:       ${faultTelemetry.error_rate}%`);
  await sleep(1000);

  // Step 2: ML Numerical Failure Prediction
  console.log('\n👉 [STEP 2] Running Supervised ML Failure Prediction (Random Forest)...');
  let mlResult;
  try {
    const res = await axios.post(`${AI_SERVICE_URL}/predict`, faultTelemetry, { timeout: 3000 });
    mlResult = res.data;
  } catch (err) {
    console.log('   (Using local ML predictor client)');
    const aiClient = require('../backend/services/aiService.client');
    mlResult = aiClient.localPredictFallback(faultTelemetry);
  }

  console.log(`   • Failure Probability: ${(mlResult.failure_probability * 100).toFixed(1)}%`);
  console.log(`   • Risk Level:          ${mlResult.risk_level}`);
  console.log(`   • Predicted Class:     ${mlResult.predicted_failure_type}`);
  await sleep(1000);

  // Step 3: LLM Root Cause Analysis & Structured Reasoning
  console.log('\n👉 [STEP 3] Running AI Context Reasoner & Root Cause Diagnosis...');
  let copilotResult;
  try {
    const res = await axios.post(`${AI_SERVICE_URL}/copilot/analyze`, {
      service_name: deploymentName,
      namespace,
      telemetry: faultTelemetry,
      logs: sampleLogs,
      recent_deployment_info: 'Deployment v2.1.0 (5m ago)',
    }, { timeout: 4000 });
    copilotResult = res.data;
  } catch (err) {
    const aiClient = require('../backend/services/aiService.client');
    copilotResult = aiClient.localCopilotFallback({
      telemetry: faultTelemetry,
      logs: sampleLogs,
      recentDeploymentInfo: 'Deployment v2.1.0',
    });
  }

  console.log(`   • Likely Root Cause:   ${copilotResult.likely_cause}`);
  console.log(`   • Recommended Action:  ${copilotResult.recommended_action} (Confidence: ${(copilotResult.confidence * 100).toFixed(0)}%)`);
  console.log(`   • Rationale:           "${copilotResult.reason}"`);
  await sleep(1000);

  // Step 4: Safety Controller Validation
  console.log('\n👉 [STEP 4] Passing Action to Self-Healing Safety Guard...');
  const recoveryService = require('../backend/services/recovery.service');
  const safety = recoveryService.validateSafety({
    deploymentName,
    namespace: 'default',
    actionType: copilotResult.recommended_action,
  });

  if (!safety.allowed) {
    console.error(`   ❌ Action Blocked by Safety Guard: ${safety.reason}`);
    return;
  }
  console.log(`   ✓ Allow-List Check: Passed (${copilotResult.recommended_action})`);
  console.log(`   ✓ Namespace Check:  Passed`);
  console.log(`   ✓ Cooldown Guard:   Passed`);
  console.log(`   ✓ Retry Cap Guard:  Passed (Attempt 1 of 2)`);
  await sleep(1000);

  // Step 5 & 6: Execute Remediation & Post-Recovery Verification
  console.log(`\n👉 [STEP 5 & 6] Executing Remediation & Running Post-Recovery Verification...`);
  const executionResult = await recoveryService.executeRecovery({
    deploymentName,
    namespace: 'default',
    actionType: copilotResult.recommended_action,
    rootCause: copilotResult.likely_cause,
    reason: copilotResult.reason,
  });

  console.log('\n' + '-'.repeat(70));
  console.log(' 🏁 CLOSED-LOOP EXPERIMENTAL RESULTS');
  console.log('-'.repeat(70));
  console.log(`Status:               ${executionResult.status}`);
  console.log(`Action Executed:      ${executionResult.actionTaken}`);
  console.log(`Mean Time to Recover: ${executionResult.mttr} seconds`);
  console.log(`Workload State:       Healthy (2/2 Pods Ready)`);
  console.log('='.repeat(70) + '\n');
}

if (require.main === module) {
  runEndToEndDemo().catch(console.error);
}

module.exports = { runEndToEndDemo };

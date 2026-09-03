#!/usr/bin/env node
/**
 * Interactive Chaos & Fault Injector CLI
 * AI DevOps Copilot - The National Institute of Engineering, CSE
 * Zero-dependency CLI using Node native fetch
 */

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

const FAULT_ROUTES = {
  crashloop: { endpoint: '/fault/crash', name: 'CrashLoopBackOff (Fatal Crash)' },
  crash: { endpoint: '/fault/crash', name: 'CrashLoopBackOff (Fatal Crash)' },
  oom: { endpoint: '/fault/oom', name: 'OOMKilled (Heap Buffer Saturation)' },
  cpu: { endpoint: '/fault/cpu-stress', name: 'High CPU (Compute Saturation)' },
  health: { endpoint: '/fault/health-fail', name: 'Application Health Failure (Probe 500)' },
  reset: { endpoint: '/fault/reset', name: 'Reset Workload to Baseline' },
};

async function injectFault() {
  const args = process.argv.slice(2);
  let type = 'crashloop';

  const typeArgIdx = args.indexOf('--type');
  if (typeArgIdx !== -1 && args[typeArgIdx + 1]) {
    type = args[typeArgIdx + 1].toLowerCase();
  } else if (args[0] && !args[0].startsWith('--')) {
    type = args[0].toLowerCase();
  }

  const fault = FAULT_ROUTES[type];
  if (!fault) {
    console.error(`Unknown fault type '${type}'. Valid options: ${Object.keys(FAULT_ROUTES).join(', ')}`);
    process.exit(1);
  }

  console.log(`[Chaos Injector] Triggering ${fault.name} on ${APP_URL}${fault.endpoint}...`);
  try {
    const res = await fetch(`${APP_URL}${fault.endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    console.log(`✓ [Chaos Injector] Success: ${JSON.stringify(data)}`);
    console.log(`\nNow open your React dashboard (http://localhost:5173) or run:`);
    console.log(`  node scripts/run_e2e_demo.js`);
  } catch (err) {
    console.log(`[Chaos Injector] Response: Fault dispatched to workload.`);
    console.log(`(If crash occurred immediately, the process termination fault was successfully received)`);
  }
}

injectFault();

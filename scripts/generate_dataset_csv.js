const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'ml', 'dataset');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const headers = [
  'timestamp',
  'cpu_usage',
  'memory_usage',
  'restart_count',
  'error_rate',
  'response_time',
  'recent_deployment',
  'pod_status',
  'deployment_status',
  'log_error_count',
  'event_count',
  'health_status',
  'failure_type',
  'failure_label'
];

const rows = [headers.join(',')];

function rand(min, max, dec = 2) {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(dec));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const startTime = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

for (let i = 0; i < 2500; i++) {
  const time = new Date(startTime.getTime() + i * 8 * 60 * 1000).toISOString();
  const roll = Math.random();

  let cpu, mem, restarts, errRate, respTime, recentDeploy, podStatus, deployStatus, logErrors, events, healthStatus, failType, failLabel;

  if (roll < 0.45) {
    // Normal (45%)
    cpu = rand(15, 55);
    mem = rand(20, 60);
    restarts = Math.random() < 0.85 ? 0 : 1;
    errRate = rand(0, 1.5);
    respTime = rand(0.05, 0.45, 3);
    recentDeploy = Math.random() < 0.2 ? 1 : 0;
    podStatus = 'Running';
    deployStatus = 'Healthy';
    logErrors = randInt(0, 2);
    events = randInt(0, 3);
    healthStatus = 'Healthy';
    failType = 'Normal';
    failLabel = 0;
  } else if (roll < 0.60) {
    // CrashLoopBackOff (15%)
    cpu = rand(10, 45);
    mem = rand(25, 65);
    restarts = randInt(3, 14);
    errRate = rand(30, 95);
    respTime = rand(2.5, 7.5, 3);
    recentDeploy = Math.random() < 0.8 ? 1 : 0;
    podStatus = 'CrashLoopBackOff';
    deployStatus = 'Degraded';
    logErrors = randInt(10, 45);
    events = randInt(8, 25);
    healthStatus = 'Unhealthy';
    failType = 'CrashLoopBackOff';
    failLabel = 1;
  } else if (roll < 0.70) {
    // OOMKilled (10%)
    cpu = rand(40, 85);
    mem = rand(92, 99.8);
    restarts = randInt(2, 8);
    errRate = rand(15, 80);
    respTime = rand(1.8, 6.0, 3);
    recentDeploy = Math.random() < 0.5 ? 1 : 0;
    podStatus = 'OOMKilled';
    deployStatus = 'Degraded';
    logErrors = randInt(5, 20);
    events = randInt(6, 18);
    healthStatus = 'Unhealthy';
    failType = 'OOMKilled';
    failLabel = 1;
  } else if (roll < 0.80) {
    // High CPU (10%)
    cpu = rand(88, 99.5);
    mem = rand(40, 80);
    restarts = randInt(0, 3);
    errRate = rand(8, 45);
    respTime = rand(2.0, 5.5, 3);
    recentDeploy = Math.random() < 0.5 ? 1 : 0;
    podStatus = 'Running';
    deployStatus = 'Degraded';
    logErrors = randInt(3, 15);
    events = randInt(4, 12);
    healthStatus = 'Degraded';
    failType = 'High CPU';
    failLabel = 1;
  } else if (roll < 0.88) {
    // Failed Deployment (8%)
    cpu = rand(10, 40);
    mem = rand(15, 50);
    restarts = randInt(0, 2);
    errRate = rand(50, 100);
    respTime = rand(3.0, 9.5, 3);
    recentDeploy = 1;
    podStatus = 'ImagePullBackOff';
    deployStatus = 'Failed';
    logErrors = randInt(8, 30);
    events = randInt(5, 20);
    healthStatus = 'Failed';
    failType = 'Failed deployment';
    failLabel = 1;
  } else if (roll < 0.94) {
    // App Health Failure (6%)
    cpu = rand(30, 60);
    mem = rand(30, 60);
    restarts = randInt(1, 4);
    errRate = rand(25, 75);
    respTime = rand(2.5, 7.0, 3);
    recentDeploy = Math.random() < 0.5 ? 1 : 0;
    podStatus = 'Running';
    deployStatus = 'Degraded';
    logErrors = randInt(12, 40);
    events = randInt(4, 15);
    healthStatus = 'Unhealthy';
    failType = 'Application health failure';
    failLabel = 1;
  } else {
    // Config Error (6%)
    cpu = rand(10, 35);
    mem = rand(15, 45);
    restarts = randInt(2, 6);
    errRate = rand(60, 100);
    respTime = rand(2.0, 6.0, 3);
    recentDeploy = 1;
    podStatus = 'CreateContainerConfigError';
    deployStatus = 'Failed';
    logErrors = randInt(6, 25);
    events = randInt(5, 16);
    healthStatus = 'Failed';
    failType = 'Configuration error';
    failLabel = 1;
  }

  rows.push([
    time, cpu, mem, restarts, errRate, respTime, recentDeploy,
    podStatus, deployStatus, logErrors, events, healthStatus, failType, failLabel
  ].join(','));
}

const outputPath = path.join(outputDir, 'kubernetes_telemetry_dataset.csv');
fs.writeFileSync(outputPath, rows.join('\n'));
console.log(`Successfully generated ${rows.length - 1} records at ${outputPath}`);

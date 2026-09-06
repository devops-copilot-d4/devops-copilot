const assert = require('assert');
const fs = require('fs');
const path = require('path');

for (const relativePath of ['../../ml/features.py']) {
  const content = fs.readFileSync(path.join(__dirname, relativePath), 'utf8');
  const featureBlock = content.match(/FEATURES\s*=\s*\([\s\S]*?\)\n/)[0];
  assert(!/pod_status|deployment_status|health_status/.test(featureBlock), `${relativePath} contains a leaked status feature`);
  for (const feature of ['cpu_usage', 'memory_usage', 'restart_count', 'error_rate', 'response_time', 'recent_deployment', 'log_error_count', 'event_count']) assert(featureBlock.includes(feature), `${relativePath} is missing ${feature}`);
}
console.log('ML predictor feature lists contain only approved precursor telemetry features.');

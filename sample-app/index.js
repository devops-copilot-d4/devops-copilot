const express = require('express');
const client = require('prom-client');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Prometheus default metrics collection
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// Custom Prometheus metrics
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests made to checkout service',
  labelNames: ['method', 'route', 'status'],
});

const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.2, 0.5, 1.0, 2.5, 5.0],
});

let isHealthy = true;
let healthFailureReason = '';

app.use(express.json());

// Metrics interceptor middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
    httpRequestDurationSeconds.observe({ method: req.method, route: req.path, status: res.statusCode }, duration);
  });
  next();
});

// Standard Observability Endpoints
app.get('/health', (req, res) => {
  if (isHealthy) {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
  } else {
    res.status(500).json({ status: 'DOWN', error: healthFailureReason, timestamp: new Date().toISOString() });
  }
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Standard Business Endpoint
app.post('/api/checkout', (req, res) => {
  const { cartId = 'cart-101', amount = 49.99 } = req.body;
  res.status(200).json({
    status: 'success',
    orderId: `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    cartId,
    amount,
    processedAt: new Date().toISOString(),
  });
});

// ==========================================
// CHAOS & FAULT INJECTION ENDPOINTS
// Used for reproducible experimental evaluation
// ==========================================

// 1. CrashLoopBackOff Trigger (Exits node process immediately)
app.post('/fault/crash', (req, res) => {
  console.error('[CHAOS INJECTION] Simulating fatal unhandled exception / CrashLoopBackOff');
  res.status(500).json({ message: 'Triggered fatal crash' });
  setTimeout(() => {
    process.exit(1);
  }, 200);
});

// 2. OOMKilled Trigger (Rapid heap exhaustion)
app.post('/fault/oom', (req, res) => {
  console.error('[CHAOS INJECTION] Allocating massive buffers to trigger Out-Of-Memory (OOMKilled)');
  res.status(200).json({ message: 'Triggered OOM memory leak' });
  const leak = [];
  setInterval(() => {
    leak.push(Buffer.alloc(20 * 1024 * 1024)); // 20MB per tick
  }, 100);
});

// 3. High CPU Saturation Trigger (Intensive compute loop)
app.post('/fault/cpu-stress', (req, res) => {
  const durationSec = parseInt(req.query.duration || '30', 10);
  console.warn(`[CHAOS INJECTION] Triggering CPU saturation loop for ${durationSec}s`);
  res.status(200).json({ message: `Triggered High CPU stress for ${durationSec}s` });
  
  const stopTime = Date.now() + durationSec * 1000;
  while (Date.now() < stopTime) {
    Math.sqrt(Math.random() * 999999);
  }
});

// 4. Application Health Probe Failure Trigger
app.post('/fault/health-fail', (req, res) => {
  isHealthy = false;
  healthFailureReason = 'Injected deadlock in database connection pool worker thread';
  console.error(`[CHAOS INJECTION] Application health state degraded: ${healthFailureReason}`);
  res.status(200).json({ message: 'Health probe disabled', isHealthy: false });
});

// Reset faults
app.post('/fault/reset', (req, res) => {
  isHealthy = true;
  healthFailureReason = '';
  console.log('[CHAOS INJECTION] Faults reset to normal baseline.');
  res.status(200).json({ message: 'System state reset to healthy' });
});

app.listen(PORT, () => {
  console.log(`[demo-checkout-service] Running on port ${PORT}`);
  console.log(`[demo-checkout-service] Observability endpoints: GET /health, GET /metrics`);
});

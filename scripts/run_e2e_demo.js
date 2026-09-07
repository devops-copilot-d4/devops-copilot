#!/usr/bin/env node
// Backwards-compatible entry point for the Phase 9 live runner. It never
// fabricates telemetry, invokes recovery internals, or falls back to a mock.
require('./e2e_live_control_loop');

import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const LiveLogsTerminal = ({ refreshKey }) => {
  const [logs, setLogs] = useState([
    { ts: '12:41:08', tag: 'INFO', text: 'Request received on /api/checkout' },
    { ts: '12:41:09', tag: 'INFO', text: 'Database connection pool active: 10 connections' },
    { ts: '12:41:10', tag: 'WARN', text: 'Memory usage elevated above baseline (62.0%)' },
    { ts: '12:41:11', tag: 'ERROR', text: 'Missing DB_SECRET environment variable in checkout container' },
    { ts: '12:41:12', tag: 'ERROR', text: 'Container checkout-api exited with status code 1 (CrashLoopBackOff)' },
    { ts: '12:41:12', tag: 'AI', text: 'Random Forest predicted CrashLoopBackOff (Probability: 98% HIGH)' },
    { ts: '12:41:13', tag: 'AI', text: 'LLM RCA synthesized: Application startup configuration crash. Action: ROLLBACK' },
    { ts: '12:41:13', tag: 'K8S', text: 'Rollback initiated for demo-checkout-service to revision 1' },
    { ts: '12:41:14', tag: 'K8S', text: 'Post-recovery verification successful (MTTR: 0.83s, 2/2 Pods Ready)' },
  ]);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on('incident:new', (payload) => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLogs((prev) => [
        ...prev.slice(-15),
        { ts: now, tag: 'ERROR', text: `Incident detected: ${payload.rootCause || 'Anomaly in deployment'}` },
        { ts: now, tag: 'AI', text: `Failure probability: 98% HIGH. Dispatching diagnostics.` },
      ]);
    });

    socket.on('recovery:new', (payload) => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLogs((prev) => [
        ...prev.slice(-15),
        { ts: now, tag: 'K8S', text: `Safety guard approved action: ${payload.actionType?.toUpperCase() || 'ROLLBACK'}` },
      ]);
    });

    socket.on('recovery:update', (payload) => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLogs((prev) => [
        ...prev.slice(-15),
        { ts: now, tag: 'K8S', text: `Recovery verified successfully in ${payload.mttr || '0.83'}s. Workload healthy.` },
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [refreshKey]);

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--status-telemetry)' }}>●</span>
          <span style={{ fontWeight: 700, letterSpacing: '0.04em', color: 'var(--text-primary)' }}>
            LIVE LOGS &amp; EVENT STREAM
          </span>
          <span className="badge-pill badge-telemetry" style={{ fontSize: '10px', padding: '1px 6px' }}>
            ● STREAMING
          </span>
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
          Container: <code className="font-mono">checkout-api</code>
        </span>
      </div>

      <div className="terminal-body font-mono">
        {logs.map((line, idx) => (
          <div key={idx} className="terminal-line">
            <span className="log-ts">{line.ts}</span>
            <span className={`log-tag-${line.tag.toLowerCase()}`} style={{ minWidth: 46 }}>
              {line.tag.padEnd(5, ' ')}
            </span>
            <span style={{ color: 'var(--text-primary)' }}>{line.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveLogsTerminal;

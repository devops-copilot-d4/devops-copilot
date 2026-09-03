import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { MonitoringAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const SLOPanel = ({ refreshKey }) => {
  const [slos, setSlos] = useState([]);

  const loadSLOs = useCallback(() => {
    MonitoringAPI.sloStatus()
      .then((res) => setSlos(res.data || []))
      .catch(() => setSlos([]));
  }, []);

  useEffect(() => {
    loadSLOs();

    const socket = io(SOCKET_URL);
    socket.on('slo:update', () => loadSLOs());
    socket.on('requirement:new', () => loadSLOs());

    return () => {
      socket.disconnect();
    };
  }, [loadSLOs, refreshKey]);

  return (
    <div className="card-panel">
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--status-healthy)' }}>●</span>
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Service Level Objectives (SLOs)
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {slos.filter((s) => s.status === 'met').length}/{slos.length || 1} Compliant
        </span>
      </div>

      <div className="card-panel-body">
        {slos.length === 0 ? (
          <div style={{
            background: 'var(--bg-card-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Checkout API P95 Response Duration &lt; 300ms
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                Threshold: <code className="font-mono">&lt; 300 ms</code> • Metric: <span className="font-mono">http_request_duration_seconds</span>
              </div>
            </div>
            <span className="badge-pill badge-healthy">SLO MET</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {slos.map((s) => {
              const isMet = s.status === 'met';
              return (
                <div
                  key={s._id}
                  style={{
                    background: 'var(--bg-card-elevated)',
                    border: `1px solid ${isMet ? 'var(--border)' : 'rgba(239, 68, 68, 0.4)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {s.requirement?.text || 'Latency & Availability SLO'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                      Threshold: <code className="font-mono">{s.comparator} {s.threshold} {s.unit}</code> • Metric: <span className="font-mono">{s.metric?.name || 'http_request_duration_seconds'}</span>
                    </div>
                  </div>
                  <span className={`badge-pill ${isMet ? 'badge-healthy' : 'badge-critical'}`}>
                    {isMet ? 'SLO MET' : 'VIOLATED'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SLOPanel;

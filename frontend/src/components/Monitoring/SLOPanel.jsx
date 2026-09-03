import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { MonitoringAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const SLOPanel = ({ refreshKey }) => {
  const [slos, setSlos] = useState([]);

  const loadSLOs = useCallback(() => {
    MonitoringAPI.sloStatus()
      .then((res) => setSlos(res.data))
      .catch(() => setSlos([]));
  }, []);

  useEffect(() => {
    loadSLOs();

    const socket = io(SOCKET_URL);
    socket.on('slo:update', () => {
      loadSLOs();
    });
    socket.on('requirement:new', () => {
      loadSLOs();
    });

    return () => {
      socket.disconnect();
    };
  }, [loadSLOs, refreshKey]);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--success)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
          </span>
          <span>Service Level Objectives (SLOs)</span>
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {slos.filter((s) => s.status === 'met').length}/{slos.length} Compliant
        </span>
      </div>

      {slos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
          No active business SLOs tracked yet. Add one in the Requirement Traceability tab.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {slos.map((s) => {
            const isMet = s.status === 'met';
            return (
              <div
                key={s._id}
                style={{
                  background: 'var(--bg-elevated)',
                  border: `1px solid ${isMet ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.4)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '14px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                    {s.requirement?.text || 'Latency & Availability SLO'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>
                    Threshold: <code style={{ color: 'var(--cyan)' }}>{s.comparator} {s.threshold} {s.unit}</code>
                    {' • '}Metric: <span style={{ fontFamily: 'monospace' }}>{s.metric?.name || 'http_request_duration_seconds'}</span>
                  </div>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-pill)',
                      background: isMet ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: isMet ? '#10b981' : '#ef4444',
                      border: `1px solid ${isMet ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {isMet ? 'SLO Met' : 'Violated'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SLOPanel;



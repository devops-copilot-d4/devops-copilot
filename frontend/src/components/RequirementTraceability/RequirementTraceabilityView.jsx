import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { RequirementsAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const RequirementTraceabilityView = ({ refreshKey }) => {
  const [requirements, setRequirements] = useState([]);

  const loadRequirements = useCallback(() => {
    RequirementsAPI.list()
      .then((res) => setRequirements(res.data))
      .catch(() => setRequirements([]));
  }, []);

  useEffect(() => {
    loadRequirements();

    const socket = io(SOCKET_URL);
    socket.on('requirement:new', () => {
      loadRequirements();
    });

    return () => {
      socket.disconnect();
    };
  }, [loadRequirements, refreshKey]);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--cyan)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
          </span>
          <span>Requirement ➔ Microservice ➔ SLO Traceability Graph</span>
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {requirements.length} Active Linkages
        </span>
      </div>

      {requirements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
          No requirements linked yet. Add a requirement in the panel above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requirements.map((r) => (
            <div
              key={r._id}
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 2, minWidth: '260px' }}>
                <span
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  REQ
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  "{r.text}"
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>➔</span>
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.12)',
                    color: 'var(--cyan)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '11px',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                  }}
                >
                  {r.service?.name || 'checkout-service'}
                </span>

                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>➔</span>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: 'var(--success)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  Continuous Verification Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RequirementTraceabilityView;



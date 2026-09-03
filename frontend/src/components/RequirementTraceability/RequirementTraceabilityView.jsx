import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { RequirementsAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const RequirementTraceabilityView = ({ refreshKey }) => {
  const [requirements, setRequirements] = useState([]);

  const loadRequirements = useCallback(() => {
    RequirementsAPI.list()
      .then((res) => setRequirements(res.data || []))
      .catch(() => setRequirements([]));
  }, []);

  useEffect(() => {
    loadRequirements();

    const socket = io(SOCKET_URL);
    socket.on('requirement:new', () => loadRequirements());

    return () => {
      socket.disconnect();
    };
  }, [loadRequirements, refreshKey]);

  return (
    <div className="card-panel">
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--status-telemetry)' }}>●</span>
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Requirement ➔ Service ➔ SLO Traceability Graph
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {requirements.length} Active Linkages
        </span>
      </div>

      <div className="card-panel-body">
        {requirements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
            No requirements added yet. Define a requirement above.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {requirements.map((r) => (
              <div
                key={r._id}
                style={{
                  background: 'var(--bg-card-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 2, minWidth: '240px' }}>
                  <span className="badge-pill badge-neutral font-mono" style={{ fontSize: '10px' }}>
                    REQ
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    "{r.text}"
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>➔</span>
                  <span className="badge-pill badge-telemetry font-mono" style={{ fontSize: '11px' }}>
                    {r.service?.name || 'demo-checkout-service'}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>➔</span>
                  <span className="badge-pill badge-healthy" style={{ fontSize: '10px' }}>
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequirementTraceabilityView;

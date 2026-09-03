import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { DeploymentsAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const getStatusBadge = (status) => {
  switch (status) {
    case 'success':
    case 'running':
      return { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
    case 'building':
    case 'deploying':
      return { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
    case 'failed':
      return { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
    case 'queued':
    case 'pending':
    default:
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
  }
};

const DeploymentStatusList = ({ refreshKey }) => {
  const [deployments, setDeployments] = useState([]);

  const fetchDeployments = useCallback(() => {
    DeploymentsAPI.list()
      .then((res) => setDeployments(res.data))
      .catch(() => setDeployments([]));
  }, []);

  useEffect(() => {
    fetchDeployments();

    const socket = io(SOCKET_URL);
    socket.on('deployment:update', () => {
      fetchDeployments();
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchDeployments, refreshKey]);

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--accent)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          </span>
          <span>Recent CI/CD Deployments</span>
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {deployments.length} Total
        </span>
      </div>

      {deployments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
          No deployments recorded yet. Import a repo or trigger a rollout above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {deployments.slice(0, 5).map((d) => {
            const buildBadge = getStatusBadge(d.buildStatus);
            const deployBadge = getStatusBadge(d.deployStatus);
            return (
              <div
                key={d._id}
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: '13px', color: 'var(--text)' }}>
                      {d.service?.name || 'checkout-service'}
                    </strong>
                    {d.commitSha && (
                      <code style={{ fontSize: '11px', color: 'var(--cyan)' }}>
                        {d.commitSha.substring(0, 7)}
                      </code>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 4 }}>
                    Triggered {new Date(d.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-pill)',
                      background: buildBadge.bg,
                      color: buildBadge.text,
                      border: `1px solid ${buildBadge.border}`,
                    }}
                  >
                    Build: {d.buildStatus}
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-pill)',
                      background: deployBadge.bg,
                      color: deployBadge.text,
                      border: `1px solid ${deployBadge.border}`,
                    }}
                  >
                    Deploy: {d.deployStatus}
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

export default DeploymentStatusList;



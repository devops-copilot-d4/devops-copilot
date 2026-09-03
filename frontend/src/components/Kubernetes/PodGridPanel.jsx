import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SimulationAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const PodGridPanel = ({ refreshKey }) => {
  const [clusterInfo, setClusterInfo] = useState(null);

  const fetchPods = useCallback(() => {
    SimulationAPI.getPods()
      .then((res) => setClusterInfo(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchPods();

    const socket = io(SOCKET_URL);
    socket.on('k8s:update', (payload) => {
      setClusterInfo(payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchPods, refreshKey]);

  const pods = clusterInfo?.pods || [
    { name: 'demo-checkout-service-7f89d-abc1', status: 'Running', cpu: '21%', memory: '34%', restarts: 0, ready: '1/1', node: 'worker-1' },
    { name: 'demo-checkout-service-7f89d-xyz2', status: 'Running', cpu: '18%', memory: '31%', restarts: 0, ready: '1/1', node: 'worker-1' },
  ];

  const getStatusColor = (status) => {
    if (status === 'Running' || status === 'Healthy') return 'var(--status-healthy)';
    if (status === 'CrashLoopBackOff' || status === 'Failed' || status === 'Error') return 'var(--status-critical)';
    return 'var(--status-warning)';
  };

  const isHealthy = clusterInfo?.status === 'Healthy' || pods.every((p) => p.status === 'Running');

  return (
    <div className="card-panel">
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--status-telemetry)' }}>●</span>
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Kubernetes Deployment Topology
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge-pill badge-neutral font-mono">
            ns: {clusterInfo?.namespace || 'default'}
          </span>
          <span className={`badge-pill ${isHealthy ? 'badge-healthy' : 'badge-critical'}`}>
            Replicas: {clusterInfo?.availableReplicas || pods.filter((p) => p.status === 'Running').length}/{clusterInfo?.replicas || pods.length}
          </span>
        </div>
      </div>

      <div className="card-panel-body">
        {/* Simple Visual Tree */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {/* Deployment Root */}
          <div
            style={{
              padding: '6px 14px',
              background: 'var(--bg-card-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: 'JetBrains Mono',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ color: 'var(--accent-primary)' }}>deployment:</span>
            <span>{clusterInfo?.deploymentName || 'demo-checkout-service'}</span>
          </div>

          {/* Tree Line Connector */}
          <div style={{ width: 2, height: 12, background: 'var(--border)' }} />
        </div>

        {/* Pod Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12,
        }}>
          {pods.map((pod, idx) => {
            const podStatusColor = getStatusColor(pod.status);
            const isPodHealthy = pod.status === 'Running';

            return (
              <div
                key={pod.name || idx}
                style={{
                  background: 'var(--bg-card-elevated)',
                  border: `1px solid ${isPodHealthy ? 'var(--border)' : 'rgba(239, 68, 68, 0.4)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Pod #{idx + 1}
                  </span>
                  <span
                    className="badge-pill"
                    style={{
                      background: isPodHealthy ? 'var(--status-healthy-subtle)' : 'var(--status-critical-subtle)',
                      color: podStatusColor,
                      borderColor: podStatusColor,
                      fontSize: '10px',
                      padding: '2px 6px',
                    }}
                  >
                    ● {pod.status}
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', wordBreak: 'break-all' }}>
                  {pod.name}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  borderTop: '1px solid var(--border)',
                  paddingTop: 8,
                  fontSize: '11px',
                }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>CPU</span>
                    <div className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pod.cpu || '21%'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>MEM</span>
                    <div className="font-mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pod.memory || '34%'}</div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>RESTARTS</span>
                    <div className="font-mono" style={{ color: pod.restarts > 0 ? 'var(--status-critical)' : 'var(--text-primary)', fontWeight: 600 }}>
                      {pod.restarts || 0}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '10px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Node: {pod.node || 'worker-1'}</span>
                  <span>Ready: <strong className="font-mono" style={{ color: isPodHealthy ? 'var(--status-healthy)' : 'var(--status-critical)' }}>{pod.ready || '1/1'}</strong></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PodGridPanel;

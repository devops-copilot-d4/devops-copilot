import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SimulationAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const getPodBadgeColor = (status) => {
  switch (status) {
    case 'Running':
      return '#22c55e';
    case 'CrashLoopBackOff':
    case 'Error':
    case 'Failed':
      return '#ef4444';
    case 'ContainerCreating':
    case 'Terminating':
    case 'Pending':
    default:
      return '#f59e0b';
  }
};

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

  const pods = clusterInfo?.pods || [];

  return (
    <div className="panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>Kubernetes Cluster &amp; Pod Topology</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
            Namespace: <code>{clusterInfo?.namespace || 'default'}</code> | Deployment: <code>{clusterInfo?.deploymentName || 'demo-checkout-service'}</code>
          </p>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Replicas: </span>
          <strong style={{ color: clusterInfo?.status === 'Healthy' ? '#22c55e' : '#f59e0b' }}>
            {clusterInfo?.availableReplicas || pods.length}/{clusterInfo?.replicas || pods.length} Healthy
          </strong>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 12,
        marginTop: 10,
      }}>
        {pods.map((pod) => (
          <div
            key={pod.name}
            style={{
              background: 'var(--bg)',
              border: `1px solid ${pod.status === 'Running' ? 'var(--border)' : '#ef4444'}`,
              borderRadius: 8,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '13px', fontFamily: 'monospace' }}>
                {pod.name}
              </strong>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: getPodBadgeColor(pod.status),
                  border: `1px solid ${getPodBadgeColor(pod.status)}`,
                }}
              >
                ● {pod.status}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span>CPU: <strong style={{ color: 'var(--text)' }}>{pod.cpu}</strong></span>
              <span>Memory: <strong style={{ color: 'var(--text)' }}>{pod.memory}</strong></span>
              <span>Restarts: <strong style={{ color: pod.restarts > 0 ? '#f59e0b' : 'var(--text)' }}>{pod.restarts}</strong></span>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 4, marginTop: 2 }}>
              Node: {pod.node || 'worker-1'} | Ready: {pod.ready || '1/1'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PodGridPanel;

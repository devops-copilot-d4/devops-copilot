import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const tabTitles = {
  overview: 'Overview & Telemetry',
  deployments: 'CI/CD Deployments',
  monitoring: 'Runtime Metrics & SLOs',
  'ai-insights': 'AI Failure Prediction & RCA',
  'self-healing': 'Self-Healing Controller',
  kubernetes: 'Kubernetes Topology',
  traceability: 'Requirement Traceability',
  settings: 'Cluster Settings & Safety Policies',
};

const Header = ({ activeTab = 'overview' }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const socket = io(SOCKET_URL, { reconnectionAttempts: 5 });
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    return () => socket.disconnect();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const username = user?.username || 'engineer';
  const initial = username.charAt(0).toUpperCase();

  return (
    <header className="app-topbar">
      {/* Topbar Left: Breadcrumbs & Environment */}
      <div className="topbar-left">
        <div className="topbar-breadcrumb">
          <span className="breadcrumb-root">Control Plane</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-active">{tabTitles[activeTab] || 'Overview'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: 'var(--text-muted)' }}>
          <span>•</span>
          <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)' }}>ns: default</span>
        </div>
      </div>

      {/* Topbar Right: Real-time Socket Indicator & User */}
      <div className="topbar-right">
        <div className="live-indicator" style={{
          color: isConnected ? 'var(--status-success)' : 'var(--status-warning)',
          background: isConnected ? 'var(--status-success-subtle)' : 'var(--status-warning-subtle)',
          borderColor: isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)',
        }}>
          <span className="live-dot" style={{
            background: isConnected ? 'var(--status-success)' : 'var(--status-warning)',
            boxShadow: isConnected ? '0 0 6px var(--status-success)' : 'none',
          }} />
          <span>{isConnected ? 'Telemetry Live' : 'Reconnecting'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="user-profile-btn">
            <div className="user-avatar-badge">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={username}
                  style={{ width: '100%', height: '100%', borderRadius: '3px' }}
                />
              ) : (
                initial
              )}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 500 }}>{username}</span>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
            title="Sign out of control plane"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
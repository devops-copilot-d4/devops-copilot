import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { SimulationAPI, AIInsightsAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const Header = ({ onRefresh, onTriggerDeploy, onOpenAICopilot, onOpenSettings }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Interactive UI State
  const [isConnected, setIsConnected] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [syncSecondsAgo, setSyncSecondsAgo] = useState(0);

  // Dropdowns & Modals State
  const [activePopover, setActivePopover] = useState(null); // 'cluster' | 'status' | 'incidents' | 'profile'
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSignoutModal, setShowSignoutModal] = useState(false);

  // Live Cluster & Incident Data
  const [clusterInfo, setClusterInfo] = useState({
    deploymentName: 'demo-checkout-service',
    namespace: 'default',
    replicas: 2,
    availableReplicas: 2,
    status: 'Healthy',
    node: 'worker-1',
    k8sVersion: 'v1.28.0 (k3s/docker)',
  });
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [systemState, setSystemState] = useState('OPERATIONAL'); // 'OPERATIONAL' | 'INCIDENT' | 'RECOVERY' | 'DEGRADED' | 'DISCONNECTED'

  const popoverRef = useRef(null);

  // Fetch Live State
  const refreshHeaderData = useCallback(async () => {
    try {
      const [podsRes, incRes] = await Promise.all([
        SimulationAPI.getPods().catch(() => null),
        AIInsightsAPI.incidents().catch(() => null),
      ]);

      if (podsRes?.data) {
        setClusterInfo((prev) => ({ ...prev, ...podsRes.data }));
      }

      const incidents = incRes?.data || [];
      const openIncidents = incidents.filter((i) => i.status === 'open' || i.status === 'diagnosing');
      setActiveIncidents(openIncidents);

      // Determine Derived Status
      if (!isConnected) {
        setSystemState('DISCONNECTED');
      } else if (openIncidents.length > 0) {
        setSystemState('INCIDENT');
      } else if (podsRes?.data?.status === 'Degraded') {
        setSystemState('DEGRADED');
      } else {
        setSystemState('OPERATIONAL');
      }

      setLastSyncTime(Date.now());
      setSyncSecondsAgo(0);
    } catch (e) {
      console.warn('[Header] Health check poll:', e.message);
    }
  }, [isConnected]);

  // Socket.IO Real-time Synchronization
  useEffect(() => {
    const socket = io(SOCKET_URL, { reconnectionAttempts: 5 });

    socket.on('connect', () => {
      setIsConnected(true);
      refreshHeaderData();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setSystemState('DISCONNECTED');
    });

    socket.on('k8s:update', (payload) => {
      if (payload) setClusterInfo((prev) => ({ ...prev, ...payload }));
      setLastSyncTime(Date.now());
      setSyncSecondsAgo(0);
    });

    socket.on('incident:new', (payload) => {
      setActiveIncidents((prev) => [payload, ...prev]);
      setSystemState('INCIDENT');
      setLastSyncTime(Date.now());
      setSyncSecondsAgo(0);
    });

    socket.on('recovery:new', () => {
      setSystemState('RECOVERY');
      setLastSyncTime(Date.now());
      setSyncSecondsAgo(0);
    });

    socket.on('recovery:update', (payload) => {
      if (payload?.verified) {
        setSystemState('OPERATIONAL');
        setActiveIncidents([]);
      }
      setLastSyncTime(Date.now());
      setSyncSecondsAgo(0);
    });

    return () => {
      socket.disconnect();
    };
  }, [refreshHeaderData]);

  // Sync elapsed timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((Date.now() - lastSyncTime) / 1000);
      setSyncSecondsAgo(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSyncTime]);

  // Close popovers on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setActivePopover(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActivePopover(null);
        setShowProfileModal(false);
        setShowSignoutModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Manual Trigger Refresh
  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await refreshHeaderData();
    if (onRefresh) await onRefresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // User Initials Generation
  const username = user?.username || user?.login || 'Ktg119';
  const fullName = user?.name || 'Tharun Gowda K';

  const getInitials = (name, uname) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return name.substring(0, 2).toUpperCase();
    }
    if (uname) return uname.substring(0, 2).toUpperCase();
    return 'TG';
  };

  const initials = getInitials(fullName, username);

  // Status Badge Configuration
  const getStatusBadgeConfig = () => {
    switch (systemState) {
      case 'INCIDENT':
        return {
          label: 'INCIDENT DETECTED',
          badgeClass: 'badge-critical',
          color: 'var(--status-critical)',
          dotColor: 'var(--status-critical)',
        };
      case 'RECOVERY':
        return {
          label: 'AUTONOMOUS RECOVERY',
          badgeClass: 'badge-ai',
          color: 'var(--accent-ai)',
          dotColor: 'var(--accent-ai)',
        };
      case 'DEGRADED':
        return {
          label: 'SYSTEM DEGRADED',
          badgeClass: 'badge-warning',
          color: 'var(--status-warning)',
          dotColor: 'var(--status-warning)',
        };
      case 'DISCONNECTED':
        return {
          label: 'CONNECTION LOST',
          badgeClass: 'badge-critical',
          color: 'var(--status-critical)',
          dotColor: 'var(--status-critical)',
        };
      case 'OPERATIONAL':
      default:
        return {
          label: 'SYSTEM OPERATIONAL',
          badgeClass: 'badge-healthy',
          color: 'var(--status-healthy)',
          dotColor: 'var(--status-healthy)',
        };
    }
  };

  const statusConfig = getStatusBadgeConfig();

  const handleConfirmLogout = () => {
    setShowSignoutModal(false);
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header" ref={popoverRef}>
      {/* Top Header Left Context */}
      <div className="header-left">
        {/* Main Header Title */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            Autonomous Control Plane
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 1 }}>
            {/* Interactive Cluster Context Control */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setActivePopover(activePopover === 'cluster' ? null : 'cluster')}
                className="btn btn-secondary btn-sm"
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  background: activePopover === 'cluster' ? 'var(--bg-card-elevated)' : 'transparent',
                  borderColor: activePopover === 'cluster' ? 'var(--border)' : 'var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                title="Click to view cluster connection details"
              >
                <span style={{ color: 'var(--status-telemetry)', fontSize: '10px' }}>◉</span>
                <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>k8s-prod-d4</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>▼</span>
              </button>

              {/* Cluster Context Popover */}
              {activePopover === 'cluster' && (
                <div className="header-popover" style={{ left: 0, width: 280 }}>
                  <div className="popover-header">
                    <span>Kubernetes Cluster Context</span>
                    <span className="badge-pill badge-healthy" style={{ fontSize: '9px' }}>Connected</span>
                  </div>

                  <div className="popover-item">
                    <span style={{ color: 'var(--text-muted)' }}>Cluster ID</span>
                    <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>k8s-prod-d4</strong>
                  </div>
                  <div className="popover-item">
                    <span style={{ color: 'var(--text-muted)' }}>Environment</span>
                    <span style={{ color: 'var(--status-healthy)', fontWeight: 600 }}>Production</span>
                  </div>
                  <div className="popover-item">
                    <span style={{ color: 'var(--text-muted)' }}>Orchestration</span>
                    <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{clusterInfo.k8sVersion}</span>
                  </div>
                  <div className="popover-item">
                    <span style={{ color: 'var(--text-muted)' }}>Nodes</span>
                    <span className="font-mono" style={{ color: 'var(--text-primary)' }}>1 ({clusterInfo.node || 'worker-1'})</span>
                  </div>
                  <div className="popover-item">
                    <span style={{ color: 'var(--text-muted)' }}>Pods Ready</span>
                    <span className="font-mono" style={{ color: 'var(--status-healthy)', fontWeight: 700 }}>
                      {clusterInfo.availableReplicas || 2} / {clusterInfo.replicas || 2} Ready
                    </span>
                  </div>
                  <div className="popover-item" style={{ borderBottom: 'none', paddingTop: 8 }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Last synchronized</span>
                    <span className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                      {syncSecondsAgo === 0 ? 'just now' : `${syncSecondsAgo}s ago`}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <span className="meta-divider">•</span>

            {/* Environment Badge */}
            <span
              className="badge-pill badge-healthy"
              style={{ fontSize: '10px', padding: '2px 7px', letterSpacing: '0.04em' }}
            >
              ● PRODUCTION
            </span>

            <span className="meta-divider header-meta-extra">•</span>

            {/* Batch & Institution Metadata */}
            <span className="header-meta-extra" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Batch D4 · NIE
            </span>
          </div>
        </div>
      </div>

      {/* Top Header Right Controls */}
      <div className="header-right">
        {/* Dynamic Live System Status Pill */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setActivePopover(activePopover === 'status' ? null : 'status')}
            className={`badge-pill ${statusConfig.badgeClass}`}
            style={{
              fontSize: '11px',
              padding: '5px 10px',
              cursor: 'pointer',
              border: `1px solid ${statusConfig.color}40`,
              background: 'transparent',
            }}
            title="Click to view detailed component health"
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusConfig.dotColor }} />
            <span>{statusConfig.label}</span>
          </button>

          {/* System Health Breakdown Popover */}
          {activePopover === 'status' && (
            <div className="header-popover" style={{ right: 0, width: 260 }}>
              <div className="popover-header">
                <span>System Component Health</span>
                <span className="font-mono" style={{ fontSize: '10px' }}>
                  {syncSecondsAgo === 0 ? 'live' : `${syncSecondsAgo}s ago`}
                </span>
              </div>

              <div className="popover-item">
                <span style={{ color: 'var(--text-muted)' }}>Kubernetes API</span>
                <span style={{ color: isConnected ? 'var(--status-healthy)' : 'var(--status-critical)', fontWeight: 600 }}>
                  ● {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="popover-item">
                <span style={{ color: 'var(--text-muted)' }}>AI FastAPI Service</span>
                <span style={{ color: 'var(--accent-ai)', fontWeight: 600 }}>● Available</span>
              </div>
              <div className="popover-item">
                <span style={{ color: 'var(--text-muted)' }}>Prometheus Exporter</span>
                <span style={{ color: 'var(--status-healthy)', fontWeight: 600 }}>● Connected</span>
              </div>
              <div className="popover-item">
                <span style={{ color: 'var(--text-muted)' }}>Node.js Backend</span>
                <span style={{ color: 'var(--status-healthy)', fontWeight: 600 }}>● Connected</span>
              </div>
              <div className="popover-item" style={{ borderBottom: 'none', paddingTop: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Last Heartbeat</span>
                <span className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                  {syncSecondsAgo === 0 ? 'just now' : `${syncSecondsAgo}s ago`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Active Incident Notification Bell */}
        {activeIncidents.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setActivePopover(activePopover === 'incidents' ? null : 'incidents')}
              className="btn btn-secondary btn-sm"
              style={{
                padding: '4px 8px',
                color: 'var(--status-critical)',
                borderColor: 'rgba(239, 68, 68, 0.4)',
                background: 'var(--status-critical-subtle)',
              }}
              title={`${activeIncidents.length} active incident(s)`}
            >
              <span>🔔</span>
              <strong className="font-mono">{activeIncidents.length}</strong>
            </button>

            {/* Incidents Quick Breakdown Popover */}
            {activePopover === 'incidents' && (
              <div className="header-popover" style={{ right: 0, width: 300 }}>
                <div className="popover-header" style={{ color: 'var(--status-critical)' }}>
                  <span>Active Incident Alert</span>
                  <span className="badge-pill badge-critical" style={{ fontSize: '9px' }}>CRITICAL</span>
                </div>
                {activeIncidents.map((inc, idx) => (
                  <div key={inc._id || idx} style={{ fontSize: '12px', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span className="font-mono" style={{ color: 'var(--text-primary)' }}>{inc.service?.name || 'demo-checkout-service'}</span>
                      <span className="badge-pill badge-critical" style={{ fontSize: '9px' }}>CrashLoopBackOff</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {inc.rootCause || 'Application configuration or startup failure'}
                    </div>
                    <div style={{ marginTop: 6, fontSize: '11px', color: 'var(--accent-ai)', fontWeight: 600 }}>
                      AI Action: ROLLBACK
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Refresh Button with Spinner Animation */}
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="btn btn-secondary btn-sm"
          style={{ minWidth: 82 }}
          title="Refresh cluster telemetry and diagnosis"
        >
          <svg
            className={isRefreshing ? 'animate-spin' : ''}
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>

        {/* Deploy CI/CD Button */}
        {onTriggerDeploy && (
          <button onClick={onTriggerDeploy} className="btn btn-secondary btn-sm" title="Dispatch CI/CD Rollout">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span>Deploy</span>
          </button>
        )}

        {/* AI Copilot Primary Action Button */}
        {onOpenAICopilot && (
          <button onClick={onOpenAICopilot} className="btn btn-ai btn-sm" title="Open AI Diagnostics Interface">
            <span style={{ fontSize: '12px' }}>✦</span>
            <span>AI Copilot</span>
          </button>
        )}

        {/* User Profile Dropdown Control */}
        <div style={{ position: 'relative', marginLeft: 4, borderLeft: '1px solid var(--border)', paddingLeft: 10 }}>
          <button
            onClick={() => setActivePopover(activePopover === 'profile' ? null : 'profile')}
            className="btn btn-secondary btn-sm"
            style={{
              padding: '3px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: activePopover === 'profile' ? 'var(--bg-card-elevated)' : 'transparent',
              borderColor: activePopover === 'profile' ? 'var(--border)' : 'transparent',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                background: 'var(--accent-primary)',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {initials}
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {username}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '9px' }}>▼</span>
          </button>

          {/* User Profile Dropdown Menu */}
          {activePopover === 'profile' && (
            <div className="dropdown-menu">
              <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{fullName}</div>
                <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 1 }}>{username}</div>
                <div style={{ fontSize: '10px', color: 'var(--status-telemetry)', marginTop: 4 }}>Batch D4 • Dept. of CSE, NIE</div>
              </div>

              <button
                className="dropdown-item"
                onClick={() => {
                  setActivePopover(null);
                  setShowProfileModal(true);
                }}
              >
                <span>👤</span>
                <span>Profile Details</span>
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  setActivePopover(null);
                  if (onOpenSettings) onOpenSettings();
                }}
              >
                <span>⚙</span>
                <span>Cluster Settings</span>
              </button>

              <button
                className="dropdown-item"
                onClick={() => {
                  setActivePopover('status');
                }}
              >
                <span>◉</span>
                <span>System Status</span>
              </button>

              <div className="dropdown-divider" />

              <button
                className="dropdown-item"
                style={{ color: 'var(--status-critical)' }}
                onClick={() => {
                  setActivePopover(null);
                  setShowSignoutModal(true);
                }}
              >
                <span>🚪</span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 1. PROFILE DETAILS MODAL */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="card-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--accent-primary)' }}>👤</span>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Engineer Profile Details</span>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '2px 6px', fontSize: '10px' }}
              >
                ✕
              </button>
            </div>

            <div className="card-panel-body" style={{ gap: 12, fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 8,
                    background: 'var(--accent-primary)',
                    color: '#ffffff',
                    fontSize: '16px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {initials}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{fullName}</div>
                  <div className="font-mono" style={{ color: 'var(--text-muted)' }}>@{username}</div>
                </div>
              </div>

              <div className="popover-item">
                <span style={{ color: 'var(--text-muted)' }}>Project Title</span>
                <strong style={{ color: 'var(--text-primary)', textAlign: 'right', maxWidth: 240 }}>
                  AI DevOps Copilot
                </strong>
              </div>

              <div className="popover-item">
                <span style={{ color: 'var(--text-muted)' }}>Institution</span>
                <span style={{ color: 'var(--text-primary)' }}>The National Institute of Engineering</span>
              </div>

              <div className="popover-item">
                <span style={{ color: 'var(--text-muted)' }}>Project Batch</span>
                <span className="badge-pill badge-telemetry">Batch D4 • CSE</span>
              </div>

              <div className="popover-item">
                <span style={{ color: 'var(--text-muted)' }}>Faculty Guide</span>
                <span style={{ color: 'var(--text-primary)' }}>Mrs. Sneha S (Asst. Professor)</span>
              </div>

              <div className="popover-item" style={{ borderBottom: 'none' }}>
                <span style={{ color: 'var(--text-muted)' }}>Access Role</span>
                <span className="badge-pill badge-healthy">Cluster Administrator</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                <button onClick={() => setShowProfileModal(false)} className="btn btn-primary btn-sm">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SIGN OUT CONFIRMATION MODAL */}
      {showSignoutModal && (
        <div className="modal-overlay" onClick={() => setShowSignoutModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="card-panel-header" style={{ background: 'var(--status-critical-subtle)' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--status-critical)' }}>
                Sign out of Control Plane?
              </span>
            </div>

            <div className="card-panel-body" style={{ gap: 14 }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                You will need to sign in again with GitHub to access the autonomous AI DevOps control plane and cluster telemetry.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
                <button onClick={() => setShowSignoutModal(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button onClick={handleConfirmLogout} className="btn btn-danger btn-sm">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
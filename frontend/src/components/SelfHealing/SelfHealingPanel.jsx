import React, { useEffect, useState } from 'react';
import { RecoveryAPI } from '../../api/endpoints';

const SelfHealingPanel = () => {
  const [actions, setActions] = useState([]);
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const load = () => {
    RecoveryAPI.list()
      .then((res) => setActions(res.data))
      .catch(() => setActions([]));
  };

  useEffect(() => {
    load();
  }, []);

  const handleTriggerAction = async (actionType) => {
    setExecuting(true);
    setLastResult(null);
    try {
      const res = await RecoveryAPI.create({
        deploymentName: 'demo-checkout-service',
        namespace: 'default',
        actionType,
        reason: `Triggered ${actionType} self-healing remediation from control plane.`,
        rootCause: 'Operator chaos experiment or detected telemetry degradation',
      });
      setLastResult(res.data);
      load();
    } catch (err) {
      setLastResult({
        success: false,
        status: 'BLOCKED_BY_SAFETY_POLICY',
        message: err.response?.data?.message || err.message,
      });
    } finally {
      setExecuting(false);
    }
  };

  const handleApprove = async (id) => {
    await RecoveryAPI.approve(id);
    load();
  };

  const getActionBadgeClass = (status) => {
    if (status === 'success' || status === 'RECOVERY_SUCCESSFUL') return 'badge-success';
    if (status === 'failed' || status === 'BLOCKED_BY_SAFETY_POLICY') return 'badge-danger';
    return 'badge-warning';
  };

  return (
    <div className="data-card">
      <div className="card-header">
        <div className="card-header-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          <span>Autonomous Self-Healing Controller &amp; Safety Layer</span>
        </div>
        <span className="badge badge-success">Policy Guard Active</span>
      </div>

      <div className="card-body">
        {/* Controlled Remediation Trigger Deck */}
        <div style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Allow-List Protected Actions (Target: demo-checkout-service)
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              disabled={executing}
              onClick={() => handleTriggerAction('ROLLBACK')}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--status-danger)' }}
            >
              Rollback Deployment
            </button>
            <button
              disabled={executing}
              onClick={() => handleTriggerAction('RESTART')}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--status-warning)' }}
            >
              Rolling Restart
            </button>
            <button
              disabled={executing}
              onClick={() => handleTriggerAction('SCALE')}
              className="btn btn-secondary btn-sm"
              style={{ color: 'var(--status-success)' }}
            >
              Scale Replicas (HPA)
            </button>
          </div>
        </div>

        {/* Real-Time Execution Feedback Card */}
        {lastResult && (
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              background: lastResult.success ? 'var(--status-success-subtle)' : 'var(--status-danger-subtle)',
              border: `1px solid ${lastResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: lastResult.success ? 'var(--status-success)' : 'var(--status-danger)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>STATUS: {lastResult.status}</strong>
              {lastResult.mttr != null && (
                <span className="font-mono">Verification MTTR: {lastResult.mttr}s</span>
              )}
            </div>
            {lastResult.message && <div style={{ fontSize: '11px' }}>{lastResult.message}</div>}
          </div>
        )}

        {/* Remediation Audit Log */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            Remediation &amp; Verification Audit Log
          </div>
          {actions.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
              No recovery actions executed yet in this session.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {actions.slice(0, 4).map((a) => (
                <div
                  key={a._id}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>
                      <strong className="font-mono" style={{ color: 'var(--status-info)' }}>{a.actionType?.toUpperCase()}</strong> on{' '}
                      <em>{a.service?.name || 'checkout-service'}</em>
                    </span>
                    <span className={`badge ${getActionBadgeClass(a.status)}`}>
                      {a.status === 'success' ? 'VERIFIED' : a.status}
                    </span>
                  </div>
                  {a.reason && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                      {a.reason}
                    </div>
                  )}
                  {a.requiresApproval && a.status === 'pending_approval' && (
                    <button
                      onClick={() => handleApprove(a._id)}
                      className="btn btn-primary btn-sm"
                      style={{ alignSelf: 'flex-start', marginTop: 4 }}
                    >
                      Authorize Remediation
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelfHealingPanel;

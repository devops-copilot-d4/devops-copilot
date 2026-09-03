import React, { useEffect, useState } from 'react';
import { RecoveryAPI } from '../../api/endpoints';
import ExplainabilityCard from '../Explainability/ExplainabilityCard';

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
        reason: `Manually triggered ${actionType} self-healing remediation from dashboard.`,
        rootCause: 'Operator chaos experiment or detected degradation',
      });
      setLastResult(res.data);
      load();
    } catch (err) {
      console.error('Self-healing execution failed:', err);
      setLastResult({
        success: false,
        status: 'BLOCKED_OR_FAILED',
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

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>🛡️ Self-Healing Controller &amp; Safety Layer</h3>
      </div>

      {/* Manual Demo Remediation Triggers */}
      <div style={{ backgroundColor: '#1e293b', padding: 12, borderRadius: 8 }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8', marginBottom: 8 }}>
          Controlled Remediation (Allow-List Protected)
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            disabled={executing}
            onClick={() => handleTriggerAction('ROLLBACK')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            Rollback Deployment
          </button>
          <button
            disabled={executing}
            onClick={() => handleTriggerAction('RESTART')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#d97706',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            Rolling Restart
          </button>
          <button
            disabled={executing}
            onClick={() => handleTriggerAction('SCALE')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            Scale Replicas (HPA)
          </button>
        </div>
      </div>

      {/* Real-time Verification Feedback Result */}
      {lastResult && (
        <div
          style={{
            backgroundColor: lastResult.success ? '#064e3b' : '#7f1d1d',
            padding: 12,
            borderRadius: 6,
            fontSize: '13px',
            color: '#f8fafc',
            border: `1px solid ${lastResult.success ? '#10b981' : '#f87171'}`,
          }}
        >
          <strong>Status: {lastResult.status}</strong>
          {lastResult.mttr != null && (
            <span style={{ marginLeft: 12, color: '#6ee7b7' }}>
              • Verification MTTR: <strong>{lastResult.mttr}s</strong>
            </span>
          )}
          {lastResult.message && <div style={{ marginTop: 4 }}>{lastResult.message}</div>}
        </div>
      )}

      {/* Recovery History */}
      <div>
        <h4 style={{ margin: '8px 0 6px 0', fontSize: '14px' }}>Remediation &amp; Verification History</h4>
        {actions.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>No recovery actions executed yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actions.slice(0, 5).map((a) => (
              <li
                key={a._id}
                style={{
                  backgroundColor: '#0f172a',
                  padding: 10,
                  borderRadius: 6,
                  border: '1px solid #334155',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>
                    <strong style={{ color: '#38bdf8' }}>{a.actionType?.toUpperCase()}</strong> on{' '}
                    <em>{a.service?.name || 'checkout-service'}</em>
                  </span>
                  <span
                    style={{
                      color: a.status === 'success' ? '#22c55e' : a.status === 'failed' ? '#ef4444' : '#f59e0b',
                      fontWeight: 'bold',
                    }}
                  >
                    {a.status === 'success' ? '✓ RECOVERY SUCCESSFUL' : a.status}
                  </span>
                </div>
                {a.requiresApproval && a.status === 'pending_approval' && (
                  <button
                    onClick={() => handleApprove(a._id)}
                    style={{
                      marginTop: 6,
                      padding: '4px 8px',
                      backgroundColor: '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Approve Action
                  </button>
                )}
                {a.reason && (
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 4 }}>
                    {a.reason}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SelfHealingPanel;

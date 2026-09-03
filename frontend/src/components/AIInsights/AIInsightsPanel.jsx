import React, { useEffect, useState } from 'react';
import { AIInsightsAPI } from '../../api/endpoints';

const AIInsightsPanel = () => {
  const [incidents, setIncidents] = useState([]);
  const [copilotDiagnosis, setCopilotDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDiagnosis = async () => {
    setLoading(true);
    try {
      const res = await AIInsightsAPI.copilotDiagnose({
        serviceName: 'demo-checkout-service',
        telemetry: {
          cpu_usage: 52,
          memory_usage: 68,
          restart_count: 1,
          error_rate: 2.5,
          response_time: 0.35,
          pod_status: 'Running',
        },
        logs: '[INFO] Checkout API pool active\n[WARN] DB connection socket timeout: 240ms',
      });
      setCopilotDiagnosis(res.data);
    } catch (err) {
      console.error('Failed to fetch AI Copilot diagnosis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    AIInsightsAPI.incidents()
      .then((res) => setIncidents(res.data))
      .catch(() => setIncidents([]));
    fetchDiagnosis();
  }, []);

  const getRiskBadgeClass = (risk) => {
    if (risk === 'HIGH') return 'badge-danger';
    if (risk === 'MEDIUM') return 'badge-warning';
    return 'badge-success';
  };

  return (
    <div className="data-card">
      <div className="card-header">
        <div className="card-header-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          <span>AI Failure Prediction &amp; Root Cause Analysis (RCA)</span>
        </div>
        <button
          onClick={fetchDiagnosis}
          disabled={loading}
          className="btn btn-primary btn-sm"
        >
          {loading ? 'Evaluating Model...' : 'Run Diagnostics'}
        </button>
      </div>

      <div className="card-body">
        {/* ML Prediction Overview Card */}
        {copilotDiagnosis && (
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
                Machine Learning Failure Risk
              </span>
              <span className={`badge ${getRiskBadgeClass(copilotDiagnosis.risk)}`}>
                {copilotDiagnosis.risk} RISK
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'JetBrains Mono' }}>
                {(copilotDiagnosis.probability * 100).toFixed(1)}%
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Classification: <strong className="font-mono">{copilotDiagnosis.failure_type}</strong>
              </span>
            </div>

            {/* Probability Progress Bar */}
            <div style={{ width: '100%', height: 4, background: 'var(--bg-app)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(100, Math.max(5, copilotDiagnosis.probability * 100))}%`,
                height: '100%',
                background: copilotDiagnosis.risk === 'HIGH' ? 'var(--status-danger)' : copilotDiagnosis.risk === 'MEDIUM' ? 'var(--status-warning)' : 'var(--status-success)',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}

        {/* Structured LLM Root Cause Diagnosis */}
        {copilotDiagnosis && (
          <div style={{
            background: 'var(--bg-app)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--status-info)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Root Cause Synthesis
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
                Confidence: {(copilotDiagnosis.confidence * 100).toFixed(0)}%
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
              <strong>Identified Root Cause:</strong> {copilotDiagnosis.likely_cause}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Recommended Policy:</span>
              <span className="badge badge-info">{copilotDiagnosis.recommended_action}</span>
            </div>

            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-subtle)', paddingTop: 6 }}>
              "{copilotDiagnosis.reason}"
            </p>
          </div>
        )}

        {/* Incident History Section */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            Logged Failure Incidents
          </div>
          {incidents.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '8px 0' }}>
              No unresolved production incidents detected.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {incidents.slice(0, 3).map((i) => (
                <div
                  key={i._id}
                  style={{
                    padding: '8px 10px',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <strong className="font-mono" style={{ color: 'var(--text-primary)' }}>{i.service?.name || 'checkout-service'}</strong>: {i.rootCause}
                  </span>
                  <span className={`badge ${i.severity === 'high' ? 'badge-danger' : 'badge-warning'}`}>
                    {i.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPanel;

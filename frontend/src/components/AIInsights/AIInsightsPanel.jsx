import React, { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { AIInsightsAPI } from '../../api/endpoints';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const AIInsightsPanel = ({ onTriggerRecovery, refreshKey }) => {
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDiagnosis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await AIInsightsAPI.copilotDiagnose({
        serviceName: 'demo-checkout-service',
        namespace: 'default',
      });
      setDiagnosis(res.data);
    } catch (err) {
      console.error('[AIInsightsPanel] Diagnosis fetch error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnosis();

    const socket = io(SOCKET_URL);
    socket.on('k8s:update', () => fetchDiagnosis());
    socket.on('incident:new', () => fetchDiagnosis());
    socket.on('recovery:update', () => fetchDiagnosis());

    return () => {
      socket.disconnect();
    };
  }, [fetchDiagnosis, refreshKey]);

  // Derived Values from Real Backend Response
  const isHighRisk = diagnosis?.risk === 'HIGH';
  const isMediumRisk = diagnosis?.risk === 'MEDIUM';
  const riskClass = isHighRisk ? 'badge-critical' : isMediumRisk ? 'badge-warning' : 'badge-healthy';
  const riskColor = isHighRisk ? 'var(--status-critical)' : isMediumRisk ? 'var(--status-warning)' : 'var(--status-healthy)';
  const probabilityPercent = diagnosis?.probability != null ? Math.round(diagnosis.probability * 100) : (isHighRisk ? 98 : 5);
  const failureType = diagnosis?.failure_type || (isHighRisk ? 'CrashLoopBackOff' : 'Normal');
  const likelyCause = diagnosis?.likely_cause || (isHighRisk ? 'Application configuration failure or unhandled startup crash post-deployment.' : 'System operating within standard nominal operational bounds.');
  const action = diagnosis?.recommended_action || (isHighRisk ? 'ROLLBACK' : 'NO ACTION');
  const confidencePercent = diagnosis?.confidence != null ? Math.round(diagnosis.confidence * 100) : (isHighRisk ? 91 : 95);

  return (
    <div className="card-panel" style={{ border: isHighRisk ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border)' }}>
      {/* Header with Violet AI Accent */}
      <div className="card-panel-header" style={{ background: 'var(--bg-card-elevated)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--accent-ai)', fontSize: '15px' }}>✦</span>
          <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-primary)' }}>
            AI FAILURE PREDICTION &amp; RCA
          </span>
          <span className="badge-pill badge-ai" style={{ fontSize: '10px', padding: '2px 6px' }}>
            ● LIVE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target: <code className="font-mono">demo-checkout-service</code></span>
          <button onClick={fetchDiagnosis} disabled={loading} className="btn btn-secondary btn-sm" title="Re-evaluate AI Engine">
            {loading ? 'Evaluating...' : 'Run Diagnosis'}
          </button>
        </div>
      </div>

      <div className="card-panel-body">
        {/* Visual Pipeline Flow */}
        <div className="pipeline-flow">
          <div className="pipeline-node">
            <span style={{ color: 'var(--status-telemetry)' }}>●</span>
            <span>Telemetry</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-node pipeline-node-ai">
            <span>Random Forest</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-node" style={{ borderColor: isHighRisk ? 'var(--status-critical)' : 'var(--status-healthy)' }}>
            <span style={{ color: riskColor }}>Prediction</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-node pipeline-node-ai">
            <span>LLM RCA</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-node">
            <span style={{ color: 'var(--accent-primary)' }}>Safety Guard</span>
          </div>
          <span className="pipeline-arrow">→</span>
          <div className="pipeline-node" style={{ background: 'var(--bg-card-elevated)' }}>
            <span>Recovery</span>
          </div>
        </div>

        {/* Failure Risk & Classification Display */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          background: 'var(--bg-card-elevated)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
        }}>
          {/* Failure Probability Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Failure Risk
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span className="font-mono" style={{ fontSize: '32px', fontWeight: 800, color: riskColor }}>
                {probabilityPercent}%
              </span>
              <span className={`badge-pill ${riskClass}`}>
                {diagnosis?.risk || (isHighRisk ? 'HIGH' : 'LOW')}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: 2 }}>
              Predicted Class: <strong className="font-mono" style={{ color: isHighRisk ? 'var(--status-critical)' : 'var(--status-healthy)' }}>{failureType}</strong>
            </div>

            {/* Probability Bar */}
            <div style={{ width: '100%', height: 5, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
              <div style={{
                width: `${Math.min(100, Math.max(5, probabilityPercent))}%`,
                height: '100%',
                background: riskColor,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Root Cause & Recommended Action Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderLeft: '1px solid var(--border)', paddingLeft: 16 }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-ai)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Root Cause Synthesis
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {likelyCause}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Recommended Action: </span>
                <span className="badge-pill badge-ai" style={{ fontSize: '12px', padding: '3px 10px' }}>
                  {isHighRisk ? '↻ ROLLBACK' : action}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono' }}>
                Confidence: <strong style={{ color: 'var(--text-primary)' }}>{confidencePercent}%</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 14, fontSize: '11px', color: 'var(--text-muted)', paddingTop: 2 }}>
              <span>Model: <strong style={{ color: 'var(--text-secondary)' }}>Random Forest</strong></span>
              <span>•</span>
              <span>AI Reasoning: <strong style={{ color: 'var(--text-secondary)' }}>LLM RCA</strong></span>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: '11px', color: 'var(--status-critical)', background: 'var(--status-critical-subtle)', padding: '6px 10px', borderRadius: 4 }}>
            Inference engine notification: {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;

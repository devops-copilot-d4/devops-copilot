import React, { useEffect, useState } from 'react';
import { AIInsightsAPI } from '../../api/endpoints';

const AIInsightsPanel = () => {
  const [incidents, setIncidents] = useState([]);
  const [prediction, setPrediction] = useState(null);
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
        logs: '[INFO] Checkout API started\n[WARN] DB pool latency spike: 240ms',
      });
      setCopilotDiagnosis(res.data);
      setPrediction({
        probability: res.data.probability,
        risk: res.data.risk,
        failure_type: res.data.failure_type,
      });
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

  const getRiskColor = (risk) => {
    if (risk === 'HIGH') return '#ef4444';
    if (risk === 'MEDIUM') return '#f59e0b';
    return '#22c55e';
  };

  return (
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>AI DevOps Copilot Analysis</span>
        </h3>
        <button
          onClick={fetchDiagnosis}
          disabled={loading}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {loading ? 'Analyzing...' : 'Run Copilot Diagnosis'}
        </button>
      </div>

      {/* ML Prediction Overview Card */}
      {prediction && (
        <div
          style={{
            backgroundColor: '#1e293b',
            padding: 14,
            borderRadius: 8,
            border: `1px solid ${getRiskColor(prediction.risk)}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>ML Failure Probability</span>
            <span
              style={{
                backgroundColor: getRiskColor(prediction.risk),
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              {prediction.risk} RISK
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, margin: '8px 0', color: '#f8fafc' }}>
            {(prediction.probability * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
            Predicted Classification: <strong>{prediction.failure_type}</strong>
          </div>
        </div>
      )}

      {/* Structured Copilot Diagnosis */}
      {copilotDiagnosis && (
        <div
          style={{
            backgroundColor: '#0f172a',
            padding: 14,
            borderRadius: 8,
            border: '1px solid #334155',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            Root Cause Diagnosis &amp; Decision Support
          </div>
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#e2e8f0' }}>
            <strong>Likely Root Cause:</strong> {copilotDiagnosis.likely_cause}
          </p>
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#e2e8f0' }}>
            <strong>Recommended Action:</strong>{' '}
            <span style={{ color: '#a855f7', fontWeight: 700 }}>{copilotDiagnosis.recommended_action}</span> (Confidence: {(copilotDiagnosis.confidence * 100).toFixed(0)}%)
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
            &ldquo;{copilotDiagnosis.reason}&rdquo;
          </p>
        </div>
      )}

      {/* Incident History List */}
      <div>
        <h4 style={{ margin: '8px 0 6px 0', fontSize: '13px', color: '#cbd5e1', fontWeight: 600 }}>Recent Incidents</h4>
        {incidents.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#94a3b8' }}>No unresolved incidents detected.</p>
        ) : (
          <ul style={{ paddingLeft: 16, margin: 0, fontSize: '12px', color: '#cbd5e1' }}>
            {incidents.map((i) => (
              <li key={i._id} style={{ marginBottom: 4 }}>
                [{i.severity ? i.severity.toUpperCase() : 'INFO'}] {i.service?.name || 'checkout'}: {i.rootCause}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;

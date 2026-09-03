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
        <h3 style={{ margin: 0 }}>🤖 AI DevOps Copilot (Hybrid ML + LLM)</h3>
        <button
          onClick={fetchDiagnosis}
          disabled={loading}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
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
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>ML Failure Probability</span>
            <span
              style={{
                backgroundColor: getRiskColor(prediction.risk),
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 4,
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {prediction.risk} RISK
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '8px 0', color: '#f8fafc' }}>
            {(prediction.probability * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
            Predicted Scenario: <strong>{prediction.failure_type}</strong>
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
          <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', marginBottom: 8 }}>
            📋 Root Cause Analysis &amp; Decision Support
          </div>
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#e2e8f0' }}>
            <strong>Likely Cause:</strong> {copilotDiagnosis.likely_cause}
          </p>
          <p style={{ margin: '4px 0', fontSize: '13px', color: '#e2e8f0' }}>
            <strong>Recommended Action:</strong>{' '}
            <span style={{ color: '#a855f7', fontWeight: 'bold' }}>{copilotDiagnosis.recommended_action}</span> (Confidence: {(copilotDiagnosis.confidence * 100).toFixed(0)}%)
          </p>
          <p style={{ margin: '4px 0', fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
            &ldquo;{copilotDiagnosis.reason}&rdquo;
          </p>
        </div>
      )}

      {/* Incident History List */}
      <div>
        <h4 style={{ margin: '8px 0 6px 0', fontSize: '14px' }}>Recent Incidents</h4>
        {incidents.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>No unresolved incidents detected.</p>
        ) : (
          <ul style={{ paddingLeft: 16, margin: 0, fontSize: '13px' }}>
            {incidents.map((i) => (
              <li key={i._id} style={{ marginBottom: 4 }}>
                [{i.severity || 'INFO'}] {i.service?.name || 'checkout'}: {i.rootCause}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AIInsightsPanel;

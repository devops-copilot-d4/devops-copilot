import React, { useCallback, useEffect, useState } from 'react';
import { AIInsightsAPI } from '../../api/endpoints';

const tone = (status = '') => {
  const value = String(status).toUpperCase();
  if (value.includes('VERIFIED') || value === 'NO_FAILURE_PREDICTED') return 'badge-healthy';
  if (value.includes('FAILED') || value.includes('BLOCKED')) return 'badge-critical';
  if (value.includes('INCONCLUSIVE') || value.includes('UNAVAILABLE') || value.includes('PENDING')) return 'badge-warning';
  return 'badge-neutral';
};
const text = (value, fallback = 'Unavailable') => value == null || value === '' ? fallback : String(value).replaceAll('_', ' ');

const AIInsightsPanel = ({ service, refreshKey }) => {
  const [result, setResult] = useState(null);
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState(null);
  const analyze = useCallback(async () => {
    if (!service?.deploymentName) { setResult(null); setState('unavailable'); setMessage('Select a registered service to collect an evidence-bound analysis.'); return; }
    setState('loading'); setMessage(null);
    try { const response = await AIInsightsAPI.analyzeCopilot({ serviceId: service._id }); setResult(response.data); setState('ready'); }
    catch (error) { setResult(error.response?.data || null); setState('unavailable'); setMessage(error.response?.data?.message || 'The copilot analysis endpoint is unavailable.'); }
  }, [service]);
  useEffect(() => { analyze(); }, [analyze, refreshKey]);
  const prediction = result?.prediction;
  const rca = result?.rca;
  const recovery = result?.recovery;
  const flowStatus = result?.status || (state === 'loading' ? 'LOADING' : 'UNAVAILABLE');
  const steps = [['Telemetry', result?.features?.available ? 'Collected' : flowStatus], ['ML prediction', prediction?.risk_level || flowStatus], ['RCA', rca?.likely_cause ? 'Available' : flowStatus], ['Decision', result?.decision?.action || flowStatus], ['Safety', result?.safety?.allowed === true ? 'Allowed' : result?.safety?.code || flowStatus], ['Recovery', recovery?.action || flowStatus], ['Verification', recovery?.verificationResult || flowStatus]];
  return (
    <section className="card-panel copilot-panel">
      <div className="card-panel-header"><div><div className="eyebrow eyebrow-ai">AI control loop</div><h2 className="panel-title">Evidence-bound copilot analysis</h2><p className="panel-caption">{service?.deploymentName ? `Target: ${service.deploymentName}` : 'No service target is selected'}</p></div><button className="btn btn-ai" onClick={analyze} disabled={state === 'loading'}>{state === 'loading' ? 'Analyzing…' : 'Run analysis'}</button></div>
      <div className="card-panel-body">
        <div className="control-flow" aria-label="Copilot control loop">{steps.map(([label, value], index) => <React.Fragment key={label}><div className="control-step"><span>{label}</span><strong className={`badge-pill ${tone(value)}`}>{text(value)}</strong></div>{index < steps.length - 1 && <span className="control-arrow">→</span>}</React.Fragment>)}</div>
        <div className="copilot-grid">
          <div className="insight-block"><span>Failure probability</span><strong className="risk-value">{prediction?.failure_probability == null ? '—' : `${Math.round(prediction.failure_probability * 100)}%`}</strong><span className={`badge-pill ${tone(prediction?.risk_level)}`}>{text(prediction?.risk_level)}</span><p>Predicted type: <b>{text(prediction?.predicted_failure_type)}</b></p></div>
          <div className="insight-block"><span>Root-cause analysis</span><p className="insight-copy">{text(rca?.likely_cause)}</p><p>Confidence: <b>{rca?.confidence == null ? 'Unavailable' : `${Math.round(rca.confidence * 100)}%`}</b></p><p>Action: <b>{text(rca?.recommended_action)}</b></p></div>
          <div className="insight-block"><span>Safety and outcome</span><p>Safety: <b>{result?.safety?.allowed === true ? 'Allowed' : text(result?.safety?.code)}</b></p><p>Verification: <b>{text(recovery?.verificationResult)}</b></p><p>Final result: <b>{text(result?.status)}</b></p></div>
        </div>
        {result?.incidentId && <div className="evidence-line">Incident ID <code>{result.incidentId}</code></div>}
        {rca?.evidence && <details className="evidence-details"><summary>Collected evidence summary</summary><p>Pod/deployment state, telemetry, events, and log-error count were supplied to the backend control loop. Raw secrets and commands are never shown or accepted by this UI.</p></details>}
        {(message || state === 'unavailable') && <div className="unavailable-callout">{message || 'Analysis is unavailable. No health, prediction, RCA, or recovery outcome is inferred.'}</div>}
      </div>
    </section>
  );
};
export default AIInsightsPanel;

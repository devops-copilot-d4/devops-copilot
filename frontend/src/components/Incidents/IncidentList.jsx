import React, { useEffect, useState, useCallback } from 'react';
import { AIInsightsAPI } from '../../api/endpoints';

const badgeFor = (value = '') => {
  const status = String(value).toLowerCase();
  if (['resolved', 'success', 'recovery_verified', 'no_failure_predicted'].includes(status)) return 'badge-healthy';
  if (['open', 'escalated', 'failed', 'critical', 'high'].includes(status)) return 'badge-critical';
  if (['diagnosing', 'recovering', 'medium'].includes(status)) return 'badge-warning';
  return 'badge-neutral';
};

const display = (value, fallback = 'Unavailable') => value == null || value === '' ? fallback : String(value).replaceAll('_', ' ');

const IncidentList = ({ refreshKey, compact = false }) => {
  const [incidents, setIncidents] = useState([]);
  const [state, setState] = useState('loading');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const result = await AIInsightsAPI.incidents();
      setIncidents(Array.isArray(result.data) ? result.data : []);
      setState('ready');
    } catch (_) {
      setIncidents([]);
      setState('unavailable');
    }
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);
  const rows = compact ? incidents.slice(0, 5) : incidents;

  return (
    <section className="card-panel">
      <div className="card-panel-header">
        <div>
          <div className="eyebrow">Incident ledger</div>
          <h2 className="panel-title">Detected incidents</h2>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load} disabled={state === 'loading'}>{state === 'loading' ? 'Loading…' : 'Refresh'}</button>
      </div>
      <div className="table-responsive">
        <table className="enterprise-table">
          <thead><tr><th>Incident</th><th>Service</th><th>Risk</th><th>RCA</th><th>Recovery</th><th>Detected</th></tr></thead>
          <tbody>
            {state === 'loading' && <tr><td colSpan="6" className="empty-cell">Loading incident history…</td></tr>}
            {state === 'unavailable' && <tr><td colSpan="6" className="empty-cell">Incident history is unavailable. No incident state is inferred.</td></tr>}
            {state === 'ready' && rows.length === 0 && <tr><td colSpan="6" className="empty-cell">No incidents have been recorded.</td></tr>}
            {rows.map((incident) => (
              <tr key={incident._id}>
                <td><code>{incident._id?.slice(-8) || 'Unavailable'}</code></td>
                <td className="cell-strong">{incident.service?.name || incident.service?.deploymentName || 'Unavailable'}</td>
                <td><span className={`badge-pill ${badgeFor(incident.risk || incident.severity)}`}>{display(incident.risk || incident.severity)}</span></td>
                <td><span className={`badge-pill ${badgeFor(incident.rca?.likely_cause ? 'diagnosing' : '')}`}>{incident.rca?.likely_cause ? 'Available' : 'Unavailable'}</span></td>
                <td><span className={`badge-pill ${badgeFor(incident.resolutionStatus || incident.status)}`}>{display(incident.resolutionStatus || incident.status)}</span></td>
                <td className="font-mono cell-muted">{incident.createdAt ? new Date(incident.createdAt).toLocaleString() : 'Unavailable'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default IncidentList;

import React, { useState } from 'react';
import { RequirementsAPI } from '../../api/endpoints';

const RequirementForm = ({ services = [], onCreated }) => {
  const [text, setText] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedService) {
      setStatus({ type: 'warning', message: 'Please enter a natural-language requirement and select a target microservice.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await RequirementsAPI.create({ text, service: selectedService });
      const { requirement, draftSlo } = res.data;

      let msg = `Requirement created: "${requirement.text}"`;
      if (draftSlo) {
        msg += ` ➔ Synthesized SLO: ${draftSlo.comparator} ${draftSlo.threshold} ${draftSlo.unit}`;
      }
      setStatus({ type: 'success', message: msg });
      setText('');
      if (onCreated) onCreated();
    } catch (err) {
      setStatus({ type: 'error', message: `Error: ${err.response?.data?.message || err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-panel">
      <div className="card-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--accent-ai)' }}>✦</span>
          <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Natural Language Requirement to SLO Synthesis
          </span>
        </div>
        <span className="badge-pill badge-ai">LLM Prompt Engine</span>
      </div>

      <div className="card-panel-body">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <select
              className="form-select"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              style={{ flex: 1, minWidth: '180px' }}
            >
              <option value="">-- Target Microservice --</option>
              {services.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              className="form-input"
              placeholder='e.g. "Checkout API response duration must stay below 300ms"'
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ flex: 2, minWidth: '260px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={loading} className="btn btn-ai btn-sm">
              {loading ? 'Synthesizing with AI...' : 'Convert to SLO & Track'}
            </button>
          </div>
        </form>

        {status && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              background: status.type === 'success' ? 'var(--status-healthy-subtle)' : 'var(--status-critical-subtle)',
              border: `1px solid ${status.type === 'success' ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
              color: status.type === 'success' ? 'var(--status-healthy)' : 'var(--status-critical)',
            }}
          >
            {status.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequirementForm;

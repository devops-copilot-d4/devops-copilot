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
      setStatus({ type: 'warning', message: 'Please enter a natural-language requirement and select a microservice.' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await RequirementsAPI.create({ text, service: selectedService });
      const { requirement, draftSlo } = res.data;

      let msg = `Requirement stored: "${requirement.text}"`;
      if (draftSlo) {
        msg += ` ➔ LLM synthesized SLO: ${draftSlo.comparator} ${draftSlo.threshold} ${draftSlo.unit}`;
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
    <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--accent)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </span>
          <span>Define Business Requirement (NLP to SLO Synthesis)</span>
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--cyan)', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: 12 }}>
          LLM Prompt Synthesizer
        </span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            style={{ flex: 1, minWidth: '200px' }}
          >
            <option value="">-- Target Microservice --</option>
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            placeholder='e.g. "Checkout API response latency must remain under 300ms"'
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ flex: 2, minWidth: '280px' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" disabled={loading} style={{ padding: '8px 18px', fontSize: '13px' }}>
            {loading ? 'Synthesizing with AI...' : 'Convert to SLO & Track'}
          </button>
        </div>
      </form>

      {status && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            fontSize: '13px',
            background: status.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${status.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            color: status.type === 'success' ? '#a7f3d0' : '#fecaca',
          }}
        >
          {status.message}
        </div>
      )}
    </div>
  );
};

export default RequirementForm;

import React, { useState } from 'react';
import { RequirementsAPI } from '../../api/endpoints';

const RequirementForm = ({ services, onCreated }) => {
  const [text, setText] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedService) {
      setStatus('Please enter a requirement and select a service.');
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await RequirementsAPI.create({ text, service: selectedService });
      const { requirement, draftSlo } = res.data;

      let msg = `Requirement created: "${requirement.text}"`;
      if (draftSlo) {
        msg += ` → SLO drafted: ${draftSlo.comparator} ${draftSlo.threshold} ${draftSlo.unit}`;
      } else {
        msg += ' (SLO generation failed — can be retried later)';
      }
      setStatus(msg);
      setText('');
      if (onCreated) onCreated();
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <h3>Add Requirement</h3>
      <form onSubmit={handleSubmit}>
        <select
          value={selectedService}
          onChange={(e) => setSelectedService(e.target.value)}
        >
          <option value="">-- Select a service --</option>
          {(services || []).map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          placeholder='e.g. "Checkout should respond within 300ms"'
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Analyzing...' : 'Create Requirement'}
        </button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
};

export default RequirementForm;

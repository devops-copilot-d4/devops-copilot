import React, { useState } from 'react';
import { DeploymentsAPI } from '../../api/endpoints';

const RepoImportForm = () => {
  const [serviceId, setServiceId] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await DeploymentsAPI.trigger({ serviceId, commitSha });
      setStatus(`Deployment queued: ${res.data._id}`);
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <h3>Import Repository / Trigger Deployment</h3>
      <input
        placeholder="Service ID"
        value={serviceId}
        onChange={(e) => setServiceId(e.target.value)}
      />
      <input
        placeholder="Commit SHA (optional)"
        value={commitSha}
        onChange={(e) => setCommitSha(e.target.value)}
      />
      <button type="submit">Trigger Deployment</button>
      {status && <p>{status}</p>}
    </form>
  );
};

export default RepoImportForm;


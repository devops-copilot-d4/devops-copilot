import React, { useState } from 'react';
import { ServicesAPI, DeploymentsAPI } from '../../api/endpoints';

const RepoImportForm = ({ services = [], onServiceCreated }) => {
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [status, setStatus] = useState(null);

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      const res = await ServicesAPI.create({ name, repoUrl });
      setStatus(`Service created: ${res.data.name}`);
      setName('');
      setRepoUrl('');
      if (onServiceCreated) onServiceCreated();
      setSelectedServiceId(res.data._id);
    } catch (err) {
      setStatus(`Error creating service: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleTriggerDeployment = async (e) => {
    e.preventDefault();
    if (!selectedServiceId) {
      setStatus('Pick a service first.');
      return;
    }
    try {
      const res = await DeploymentsAPI.trigger({ serviceId: selectedServiceId, commitSha });
      setStatus(`Deployment queued: ${res.data._id}`);
    } catch (err) {
      setStatus(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="panel">
      <h3>Import Repository</h3>
      <form onSubmit={handleCreateService}>
        <input
          placeholder="Service name (e.g. checkout-service)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          placeholder="Repo URL (e.g. https://github.com/you/repo)"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
        />
        <button type="submit">Create Service</button>
      </form>

      <h3>Trigger Deployment</h3>
      <form onSubmit={handleTriggerDeployment}>
        <select
          value={selectedServiceId}
          onChange={(e) => setSelectedServiceId(e.target.value)}
        >
          <option value="">-- Select a service --</option>
          {services.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Commit SHA (optional)"
          value={commitSha}
          onChange={(e) => setCommitSha(e.target.value)}
        />
        <button type="submit">Trigger Deployment</button>
      </form>

      {status && <p>{status}</p>}
    </div>
  );
};

export default RepoImportForm;
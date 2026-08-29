import React, { useEffect, useState } from 'react';
import { RequirementsAPI } from '../../api/endpoints';

const RequirementTraceabilityView = () => {
  const [requirements, setRequirements] = useState([]);

  useEffect(() => {
    RequirementsAPI.list()
      .then((res) => setRequirements(res.data))
      .catch(() => setRequirements([]));
  }, []);

  return (
    <div className="panel">
      <h3>Requirement -&gt; Service -&gt; SLO Traceability</h3>
      {requirements.length === 0 && <p>No requirements added yet.</p>}
      <ul>
        {requirements.map((r) => (
          <li key={r._id}>
            "{r.text}" -&gt; service: {r.service?.name || 'unlinked'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RequirementTraceabilityView;


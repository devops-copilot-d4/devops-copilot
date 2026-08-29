import React, { useEffect, useState } from 'react';
import { AIInsightsAPI } from '../../api/endpoints';

const AIInsightsPanel = () => {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    AIInsightsAPI.incidents()
      .then((res) => setIncidents(res.data))
      .catch(() => setIncidents([]));
  }, []);

  return (
    <div className="panel">
      <h3>AI Root Cause Analysis</h3>
      {incidents.length === 0 && <p>No incidents detected yet.</p>}
      <ul>
        {incidents.map((i) => (
          <li key={i._id}>
            [{i.severity}] {i.service?.name}: {i.rootCause} (confidence:{' '}
            {i.confidence != null ? Math.round(i.confidence * 100) + '%' : 'n/a'})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AIInsightsPanel;


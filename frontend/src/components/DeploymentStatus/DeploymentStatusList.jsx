import React, { useEffect, useState } from 'react';
import { DeploymentsAPI } from '../../api/endpoints';

const DeploymentStatusList = () => {
  const [deployments, setDeployments] = useState([]);

  useEffect(() => {
    DeploymentsAPI.list()
      .then((res) => setDeployments(res.data))
      .catch(() => setDeployments([]));
  }, []);

  return (
    <div className="panel">
      <h3>Recent Deployments</h3>
      {deployments.length === 0 && <p>No deployments yet.</p>}
      <ul>
        {deployments.map((d) => (
          <li key={d._id}>
            {d.service?.name || 'Unknown service'} - build: {d.buildStatus}, deploy: {d.deployStatus}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DeploymentStatusList;


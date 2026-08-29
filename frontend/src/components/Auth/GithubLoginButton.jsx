import React from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const GithubLoginButton = () => {
  const handleLogin = () => {
    window.location.href = `${API_BASE}/auth/github`;
  };

  return (
    <button onClick={handleLogin} className="panel" style={{ cursor: 'pointer' }}>
      Sign in with GitHub
    </button>
  );
};

export default GithubLoginButton;


import React from 'react';
import GithubLoginButton from '../components/Auth/GithubLoginButton';

const LoginPage = () => (
  <div className="login-shell">
  <div className="panel login-card">
    <h2>AI-Driven DevOps Platform</h2>
    <p>Sign in with GitHub to import a repository and get started.</p>
    <GithubLoginButton />
  </div>
  </div>
);

export default LoginPage;


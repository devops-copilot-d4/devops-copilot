import React from 'react';
import GithubLoginButton from '../components/Auth/GithubLoginButton';

const LoginPage = () => (
  <div className="panel" style={{ maxWidth: 400, margin: '80px auto', textAlign: 'center' }}>
    <h2>AI-Driven DevOps Platform</h2>
    <p>Sign in with GitHub to import a repository and get started.</p>
    <GithubLoginButton />
  </div>
);

export default LoginPage;


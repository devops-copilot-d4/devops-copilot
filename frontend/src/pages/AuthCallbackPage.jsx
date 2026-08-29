import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Backend redirects here (or you configure the frontend to read the JSON
// response directly) after GitHub OAuth completes. Adjust based on how
// auth.controller.js's githubCallback is wired to redirect in Week 2.
const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token, null);
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [searchParams, login, navigate]);

  return <p style={{ textAlign: 'center', marginTop: 80 }}>Signing you in...</p>;
};

export default AuthCallbackPage;


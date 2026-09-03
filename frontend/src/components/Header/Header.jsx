import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const username = user?.username || 'engineer';
  const initial = username.charAt(0).toUpperCase();

  return (
    <header className="app-header">
      <div className="app-header__left">
        <div className="app-header__brand">
          <div className="app-header__logo-icon">⚡</div>
          <span>DevOps Copilot</span>
        </div>
        <div className="app-header__badge">
          <span className="app-header__pulse-dot" />
          <span>Production (k8s-us-east-1)</span>
        </div>
      </div>

      <div className="app-header__right">
        <div className="app-header__user-chip">
          <div className="app-header__avatar">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={username}
                style={{ width: '100%', height: '100%', borderRadius: '50%' }}
              />
            ) : (
              initial
            )}
          </div>
          <span className="app-header__username">{username}</span>
        </div>
        <button className="btn btn--ghost" onClick={handleLogout} style={{ padding: '6px 14px', fontSize: '13px' }}>
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default Header;
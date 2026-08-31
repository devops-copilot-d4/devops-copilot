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

  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__dot" />
        DevOps Copilot
      </div>
      <div className="app-header__right">
        {user?.username && <span className="app-header__user">{user.username}</span>}
        <button className="btn btn--ghost" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
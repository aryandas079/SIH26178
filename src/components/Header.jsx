import React from 'react';
import ViewDetailingMenu from './ViewDetailingMenu';
import { useAuth, getInitialsAvatar } from '../context/AuthContext';

export default function Header({
  currentTheme,
  onThemeChange,
  currentView,
  onViewChange,
  viewDetails,
  onToggleDetail,
  onSetViewPreset,
}) {
  const {
    user,
    isAuthenticated,
    loginWithGoogle,
    logout,
    authLoading,
  } = useAuth();

  const getNextTheme = () => {
    if (currentTheme === 'light') return 'dark';
    if (currentTheme === 'dark') return 'tinted';
    return 'light';
  };

  const getThemeButtonLabel = () => {
    if (currentTheme === 'light') return 'DARK MODE';
    if (currentTheme === 'dark') return 'TINTED MODE';
    return 'LIGHT MODE';
  };

  return (
    <header className={`top-nav-bar ${currentView === 'dashboard' ? 'dashboard-nav-bar' : ''}`}>
      {currentView === 'dashboard' && (
        <div className="dashboard-nav-left">
          <span className="dashboard-nav-brand">ERMS</span>
          <span className="dashboard-nav-divider">/</span>
          <span className="dashboard-nav-title">ENVIRONMENTAL RISK INTELLIGENCE CONSOLE</span>
          <span className="dashboard-nav-live-pill">
            <span className="live-pulse-dot" /> LIVE SENSOR STREAM
          </span>
        </div>
      )}

      <div className="top-nav-right">
        {currentView === 'dashboard' ? (
          <>
            <ViewDetailingMenu
              viewDetails={viewDetails}
              onToggleDetail={onToggleDetail}
              onSetViewPreset={onSetViewPreset}
            />

            <button
              type="button"
              className="clean-box-btn"
              onClick={() => onViewChange('home')}
            >
              HOME
            </button>
          </>
        ) : (
          <button
            type="button"
            className="clean-box-btn dashboard-nav-btn"
            onClick={() => onViewChange('dashboard')}
          >
            DASHBOARD
          </button>
        )}

        <button
          type="button"
          className="clean-box-btn theme-toggle-btn"
          onClick={() => onThemeChange(getNextTheme())}
        >
          {getThemeButtonLabel()}
        </button>

        {isAuthenticated && user ? (
          <div className="header-authenticated-user-group">
            <div
              className="header-user-identity-btn"
              title={`Logged in: ${user.displayName || user.email || 'Authorized User'}`}
            >
              <img
                src={user.photoURL || getInitialsAvatar(user.displayName || 'Google User')}
                alt={user.displayName || 'Google User'}
                className="header-user-avatar-img"
                onError={(e) => {
                  e.currentTarget.src = getInitialsAvatar(user.displayName || 'Google User');
                }}
              />
              <span className="header-user-name-text">
                {user.displayName || (user.email ? user.email.split('@')[0] : 'Google User')}
              </span>
            </div>

            <button
              type="button"
              className="clean-box-btn header-sign-out-btn"
              onClick={() => {
                logout();
                onViewChange('home');
              }}
              title="Sign Out"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              SIGN OUT
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="clean-box-btn auth-sign-in-btn"
            onClick={loginWithGoogle}
            disabled={authLoading}
            title="Sign in with Google"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            {authLoading ? 'CONNECTING...' : 'SIGN IN WITH GOOGLE'}
          </button>
        )}
      </div>
    </header>
  );
}

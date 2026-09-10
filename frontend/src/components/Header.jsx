import React, { useState, useEffect, useRef } from 'react';
import ViewDetailingMenu from './ViewDetailingMenu';
import { useAuth, getInitialsAvatar } from '../context/AuthContext';

function TimeIcon({ period }) {
  if (period === 'morning') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 2v6m0 0l-2-2m2 2l2-2" />
        <path d="M4.93 10.93l2.83 2.83M19.07 10.93l-2.83 2.83" />
        <path d="M2 18h20" />
        <path d="M7 18a5 5 0 0 1 10 0" />
      </svg>
    );
  }
  if (period === 'afternoon') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    );
  }
  if (period === 'evening') {
    return (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 10V4m0 6l-2-2m2 2l2-2" />
        <path d="M4.93 10.93l2.83 2.83M19.07 10.93l-2.83 2.83" />
        <path d="M2 18h20" />
        <path d="M7 18a5 5 0 0 1 10 0" />
      </svg>
    );
  }
  // night
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

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
    greeting,
    greetingPeriod,
    logout,
    openAuthModal,
  } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile dropdown on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isProfileOpen) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isProfileOpen]);

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
        {/* If logged in: Dynamic Time-of-Day Greeting with Name */}
        {isAuthenticated && user && (
          <div
            className="user-greeting-pill"
            title={`Active Session: ${user.displayName || user.email || user.phoneNumber}`}
          >
            <span className="greeting-icon-wrapper" aria-hidden="true">
              <TimeIcon period={greetingPeriod} />
            </span>
            <span className="greeting-text-content">{greeting}</span>
          </div>
        )}

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
              title={`Logged in: ${user.displayName || user.email || user.phoneNumber} (${user.role || 'Analyst'})`}
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
            onClick={openAuthModal}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            SIGN IN
          </button>
        )}
      </div>
    </header>
  );
}

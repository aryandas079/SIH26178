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

        {/* Home navigation & Dashboard button */}
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

        {/* Theme Toggle */}
        <button
          type="button"
          className="clean-box-btn theme-toggle-btn"
          onClick={() => onThemeChange(getNextTheme())}
        >
          {getThemeButtonLabel()}
        </button>

        {/* Authentication Section: Profile Avatar with Sign Out OR Sign In Button */}
        {isAuthenticated && user ? (
          <div className="header-profile-menu-container" ref={profileRef}>
            <button
              type="button"
              className={`header-profile-avatar-btn ${isProfileOpen ? 'avatar-active' : ''}`}
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-label="User Profile and Sign Out Menu"
              aria-haspopup="true"
              aria-expanded={isProfileOpen}
            >
              <img
                src={user.photoURL || getInitialsAvatar(user.displayName || 'Commander')}
                alt={user.displayName || 'User Profile'}
                className="header-avatar-image"
                onError={(e) => {
                  e.currentTarget.src = getInitialsAvatar(user.displayName || 'Commander');
                }}
              />
              <span className="avatar-live-beacon" title="Session Authenticated" />
            </button>

            {/* Profile Dropdown Popover */}
            {isProfileOpen && (
              <div className="profile-popover-panel" role="dialog" aria-label="User Session Details">
                {/* Header Card */}
                <div className="profile-popover-card">
                  <div className="profile-popover-avatar-wrap">
                    <img
                      src={user.photoURL || getInitialsAvatar(user.displayName || 'Commander')}
                      alt={user.displayName || 'User'}
                      className="profile-popover-avatar-lg"
                      onError={(e) => {
                        e.currentTarget.src = getInitialsAvatar(user.displayName || 'Commander');
                      }}
                    />
                    <div className="profile-badge-icon" title={`Auth: ${user.provider}`}>
                      {user.provider === 'google' ? (
                        <svg width="12" height="12" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                      ) : user.provider === 'phone' ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <div className="profile-popover-details">
                    <div className="profile-popover-display-name">
                      {user.displayName || 'Authorized Responder'}
                    </div>
                    <div className="profile-popover-id">
                      {user.email || user.phoneNumber || 'Disaster Commander'}
                    </div>
                    <div className="profile-popover-badge-pill">
                      <span className="profile-popover-status-dot" />
                      {user.role || (user.provider === 'google' ? 'Google Authenticated' : 'Phone Verified')}
                    </div>
                  </div>
                </div>

                <div className="profile-popover-meta-list">
                  <div className="profile-popover-meta-item">
                    <span className="meta-key">PROVIDER</span>
                    <span className="meta-val">{user.provider === 'google' ? 'Google OAuth 2.0' : user.provider === 'phone' ? 'SMS Mobile OTP' : 'Emergency Passcode'}</span>
                  </div>
                  <div className="profile-popover-meta-item">
                    <span className="meta-key">SECURITY</span>
                    <span className="meta-val meta-val-sovereign">SOVEREIGN MISSION READY</span>
                  </div>
                </div>

                {/* Sign Out Action Button */}
                <div className="profile-popover-actions">
                  <button
                    type="button"
                    className="clean-box-btn profile-logout-btn"
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                      onViewChange('home');
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    SIGN OUT
                  </button>
                </div>
              </div>
            )}
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

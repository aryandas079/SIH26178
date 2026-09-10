import React, { useState, useEffect, useRef } from 'react';
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
    openAuthModal,
    logout,
    updateUserProfile,
  } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInputValue, setPhoneInputValue] = useState('');
  const profileRef = useRef(null);

  // Close profile dropdown on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
        setEditingPhone(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isProfileOpen) {
        setIsProfileOpen(false);
        setEditingPhone(false);
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

  const handleSavePhone = (e) => {
    e.preventDefault();
    if (phoneInputValue.trim()) {
      updateUserProfile({ phoneNumber: phoneInputValue.trim() });
      setEditingPhone(false);
    }
  };

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
            <div className="header-profile-menu-container" ref={profileRef}>
              <button
                type="button"
                className={`header-profile-avatar-btn ${isProfileOpen ? 'avatar-active' : ''}`}
                onClick={() => setIsProfileOpen((prev) => !prev)}
                title={`Profile: ${user.displayName || user.email || 'User'} (Click to view details)`}
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <img
                  src={user.photoURL || getInitialsAvatar(user.displayName || 'Google User')}
                  alt={user.displayName || 'Google User'}
                  className="header-avatar-image"
                  onError={(e) => {
                    e.currentTarget.src = getInitialsAvatar(user.displayName || 'Google User');
                  }}
                />
                <span className="avatar-live-beacon" />
              </button>

              <span
                className="header-user-name-text"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                style={{ cursor: 'pointer' }}
                title="Click to view profile"
              >
                {user.displayName || (user.email ? user.email.split('@')[0] : 'Google User')}
              </span>

              {/* Profile Dropdown Popover */}
              {isProfileOpen && (
                <div
                  className="profile-popover-panel"
                  role="dialog"
                  aria-label="User Profile Details"
                >
                  <div className="profile-popover-card">
                    <div className="profile-popover-avatar-wrap">
                      <img
                        src={user.photoURL || getInitialsAvatar(user.displayName || 'Google User')}
                        alt={user.displayName || 'User'}
                        className="profile-popover-avatar-lg"
                        onError={(e) => {
                          e.currentTarget.src = getInitialsAvatar(user.displayName || 'Google User');
                        }}
                      />
                      <span className="profile-badge-icon" aria-hidden="true">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    </div>

                    <div className="profile-popover-details">
                      <div className="profile-popover-display-name">
                        {user.displayName || 'Google User'}
                      </div>
                      <div className="profile-popover-id">
                        {user.email || 'No email attached'}
                      </div>
                      <div className="profile-popover-badge-pill">
                        <span className="profile-popover-status-dot" />
                        <span>{user.role || 'Disaster Risk Analyst'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="profile-popover-meta-list">
                    <div className="profile-popover-meta-item">
                      <span className="meta-key">AUTH METHOD</span>
                      <span className="meta-val meta-val-sovereign">
                        {user.provider ? user.provider.toUpperCase() : 'GOOGLE'}
                      </span>
                    </div>

                    <div className="profile-popover-meta-item">
                      <span className="meta-key">PHONE</span>
                      <span className="meta-val">
                        {user.phoneNumber || 'Not Linked'}
                      </span>
                    </div>

                    <div className="profile-popover-meta-item">
                      <span className="meta-key">SESSION STATUS</span>
                      <span className="meta-val meta-val-sovereign">ACTIVE // LIVE</span>
                    </div>
                  </div>

                  {/* Add / Edit phone number inside popover */}
                  {(!user.phoneNumber || editingPhone) ? (
                    <form onSubmit={handleSavePhone} style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
                      <input
                        type="tel"
                        placeholder="Add phone: +91..."
                        className="auth-text-input"
                        style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem', height: '28px', flex: 1 }}
                        value={phoneInputValue}
                        onChange={(e) => setPhoneInputValue(e.target.value)}
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="clean-box-btn"
                        style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', height: '28px' }}
                      >
                        SAVE
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="clean-box-btn"
                      style={{ fontSize: '0.65rem', padding: '0.2rem 0.4rem', alignSelf: 'flex-start', border: 'none', background: 'transparent', color: 'var(--pal-emerald, #284f38)', textDecoration: 'underline', cursor: 'pointer' }}
                      onClick={() => {
                        setPhoneInputValue(user.phoneNumber || '');
                        setEditingPhone(true);
                      }}
                    >
                      Update phone number
                    </button>
                  )}

                  <div className="profile-popover-actions">
                    <button
                      type="button"
                      className="profile-logout-btn"
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                        onViewChange('home');
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

            <button
              type="button"
              className="clean-box-btn header-sign-out-btn"
              onClick={() => {
                setIsProfileOpen(false);
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
            title="Sign In"
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

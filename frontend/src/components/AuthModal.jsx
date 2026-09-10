import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const {
    loginWithGoogle,
    loginWithDemo,
    sendPhoneOtp,
    verifyPhoneOtp,
    loginWithAdmin,
    authLoading,
    authError,
    clearAuthError,
    isFirebaseLive,
  } = useAuth();

  const [activeTab, setActiveTab] = useState('google'); // 'google' | 'phone' | 'admin'

  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneUserName, setPhoneUserName] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [localError, setLocalError] = useState('');

  const [adminId, setAdminId] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const phoneInputRef = useRef(null);
  const otpInputRef = useRef(null);
  const adminInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setLocalError('');
      clearAuthError?.();
      setOtpSent(false);
      setOtpCode('');
      setOtpMessage('');
      setPhoneNumber('');
      setPhoneUserName('');
      setAdminId('');
      setAdminPassword('');
    }
  }, [isOpen]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setLocalError('');
    clearAuthError?.();
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLocalError('');
    clearAuthError?.();
    const result = await loginWithGoogle();
    if (result?.success) {
      onClose();
    } else if (result?.error !== 'Popup closed') {
      setLocalError(result?.error || 'Google authentication failed. Please try again.');
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLocalError('');
    setOtpMessage('');

    const cleanNumber = phoneNumber.trim().replace(/\D/g, '');
    if (cleanNumber.length < 8 || cleanNumber.length > 13) {
      setLocalError('Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullPhone = countryCode + cleanNumber;
    const res = await sendPhoneOtp(fullPhone);

    if (res.success) {
      setOtpSent(true);
      setOtpMessage(res.message || 'OTP verification code dispatched via SMS.');
      setTimeout(() => {
        if (otpInputRef.current) otpInputRef.current.focus();
      }, 100);
    } else {
      setLocalError(res.error || 'Failed to dispatch verification code.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLocalError('');

    const targetCode = otpCode.trim();
    if (!targetCode || targetCode.length < 4) {
      setLocalError('Please enter the SMS verification code.');
      return;
    }

    const res = await verifyPhoneOtp(targetCode, phoneUserName.trim());
    if (res?.success) {
      onClose();
    } else {
      setLocalError(res?.error || 'Invalid verification code.');
    }
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    const res = await loginWithAdmin(adminId.trim(), adminPassword);
    if (res?.success) {
      onClose();
    } else {
      setLocalError(res?.error || 'ACCESS DENIED // INVALID ADMIN ID OR PASSWORD');
    }
  };

  return (
    <div
      className="auth-fullscreen-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={onClose}
    >
      <div className="auth-prompt-card auth-prompt-card-wide" onClick={(e) => e.stopPropagation()}>
        {/* Invisible reCAPTCHA container for live Firebase Phone Auth */}
        <div id="recaptcha-container" />

        <div className="auth-card-header">
          <div className="auth-header-left">
            <span className="auth-gateway-tag">SOVEREIGN ACCESS PORTAL</span>
            <h3 id="auth-modal-title" className="auth-header-title">
              ERMS OPERATIONAL AUTHENTICATION
            </h3>
          </div>
          <button
            type="button"
            className="clean-box-btn auth-cancel-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="auth-tabs-nav" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'google'}
            className={`auth-tab-btn ${activeTab === 'google' ? 'active-tab' : ''}`}
            onClick={() => handleTabChange('google')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            GOOGLE AUTH
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'phone'}
            className={`auth-tab-btn ${activeTab === 'phone' ? 'active-tab' : ''}`}
            onClick={() => handleTabChange('phone')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            PHONE OTP
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'admin'}
            className={`auth-tab-btn ${activeTab === 'admin' ? 'active-tab' : ''}`}
            onClick={() => handleTabChange('admin')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            ADMIN ACCESS
          </button>
        </div>

        {activeTab === 'google' && (
          <div className="auth-tab-pane">
            <div className="auth-provider-hero">
              <div className="auth-provider-icon-badge">
                <svg width="32" height="32" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              </div>
              <h4 className="auth-provider-title">Sign in with Google</h4>
              <p className="auth-provider-description">
                Authenticate with your official Google account to activate live multi-hazard risk tracking, AI operational copilot, and geodetic response coordination.
              </p>
            </div>

            <div className="auth-google-action-container">
              <button
                type="button"
                className="clean-box-btn google-sign-in-btn"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                {authLoading ? 'CONNECTING TO GOOGLE...' : 'CONTINUE WITH GOOGLE'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'phone' && (
          <div className="auth-tab-pane">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="auth-form">
                <div className="auth-form-group">
                  <label htmlFor="auth-phone-number" className="auth-field-label">
                    MOBILE NUMBER
                  </label>
                  <div className="phone-input-combo">
                    <select
                      className="country-code-select"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      <option value="+91">+91 (IN)</option>
                      <option value="+1">+1 (US/CA)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+977">+977 (NP)</option>
                      <option value="+880">+880 (BD)</option>
                    </select>
                    <input
                      id="auth-phone-number"
                      ref={phoneInputRef}
                      type="tel"
                      autoComplete="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Enter 10-digit mobile number"
                      className="auth-text-input phone-number-input"
                      required
                    />
                  </div>
                  <span className="auth-input-hint">An SMS with a 6-digit verification code will be sent to your mobile.</span>
                </div>

                <div className="auth-actions-row">
                  <button
                    type="button"
                    className="clean-box-btn auth-secondary-btn"
                    onClick={onClose}
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="clean-box-btn auth-primary-submit-btn"
                    disabled={authLoading}
                  >
                    {authLoading ? 'SENDING OTP...' : 'SEND VERIFICATION OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="auth-form">
                {otpMessage && (
                  <div className="auth-success-alert" role="status">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{otpMessage}</span>
                  </div>
                )}

                <div className="auth-form-group">
                  <label htmlFor="auth-user-name" className="auth-field-label">
                    RESPONDER NAME (OPTIONAL)
                  </label>
                  <input
                    id="auth-user-name"
                    type="text"
                    value={phoneUserName}
                    onChange={(e) => setPhoneUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="auth-text-input"
                  />
                  <span className="auth-input-hint">Used for your personalized time-of-day greeting.</span>
                </div>

                <div className="auth-form-group">
                  <label htmlFor="auth-otp-code" className="auth-field-label">
                    VERIFICATION CODE (OTP)
                  </label>
                  <input
                    id="auth-otp-code"
                    ref={otpInputRef}
                    type="text"
                    maxLength={6}
                    autoComplete="one-time-code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit code"
                    className="auth-text-input otp-code-input"
                    required
                  />
                </div>

                <div className="auth-actions-row">
                  <button
                    type="button"
                    className="clean-box-btn auth-secondary-btn"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                      setLocalError('');
                    }}
                  >
                    CHANGE NUMBER
                  </button>
                  <button
                    type="submit"
                    className="clean-box-btn auth-primary-submit-btn"
                    disabled={authLoading}
                  >
                    {authLoading ? 'VERIFYING...' : 'VERIFY & ENTER CONSOLE'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === 'admin' && (
          <form onSubmit={handleAdminSubmit} className="auth-form auth-tab-pane">
            <div className="auth-form-group">
              <label htmlFor="auth-admin-id" className="auth-field-label">
                ADMIN ID
              </label>
              <input
                id="auth-admin-id"
                ref={adminInputRef}
                type="text"
                autoComplete="username"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="Enter Admin ID"
                className="auth-text-input"
                required
              />
            </div>

            <div className="auth-form-group">
              <label htmlFor="auth-password" className="auth-field-label">
                PASSWORD
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete="current-password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter Authorization Password"
                className="auth-text-input"
                required
              />
            </div>

            <div className="auth-actions-row">
              <button
                type="button"
                className="clean-box-btn auth-secondary-btn"
                onClick={onClose}
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="clean-box-btn auth-primary-submit-btn"
                disabled={authLoading}
              >
                AUTHENTICATE
              </button>
            </div>
          </form>
        )}

        {(localError || authError) && (
          <div className="auth-error-alert" role="alert">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontWeight: 600 }}>{localError || authError}</span>
          </div>
        )}
      </div>
    </div>
  );
}

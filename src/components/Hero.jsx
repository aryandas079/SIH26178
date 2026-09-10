import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Hero({ onOpenDashboard }) {
  const { isAuthenticated, user, greeting } = useAuth();

  return (
    <section className="hero-section">
      <div className="hero-subtitle">
        ENVIRONMENTAL INTELLIGENCE PLATFORM
      </div>

      <h1 className="hero-main-title">
        <span>ENVIRONMENTAL RISK</span>
        <span>MONITORING SYSTEM</span>
      </h1>

      {isAuthenticated && user && (
        <div className="hero-operator-badge">
          <span className="live-pulse-dot" style={{ backgroundColor: '#10b981' }} />
          <span>OPERATOR ACTIVE: <strong>{user.displayName || user.email}</strong></span>
        </div>
      )}

      <div className="hero-action-container">
        <button
          type="button"
          className="clean-box-btn hero-open-btn"
          onClick={onOpenDashboard}
        >
          OPEN DASHBOARD
        </button>
      </div>
    </section>
  );
}

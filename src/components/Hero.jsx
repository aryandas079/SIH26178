import React from 'react';

export default function Hero({ onOpenDashboard }) {
  return (
    <section className="hero-section">
      <div className="hero-subtitle">
        ENVIRONMENTAL INTELLIGENCE PLATFORM
      </div>

      <h1 className="hero-main-title">
        <span>ENVIRONMENTAL RISK</span>
        <span>MONITORING SYSTEM</span>
      </h1>

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

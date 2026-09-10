import React, { useEffect } from 'react';

export default function Modal({ isOpen, type, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
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

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 id="modal-title" className="modal-title">
            {type === 'team' ? 'ABOUT THE DEVELOPERS' : 'TERMS AND CONDITIONS'}
          </h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            CLOSE [ESC]
          </button>
        </div>

        <div className="modal-body">
          {type === 'team' ? (
            <div className="modal-team-list">
              {/* Aryan Das - Lead Developer */}
              <div className="modal-team-member">
                <span className="member-role">LEAD DEVELOPER</span>
                <h4 className="member-name">ARYAN DAS</h4>
                <div style={{ marginTop: '0.45rem' }}>
                  <a
                    href="https://github.com/aryandas079"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="github-badge-link"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>@aryandas079</span>
                  </a>
                </div>
              </div>

              {/* Firujur Rahman Barbhuiya */}
              <div className="modal-team-member">
                <span className="member-role">HARDWARE & EMBEDDED</span>
                <h4 className="member-name">FIRUJUR RAHMAN BARBHUIYA</h4>
              </div>

              {/* Jeet Sarkar */}
              <div className="modal-team-member">
                <span className="member-role">PRESENTATION & DESIGN</span>
                <h4 className="member-name">JEET SARKAR</h4>
              </div>

              {/* Sudarshan Sarkar */}
              <div className="modal-team-member">
                <span className="member-role">IDEA MODULATOR & PRESENTATION</span>
                <h4 className="member-name">SUDARSHAN SARKAR</h4>
              </div>

              {/* Yeahyea Choudhary */}
              <div className="modal-team-member">
                <span className="member-role">LEAD PRESENTATION</span>
                <h4 className="member-name">YEAHYEA CHOUDHARY</h4>
              </div>

              {/* Susmita */}
              <div className="modal-team-member">
                <span className="member-role">PRESENTATION</span>
                <h4 className="member-name">SUSMITA</h4>
              </div>
            </div>
          ) : (
            <div className="modal-terms-content">
              {/* Primary Sensor Advisory Section */}
              <div className="terms-section">
                <h4 className="terms-heading">01 // SENSOR DATA ADVISORY & CROSS-VERIFICATION</h4>
                <p>
                  The Environmental Risk Monitoring System (ERMS) synthesizes real-time metrics primarily
                  derived from physical sensor arrays, atmospheric monitoring nodes, and remote embedded field units.
                  Due to natural micro-climate volatility, sensor calibration drift, atmospheric occlusions, or
                  hardware transmission latencies, sensor readings <strong>may occasionally be subject to inaccuracies or variance</strong>.
                </p>
                <p style={{ marginTop: '0.65rem' }}>
                  Users, field operators, and environmental researchers <strong>must not rely solely on ERMS telemetry as a single source of truth</strong> for emergency or high-consequence decisions. All data, anomalies, and risk indices <strong>should always be cross-referenced and validated with independent cross-sources</strong>, including official government meteorological bureaus, local environmental protection bodies, and manual ground-truth samplings.
                </p>
              </div>

              <div className="terms-section">
                <h4 className="terms-heading">02 // PLATFORM INTENT & DECISION SUPPORT</h4>
                <p>
                  ERMS is engineered as an auxiliary computational intelligence tool to assist in early detection, trend analysis, and environmental monitoring. The system provides predictive indicators and telemetry aggregation to augment—not replace—professional environmental assessment.
                </p>
              </div>

              <div className="terms-section">
                <h4 className="terms-heading">03 // HARDWARE TELEMETRY & UPTIME DYNAMICS</h4>
                <p>
                  Remote IoT nodes and sensor stations operate under variable field conditions. Power cycles, physical weather exposure, or network intermittency may result in interpolated or estimated values until live station synchronization is re-established.
                </p>
              </div>

              <div className="terms-section">
                <h4 className="terms-heading">04 // ETHICAL USE & STEWARDSHIP</h4>
                <p>
                  All data accessed through ERMS must be utilized exclusively for conservation, public safety, ecological research, and climate resilience planning. Reverse engineering or malicious exploitation of sensor infrastructure is strictly prohibited.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

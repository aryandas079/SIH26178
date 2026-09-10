import React from 'react';

export default function Footer({ onOpenModal }) {
  return (
    <footer id="page-footer" className="exact-footer">
      <div className="footer-links-left">
        <button
          type="button"
          className="footer-underlined-link"
          onClick={() => onOpenModal('team')}
        >
          ABOUT THE DEVELOPERS
        </button>

        <button
          type="button"
          className="footer-underlined-link"
          onClick={() => onOpenModal('terms')}
        >
          TERMS AND CONDITIONS
        </button>
      </div>

      <div className="footer-brand-right">
        <span className="footer-huge-logo">ERMS</span>
      </div>
    </footer>
  );
}

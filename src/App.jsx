import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Dashboard from './components/Dashboard';
import Footer from './components/Footer';
import Modal from './components/Modal';
import AuthModal from './components/AuthModal';
import LeafCanvas from './components/LeafCanvas';
import { AuthProvider, useAuth } from './context/AuthContext';
import '../assets/Instagram-Sans-Font-Family/stylesheet.css';
import './styles/theme.css';
import './styles/app.css';

function MainApp() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('erms-theme') || 'light';
  });

  const { isAuthenticated, authModalOpen, openAuthModal, closeAuthModal } = useAuth();

  // Strict default: Always open at 'home'
  const [view, setView] = useState('home');
  const [pendingDashboardRedirect, setPendingDashboardRedirect] = useState(false);

  const [activeModal, setActiveModal] = useState(null); // 'team' | 'terms' | null

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('erms-theme', theme);
  }, [theme]);

  // Protected Dashboard Navigation
  const handleOpenDashboard = () => {
    if (!isAuthenticated) {
      setPendingDashboardRedirect(true);
      openAuthModal();
      return;
    }
    setView('dashboard');
    if (typeof window !== 'undefined') window.location.hash = 'dashboard';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Safe Navigation Handler for Header & Hash
  const handleViewChange = (newView) => {
    if (newView === 'dashboard') {
      handleOpenDashboard();
      return;
    }
    setView(newView);
    if (typeof window !== 'undefined') window.location.hash = newView;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-redirect to dashboard when user completes authentication with pending intent
  useEffect(() => {
    if (isAuthenticated && pendingDashboardRedirect) {
      setView('dashboard');
      setPendingDashboardRedirect(false);
      if (typeof window !== 'undefined') window.location.hash = 'dashboard';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isAuthenticated, pendingDashboardRedirect]);

  // If user signs out while on dashboard, return to home
  useEffect(() => {
    if (!isAuthenticated && view === 'dashboard') {
      setView('home');
      if (typeof window !== 'undefined') window.location.hash = 'home';
    }
  }, [isAuthenticated, view]);

  // Synchronize hash changes safely
  useEffect(() => {
    const handleHashChange = () => {
      if (typeof window === 'undefined') return;
      if (window.location.hash === '#dashboard') {
        if (!isAuthenticated) {
          setPendingDashboardRedirect(true);
          openAuthModal();
          setView('home');
        } else {
          setView('dashboard');
        }
      } else if (window.location.hash === '#home') {
        setView('home');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isAuthenticated, openAuthModal]);

  const [viewDetails, setViewDetails] = useState(() => {
    try {
      const saved = localStorage.getItem('erms-view-details-v5');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return {
      nodeTelemetry: false,
      sensorChannels: false,
      topicAnalytics: false,
      stressTestBar: false,
      anomalyCards: false,
      cascadingForecast: false,
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('erms-view-details-v5', JSON.stringify(viewDetails));
    } catch (e) {}
  }, [viewDetails]);

  const handleToggleDetail = (key) => {
    setViewDetails((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSetViewPreset = (preset) => {
    if (preset === 'clean') {
      setViewDetails({
        nodeTelemetry: false,
        sensorChannels: false,
        topicAnalytics: false,
        stressTestBar: false,
        anomalyCards: false,
        cascadingForecast: false,
      });
    } else if (preset === 'full') {
      setViewDetails({
        nodeTelemetry: true,
        sensorChannels: true,
        topicAnalytics: true,
        stressTestBar: true,
        anomalyCards: true,
        cascadingForecast: true,
      });
    }
  };

  const handleBackHome = () => {
    setView('home');
    if (typeof window !== 'undefined') window.location.hash = 'home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* Leaf Particle Scatter Cursor Canvas */}
      <LeafCanvas />

      {/* Top Navigation Bar with Greetings & Profile */}
      <Header
        currentTheme={theme}
        onThemeChange={setTheme}
        currentView={view}
        onViewChange={handleViewChange}
        viewDetails={viewDetails}
        onToggleDetail={handleToggleDetail}
        onSetViewPreset={handleSetViewPreset}
      />

      {/* Main Content: Home or Dashboard */}
      <main style={{ flex: 1 }}>
        {view === 'home' ? (
          <Hero onOpenDashboard={handleOpenDashboard} />
        ) : (
          <Dashboard
            onBackHome={handleBackHome}
            viewDetails={viewDetails}
            onToggleDetail={handleToggleDetail}
            onSetViewPreset={handleSetViewPreset}
          />
        )}
      </main>

      {/* Footer revealed on scrolling down */}
      <Footer onOpenModal={(modalType) => setActiveModal(modalType)} />

      {/* Modals for Developing Team & Terms */}
      <Modal
        isOpen={activeModal !== null}
        type={activeModal}
        onClose={() => setActiveModal(null)}
      />

      {/* Unified Google, Phone & Admin Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={closeAuthModal}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

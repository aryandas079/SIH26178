import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  auth,
  googleProvider,
  fbSignOut,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  onAuthStateChanged,
  isFirebaseConfigured,
} from '../services/firebase';

const AuthContext = createContext(null);

const STORAGE_KEY = 'erms-auth-user-v2';

// Fallback high-res avatar generator using initials
export function getInitialsAvatar(name, bg = '0ea5e9') {
  const initials = (name || 'Commander')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bg}&color=ffffff&bold=true&size=128`;
}

// Compute time-of-day greeting
export function computeGreeting(user) {
  const hour = new Date().getHours();
  let timeGreeting = 'Good morning';
  let period = 'morning'; // 'morning' | 'afternoon' | 'evening' | 'night'

  if (hour >= 5 && hour < 12) {
    timeGreeting = 'Good morning';
    period = 'morning';
  } else if (hour >= 12 && hour < 17) {
    timeGreeting = 'Good afternoon';
    period = 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    timeGreeting = 'Good evening';
    period = 'evening';
  } else {
    timeGreeting = 'Good night';
    period = 'night';
  }

  let rawName = user?.displayName || user?.name || '';
  if (!rawName && user?.email) {
    rawName = user.email.split('@')[0];
  }
  if (!rawName && user?.phoneNumber) {
    rawName = user.phoneNumber;
  }
  if (!rawName) {
    rawName = 'Commander';
  }

  // Capitalize first token
  const firstName = rawName.split(' ')[0].replace(/[^a-zA-Z0-9+]/g, '');
  const cleanName = firstName.length > 0 ? (firstName.charAt(0).toUpperCase() + firstName.slice(1)) : 'Commander';

  return {
    fullGreeting: `${timeGreeting}, ${cleanName}`,
    timeGreeting,
    name: cleanName,
    period,
  };
}

// Transmit authenticated user details to backend access log file
async function transmitAuthLog(userData) {
  try {
    const payload = {
      provider: userData.provider || 'UNKNOWN',
      displayName: userData.displayName || 'Anonymous User',
      email: userData.email || null,
      phoneNumber: userData.phoneNumber || null,
      uid: userData.uid || null,
      role: userData.role || 'User',
    };
    await fetch('/api/auth/log-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn('[AuthContext] Could not send auth log to backend:', err.message);
  }
}

export function AuthProvider({ children }) {
  // Load persisted session
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to read auth state from localStorage', e);
    }
    return null;
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Phone auth confirmation result
  const [phoneConfirmation, setPhoneConfirmation] = useState(null);

  // Synchronize with localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to write auth state to localStorage', e);
    }
  }, [user]);

  // Subscribe to live Firebase auth changes when configured
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setUser((prev) => {
          const defaultName = fbUser.phoneNumber
            ? `Field Officer ${fbUser.phoneNumber.slice(-4)}`
            : (fbUser.email ? fbUser.email.split('@')[0] : 'Authorized User');

          const updated = {
            uid: fbUser.uid,
            displayName: fbUser.displayName || prev?.displayName || defaultName,
            email: fbUser.email,
            phoneNumber: fbUser.phoneNumber,
            photoURL: fbUser.photoURL || prev?.photoURL || getInitialsAvatar(fbUser.displayName || defaultName),
            provider: fbUser.phoneNumber ? 'phone' : 'google',
            role: prev?.role || (fbUser.phoneNumber ? 'Field Telemetry Responder' : 'Disaster Risk Analyst'),
            lastLogin: new Date().toISOString(),
          };
          return updated;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Compute live greeting info
  const greetingInfo = useMemo(() => computeGreeting(user), [user]);

  // 1. Google Login Handler (Real Firebase Google OAuth)
  const loginWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);

    if (isFirebaseConfigured && auth && googleProvider) {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;
        const defaultName = fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Authorized User');
        const loggedUser = {
          uid: fbUser.uid,
          displayName: defaultName,
          email: fbUser.email,
          phoneNumber: fbUser.phoneNumber,
          photoURL: fbUser.photoURL || getInitialsAvatar(defaultName),
          provider: 'google',
          role: 'Disaster Risk Analyst',
          lastLogin: new Date().toISOString(),
        };
        setUser(loggedUser);
        setAuthLoading(false);
        setAuthModalOpen(false);
        transmitAuthLog(loggedUser);
        return { success: true, user: loggedUser };
      } catch (err) {
        console.error('[Firebase Google Auth error]:', err.code, err.message);
        setAuthLoading(false);
        let errorMsg = 'Google authentication failed. Please try again.';
        if (err.code === 'auth/popup-closed-by-user') {
          errorMsg = 'Google sign-in popup was closed before completing.';
        } else if (err.code === 'auth/cancelled-popup-request') {
          errorMsg = 'Sign-in popup request was cancelled.';
        } else if (err.code === 'auth/unauthorized-domain') {
          errorMsg = 'Domain not authorized in Firebase Console. Please add your domain (e.g. localhost, 127.0.0.1) under Firebase Console > Authentication > Settings > Authorized domains.';
        } else if (err.code === 'auth/operation-not-allowed') {
          errorMsg = 'Google sign-in provider is not enabled in Firebase Console. Please enable Google in Firebase Console > Authentication > Sign-in method.';
        } else if (err.message) {
          errorMsg = err.message;
        }
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } else {
      setAuthLoading(false);
      const errorMsg = 'Firebase Authentication is not configured. Please check your .env variables.';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Set up Recaptcha Verifier for Phone Auth
  const setupRecaptcha = useCallback((containerId = 'recaptcha-container') => {
    if (!isFirebaseConfigured || !auth) return null;
    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = null;
      }
      const container = document.getElementById(containerId);
      if (!container) return null;

      window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired');
        },
      });
      return window.recaptchaVerifier;
    } catch (err) {
      console.warn('reCAPTCHA setup warning:', err);
      return null;
    }
  }, []);

  // 2. Send Phone OTP Handler (Real Firebase SMS Dispatch)
  const sendPhoneOtp = useCallback(async (phoneNumber) => {
    setAuthLoading(true);
    setAuthError(null);

    // Format phone number to E.164
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : '+91' + phoneNumber.replace(/\D/g, '');

    if (isFirebaseConfigured && auth) {
      try {
        const appVerifier = setupRecaptcha();
        if (!appVerifier) {
          throw new Error('Could not initialize reCAPTCHA verifier. Please refresh and try again.');
        }

        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
        setPhoneConfirmation(confirmation);
        setAuthLoading(false);
        return { success: true, message: `SMS verification code dispatched to ${formattedPhone}.` };
      } catch (err) {
        console.error('[Firebase Phone Auth error]:', err.code, err.message);
        setAuthLoading(false);
        if (window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch (e) {}
          window.recaptchaVerifier = null;
        }
        let errorMsg = 'Failed to dispatch SMS verification code.';
        if (err.code === 'auth/invalid-phone-number') {
          errorMsg = 'Invalid phone number format. Please ensure country code is included (e.g. +91).';
        } else if (err.code === 'auth/missing-phone-number') {
          errorMsg = 'Please enter a valid phone number.';
        } else if (err.code === 'auth/quota-exceeded') {
          errorMsg = 'SMS quota exceeded for this Firebase project. To test for free, add this number under Firebase Console > Authentication > Phone > Phone numbers for testing.';
        } else if (err.code === 'auth/operation-not-allowed') {
          errorMsg = 'Phone sign-in is not enabled in Firebase Console. Please enable Phone provider in Firebase Console > Authentication > Sign-in method.';
        } else if (err.code === 'auth/too-many-requests') {
          errorMsg = 'Too many requests. Please wait a moment and try again.';
        } else if (err.message) {
          errorMsg = err.message;
        }
        setAuthError(errorMsg);
        return { success: false, error: errorMsg };
      }
    } else {
      setAuthLoading(false);
      const errorMsg = 'Firebase Authentication is not configured. Please check your .env variables.';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [setupRecaptcha]);

  // 3. Verify Phone OTP Handler (Real Firebase Confirmation)
  const verifyPhoneOtp = useCallback(async (otpCode, customDisplayName = '') => {
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (!phoneConfirmation) {
        throw new Error('No active OTP session found. Please request a new verification code.');
      }

      const res = await phoneConfirmation.confirm(otpCode);
      const phoneDigits = res.user.phoneNumber ? res.user.phoneNumber.slice(-4) : '';
      const finalName = customDisplayName.trim() || res.user.displayName || `Officer ${phoneDigits}` || 'Field Officer';

      const verifiedUser = {
        uid: res.user.uid,
        displayName: finalName,
        phoneNumber: res.user.phoneNumber || phoneConfirmation.phoneNumber,
        email: res.user.email || null,
        photoURL: res.user.photoURL || getInitialsAvatar(finalName, '059669'),
        provider: 'phone',
        role: 'Field Telemetry Responder',
        lastLogin: new Date().toISOString(),
      };

      setUser(verifiedUser);
      setPhoneConfirmation(null);
      setAuthLoading(false);
      setAuthModalOpen(false);
      transmitAuthLog(verifiedUser);
      return { success: true, user: verifiedUser };
    } catch (err) {
      console.error('[Firebase Verify OTP error]:', err.code, err.message);
      setAuthLoading(false);
      let errorMsg = 'Invalid verification code. Please check SMS and try again.';
      if (err.code === 'auth/invalid-verification-code') {
        errorMsg = 'The verification code you entered is incorrect. Please try again.';
      } else if (err.code === 'auth/code-expired') {
        errorMsg = 'The SMS verification code has expired. Please request a new code.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, [phoneConfirmation]);

  // 4. Admin Access Login
  const loginWithAdmin = useCallback(async (adminId = 'abc123', password = '') => {
    try {
      const res = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const adminUser = {
          uid: data.user.uid,
          displayName: data.user.displayName || 'System Administrator',
          email: data.user.email || 'admin@disaster-command.gov.in',
          phoneNumber: null,
          photoURL: getInitialsAvatar('System Administrator', '047857'),
          provider: 'admin',
          role: data.user.role || 'Disaster Operations Administrator',
          lastLogin: new Date().toISOString(),
        };
        setUser(adminUser);
        setAuthModalOpen(false);
        return { success: true, user: adminUser };
      } else {
        return { success: false, error: data.message || 'ACCESS DENIED // INVALID ADMIN ID OR PASSWORD' };
      }
    } catch (e) {
      // Offline fallback if server is temporarily unreachable
      if (adminId.trim() === 'abc123' && password === 'ERer00*#') {
        const adminUser = {
          uid: 'admin-' + adminId,
          displayName: 'System Administrator',
          email: 'admin@disaster-command.gov.in',
          phoneNumber: null,
          photoURL: getInitialsAvatar('System Administrator', '047857'),
          provider: 'admin',
          role: 'Disaster Operations Administrator',
          lastLogin: new Date().toISOString(),
        };
        setUser(adminUser);
        setAuthModalOpen(false);
        transmitAuthLog(adminUser);
        return { success: true, user: adminUser };
      }
      return { success: false, error: 'ACCESS DENIED // INVALID ADMIN ID OR PASSWORD' };
    }
  }, []);

  // Sign Out Handler
  const logout = useCallback(async () => {
    setAuthLoading(true);
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.warn('Firebase signOut error:', err);
      }
    }
    setUser(null);
    setPhoneConfirmation(null);
    setAuthLoading(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }, []);

  const value = {
    user,
    isAuthenticated: Boolean(user),
    authModalOpen,
    setAuthModalOpen,
    openAuthModal: () => setAuthModalOpen(true),
    closeAuthModal: () => setAuthModalOpen(false),
    greeting: greetingInfo.fullGreeting,
    greetingTime: greetingInfo.timeGreeting,
    userName: greetingInfo.name,
    greetingPeriod: greetingInfo.period,
    loginWithGoogle,
    sendPhoneOtp,
    verifyPhoneOtp,
    loginWithAdmin,
    logout,
    authLoading,
    authError,
    phoneConfirmation,
    isFirebaseLive: isFirebaseConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;

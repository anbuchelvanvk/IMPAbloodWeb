"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase';
import { onIdTokenChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [pendingUser, setPendingUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastSessionSyncAtRef = useRef(0);
  const lastSessionUidRef = useRef('');

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return () => {};
    }
    const unsub = onIdTokenChanged(auth, async (authUser) => {
      try {
        if (!authUser) {
          setUser(null);
          setPendingUser(null);
          setLoading(false);
          return;
        }
        // Fast path: resolve current user via bearer-token API.
        const latest = await firebaseService.refreshCurrentUser();
        if (latest?.needsRegistration) {
          setPendingUser(latest);
          setUser(null);
        } else {
          setUser(latest);
          setPendingUser(null);
        }
        // Slow path in background: keep session cookie synced for SSR routes.
        const now = Date.now();
        const shouldRefresh = authUser.uid !== lastSessionUidRef.current || (now - lastSessionSyncAtRef.current) > 30_000;
        if (shouldRefresh) {
          firebaseService.refreshServerSession().catch(() => {});
          lastSessionSyncAtRef.current = now;
          lastSessionUidRef.current = authUser.uid;
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    const userData = await firebaseService.login(email, password);
    if (!userData?.needsRegistration) {
      setUser(userData);
      setPendingUser(null);
    } else {
      setPendingUser(userData);
    }
    return userData;
  };

  const loginWithGoogle = async () => {
    const userData = await firebaseService.loginWithGoogle();
    if (!userData.needsRegistration) {
      setUser(userData);
      setPendingUser(null);
    } else {
      setPendingUser(userData);
    }
    return userData;
  };

  const register = async (userData) => {
    const newUser = await firebaseService.register(userData);
    setUser(newUser);
    setPendingUser(null);
  };

  const logout = async () => {
    await firebaseService.logout();
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('pendingGoogleUser');
      window.sessionStorage.removeItem('pendingProfileUser');
    }
    setUser(null);
    setPendingUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    pendingUser,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
    setPendingUser,
    loading
  };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { firebaseService } from '../services/firebaseService';
import { auth } from '../firebase';
import { onIdTokenChanged } from 'firebase/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
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
          setLoading(false);
          return;
        }
        // Fast path: resolve current user via bearer-token API.
        const latest = await firebaseService.refreshCurrentUser();
        setUser(latest);
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
    if (!userData?.needsRegistration) setUser(userData);
    return userData;
  };

  const loginWithGoogle = async () => {
    const userData = await firebaseService.loginWithGoogle();
    if (!userData.needsRegistration) {
      setUser(userData);
    }
    return userData;
  };

  const register = async (userData) => {
    const newUser = await firebaseService.register(userData);
    setUser(newUser);
  };

  const logout = async () => {
    await firebaseService.logout();
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

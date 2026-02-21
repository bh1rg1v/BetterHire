import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = useCallback(async () => {
    const token = api.getStoredToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: u } = await api.api('/auth/me');
      setUser(u);
      setError(null);
    } catch (e) {
      api.setToken(null);
      setUser(null);
      if (e.status === 401) setError(null);
      else setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email, password) => {
    setError(null);
    const { user: u, token } = await api.api('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    api.setToken(token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    setError(null);
    const { user: u, token } = await api.api('/auth/register', {
      method: 'POST',
      body: payload,
      auth: false,
    });
    api.setToken(token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    api.setToken(null);
    setUser(null);
    setError(null);
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    refreshUser: loadUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    isManager: user?.role === 'Manager',
    isApplicant: user?.role === 'Applicant',
    isOrgStaff: user?.role === 'Admin' || user?.role === 'Manager',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

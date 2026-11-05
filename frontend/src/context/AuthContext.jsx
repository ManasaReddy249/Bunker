import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const token = localStorage.getItem('bs_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      setDemoMode(!!data.demo_mode);
    } catch {
      localStorage.removeItem('bs_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function login(loginValue, password) {
    const { data } = await api.post('/auth/login', { login: loginValue, password });
    localStorage.setItem('bs_token', data.token);
    setUser(data.user);
    const me = await api.get('/auth/me');
    setDemoMode(!!me.data.demo_mode);
    return data.user;
  }

  async function register(details) {
    const { data } = await api.post('/auth/register', details);
    localStorage.setItem('bs_token', data.token);
    setUser(data.user);
    const me = await api.get('/auth/me');
    setDemoMode(!!me.data.demo_mode);
    return data.user;
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    localStorage.removeItem('bs_token');
    setUser(null);
  }

  const value = useMemo(() => ({ user, demoMode, loading, login, register, logout, refresh }), [user, demoMode, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [officer, setOfficer] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore stored session on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('relic_auth_token');
      const storedOfficer = localStorage.getItem('relic_officer_profile');
      if (storedToken && storedOfficer) {
        setToken(storedToken);
        setOfficer(JSON.parse(storedOfficer));
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (badgeId, password) => {
    const data = await api.login(badgeId, password);
    if (data.success && data.access_token) {
      setToken(data.access_token);
      setOfficer(data.officer);
      localStorage.setItem('relic_auth_token', data.access_token);
      localStorage.setItem('relic_officer_profile', JSON.stringify(data.officer));
    }
    return data;
  };

  const logout = () => {
    setToken(null);
    setOfficer(null);
    localStorage.removeItem('relic_auth_token');
    localStorage.removeItem('relic_officer_profile');
  };

  return (
    <AuthContext.Provider
      value={{
        officer,
        token,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useTheme } from './ThemeContext';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { resetTheme } = useTheme();

  useEffect(() => {
    // Check if we have an active session flag in sessionStorage.
    // Unlike cookies, sessionStorage is cleared by the browser when the tab/window is closed.
    const sessionActive = sessionStorage.getItem('academic_system_session');

    if (!sessionActive) {
      // If no session flag exists, skip session restoration (even if cookie is present)
      setLoading(false);
      return;
    }

    // Restore session by calling /auth/me — the HttpOnly cookie is sent automatically.
    api.get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => {
          // If the token is invalid or expired, clear the flag too
          sessionStorage.removeItem('academic_system_session');
          setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      // The server sets the HttpOnly cookie automatically via set-cookie header.
      // Mark session as active in sessionStorage so it persists on refresh
      sessionStorage.setItem('academic_system_session', 'active');
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      };
    }
  };

  const logout = async () => {
    try {
      // Clear the session flag and ask the server to clear the HttpOnly cookie
      sessionStorage.removeItem('academic_system_session');
      resetTheme();
      await api.post('/auth/logout');
    } catch (_) {
      // Proceed even if the request fails
    }
    setUser(null);
    window.location.href = '/login';
  };

  const value = {
    user,
    setUser,   // Exposed so Profile can update user state without a page reload
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isTeacher: user?.role === 'TEACHER',
    isStudent: user?.role === 'STUDENT',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

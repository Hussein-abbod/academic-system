import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

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

  useEffect(() => {
    // Restore session by calling /auth/me — the HttpOnly cookie is sent automatically.
    // No localStorage needed; the browser manages the cookie.
    api.get('/auth/me')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password, role) => {
    try {
      const response = await api.post('/auth/login', { email, password, role });
      // The server sets the HttpOnly cookie automatically via set-cookie header.
      // We only store the user object in React state — never in localStorage.
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
      // Ask the server to clear the HttpOnly cookie — JS cannot do this itself.
      await api.post('/auth/logout');
    } catch (_) {
      // Proceed even if the request fails (token may already be expired)
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

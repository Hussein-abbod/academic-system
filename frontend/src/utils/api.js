import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
  // Required for HttpOnly cookies to be sent/received automatically
  withCredentials: true,
});

// Response interceptor — redirect to login on 401 (session expired or not logged in)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      // Do not touch localStorage — the HttpOnly cookie is cleared by the server logout endpoint
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

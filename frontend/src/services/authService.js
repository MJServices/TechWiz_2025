import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const API_URL = `${API_BASE_URL}/auth`;

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log(`[Auth API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      hasToken: !!token,
      baseURL: config.baseURL
    });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("[Auth API Request Error]", error);
    return Promise.reject(error);
  }
);

// Handle token refresh or logout on 401 errors
api.interceptors.response.use(
  (response) => {
    console.log(`[Auth API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      hasData: !!response.data
    });
    return response;
  },
  async (error) => {
    console.error("[Auth API Error]", {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    if (error.response?.status === 401) {
      // Clear token and redirect to login if unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Get current user profile
  getCurrentUser: async () => {
    return api.get('/me');
  },

  // Update user profile
  updateProfile: async (userData) => {
    return api.patch('/me', userData);
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
  },

  // Verify email with token
  verifyEmail: async (token) => {
    return api.get(`/verify-email/${token}`);
  },

  // Resend verification email
  resendVerification: async (email) => {
    return api.post('/resend-verification', { email });
  },

  // Send 2FA code for login verification
  sendTwoFactorCode: async (userId) => {
    const response = await api.post('/send-2fa-code', { userId });
    return response.data;
  },

  // Verify 2FA code and complete login
  verifyTwoFactorCode: async (userId, code) => {
    const response = await api.post('/verify-2fa', { userId, code });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export default authService;
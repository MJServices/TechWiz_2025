// Admin Service - API calls for admin functionality
import axios from "axios";

// Base API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// User management API functions
export const userAPI = {
  // Get all users
  getAll: async () => {
    try {
      const response = await api.get("/admin/users");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch users"
      );
    }
  },

  // Update user role
  updateRole: async (id, role) => {
    try {
      const response = await api.patch(`/admin/users/${id}/role`, { role });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update user role"
      );
    }
  },

  // Delete user
  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete user"
      );
    }
  },
};

// Organizer management API functions
export const organizerAPI = {
  // Create new organizer
  create: async (organizerData) => {
    try {
      const response = await api.post("/admin/organizers", organizerData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to create organizer"
      );
    }
  },

  // Get all organizers
  getAll: async () => {
    try {
      const response = await api.get("/admin/organizers");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch organizers"
      );
    }
  },

  // Update organizer
  update: async (id, organizerData) => {
    try {
      const response = await api.patch(`/admin/organizers/${id}`, organizerData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update organizer"
      );
    }
  },

  // Delete organizer
  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/organizers/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete organizer"
      );
    }
  },
};

// 2FA Service - API calls for two-factor authentication
export const twoFactorAPI = {
  // Get 2FA status
  getStatus: async () => {
    try {
      const response = await api.get('/2fa/status');
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to get 2FA status'
      );
    }
  },

  // Enable 2FA
  enable: async () => {
    try {
      const response = await api.post('/2fa/enable');
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to enable 2FA'
      );
    }
  },

  // Disable 2FA
  disable: async (verificationCode) => {
    try {
      const response = await api.post('/2fa/disable', { verificationCode });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to disable 2FA'
      );
    }
  },

  // Send verification code
  sendCode: async () => {
    try {
      const response = await api.post('/2fa/send-code');
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to send verification code'
      );
    }
  },

  // Verify code
  verifyCode: async (code) => {
    try {
      const response = await api.post('/2fa/verify-code', { code });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to verify code'
      );
    }
  },

  // Verify backup code
  verifyBackupCode: async (backupCode) => {
    try {
      const response = await api.post('/2fa/verify-backup', { backupCode });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to verify backup code'
      );
    }
  },

  // Regenerate backup codes
  regenerateBackupCodes: async () => {
    try {
      const response = await api.post('/2fa/regenerate-backup');
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to regenerate backup codes'
      );
    }
  },
};

// Announcement Service - API calls for announcements
export const announcementAPI = {
  // Get all announcements
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/announcements', { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch announcements'
      );
    }
  },

  // Get active announcements
  getActive: async () => {
    try {
      const response = await api.get('/announcements/active');
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch active announcements'
      );
    }
  },

  // Create announcement
  create: async (announcementData) => {
    try {
      const response = await api.post('/announcements', announcementData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to create announcement'
      );
    }
  },

  // Update announcement
  update: async (id, announcementData) => {
    try {
      const response = await api.patch(`/announcements/${id}`, announcementData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to update announcement'
      );
    }
  },

  // Delete announcement
  delete: async (id) => {
    try {
      const response = await api.delete(`/announcements/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete announcement'
      );
    }
  },

  // Toggle announcement status
  toggleStatus: async (id) => {
    try {
      const response = await api.patch(`/announcements/${id}/toggle-status`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to toggle announcement status'
      );
    }
  },
};

// Export Service - API calls for data export
export const exportAPI = {
  // Export users to PDF
  exportUsersToPDF: async (params = {}) => {
    try {
      const response = await api.get('/export/users/pdf', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to export users to PDF'
      );
    }
  },

  // Export users to Excel
  exportUsersToExcel: async (params = {}) => {
    try {
      const response = await api.get('/export/users/excel', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to export users to Excel'
      );
    }
  },

  // Export events to PDF
  exportEventsToPDF: async (params = {}) => {
    try {
      const response = await api.get('/export/events/pdf', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to export events to PDF'
      );
    }
  },

  // Export events to Excel
  exportEventsToExcel: async (params = {}) => {
    try {
      const response = await api.get('/export/events/excel', {
        params,
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to export events to Excel'
      );
    }
  },
};

// Enhanced User Management API
export const userManagementAPI = {
  // Get all users with pagination and filtering
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch users'
      );
    }
  },

  // Update user role
  updateRole: async (id, role) => {
    try {
      const response = await api.patch(`/admin/users/${id}/role`, { role });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to update user role'
      );
    }
  },

  // Block/unblock user
  toggleBlock: async (id) => {
    try {
      const response = await api.patch(`/admin/users/${id}/block`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to toggle user block status'
      );
    }
  },

  // Delete user
  delete: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete user'
      );
    }
  },

  // Upgrade user to organizer
  upgradeToOrganizer: async (id) => {
    try {
      const response = await api.patch(`/admin/users/${id}/upgrade`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to upgrade user to organizer'
      );
    }
  },
};

// Dashboard Stats Service - API calls for dashboard statistics
export const statsAPI = {
  // Get admin dashboard stats
  getAdminStats: async () => {
    try {
      const response = await api.get('/stats/admin');
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch admin stats'
      );
    }
  },

  // Get organizer dashboard stats
  getOrganizerStats: async () => {
    try {
      const response = await api.get('/stats/organizer');
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch organizer stats'
      );
    }
  },

  // Get participant dashboard stats
  getParticipantStats: async () => {
    try {
      const response = await api.get('/stats/participant');
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch participant stats'
      );
    }
  },
};


// Export default api instance
export default api;
// Event Service - API calls for events, gallery, and related functionality
import axios from "axios";

// Base API configuration
const API_BASE_URL = "http://localhost:5000/api";

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
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, {
      hasToken: !!token,
      headers: config.headers
    });
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      dataKeys: Object.keys(response.data || {}),
      hasData: !!response.data
    });
    return response;
  },
  (error) => {
    console.error("[API Error]", {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      hasToken: !!localStorage.getItem("token")
    });
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Event-related API functions
export const eventsAPI = {
  // Get all events
  getAll: async (params = {}) => {
    try {
      const response = await api.get("/events", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch events"
      );
    }
  },

  // Get event by ID
  getById: async (id) => {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch event");
    }
  },

  // Create new event
  create: async (eventData) => {
    try {
      const response = await api.post("/events", eventData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to create event"
      );
    }
  },

  // Update event
  update: async (id, eventData) => {
    try {
      const response = await api.patch(`/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to update event"
      );
    }
  },

  // Cancel event
  cancel: async (id) => {
    try {
      const response = await api.post(`/events/${id}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to cancel event"
      );
    }
  },

  // Approve event
  approve: async (id) => {
    try {
      const response = await api.patch(`/events/${id}/approve`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to approve event"
      );
    }
  },

  // Reject event
  reject: async (id) => {
    try {
      const response = await api.patch(`/events/${id}/reject`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to reject event"
      );
    }
  },

  // Get available seats for event
  getSeats: async (id) => {
    try {
      const response = await api.get(`/events/${id}/seats`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch seats");
    }
  },

  // Get metrics for event
  getMetrics: async (id) => {
    try {
      const response = await api.get(`/events/${id}/metrics`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch metrics");
    }
  },

  // Register for event
  register: async (eventId, registrationData) => {
    try {
      const response = await api.post(
        "/registrations",
        { eventId, ...registrationData }
      );
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to register for event"
      );
    }
  },

  // Get user's event registrations
  getRegistrations: async () => {
    try {
      const response = await api.get("/registrations/me");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch registrations"
      );
    }
  },

  // Approve registration
  approveRegistration: async (id) => {
    try {
      const response = await api.patch(`/registrations/${id}/approve`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to approve registration"
      );
    }
  },

  // Reject registration
  rejectRegistration: async (id) => {
    try {
      const response = await api.patch(`/registrations/${id}/reject`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to reject registration"
      );
    }
  },

  // Get registrations for event
  getRegistrationsForEvent: async (eventId) => {
    try {
      const response = await api.get(`/registrations/event/${eventId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch registrations for event"
      );
    }
  },

  // Cancel registration
  cancelRegistration: async (registrationId) => {
    try {
      const response = await api.patch(`/registrations/${registrationId}/cancel`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to cancel registration"
      );
    }
  },

  // Download ticket for registration
  downloadTicket: async (registrationId) => {
    try {
      const response = await api.get(`/registrations/${registrationId}/ticket`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to download ticket"
      );
    }
  },

  // Get count of user's approved registrations
  getApprovedRegistrationsCount: async () => {
    try {
      const response = await api.get("/registrations/me");
      const registrations = response.data.registrations || [];
      const approvedCount = registrations.filter(reg => reg.status === 'approved').length;
      return approvedCount;
    } catch (error) {
      throw new Error("Failed to fetch approved registrations count");
    }
  },

  // Mark attendance
  markAttendance: async (eventId, participantId, attended = true) => {
    try {
      const response = await api.post('/attendance', { eventId, participantId, attended });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to mark attendance');
    }
  },

  // Get attendance for event
  getAttendance: async (eventId) => {
    try {
      const response = await api.get(`/attendance/event/${eventId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch attendance');
    }
  },
};

// Gallery-related API functions
export const galleryAPI = {
  // Get all gallery items
  getAll: async (params = {}) => {
    try {
      const response = await api.get("/media/gallery", { params });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch gallery items"
      );
    }
  },

  // Get gallery items for event
  getByEvent: async (eventId) => {
    try {
      const response = await api.get(`/media/event/${eventId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch event gallery"
      );
    }
  },

  // Upload new gallery item
  upload: async (formData) => {
    try {
      const response = await api.post("/media", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to upload gallery item"
      );
    }
  },

  // Note: Update, delete, like, comments not implemented in backend
  // update: not available
  // delete: not available
  // toggleLike: not available
  // addComment: not available
  // getComments: not available
};

// Feedback-related API functions
export const feedbackAPI = {
  // Submit feedback
   submit: async (feedbackData) => {
     try {
       const response = await api.post("/feedback/submit", feedbackData);
       return response.data;
     } catch (error) {
       throw new Error(
         error.response?.data?.message || "Failed to submit feedback"
       );
     }
   },

  // Get feedback for event
  getByEvent: async (eventId) => {
    try {
      const response = await api.get(`/feedback/event/${eventId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch event feedback"
      );
    }
  },

  // Upload feedback attachment
  uploadAttachment: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post("/media", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.media.fileUrl;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to upload attachment"
      );
    }
  },
};

// Saved designs API functions - Dummy implementation for testing
export const savesAPI = {
  list: async () => {
    try {
      // Dummy response for testing
      return {
        data: {
          success: true,
          data: {
            items: [],
            pagination: { total_pages: 1, current_page: 1 }
          }
        }
      };
    } catch (error) {
      throw new Error("Failed to fetch saved designs");
    }
  },

  toggle: async () => {
    try {
      // Dummy response for testing
      return {
        data: {
          success: true,
          data: { saved: true }
        }
      };
    } catch (error) {
      throw new Error("Failed to toggle save");
    }
  }
};

// Statistics API functions - Not implemented in backend
// export const statsAPI = { ... };

// Consultation API functions - Not implemented in backend
// export const consultationsAPI = { ... };

// User profile API functions - Not implemented in backend
// export const profileAPI = { ... };

// Notification API functions - Not implemented in backend
// export const notificationsAPI = { ... };

// Search API functions - Not implemented in backend
// export const searchAPI = { ... };

// Export default api instance
export default api;

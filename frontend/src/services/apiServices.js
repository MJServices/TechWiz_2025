// API Services - Centralized service exports for consistent API access
import api, { eventsAPI, galleryAPI, savesAPI } from './eventService.js';

// Bookmark Service - Wrapper for bookmark-related API calls
export const bookmarkService = {
  // Event bookmarks
  addEventBookmark: async (eventId) => {
    try {
      const response = await api.post(`/bookmarks/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to bookmark event");
    }
  },

  removeEventBookmark: async (eventId) => {
    try {
      const response = await api.delete(`/bookmarks/events/${eventId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to remove event bookmark");
    }
  },

  checkEventBookmark: async (eventId) => {
    try {
      const response = await api.get(`/bookmarks/events/${eventId}/check`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to check event bookmark status");
    }
  },

  getBookmarkedEvents: async (params = {}) => {
    try {
      const response = await api.get('/bookmarks/events', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch bookmarked events");
    }
  },

  // Media bookmarks
  addMediaBookmark: async (mediaId) => {
    try {
      const response = await api.post(`/bookmarks/media/${mediaId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to bookmark media");
    }
  },

  removeMediaBookmark: async (mediaId) => {
    try {
      const response = await api.delete(`/bookmarks/media/${mediaId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to remove media bookmark");
    }
  },

  checkMediaBookmark: async (mediaId) => {
    try {
      const response = await api.get(`/bookmarks/media/${mediaId}/check`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to check media bookmark status");
    }
  },

  getBookmarkedMedia: async (params = {}) => {
    try {
      const response = await api.get('/bookmarks/media', { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch bookmarked media");
    }
  },

  // Bookmark statistics
  getBookmarkStats: async () => {
    try {
      const response = await api.get('/bookmarks/stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch bookmark stats");
    }
  },
};

// Media Service - Wrapper for media-related API calls
export const mediaService = {
  // Get all gallery items
  getGallery: async (params = {}) => {
    try {
      const response = await api.get("/media/gallery", { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch gallery items");
    }
  },

  // Get gallery items for specific user
  getUserGallery: async (userId) => {
    try {
      const response = await api.get(`/media/gallery/user/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch user gallery");
    }
  },

  // Upload new media
  uploadMedia: async (formData) => {
    try {
      const response = await api.post("/media", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to upload media");
    }
  },

  // Update media item
  updateMedia: async (id, data) => {
    try {
      const response = await api.put(`/media/${id}`, data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to update media");
    }
  },

  // Delete media item
  deleteMedia: async (id) => {
    try {
      const response = await api.delete(`/media/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete media");
    }
  },

  // Like/unlike media item
  toggleLike: async (id) => {
    try {
      const response = await api.post(`/media/${id}/like`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to toggle like");
    }
  },

  // Get saved designs
  getSavedDesigns: async (params = {}) => {
    try {
      const response = await bookmarkService.getBookmarkedMedia(params);
      return response;
    } catch (error) {
      throw new Error("Failed to fetch saved designs");
    }
  },

  // Toggle save/unsave design
  toggleSave: async (id) => {
    try {
      // First check if it's already bookmarked
      const checkResponse = await bookmarkService.checkMediaBookmark(id);
      if (checkResponse.isBookmarked) {
        await bookmarkService.removeMediaBookmark(id);
        return { data: { saved: false } };
      } else {
        await bookmarkService.addMediaBookmark(id);
        return { data: { saved: true } };
      }
    } catch (error) {
      throw new Error("Failed to toggle save");
    }
  },
};

// Event Service - Wrapper for event-related API calls
export const eventService = {
  // Get event by ID
  getEventById: (id) => eventsAPI.getById(id),

  // Create new event
  createEvent: (eventData) => eventsAPI.create(eventData),

  // Update event
  updateEvent: (id, eventData) => eventsAPI.update(id, eventData),

  // Cancel event
  cancelEvent: (id) => eventsAPI.cancel(id),

  // Approve event
  approveEvent: (id) => eventsAPI.approve(id),

  // Reject event
  rejectEvent: (id) => eventsAPI.reject(id),

  // Get all events
  getAllEvents: (params) => eventsAPI.getAll(params),

  // Get event seats
  getEventSeats: (id) => eventsAPI.getSeats(id),
};

// Registration Service - Wrapper for registration-related API calls
export const registrationService = {
  // Register for event
  registerForEvent: (eventId, registrationData = {}) => eventsAPI.register(eventId, registrationData),

  // Get user's registrations
  getUserRegistrations: () => eventsAPI.getRegistrations(),

  // Cancel registration
  cancelRegistration: (registrationId) => eventsAPI.cancelRegistration(registrationId),

  // Approve registration
  approveRegistration: (id) => eventsAPI.approveRegistration(id),

  // Reject registration
  rejectRegistration: (id) => eventsAPI.rejectRegistration(id),

  // Get registrations for event
  getRegistrationsForEvent: (eventId) => eventsAPI.getRegistrationsForEvent(eventId),

  // Download ticket
  downloadTicket: (registrationId) => eventsAPI.downloadTicket(registrationId),

  // Get approved registrations count
  getApprovedRegistrationsCount: () => eventsAPI.getApprovedRegistrationsCount(),
};

// Contact Service - Wrapper for contact-related API calls
export const contactService = {
  // Submit contact form
  contactSubmit: async (contactData) => {
    try {
      const response = await api.post("/contact/submit", contactData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to send message");
    }
  },
};

// Certificate Service - Wrapper for certificate-related API calls
export const certificateService = {
  // Request certificate for an event (organizer issuing to participant)
  requestCertificate: async (formData) => {
    try {
      const response = await api.post("/certificates/issue", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to issue certificate");
    }
  },

  // Get attended events for certificate request
  getAttendedEvents: async () => {
    try {
      const response = await api.get("/certificates/attended-events");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch attended events");
    }
  },

  // Get user's certificates
  getMyCertificates: async () => {
    try {
      const response = await api.get("/certificates/me");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch certificates");
    }
  },
};

// Notification Service - Wrapper for notification-related API calls
export const notificationService = {
  // Get user's notifications
  getNotifications: async (params = {}) => {
    try {
      const response = await api.get("/notifications", { params });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch notifications");
    }
  },

  // Get notification statistics
  getNotificationStats: async () => {
    try {
      const response = await api.get("/notifications/stats");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch notification stats");
    }
  },

  // Get specific notification
  getNotification: async (id) => {
    try {
      const response = await api.get(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch notification");
    }
  },

  // Mark notification as read
  markAsRead: async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to mark notification as read");
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await api.patch("/notifications/read-all");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to mark all notifications as read");
    }
  },

  // Delete notification
  deleteNotification: async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete notification");
    }
  },

  // Delete all read notifications
  deleteReadNotifications: async () => {
    try {
      const response = await api.delete("/notifications/read-all");
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to delete read notifications");
    }
  },

  // Create test notification (development only)
  createTestNotification: async (data) => {
    try {
      const response = await api.post("/notifications/test", data);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to create test notification");
    }
  },
};

// Stats Service - Wrapper for stats-related API calls
export const statsService = {
  // Get public homepage stats
  getPublicStats: async () => {
    try {
      const response = await api.get('/stats/public');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch public stats");
    }
  },

  // Get participant dashboard stats
  getParticipantStats: async () => {
    try {
      const response = await api.get('/stats/participant');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch participant stats");
    }
  },

  // Get organizer dashboard stats
  getOrganizerStats: async () => {
    try {
      const response = await api.get('/stats/organizer');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch organizer stats");
    }
  },

  // Get admin dashboard stats
  getAdminStats: async () => {
    try {
      const response = await api.get('/stats/admin');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Failed to fetch admin stats");
    }
  },
};
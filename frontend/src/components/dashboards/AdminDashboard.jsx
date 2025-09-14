import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  organizerAPI,
  twoFactorAPI,
  announcementAPI,
  exportAPI,
  userManagementAPI
} from '../../services/adminService';
import { statsAPI } from '../../services/adminService';
import { eventsAPI } from '../../services/eventService';
import { registrationService } from '../../services/apiServices';
import { toast } from 'react-hot-toast';
import EventStatusBadge from '../EventStatusBadge';
import { calculateEventStatus } from '../../utils/eventUtils';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useForm, Controller } from 'react-hook-form';

// Custom Quill styles
const customQuillStyles = `
  .custom-quill .ql-toolbar {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-bottom: none;
    border-radius: 12px 12px 0 0;
    backdrop-filter: blur(16px);
  }

  .custom-quill .ql-toolbar .ql-stroke {
    stroke: #d1d5db;
  }

  .custom-quill .ql-toolbar .ql-fill {
    fill: #d1d5db;
  }

  .custom-quill .ql-toolbar button:hover {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 6px;
  }

  .custom-quill .ql-toolbar button.ql-active {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }

  .custom-quill .ql-container {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-top: none;
    border-radius: 0 0 12px 12px;
    min-height: 120px;
  }

  .custom-quill .ql-editor {
    color: white;
    font-size: 14px;
    line-height: 1.6;
  }

  .custom-quill .ql-editor.ql-blank::before {
    color: #9ca3af;
    font-style: normal;
  }

  .custom-quill .ql-editor:focus {
    outline: none;
  }

  .custom-quill .ql-picker-label {
    color: #d1d5db;
  }

  .custom-quill .ql-picker-options {
    background: rgba(31, 41, 55, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    backdrop-filter: blur(16px);
  }

  .custom-quill .ql-picker-item {
    color: white;
  }

  .custom-quill .ql-picker-item:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

// Inject custom styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customQuillStyles;
  document.head.appendChild(styleSheet);
}

const AdminDashboard = () => {
   const { user, isAuthenticated } = useAuth();
   const navigate = useNavigate();

   // Debug logging for component renders
   console.log('[DEBUG] AdminDashboard component rendering');
  const [organizers, setOrganizers] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOrganizer, setEditingOrganizer] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    mobile: '',
    department: '',
    enrollmentNo: ''
  });

  // 2FA State
  const [twoFactorStatus, setTwoFactorStatus] = useState(null);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);

  // User Management State
  const [users, setUsers] = useState([]);
  const [userFilters, setUserFilters] = useState({
    role: '',
    department: '',
    search: ''
  });
  const [userSort, setUserSort] = useState({ field: 'createdAt', direction: 'desc' });
  const [userPagination, setUserPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingOrganizers, setLoadingOrganizers] = useState(false);
  const [loadingPendingEvents, setLoadingPendingEvents] = useState(false);
  const [loadingPendingRegistrations, setLoadingPendingRegistrations] = useState(false);
  const [approvingRegistration, setApprovingRegistration] = useState(null);
  const [rejectingRegistration, setRejectingRegistration] = useState(null);
  const [approvingEvent, setApprovingEvent] = useState(null);
  const [rejectingEvent, setRejectingEvent] = useState(null);

  // Admin Stats State
  const [adminStats, setAdminStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Organizers State
  const [organizerSort, setOrganizerSort] = useState({ field: 'fullName', direction: 'asc' });

  // Pending Events State
  const [pendingEventsSort, setPendingEventsSort] = useState({ field: 'title', direction: 'asc' });

  // Pending Registrations State
  const [pendingRegistrationsSort, setPendingRegistrationsSort] = useState({ field: 'eventTitle', direction: 'asc' });

  // Search State
  const [organizerSearch, setOrganizerSearch] = useState('');
  const [pendingEventsSearch, setPendingEventsSearch] = useState('');
  const [pendingRegistrationsSearch, setPendingRegistrationsSearch] = useState('');

  // Reset pagination when search changes
  useEffect(() => {
    setOrganizerPagination(prev => ({ ...prev, page: 1 }));
  }, [organizerSearch]);

  useEffect(() => {
    setPendingEventsPagination(prev => ({ ...prev, page: 1 }));
  }, [pendingEventsSearch]);

  useEffect(() => {
    setPendingRegistrationsPagination(prev => ({ ...prev, page: 1 }));
  }, [pendingRegistrationsSearch]);

  // Pagination State
  const [organizerPagination, setOrganizerPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [pendingEventsPagination, setPendingEventsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  const [pendingRegistrationsPagination, setPendingRegistrationsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Announcements State
   const [announcements, setAnnouncements] = useState([]);
   const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
   const [editingAnnouncement, setEditingAnnouncement] = useState(null);
   const [announcementFormData, setAnnouncementFormData] = useState({
     title: '',
     content: '',
     type: 'system',
     targetUsers: [],
     targetRoles: [],
     expiresAt: '',
     priority: 3,
     eventId: ''
   });

   // React Hook Form for announcement form
   const {
     control,
     handleSubmit,
     reset,
     formState: { errors, isSubmitting },
     setValue,
     watch
   } = useForm({
     defaultValues: {
       title: '',
       content: '',
       type: 'system',
       targetUsers: [],
       targetRoles: [],
       expiresAt: '',
       priority: 3,
       eventId: ''
     }
   });

   // Quill modules configuration
   const quillModules = {
     toolbar: [
       [{ 'header': [1, 2, 3, false] }],
       ['bold', 'italic', 'underline', 'strike'],
       [{ 'list': 'ordered'}, { 'list': 'bullet' }],
       [{ 'color': [] }, { 'background': [] }],
       ['link'],
       ['clean']
     ],
   };

   const quillFormats = [
     'header', 'bold', 'italic', 'underline', 'strike',
     'list', 'bullet', 'color', 'background', 'link'
   ];

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      navigate('/');
      return;
    }
    fetchOrganizers();
    fetchPendingEvents();
    fetchPendingRegistrations();
    fetchTwoFactorStatus();
    fetchUsers();
    fetchAnnouncements();
    fetchAdminStats();
  }, [isAuthenticated, user, navigate]);

  // Fetch users when filters, sort, or pagination changes
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      fetchUsers();
    }
  }, [userFilters, userSort, userPagination.page, userPagination.limit]);

  // Handle keyboard navigation for modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showTwoFactorSetup) {
          setShowTwoFactorSetup(false);
          setTwoFactorCode('');
          setBackupCodes([]);
        }
        if (showAnnouncementForm) {
          resetAnnouncementForm();
        }
        if (showAddForm) {
          resetForm();
        }
      }
    };

    if (showTwoFactorSetup || showAnnouncementForm || showAddForm) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showTwoFactorSetup, showAnnouncementForm, showAddForm]);

  const fetchOrganizers = async () => {
    try {
      const response = await organizerAPI.getAll();
      setOrganizers(response.organizers || []);
    } catch (error) {
      toast.error('Failed to fetch organizers');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      setLoadingStats(true);
      const response = await statsAPI.getAdminStats();
      setAdminStats(response);
    } catch (error) {
      toast.error('Failed to fetch admin stats');
      console.error(error);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPendingEvents = async () => {
    try {
      const response = await eventsAPI.getAll({ status: 'pending' });
      setPendingEvents(response.events || []);
    } catch (error) {
      toast.error('Failed to fetch pending events');
      console.error(error);
    }
  };

  const fetchPendingRegistrations = async () => {
    console.log('[DEBUG] fetchPendingRegistrations called');
    try {
      const response = await eventsAPI.getAll();
      const allEvents = response.events || [];
      console.log('[DEBUG] fetchPendingRegistrations: Found', allEvents.length, 'events');
      const allPending = [];
      for (const event of allEvents) {
        console.log('[DEBUG] fetchPendingRegistrations: Fetching registrations for event', event._id);
        const regResponse = await registrationService.getRegistrationsForEvent(event._id);
        const pending = regResponse.registrations.filter(reg => reg.status === 'pending');
        console.log('[DEBUG] fetchPendingRegistrations: Found', pending.length, 'pending registrations for event', event._id);
        allPending.push(...pending.map(reg => ({ ...reg, eventTitle: event.title })));
      }
      console.log('[DEBUG] fetchPendingRegistrations: Total pending registrations found:', allPending.length);
      setPendingRegistrations(allPending);
    } catch (error) {
      console.error('Failed to fetch pending registrations', error);
      toast.error('Failed to fetch pending registrations');
    }
  };

  const handleApproveRegistration = async (id) => {
    console.log('[DEBUG] handleApproveRegistration called with id:', id);

    // Input validation
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('[DEBUG] Invalid registration ID provided:', id);
      toast.error('Invalid registration ID');
      return;
    }

    // Prevent multiple simultaneous approvals
    if (approvingRegistration === id) {
      console.log('[DEBUG] Already approving this registration, skipping...');
      return;
    }

    setApprovingRegistration(id);

    try {
      console.log('[DEBUG] Calling registrationService.approveRegistration...');
      const response = await registrationService.approveRegistration(id);
      console.log('[DEBUG] Registration approved successfully, response:', response);

      toast.success('Registration approved successfully');

      console.log('[DEBUG] Calling fetchPendingRegistrations to refresh data...');
      await fetchPendingRegistrations(); // Refresh
      console.log('[DEBUG] fetchPendingRegistrations completed');

    } catch (error) {
      console.error('[DEBUG] Error in handleApproveRegistration:', error);

      // More specific error handling
      let errorMessage = 'Failed to approve registration';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Registration not found';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to approve this registration';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid request data';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setApprovingRegistration(null);
    }
  };

  const handleRejectRegistration = async (id) => {
    console.log('[DEBUG] handleRejectRegistration called with id:', id);

    // Input validation
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('[DEBUG] Invalid registration ID provided:', id);
      toast.error('Invalid registration ID');
      return;
    }

    // Prevent multiple simultaneous rejections
    if (rejectingRegistration === id) {
      console.log('[DEBUG] Already rejecting this registration, skipping...');
      return;
    }

    setRejectingRegistration(id);

    try {
      console.log('[DEBUG] Calling registrationService.rejectRegistration...');
      const response = await registrationService.rejectRegistration(id);
      console.log('[DEBUG] Registration rejected successfully, response:', response);

      toast.success('Registration rejected successfully');

      console.log('[DEBUG] Calling fetchPendingRegistrations to refresh data...');
      await fetchPendingRegistrations(); // Refresh
      console.log('[DEBUG] fetchPendingRegistrations completed');

    } catch (error) {
      console.error('[DEBUG] Error in handleRejectRegistration:', error);

      // More specific error handling
      let errorMessage = 'Failed to reject registration';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Registration not found';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to reject this registration';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid request data';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setRejectingRegistration(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      fullName: '',
      mobile: '',
      department: '',
      enrollmentNo: ''
    });
    setEditingOrganizer(null);
    setShowAddForm(false);
  };

  const handleAddOrganizer = async (e) => {
    e.preventDefault();
    try {
      await organizerAPI.create(formData);
      toast.success('Organizer created successfully');
      resetForm();
      fetchOrganizers();
    } catch (error) {
      toast.error(error.message || 'Failed to create organizer');
    }
  };

  const handleEditOrganizer = (organizer) => {
    setEditingOrganizer(organizer);
    setFormData({
      username: organizer.username,
      email: organizer.email,
      password: '', // Don't populate password
      fullName: organizer.fullName,
      mobile: organizer.mobile || '',
      department: organizer.department,
      enrollmentNo: organizer.enrollmentNo || ''
    });
    setShowAddForm(true);
  };

  const handleUpdateOrganizer = async (e) => {
    e.preventDefault();
    try {
      const updateData = { ...formData };
      delete updateData.password; // Don't update password if empty
      if (!updateData.password) delete updateData.password;

      await organizerAPI.update(editingOrganizer._id, updateData);
      toast.success('Organizer updated successfully');
      resetForm();
      fetchOrganizers();
    } catch (error) {
      toast.error(error.message || 'Failed to update organizer');
    }
  };

  const handleDeleteOrganizer = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organizer?')) return;
    try {
      await organizerAPI.delete(id);
      toast.success('Organizer deleted successfully');
      fetchOrganizers();
    } catch (error) {
      toast.error(error.message || 'Failed to delete organizer');
    }
  };

  const handleApproveEvent = async (id) => {
    console.log('[DEBUG] handleApproveEvent called with id:', id);

    // Input validation
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('[DEBUG] Invalid event ID provided:', id);
      toast.error('Invalid event ID');
      return;
    }

    // Prevent multiple simultaneous approvals
    if (approvingEvent === id) {
      console.log('[DEBUG] Already approving this event, skipping...');
      return;
    }

    if (!window.confirm('Are you sure you want to approve this event?')) {
      console.log('[DEBUG] User cancelled event approval');
      return;
    }

    setApprovingEvent(id);

    try {
      console.log('[DEBUG] Calling eventsAPI.approve...');
      const response = await eventsAPI.approve(id);
      console.log('[DEBUG] Event approved successfully, response:', response);

      toast.success('Event approved successfully');

      console.log('[DEBUG] Calling fetchPendingEvents to refresh data...');
      await fetchPendingEvents();
      console.log('[DEBUG] fetchPendingEvents completed');

    } catch (error) {
      console.error('[DEBUG] Error in handleApproveEvent:', error);

      // More specific error handling
      let errorMessage = 'Failed to approve event';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Event not found';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to approve this event';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid request data';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setApprovingEvent(null);
    }
  };

  const handleRejectEvent = async (id) => {
    console.log('[DEBUG] handleRejectEvent called with id:', id);

    // Input validation
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('[DEBUG] Invalid event ID provided:', id);
      toast.error('Invalid event ID');
      return;
    }

    // Prevent multiple simultaneous rejections
    if (rejectingEvent === id) {
      console.log('[DEBUG] Already rejecting this event, skipping...');
      return;
    }

    if (!window.confirm('Are you sure you want to reject this event?')) {
      console.log('[DEBUG] User cancelled event rejection');
      return;
    }

    setRejectingEvent(id);

    try {
      console.log('[DEBUG] Calling eventsAPI.reject...');
      const response = await eventsAPI.reject(id);
      console.log('[DEBUG] Event rejected successfully, response:', response);

      toast.success('Event rejected successfully');

      console.log('[DEBUG] Calling fetchPendingEvents to refresh data...');
      await fetchPendingEvents();
      console.log('[DEBUG] fetchPendingEvents completed');

    } catch (error) {
      console.error('[DEBUG] Error in handleRejectEvent:', error);

      // More specific error handling
      let errorMessage = 'Failed to reject event';
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Event not found';
        } else if (error.response.status === 403) {
          errorMessage = 'You do not have permission to reject this event';
        } else if (error.response.status === 400) {
          errorMessage = 'Invalid request data';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setRejectingEvent(null);
    }
  };

  // 2FA Functions
  const fetchTwoFactorStatus = async () => {
    try {
      const response = await twoFactorAPI.getStatus();
      setTwoFactorStatus(response);
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
    }
  };

  const handleEnableTwoFactor = async () => {
    try {
      const response = await twoFactorAPI.enable();
      setBackupCodes(response.backupCodes);
      setTwoFactorStatus({ ...twoFactorStatus, enabled: true });
      toast.success('2FA enabled successfully! Save your backup codes securely.');
    } catch (error) {
      toast.error(error.message || 'Failed to enable 2FA');
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!twoFactorCode) {
      toast.error('Please enter verification code');
      return;
    }
    try {
      await twoFactorAPI.disable(twoFactorCode);
      setTwoFactorStatus({ ...twoFactorStatus, enabled: false });
      setTwoFactorCode('');
      toast.success('2FA disabled successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to disable 2FA');
    }
  };

  const handleSendTwoFactorCode = async () => {
    try {
      await twoFactorAPI.sendCode();
      toast.success('Verification code sent to your email');
    } catch (error) {
      toast.error(error.message || 'Failed to send verification code');
    }
  };

  // User Management Functions
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const params = {
        page: userPagination.page,
        limit: userPagination.limit,
        sort: `${userSort.field}:${userSort.direction}`,
        ...userFilters
      };
      const response = await userManagementAPI.getAll(params);
      setUsers(response.users || []);
      setUserPagination(prev => ({
        ...prev,
        total: response.total || 0,
        pages: response.pages || 0
      }));
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error(error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserSort = (field) => {
    const direction = userSort.field === field && userSort.direction === 'asc' ? 'desc' : 'asc';
    setUserSort({ field, direction });
  };

  const handleOrganizerSort = (field) => {
    const direction = organizerSort.field === field && organizerSort.direction === 'asc' ? 'desc' : 'asc';
    setOrganizerSort({ field, direction });
  };

  const handlePendingEventsSort = (field) => {
    const direction = pendingEventsSort.field === field && pendingEventsSort.direction === 'asc' ? 'desc' : 'asc';
    setPendingEventsSort({ field, direction });
  };

  const handlePendingRegistrationsSort = (field) => {
    const direction = pendingRegistrationsSort.field === field && pendingRegistrationsSort.direction === 'asc' ? 'desc' : 'asc';
    setPendingRegistrationsSort({ field, direction });
  };

  // Helper functions for sorting, filtering, and pagination
  const getFilteredSortedOrganizers = useMemo(() => {
    let filtered = [...organizers];

    // Apply search filter
    if (organizerSearch) {
      filtered = filtered.filter(organizer =>
        organizer.fullName.toLowerCase().includes(organizerSearch.toLowerCase()) ||
        organizer.email.toLowerCase().includes(organizerSearch.toLowerCase()) ||
        organizer.username.toLowerCase().includes(organizerSearch.toLowerCase()) ||
        (organizer.department && organizer.department.toLowerCase().includes(organizerSearch.toLowerCase()))
      );
    }

    // Apply sorting
    const sorted = filtered.sort((a, b) => {
      const aValue = a[organizerSort.field];
      const bValue = b[organizerSort.field];

      if (organizerSort.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [organizers, organizerSearch, organizerSort]);

  // Update pagination info when filtered data changes
  useEffect(() => {
    const total = getFilteredSortedOrganizers.length;
    const pages = Math.ceil(total / organizerPagination.limit);
    setOrganizerPagination(prev => ({ ...prev, total, pages }));
  }, [getFilteredSortedOrganizers.length, organizerPagination.limit]);

  // Get paginated organizers
  const getPaginatedOrganizers = useMemo(() => {
    const startIndex = (organizerPagination.page - 1) * organizerPagination.limit;
    const endIndex = startIndex + organizerPagination.limit;
    return getFilteredSortedOrganizers.slice(startIndex, endIndex);
  }, [getFilteredSortedOrganizers, organizerPagination.page, organizerPagination.limit]);

  const getFilteredSortedPendingEvents = useMemo(() => {
    let filtered = [...pendingEvents];

    // Apply search filter
    if (pendingEventsSearch) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(pendingEventsSearch.toLowerCase()) ||
        (event.organizer?.fullName && event.organizer.fullName.toLowerCase().includes(pendingEventsSearch.toLowerCase())) ||
        (event.description && event.description.toLowerCase().includes(pendingEventsSearch.toLowerCase()))
      );
    }

    // Apply sorting
    const sorted = filtered.sort((a, b) => {
      let aValue, bValue;

      switch (pendingEventsSort.field) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'organizer':
          aValue = a.organizer?.fullName || '';
          bValue = b.organizer?.fullName || '';
          break;
        case 'date':
          aValue = new Date(a.date || 0);
          bValue = new Date(b.date || 0);
          break;
        default:
          aValue = a[pendingEventsSort.field];
          bValue = b[pendingEventsSort.field];
      }

      if (pendingEventsSort.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [pendingEvents, pendingEventsSearch, pendingEventsSort]);

  // Update pagination info when filtered data changes
  useEffect(() => {
    const total = getFilteredSortedPendingEvents.length;
    const pages = Math.ceil(total / pendingEventsPagination.limit);
    setPendingEventsPagination(prev => ({ ...prev, total, pages }));
  }, [getFilteredSortedPendingEvents.length, pendingEventsPagination.limit]);

  // Get paginated pending events
  const getPaginatedPendingEvents = useMemo(() => {
    const startIndex = (pendingEventsPagination.page - 1) * pendingEventsPagination.limit;
    const endIndex = startIndex + pendingEventsPagination.limit;
    return getFilteredSortedPendingEvents.slice(startIndex, endIndex);
  }, [getFilteredSortedPendingEvents, pendingEventsPagination.page, pendingEventsPagination.limit]);

  const getFilteredSortedPendingRegistrations = useMemo(() => {
    let filtered = [...pendingRegistrations];

    // Apply search filter
    if (pendingRegistrationsSearch) {
      filtered = filtered.filter(reg =>
        reg.eventTitle.toLowerCase().includes(pendingRegistrationsSearch.toLowerCase()) ||
        reg.participant.username.toLowerCase().includes(pendingRegistrationsSearch.toLowerCase()) ||
        reg.participant.email.toLowerCase().includes(pendingRegistrationsSearch.toLowerCase()) ||
        reg.participant.fullName.toLowerCase().includes(pendingRegistrationsSearch.toLowerCase())
      );
    }

    // Apply sorting
    const sorted = filtered.sort((a, b) => {
      let aValue, bValue;

      switch (pendingRegistrationsSort.field) {
        case 'eventTitle':
          aValue = a.eventTitle;
          bValue = b.eventTitle;
          break;
        case 'participant':
          aValue = a.participant.username;
          bValue = b.participant.username;
          break;
        case 'registeredOn':
          aValue = new Date(a.registeredOn);
          bValue = new Date(b.registeredOn);
          break;
        default:
          aValue = a[pendingRegistrationsSort.field];
          bValue = b[pendingRegistrationsSort.field];
      }

      if (pendingRegistrationsSort.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [pendingRegistrations, pendingRegistrationsSearch, pendingRegistrationsSort]);

  // Update pagination info when filtered data changes
  useEffect(() => {
    const total = getFilteredSortedPendingRegistrations.length;
    const pages = Math.ceil(total / pendingRegistrationsPagination.limit);
    setPendingRegistrationsPagination(prev => ({ ...prev, total, pages }));
  }, [getFilteredSortedPendingRegistrations.length, pendingRegistrationsPagination.limit]);

  // Get paginated pending registrations
  const getPaginatedPendingRegistrations = useMemo(() => {
    const startIndex = (pendingRegistrationsPagination.page - 1) * pendingRegistrationsPagination.limit;
    const endIndex = startIndex + pendingRegistrationsPagination.limit;
    return getFilteredSortedPendingRegistrations.slice(startIndex, endIndex);
  }, [getFilteredSortedPendingRegistrations, pendingRegistrationsPagination.page, pendingRegistrationsPagination.limit]);

  const handleUserFilterChange = (field, value) => {
    setUserFilters(prev => ({ ...prev, [field]: value }));
    setUserPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleUserPageChange = (page) => {
    setUserPagination(prev => ({ ...prev, page }));
  };

  const handleOrganizerPageChange = (page) => {
    setOrganizerPagination(prev => ({ ...prev, page }));
  };

  const handlePendingEventsPageChange = (page) => {
    setPendingEventsPagination(prev => ({ ...prev, page }));
  };

  const handlePendingRegistrationsPageChange = (page) => {
    setPendingRegistrationsPagination(prev => ({ ...prev, page }));
  };

  const handleUpdateUserRole = async (id, role) => {
    try {
      await userManagementAPI.updateRole(id, role);
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to update user role');
    }
  };

  const handleToggleUserBlock = async (id) => {
    try {
      await userManagementAPI.toggleBlock(id);
      toast.success('User block status updated');
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to update user block status');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await userManagementAPI.delete(id);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleUpgradeToOrganizer = async (id) => {
    if (!window.confirm('Are you sure you want to upgrade this user to organizer?')) return;
    try {
      await userManagementAPI.upgradeToOrganizer(id);
      toast.success('User upgraded to organizer successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to upgrade user');
    }
  };

  // Export State
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [exportingUsers, setExportingUsers] = useState(false);
  const [exportingEvents, setExportingEvents] = useState(false);

  // Announcement Functions
  const fetchAnnouncements = async () => {
    try {
      const response = await announcementAPI.getAll();
      setAnnouncements(response.announcements || []);
    } catch (error) {
      toast.error('Failed to fetch announcements');
      console.error(error);
    }
  };

  const handleAnnouncementSubmit = async (data) => {
    try {
      const formData = {
        ...data,
        expiresAt: data.expiresAt || undefined,
        priority: parseInt(data.priority),
        targetUsers: data.targetUsers || [],
        targetRoles: data.targetRoles || []
      };

      if (editingAnnouncement) {
        await announcementAPI.update(editingAnnouncement._id, formData);
        toast.success('Announcement updated successfully');
      } else {
        await announcementAPI.create(formData);
        toast.success('Announcement created successfully');
      }
      resetAnnouncementForm();
      fetchAnnouncements();
    } catch (error) {
      toast.error(error.message || 'Failed to save announcement');
    }
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    reset({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      targetUsers: announcement.targetUsers || [],
      targetRoles: announcement.targetRoles || [],
      expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 16) : '',
      priority: announcement.priority,
      eventId: announcement.eventId || ''
    });
    setShowAnnouncementForm(true);
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await announcementAPI.delete(id);
      toast.success('Announcement deleted successfully');
      fetchAnnouncements();
    } catch (error) {
      toast.error(error.message || 'Failed to delete announcement');
    }
  };

  const handleToggleAnnouncementStatus = async (id) => {
    try {
      await announcementAPI.toggleStatus(id);
      toast.success('Announcement status updated');
      fetchAnnouncements();
    } catch (error) {
      toast.error(error.message || 'Failed to update announcement status');
    }
  };

  const resetAnnouncementForm = () => {
    reset({
      title: '',
      content: '',
      type: 'system',
      targetUsers: [],
      targetRoles: [],
      expiresAt: '',
      priority: 3,
      eventId: ''
    });
    setEditingAnnouncement(null);
    setShowAnnouncementForm(false);
  };

  // Enhanced Export Functions
  const handleExportUsers = async (format) => {
    setExportingUsers(true);
    try {
      const params = {
        ...userFilters,
        from: exportDateFrom || undefined,
        to: exportDateTo || undefined
      };

      let blob;
      if (format === 'pdf') {
        blob = await exportAPI.exportUsersToPDF(params);
      } else {
        blob = await exportAPI.exportUsersToExcel(params);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Users ${format.toUpperCase()} exported successfully`, {
        duration: 4000,
        icon: '✅',
        style: {
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#22c55e',
        }
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export users ${format.toUpperCase()}: ${error.message || 'Unknown error'}`, {
        duration: 5000,
        icon: '❌',
        style: {
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
        }
      });
    } finally {
      setExportingUsers(false);
    }
  };

  const handleExportEvents = async (format) => {
    setExportingEvents(true);
    try {
      const params = {
        from: exportDateFrom || undefined,
        to: exportDateTo || undefined
      };

      let blob;
      if (format === 'pdf') {
        blob = await exportAPI.exportEventsToPDF(params);
      } else {
        blob = await exportAPI.exportEventsToExcel(params);
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `events_report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Events ${format.toUpperCase()} exported successfully`, {
        duration: 4000,
        icon: '✅',
        style: {
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#22c55e',
        }
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export events ${format.toUpperCase()}: ${error.message || 'Unknown error'}`, {
        duration: 5000,
        icon: '❌',
        style: {
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
        }
      });
    } finally {
      setExportingEvents(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 text-white">
      {/* Enhanced Glassmorphism Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-purple-500/20 to-purple-600/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse backdrop-blur-xl"></div>
        <div
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-purple-500/15 rounded-full mix-blend-multiply filter blur-3xl animate-pulse backdrop-blur-xl"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-purple-300/10 to-purple-400/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse backdrop-blur-xl"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">Admin Dashboard</h1>
          <p className="text-gray-300">Manage organizers, users, and system settings</p>
        </div>

        {/* 2FA Security Section */}
        <div className="card card-hover mb-8">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">Two-Factor Authentication</h2>
                <p className="text-gray-300 text-sm">Enhanced security for admin accounts</p>
              </div>
              {twoFactorStatus && (
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    twoFactorStatus.enabled
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {twoFactorStatus.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  {twoFactorStatus.isLocked && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                      Locked
                    </span>
                  )}
                </div>
              )}
            </div>

            {twoFactorStatus && (
              <div className="space-y-4">
                {!twoFactorStatus.enabled ? (
                  <div className="flex items-center justify-between">
                    <p className="text-gray-300">Enable 2FA to secure your admin account</p>
                    <button
                      onClick={handleEnableTwoFactor}
                      className="btn btn-primary"
                    >
                      Enable 2FA
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-gray-300">2FA is enabled for your account</p>
                      <button
                        onClick={() => setShowTwoFactorSetup(true)}
                        className="btn btn-danger"
                      >
                        Disable 2FA
                      </button>
                    </div>
                    <div className="text-sm text-gray-400">
                      <p>Last verification: {twoFactorStatus.lastVerification ? new Date(twoFactorStatus.lastVerification).toLocaleString() : 'Never'}</p>
                      <p>Backup codes remaining: {twoFactorStatus.backupCodesCount}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      {/* User Management Section */}
    <div className="card card-hover mb-8" role="region" aria-labelledby="user-management-heading">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 id="user-management-heading" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">User Management</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
              <button
                onClick={() => handleExportUsers('pdf')}
                className="btn btn-danger text-sm w-full sm:w-auto"
              >
                Export PDF
              </button>
              <button
                onClick={() => handleExportUsers('excel')}
                className="btn btn-primary text-sm w-full sm:w-auto"
              >
                Export Excel
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userFilters.search}
                onChange={(e) => handleUserFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none transition-all duration-300"
                aria-label="Search users by name or email"
                role="searchbox"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Role</label>
              <select
                value={userFilters.role}
                onChange={(e) => handleUserFilterChange('role', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:border-blue-400/50 focus:outline-none transition-all duration-300"
              >
                <option value="">All Roles</option>
                <option value="participant">Participant</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Department</label>
              <input
                type="text"
                placeholder="Filter by department..."
                value={userFilters.department}
                onChange={(e) => handleUserFilterChange('department', e.target.value)}
                className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400/50 focus:outline-none transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-bold mb-2">Per Page</label>
              <select
                value={userPagination.limit}
                onChange={(e) => setUserPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:border-blue-400/50 focus:outline-none transition-all duration-300"
              >
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <table className="min-w-full table-auto backdrop-blur-xl bg-white/5 rounded-2xl border border-white/20 shadow-2xl" role="table" aria-label="Users management table">
              <thead className="bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-2xl border-b border-white/20">
                <tr>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50 rounded"
                    onClick={() => handleUserSort('fullName')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleUserSort('fullName');
                      }
                    }}
                    tabIndex={0}
                    aria-sort={userSort.field === 'fullName' ? (userSort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                    aria-label="Sort by name"
                  >
                    Name {userSort.field === 'fullName' && (userSort.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleUserSort('email')}
                  >
                    Email {userSort.field === 'email' && (userSort.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleUserSort('role')}
                  >
                    Role {userSort.field === 'role' && (userSort.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Department
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleUserSort('createdAt')}
                  >
                    Created {userSort.field === 'createdAt' && (userSort.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gradient-to-b from-white/5 to-white/10 divide-y divide-white/20 backdrop-blur-lg">
                {loadingUsers ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {user.fullName}
                        </div>
                        <div className="text-sm text-gray-400">
                          @{user.username}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                        {user.email}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleUpdateUserRole(user._id, e.target.value)}
                          className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg px-2 py-1 text-xs text-white focus:border-blue-400/50 focus:outline-none"
                        >
                          <option value="participant">Participant</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                        {user.department || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleToggleUserBlock(user._id)}
                          className={`px-2 py-1 rounded text-xs transition-colors duration-300 ${
                            user.isBlocked
                              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                              : 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                          }`}
                        >
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                        {user.role === 'participant' && (
                          <button
                            onClick={() => handleUpgradeToOrganizer(user._id)}
                            className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors duration-300"
                          >
                            Upgrade
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors duration-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {userPagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
              <div className="text-sm text-gray-400 text-center sm:text-left">
                Showing {((userPagination.page - 1) * userPagination.limit) + 1} to {Math.min(userPagination.page * userPagination.limit, userPagination.total)} of {userPagination.total} users
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleUserPageChange(userPagination.page - 1)}
                  disabled={userPagination.page === 1}
                  className="px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300 text-sm"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-white text-sm">
                  Page {userPagination.page} of {userPagination.pages}
                </span>
                <button
                  onClick={() => handleUserPageChange(userPagination.page + 1)}
                  disabled={userPagination.page === userPagination.pages}
                  className="px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300 text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Organizers Section */}
      <div className="card card-hover mb-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">Organizers</h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
            >
              Add New Organizer
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-bold mb-2">Search Organizers</label>
            <input
              type="text"
              placeholder="Search by name, email, username, or department..."
              value={organizerSearch}
              onChange={(e) => setOrganizerSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
            />
          </div>

          {/* Organizers List */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto backdrop-blur-xl bg-white/5 rounded-2xl border border-white/20 shadow-2xl">
              <thead className="bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-2xl border-b border-white/20">
                <tr>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleOrganizerSort('fullName')}
                  >
                    Name {organizerSort.field === 'fullName' && (organizerSort.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleOrganizerSort('email')}
                  >
                    Email {organizerSort.field === 'email' && (organizerSort.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handleOrganizerSort('department')}
                  >
                    Department {organizerSort.field === 'department' && (organizerSort.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gradient-to-b from-white/5 to-white/10 divide-y divide-white/20 backdrop-blur-lg">
                {getPaginatedOrganizers.map((organizer) => (
                  <tr key={organizer._id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {organizer.fullName}
                      </div>
                      <div className="text-sm text-gray-400">
                        @{organizer.username}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {organizer.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {organizer.department}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEditOrganizer(organizer)}
                        className="text-purple-400 hover:text-purple-300 mr-4 transition-colors duration-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteOrganizer(organizer._id)}
                        className="text-red-400 hover:text-red-300 transition-colors duration-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {organizers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                      No organizers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {organizerPagination.pages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-400">
                Showing {((organizerPagination.page - 1) * organizerPagination.limit) + 1} to {Math.min(organizerPagination.page * organizerPagination.limit, organizerPagination.total)} of {organizerPagination.total} organizers
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleOrganizerPageChange(organizerPagination.page - 1)}
                  disabled={organizerPagination.page === 1}
                  className="px-3 py-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-white">
                  Page {organizerPagination.page} of {organizerPagination.pages}
                </span>
                <button
                  onClick={() => handleOrganizerPageChange(organizerPagination.page + 1)}
                  disabled={organizerPagination.page === organizerPagination.pages}
                  className="px-3 py-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending Events Section */}
      <div className="card card-hover mb-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">Pending Events</h2>
          </div>

          {/* Search */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-bold mb-2">Search Events</label>
            <input
              type="text"
              placeholder="Search by title, organizer, or description..."
              value={pendingEventsSearch}
              onChange={(e) => setPendingEventsSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-orange-400/50 focus:outline-none transition-all duration-300"
            />
          </div>

          {/* Pending Events List */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto backdrop-blur-xl bg-white/5 rounded-2xl border border-white/20 shadow-2xl">
              <thead className="bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-2xl border-b border-white/20">
                <tr>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handlePendingEventsSort('title')}
                  >
                    Title {pendingEventsSort.field === 'title' && (pendingEventsSort.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handlePendingEventsSort('organizer')}
                  >
                    Organizer {pendingEventsSort.field === 'organizer' && (pendingEventsSort.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handlePendingEventsSort('date')}
                  >
                    Date {pendingEventsSort.field === 'date' && (pendingEventsSort.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gradient-to-b from-white/5 to-white/10 divide-y divide-white/20 backdrop-blur-lg">
                {getPaginatedPendingEvents.map((event) => (
                  <tr key={event._id}>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {event.title}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {event.organizer?.fullName || 'Unknown'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <EventStatusBadge event={event} size="sm" />
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApproveEvent(event._id)}
                        disabled={approvingEvent === event._id}
                        className="text-green-400 hover:text-green-300 mr-4 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {approvingEvent === event._id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectEvent(event._id)}
                        disabled={rejectingEvent === event._id}
                        className="text-red-400 hover:text-red-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {rejectingEvent === event._id ? 'Rejecting...' : 'Reject'}
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingEvents.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                      No pending events
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pendingEventsPagination.pages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-400">
                Showing {((pendingEventsPagination.page - 1) * pendingEventsPagination.limit) + 1} to {Math.min(pendingEventsPagination.page * pendingEventsPagination.limit, pendingEventsPagination.total)} of {pendingEventsPagination.total} events
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePendingEventsPageChange(pendingEventsPagination.page - 1)}
                  disabled={pendingEventsPagination.page === 1}
                  className="px-3 py-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-white">
                  Page {pendingEventsPagination.page} of {pendingEventsPagination.pages}
                </span>
                <button
                  onClick={() => handlePendingEventsPageChange(pendingEventsPagination.page + 1)}
                  disabled={pendingEventsPagination.page === pendingEventsPagination.pages}
                  className="px-3 py-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pending Registrations Section */}
      <div className="card card-hover mb-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent mb-6">Pending Registrations</h2>

          {/* Search */}
          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-bold mb-2">Search Registrations</label>
            <input
              type="text"
              placeholder="Search by event, participant name, username, or email..."
              value={pendingRegistrationsSearch}
              onChange={(e) => setPendingRegistrationsSearch(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-green-400/50 focus:outline-none transition-all duration-300"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full table-auto backdrop-blur-xl bg-white/5 rounded-2xl border border-white/20 shadow-2xl">
              <thead className="bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-2xl border-b border-white/20">
                <tr>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handlePendingRegistrationsSort('eventTitle')}
                  >
                    Event {pendingRegistrationsSort.field === 'eventTitle' && (pendingRegistrationsSort.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handlePendingRegistrationsSort('participant')}
                  >
                    Participant {pendingRegistrationsSort.field === 'participant' && (pendingRegistrationsSort.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                    onClick={() => handlePendingRegistrationsSort('registeredOn')}
                  >
                    Registered On {pendingRegistrationsSort.field === 'registeredOn' && (pendingRegistrationsSort.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gradient-to-b from-white/5 to-white/10 divide-y divide-white/20 backdrop-blur-lg">
                {getPaginatedPendingRegistrations.map((reg) => (
                  <tr key={reg._id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {reg.eventTitle}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {reg.participant.username} ({reg.participant.email})
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white">
                      {new Date(reg.registeredOn).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleApproveRegistration(reg._id)}
                        disabled={approvingRegistration === reg._id}
                        className="text-green-400 hover:text-green-300 mr-4 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {approvingRegistration === reg._id ? 'Approving...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectRegistration(reg._id)}
                        disabled={rejectingRegistration === reg._id}
                        className="text-red-400 hover:text-red-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {rejectingRegistration === reg._id ? 'Rejecting...' : 'Reject'}
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingRegistrations.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-4 py-8 text-center text-gray-400">
                      No pending registrations
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pendingRegistrationsPagination.pages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-400">
                Showing {((pendingRegistrationsPagination.page - 1) * pendingRegistrationsPagination.limit) + 1} to {Math.min(pendingRegistrationsPagination.page * pendingRegistrationsPagination.limit, pendingRegistrationsPagination.total)} of {pendingRegistrationsPagination.total} registrations
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePendingRegistrationsPageChange(pendingRegistrationsPagination.page - 1)}
                  disabled={pendingRegistrationsPagination.page === 1}
                  className="px-3 py-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-white">
                  Page {pendingRegistrationsPagination.page} of {pendingRegistrationsPagination.pages}
                </span>
                <button
                  onClick={() => handlePendingRegistrationsPageChange(pendingRegistrationsPagination.page + 1)}
                  disabled={pendingRegistrationsPagination.page === pendingRegistrationsPagination.pages}
                  className="px-3 py-1 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-all duration-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Announcements Section */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden mb-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">Announcements</h2>
            <button
              onClick={() => setShowAnnouncementForm(true)}
              className="btn btn-primary"
            >
              Create Announcement
            </button>
          </div>

          {/* Enhanced Announcements List */}
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="text-center text-gray-400 py-12">
                <div className="text-6xl mb-4">📢</div>
                <p className="text-lg">No announcements found</p>
                <p className="text-sm text-gray-500 mt-2">Create your first announcement to get started</p>
              </div>
            ) : (
              announcements.map((announcement) => {
                const getPriorityConfig = (priority) => {
                  switch (priority) {
                    case 1: return { color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: '🟢', label: 'Low' };
                    case 2: return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: '🟡', label: 'Medium-Low' };
                    case 3: return { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: '🟠', label: 'Medium' };
                    case 4: return { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: '🟠', label: 'Medium-High' };
                    case 5: return { color: 'bg-red-600/20 text-red-300 border-red-600/30', icon: '🔴', label: 'High' };
                    default: return { color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: '⚪', label: 'Unknown' };
                  }
                };

                const getTypeIcon = (type) => {
                  switch (type) {
                    case 'system': return '🌐';
                    case 'targeted': return '🎯';
                    case 'event': return '🎪';
                    default: return '📢';
                  }
                };

                const priorityConfig = getPriorityConfig(announcement.priority);

                return (
                  <div
                    key={announcement._id}
                    className={`bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                      !announcement.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Header with Priority Badge */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-2xl">{getTypeIcon(announcement.type)}</span>
                          <h3 className="text-xl font-bold text-white">{announcement.title}</h3>
                          <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${priorityConfig.color} flex items-center space-x-1`}>
                            <span>{priorityConfig.icon}</span>
                            <span>{priorityConfig.label}</span>
                          </div>
                        </div>

                        {/* Status and Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-3">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs">📊</span>
                            <span className="capitalize">{announcement.type}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            announcement.isActive
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {announcement.isActive ? '✅ Active' : '⏸️ Inactive'}
                          </div>
                          {announcement.expiresAt && (
                            <div className="flex items-center space-x-1">
                              <span className="text-xs">⏰</span>
                              <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEditAnnouncement(announcement)}
                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-300"
                          title="Edit announcement"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleAnnouncementStatus(announcement._id)}
                          className={`p-2 rounded-lg transition-all duration-300 ${
                            announcement.isActive
                              ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10'
                              : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'
                          }`}
                          title={announcement.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {announcement.isActive ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.586a1 1 0 01.707.293l.707.707A1 1 0 0012.414 11H15m-3 7.5A9.5 9.5 0 1121.5 12 9.5 9.5 0 0112 2.5z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement._id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                          title="Delete announcement"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 border border-white/10 mb-4">
                      <div
                        className="text-gray-300 text-sm line-clamp-3 prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: announcement.content.length > 200
                            ? announcement.content.substring(0, 200) + '...'
                            : announcement.content
                        }}
                      />
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-4">
                        <span>👤 {announcement.createdBy?.username || 'Unknown'}</span>
                        <span>📅 {new Date(announcement.createdAt).toLocaleDateString()}</span>
                        {announcement.eventId && (
                          <span>🎪 Event: {announcement.eventId.title}</span>
                        )}
                      </div>
                      <div className="text-gray-600">
                        ID: {announcement._id.slice(-8)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Data Export Section */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 overflow-hidden mb-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent mb-6">Data Export</h2>

          {/* Export Configuration */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/10 mb-6" role="region" aria-labelledby="export-config-heading">
            <h3 id="export-config-heading" className="text-lg font-semibold text-white mb-4">Export Configuration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Format Selection */}
              <div>
                <label htmlFor="export-format" className="block text-gray-300 text-sm font-bold mb-2">Export Format</label>
                <select
                  id="export-format"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all duration-300"
                  aria-describedby="format-help"
                >
                  <option value="pdf">📄 PDF</option>
                  <option value="excel">📊 Excel</option>
                </select>
                <span id="format-help" className="sr-only">Choose the file format for your export</span>
              </div>

              {/* Date Range From */}
              <div>
                <label htmlFor="export-date-from" className="block text-gray-300 text-sm font-bold mb-2">From Date</label>
                <input
                  id="export-date-from"
                  type="date"
                  value={exportDateFrom}
                  onChange={(e) => setExportDateFrom(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all duration-300"
                  aria-describedby="date-from-help"
                />
                <span id="date-from-help" className="sr-only">Select start date for filtering data (optional)</span>
              </div>

              {/* Date Range To */}
              <div>
                <label htmlFor="export-date-to" className="block text-gray-300 text-sm font-bold mb-2">To Date</label>
                <input
                  id="export-date-to"
                  type="date"
                  value={exportDateTo}
                  onChange={(e) => setExportDateTo(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:border-teal-400/50 focus:outline-none focus:ring-2 focus:ring-teal-400/20 transition-all duration-300"
                  aria-describedby="date-to-help"
                />
                <span id="date-to-help" className="sr-only">Select end date for filtering data (optional)</span>
              </div>
            </div>
          </div>

          {/* Export Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Users & Organizers Export */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/10" role="region" aria-labelledby="users-export-heading">
              <h3 id="users-export-heading" className="text-lg font-semibold text-white mb-4">Users & Organizers</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleExportUsers(exportFormat)}
                  disabled={exportingUsers}
                  className="w-full bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-xl border border-white/30 hover:border-white/50 text-white px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                  aria-label={`Export users as ${exportFormat.toUpperCase()}`}
                  aria-describedby="users-export-status"
                >
                  {exportingUsers ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">{exportFormat === 'pdf' ? '📄' : '📊'}</span>
                      <span>Export Users as {exportFormat.toUpperCase()}</span>
                    </>
                  )}
                </button>
                <div id="users-export-status" className="sr-only">
                  {exportingUsers ? 'Export in progress' : 'Ready to export users data'}
                </div>
              </div>
            </div>

            {/* Events Export */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-4 sm:p-6 border border-white/10" role="region" aria-labelledby="events-export-heading">
              <h3 id="events-export-heading" className="text-lg font-semibold text-white mb-4">Events</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleExportEvents(exportFormat)}
                  disabled={exportingEvents}
                  className="w-full bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-xl border border-white/30 hover:border-white/50 text-white px-4 py-3 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-teal-400/50"
                  aria-label={`Export events as ${exportFormat.toUpperCase()}`}
                  aria-describedby="events-export-status"
                >
                  {exportingEvents ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" aria-hidden="true"></div>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <span aria-hidden="true">{exportFormat === 'pdf' ? '📄' : '📊'}</span>
                      <span>Export Events as {exportFormat.toUpperCase()}</span>
                    </>
                  )}
                </button>
                <div id="events-export-status" className="sr-only">
                  {exportingEvents ? 'Export in progress' : 'Ready to export events data'}
                </div>
              </div>
            </div>
          </div>

          {/* Export Progress Indicators */}
          {(exportingUsers || exportingEvents) && (
            <div
              className="mt-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-blue-500/30 rounded-xl p-4"
              role="status"
              aria-live="polite"
              aria-label="Export progress"
            >
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" aria-hidden="true"></div>
                <div>
                  <p className="text-blue-300 font-medium">Export in Progress</p>
                  <p className="text-blue-200 text-sm">
                    {exportingUsers ? 'Exporting users data...' : 'Exporting events data...'}
                  </p>
                </div>
              </div>
              <div className="mt-3 bg-white/10 rounded-full h-2" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100">
                <div
                  className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full animate-pulse transition-all duration-300"
                  style={{width: '60%'}}
                  aria-hidden="true"
                ></div>
              </div>
              <div className="sr-only">
                Export is 60% complete. Please wait while we prepare your data.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50"
          onClick={() => setShowAddForm(false)}
        >
          <div
            className="relative top-20 mx-auto p-5 border border-white/20 w-96 shadow-2xl rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3">
              <h3 className="text-lg font-medium bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                {editingOrganizer ? 'Edit Organizer' : 'Add New Organizer'}
              </h3>
              <form onSubmit={editingOrganizer ? handleUpdateOrganizer : handleAddOrganizer}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                    />
                  </div>

                  {!editingOrganizer && (
                    <div>
                      <label className="block text-gray-300 text-sm font-bold mb-2">
                        Password *
                      </label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required={!editingOrganizer}
                        className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Mobile
                    </label>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Department *
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-bold mb-2">
                      Enrollment No
                    </label>
                    <input
                      type="text"
                      name="enrollmentNo"
                      value={formData.enrollmentNo}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="mr-3 px-4 py-2 text-sm font-medium text-gray-300 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
                  >
                    {editingOrganizer ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {showTwoFactorSetup && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md overflow-y-auto h-full w-full z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="two-factor-heading"
          onClick={() => setShowTwoFactorSetup(false)}
        >
          <div
            className="relative mx-auto p-6 sm:p-8 border border-white/30 w-full max-w-md shadow-2xl rounded-3xl bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-2xl shadow-purple-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3">
              <h3 id="two-factor-heading" className="text-lg font-medium bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">
                {twoFactorStatus?.enabled ? 'Disable 2FA' : 'Enable 2FA'}
              </h3>

              {backupCodes.length > 0 && (
                <div className="mb-6 p-6 bg-gradient-to-br from-yellow-500/15 to-orange-500/10 backdrop-blur-xl border border-yellow-500/30 rounded-2xl shadow-lg">
                  <h4 className="text-yellow-300 font-bold mb-3 flex items-center">
                    <span className="text-2xl mr-2">⚠️</span>
                    Backup Codes
                  </h4>
                  <p className="text-yellow-200 text-sm mb-4 leading-relaxed">Save these codes securely in a safe place. They will not be shown again!</p>
                  <div className="grid grid-cols-2 gap-3">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-lg border border-white/20 p-3 rounded-xl text-center font-mono text-white shadow-lg hover:shadow-xl transition-all duration-300">
                        {code}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {twoFactorStatus?.enabled && (
                <div className="mb-6">
                  <label className="block text-gray-200 text-sm font-semibold mb-3">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-xl border border-white/30 rounded-xl text-white placeholder-gray-400 focus:border-green-400/60 focus:outline-none transition-all duration-300 shadow-lg"
                  />
                  <button
                    onClick={handleSendTwoFactorCode}
                    className="mt-3 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg border border-green-500/30 rounded-lg text-green-300 hover:text-green-200 hover:bg-green-500/30 transition-all duration-300 text-sm font-medium"
                  >
                    Send verification code
                  </button>
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowTwoFactorSetup(false);
                    setTwoFactorCode('');
                    setBackupCodes([]);
                  }}
                  className="px-6 py-3 text-sm font-medium text-gray-300 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/30 rounded-xl hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg"
                >
                  Cancel
                </button>
                {twoFactorStatus?.enabled ? (
                  <button
                    onClick={handleDisableTwoFactor}
                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-xl hover:shadow-lg hover:shadow-red-500/40 transition-all duration-300 shadow-lg hover:scale-105"
                  >
                    Disable 2FA
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowTwoFactorSetup(false);
                      setBackupCodes([]);
                    }}
                    className="px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl hover:shadow-lg hover:shadow-green-500/40 transition-all duration-300 shadow-lg hover:scale-105"
                  >
                    I've Saved the Codes
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Announcement Form Modal */}
      {showAnnouncementForm && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-lg overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="announcement-form-title"
          onClick={resetAnnouncementForm}
        >
          <div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glassmorphic Container */}
            <div className="bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-2xl shadow-yellow-500/30 p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3
                  id="announcement-form-title"
                  className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent"
                >
                  {editingAnnouncement ? '✏️ Edit Announcement' : '📢 Create Announcement'}
                </h3>
                <button
                  onClick={resetAnnouncementForm}
                  className="p-2 hover:bg-white/10 rounded-full transition-all duration-300 hover:scale-110"
                  aria-label="Close announcement form"
                >
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(handleAnnouncementSubmit)} className="space-y-6">
                {/* Title Field */}
                <div className="space-y-2">
                  <label
                    htmlFor="announcement-title"
                    className="block text-gray-200 text-sm font-semibold"
                  >
                    Title <span className="text-red-400">*</span>
                  </label>
                  <Controller
                    name="title"
                    control={control}
                    rules={{
                      required: 'Title is required',
                      minLength: { value: 3, message: 'Title must be at least 3 characters' },
                      maxLength: { value: 200, message: 'Title must be less than 200 characters' }
                    }}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="announcement-title"
                        type="text"
                        className="w-full px-4 py-3 bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-xl border border-white/30 rounded-xl text-white placeholder-gray-400 focus:border-yellow-400/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all duration-300 shadow-lg"
                        placeholder="Enter announcement title..."
                        aria-describedby={errors.title ? "title-error" : undefined}
                      />
                    )}
                  />
                  {errors.title && (
                    <p id="title-error" className="text-red-400 text-sm" role="alert">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                {/* Content Field with Rich Text Editor */}
                <div className="space-y-2">
                  <label
                    htmlFor="announcement-content"
                    className="block text-gray-200 text-sm font-semibold"
                  >
                    Content <span className="text-red-400">*</span>
                  </label>
                  <div className="bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-xl border border-white/30 rounded-xl overflow-hidden shadow-lg">
                    <Controller
                      name="content"
                      control={control}
                      rules={{
                        required: 'Content is required',
                        minLength: { value: 10, message: 'Content must be at least 10 characters' },
                        maxLength: { value: 2000, message: 'Content must be less than 2000 characters' }
                      }}
                      render={({ field }) => (
                        <ReactQuill
                          {...field}
                          theme="snow"
                          modules={quillModules}
                          formats={quillFormats}
                          placeholder="Compose your announcement..."
                          className="custom-quill"
                          style={{
                            backgroundColor: 'transparent',
                            color: 'white'
                          }}
                        />
                      )}
                    />
                  </div>
                  {errors.content && (
                    <p className="text-red-400 text-sm" role="alert">
                      {errors.content.message}
                    </p>
                  )}
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Type */}
                  <div className="space-y-2">
                    <label
                      htmlFor="announcement-type"
                      className="block text-gray-200 text-sm font-semibold"
                    >
                      Type
                    </label>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          id="announcement-type"
                          className="w-full px-4 py-3 bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-xl border border-white/30 rounded-xl text-white focus:border-yellow-400/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all duration-300 shadow-lg"
                        >
                          <option value="system">🌐 System</option>
                          <option value="targeted">🎯 Targeted</option>
                          <option value="event">🎪 Event</option>
                        </select>
                      )}
                    />
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <label
                      htmlFor="announcement-priority"
                      className="block text-gray-200 text-sm font-semibold"
                    >
                      Priority
                    </label>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <select
                          {...field}
                          id="announcement-priority"
                          className="w-full px-4 py-3 bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-xl border border-white/30 rounded-xl text-white focus:border-yellow-400/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all duration-300 shadow-lg"
                        >
                          <option value="1">🟢 Low</option>
                          <option value="2">🟡 Medium-Low</option>
                          <option value="3">🟠 Medium</option>
                          <option value="4">🟠 Medium-High</option>
                          <option value="5">🔴 High</option>
                        </select>
                      )}
                    />
                  </div>

                  {/* Expires At */}
                  <div className="space-y-2">
                    <label
                      htmlFor="announcement-expires"
                      className="block text-gray-200 text-sm font-semibold"
                    >
                      Expires At
                    </label>
                    <Controller
                      name="expiresAt"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          id="announcement-expires"
                          type="datetime-local"
                          className="w-full px-4 py-3 bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-xl border border-white/30 rounded-xl text-white focus:border-yellow-400/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all duration-300 shadow-lg"
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      )}
                    />
                  </div>
                </div>

                {/* Event ID */}
                <div className="space-y-2">
                  <label
                    htmlFor="announcement-eventId"
                    className="block text-gray-200 text-sm font-semibold"
                  >
                    Event ID (for event announcements)
                  </label>
                  <Controller
                    name="eventId"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        id="announcement-eventId"
                        type="text"
                        placeholder="Optional event ID"
                        className="w-full px-4 py-3 bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-xl border border-white/30 rounded-xl text-white placeholder-gray-400 focus:border-yellow-400/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all duration-300 shadow-lg"
                      />
                    )}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-white/20">
                  <button
                    type="button"
                    onClick={resetAnnouncementForm}
                    className="px-6 py-3 text-sm font-medium text-gray-300 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/30 rounded-xl hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:scale-105"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      editingAnnouncement ? '✏️ Update Announcement' : '📢 Create Announcement'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventsAPI } from '../../services/eventService';
import { registrationService, certificateService } from '../../services/apiServices';
import { toast } from 'react-hot-toast';
import EventStatusBadge from '../EventStatusBadge';
import { calculateEventStatus } from '../../utils/eventUtils';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const OrganizerDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Core state
  const [events, setEvents] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingRegistration, setApprovingRegistration] = useState(null);
  const [rejectingRegistration, setRejectingRegistration] = useState(null);
  const [error, setError] = useState(null);

  // Metrics state with real-time updates
  const [metrics, setMetrics] = useState({});
  const [lastUpdate, setLastUpdate] = useState(new Date());


  // Event management state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);

  // Participation requests state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('registeredOn');
  const [sortOrder, setSortOrder] = useState('desc');

  // Events table state
  const [eventsSearchTerm, setEventsSearchTerm] = useState('');
  const [eventsSortBy, setEventsSortBy] = useState('date');
  const [eventsSortOrder, setEventsSortOrder] = useState('desc');

  // Attendance management state
   const [attendanceFilter, setAttendanceFilter] = useState('all');
   const [attendanceSearch, setAttendanceSearch] = useState('');
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage] = useState(10);
   const [showCertificateModal, setShowCertificateModal] = useState(false);
   const [selectedParticipant, setSelectedParticipant] = useState(null);
   const [certificateFile, setCertificateFile] = useState(null);
   const [certificatePreview, setCertificatePreview] = useState('');
   const [feePaid, setFeePaid] = useState(false);
   const [attendanceLoading, setAttendanceLoading] = useState(false);
   const [certificateLoading, setCertificateLoading] = useState(false);
   const [metricsLoading, setMetricsLoading] = useState(false);

  // Redirect if not authenticated or not organizer
  useEffect(() => {
    console.log('[OrganizerDashboard] Auth check - isAuthenticated:', isAuthenticated, 'user:', user);
    if (!isAuthenticated) {
      console.log('[OrganizerDashboard] Not authenticated, redirecting to login');
      navigate('/login');
      return;
    }
    if (user && user.role !== 'organizer') {
      console.log('[OrganizerDashboard] User role is not organizer:', user.role);
      toast.error('Access denied. Organizer privileges required.');
      navigate('/');
      return;
    }
    console.log('[OrganizerDashboard] User is authenticated as organizer, fetching events');
    fetchEvents();
  }, [isAuthenticated, user, navigate]);

  // Handle keyboard navigation for modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showEditModal) {
          setShowEditModal(false);
        }
        if (showDeleteModal) {
          setShowDeleteModal(false);
        }
        if (showCertificateModal) {
          setShowCertificateModal(false);
          setCertificateFile(null);
          setCertificatePreview('');
          setFeePaid(false);
        }
      }
    };

    if (showEditModal || showDeleteModal || showCertificateModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showEditModal, showDeleteModal, showCertificateModal]);

  // Start polling for metrics only after events are loaded
  useEffect(() => {
    if (events.length > 0) {
      console.log('[OrganizerDashboard] Starting metrics polling with', events.length, 'events');
      const interval = setInterval(fetchMetrics, 30000); // Update every 30 seconds
      return () => clearInterval(interval);
    }
  }, [events]);

  const fetchEvents = async () => {
    try {
      console.log('[OrganizerDashboard] fetchEvents called, user:', user);
      setError(null);
      const response = await eventsAPI.getAll();
      console.log('[OrganizerDashboard] Events response:', response);
      const myEvents = response.events.filter(event => event.organizer === user._id);
      console.log('[OrganizerDashboard] Filtered my events:', myEvents);
      setEvents(myEvents || []);
      await fetchPendingRegistrations(myEvents);
      await fetchMetrics();
    } catch (error) {
      console.error('[OrganizerDashboard] Error fetching events:', error);
      setError('Failed to fetch events');
      toast.error('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };


  const fetchMetrics = async () => {
    try {
      console.log('[OrganizerDashboard] fetchMetrics called, events:', events.length);
      const newMetrics = {};
      for (const event of events) {
        try {
          console.log(`[OrganizerDashboard] Fetching metrics for event ${event._id}`);
          const response = await eventsAPI.getMetrics(event._id);
          console.log(`[OrganizerDashboard] Metrics response for ${event._id}:`, response);
          newMetrics[event._id] = response.metrics;
        } catch (error) {
          console.error(`[OrganizerDashboard] Failed to fetch metrics for event ${event._id}:`, error);
          console.log(`[OrganizerDashboard] Falling back to manual calculation for ${event._id}`);
          // Fallback to old method if new endpoint fails
          const regResponse = await registrationService.getRegistrationsForEvent(event._id);
          const registrations = regResponse.registrations || [];
          console.log(`[OrganizerDashboard] Fallback registrations for ${event._id}:`, registrations.length);
          newMetrics[event._id] = {
            totalRegistrations: registrations.length,
            approvedRegistrations: registrations.filter(r => r.status === 'approved').length,
            pendingRegistrations: registrations.filter(r => r.status === 'pending').length,
            rejectedRegistrations: registrations.filter(r => r.status === 'rejected').length,
            views: event.views || 0,
            presentCount: 0,
            absentCount: 0,
            lastUpdated: new Date()
          };
        }
      }
      console.log('[OrganizerDashboard] Final metrics:', newMetrics);
      setMetrics(newMetrics);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('[OrganizerDashboard] Failed to fetch metrics:', error);
    }
  };

  const fetchPendingRegistrations = async (myEvents) => {
    try {
      console.log('[OrganizerDashboard] fetchPendingRegistrations called with events:', myEvents.length);
      const allPending = [];
      for (const event of myEvents) {
        try {
          console.log(`[OrganizerDashboard] Fetching registrations for event ${event._id} (${event.title})`);
          const response = await registrationService.getRegistrationsForEvent(event._id);
          console.log(`[OrganizerDashboard] Registrations response for ${event._id}:`, response.registrations?.length || 0);
          const pending = response.registrations.filter(reg => reg.status === 'pending');
          console.log(`[OrganizerDashboard] Pending registrations for ${event._id}:`, pending.length);
          allPending.push(...pending.map(reg => ({ ...reg, eventTitle: event.title })));
        } catch (error) {
          console.error(`[OrganizerDashboard] Failed to fetch registrations for event ${event._id}:`, error);
          // Continue to next event instead of failing completely
        }
      }
      console.log('[OrganizerDashboard] Total pending registrations:', allPending.length);
      setPendingRegistrations(allPending);
    } catch (error) {
      console.error('[OrganizerDashboard] Failed to fetch pending registrations', error);
      toast.error('Failed to fetch pending registrations');
    }
  };

  const handleEventSelect = async (eventId) => {
    setSelectedEvent(eventId);
    try {
      const regResponse = await registrationService.getRegistrationsForEvent(eventId);
      const approved = regResponse.registrations.filter(r => r.status === 'approved');
      setParticipants(approved);
      const attResponse = await eventsAPI.getAttendance(eventId);
      setAttendance(attResponse.attendance);
    } catch (error) {
      toast.error('Failed to load participants and attendance');
      console.error(error);
    }
  };

  const handleMarkAttendance = async (participantId, attended) => {
    setAttendanceLoading(true);
    try {
      await eventsAPI.markAttendance(selectedEvent, participantId, attended);
      toast.success(`Attendance marked as ${attended ? 'present' : 'absent'}`);
      // Refresh attendance
      const attResponse = await eventsAPI.getAttendance(selectedEvent);
      setAttendance(attResponse.attendance);
      // Refresh metrics
      await fetchMetrics();
    } catch (error) {
      console.error('Failed to mark attendance:', error);
      toast.error('Failed to mark attendance. Please try again.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const handleApproveRegistration = async (registrationId) => {
    console.log('[DEBUG] Organizer handleApproveRegistration called with id:', registrationId);

    // Input validation
    if (!registrationId || typeof registrationId !== 'string' || registrationId.trim() === '') {
      console.error('[DEBUG] Invalid registration ID provided:', registrationId);
      toast.error('Invalid registration ID');
      return;
    }

    // Prevent multiple simultaneous approvals
    if (approvingRegistration === registrationId) {
      console.log('[DEBUG] Already approving this registration, skipping...');
      return;
    }

    setApprovingRegistration(registrationId);

    try {
      console.log('[DEBUG] Calling registrationService.approveRegistration...');
      const response = await registrationService.approveRegistration(registrationId);
      console.log('[DEBUG] Registration approved successfully, response:', response);

      toast.success('Registration approved successfully');

      console.log('[DEBUG] Calling fetchPendingRegistrations and fetchMetrics to refresh data...');
      await fetchPendingRegistrations(events);
      await fetchMetrics();
      console.log('[DEBUG] Data refresh completed');

    } catch (error) {
      console.error('[DEBUG] Error in Organizer handleApproveRegistration:', error);

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

  const handleRejectRegistration = async (registrationId) => {
    console.log('[DEBUG] Organizer handleRejectRegistration called with id:', registrationId);

    // Input validation
    if (!registrationId || typeof registrationId !== 'string' || registrationId.trim() === '') {
      console.error('[DEBUG] Invalid registration ID provided:', registrationId);
      toast.error('Invalid registration ID');
      return;
    }

    // Prevent multiple simultaneous rejections
    if (rejectingRegistration === registrationId) {
      console.log('[DEBUG] Already rejecting this registration, skipping...');
      return;
    }

    setRejectingRegistration(registrationId);

    try {
      console.log('[DEBUG] Calling registrationService.rejectRegistration...');
      const response = await registrationService.rejectRegistration(registrationId);
      console.log('[DEBUG] Registration rejected successfully, response:', response);

      toast.success('Registration rejected successfully');

      console.log('[DEBUG] Calling fetchPendingRegistrations and fetchMetrics to refresh data...');
      await fetchPendingRegistrations(events);
      await fetchMetrics();
      console.log('[DEBUG] Data refresh completed');

    } catch (error) {
      console.error('[DEBUG] Error in Organizer handleRejectRegistration:', error);

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

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setShowEditModal(true);
  };

  const handleDeleteEvent = (event) => {
    setDeletingEvent(event);
    setShowDeleteModal(true);
  };

  const confirmDeleteEvent = async () => {
    try {
      // Assuming there's a delete API - if not, we can use cancel
      await eventsAPI.cancel(deletingEvent._id);
      toast.success('Event deleted successfully');
      setShowDeleteModal(false);
      setDeletingEvent(null);
      await fetchEvents();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const handleIssueCertificate = async () => {
    if (!certificateFile) {
      toast.error('Please select a certificate file');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(certificateFile.type)) {
      toast.error('Please upload a PDF or image file (JPEG, PNG)');
      return;
    }

    // Validate file size (max 10MB)
    if (certificateFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setCertificateLoading(true);
    try {
      const formData = new FormData();
      formData.append('certificate', certificateFile);
      formData.append('eventId', selectedEvent);
      formData.append('participantId', selectedParticipant.participant._id);
      formData.append('feePaid', feePaid);

      await certificateService.requestCertificate(formData);
      toast.success('Certificate issued successfully');
      setShowCertificateModal(false);
      setSelectedParticipant(null);
      setCertificateFile(null);
      setCertificatePreview('');
      setFeePaid(false);
    } catch (error) {
      console.error('Failed to issue certificate:', error);
      toast.error('Failed to issue certificate. Please try again.');
    } finally {
      setCertificateLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCertificateFile(file);
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setCertificatePreview(e.target.result);
        reader.readAsDataURL(file);
      } else {
        setCertificatePreview('');
      }
    }
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = attendanceSearch === '' ||
      participant.participant.username.toLowerCase().includes(attendanceSearch.toLowerCase()) ||
      participant.participant.email.toLowerCase().includes(attendanceSearch.toLowerCase());

    const matchesFilter = attendanceFilter === 'all' ||
      (attendanceFilter === 'present' && attendance.find(a => a.participant._id === participant.participant._id)?.attended) ||
      (attendanceFilter === 'absent' && !attendance.find(a => a.participant._id === participant.participant._id)?.attended);

    return matchesSearch && matchesFilter;
  });

  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'ongoing':
        return 'text-blue-600 bg-blue-100';
      case 'completed':
        return 'text-gray-600 bg-gray-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const sortedRegistrations = [...pendingRegistrations].sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case 'eventTitle':
        aValue = a.eventTitle.toLowerCase();
        bValue = b.eventTitle.toLowerCase();
        break;
      case 'participant':
        aValue = a.participant.username.toLowerCase();
        bValue = b.participant.username.toLowerCase();
        break;
      case 'registeredOn':
      default:
        aValue = new Date(a.registeredOn);
        bValue = new Date(b.registeredOn);
        break;
    }
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const sortedEvents = [...events].sort((a, b) => {
    let aValue, bValue;
    switch (eventsSortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'date':
      default:
        aValue = new Date(a.date);
        bValue = new Date(b.date);
        break;
      case 'status':
        aValue = a.status.toLowerCase();
        bValue = b.status.toLowerCase();
        break;
      case 'participants':
        aValue = a.currentBooked || 0;
        bValue = b.currentBooked || 0;
        break;
    }
    if (eventsSortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const filteredEvents = sortedEvents.filter(event =>
    eventsSearchTerm === '' ||
    event.title.toLowerCase().includes(eventsSearchTerm.toLowerCase()) ||
    event.description.toLowerCase().includes(eventsSearchTerm.toLowerCase()) ||
    event.category.toLowerCase().includes(eventsSearchTerm.toLowerCase()) ||
    event.venue.toLowerCase().includes(eventsSearchTerm.toLowerCase())
  );

  const handleEventsSort = (column) => {
    if (eventsSortBy === column) {
      setEventsSortOrder(eventsSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setEventsSortBy(column);
      setEventsSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-400">
          <p>{error}</p>
          <button
            onClick={fetchEvents}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
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

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">Organizer Dashboard</h1>
          <p className="text-lg text-gray-300">Manage your events and track performance</p>
          <p className="text-sm text-gray-400 mt-2">Last updated: {lastUpdate.toLocaleTimeString()}</p>
        </div>

        {/* Enhanced Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 mb-8" role="region" aria-label="Event Metrics Overview">
          {events.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-lg text-gray-400">No events found. Create your first event to see analytics.</p>
            </div>
          ) : (
            events.map(event => {
            const eventMetrics = metrics[event._id] || {};
            const registrationData = {
              labels: ['Approved', 'Pending', 'Rejected'],
              datasets: [{
                data: [
                  eventMetrics.approvedRegistrations || 0,
                  eventMetrics.pendingRegistrations || 0,
                  eventMetrics.rejectedRegistrations || 0
                ],
                backgroundColor: [
                  'rgba(34, 197, 94, 0.8)',
                  'rgba(251, 191, 36, 0.8)',
                  'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                  'rgba(34, 197, 94, 1)',
                  'rgba(251, 191, 36, 1)',
                  'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 2,
              }],
            };

            const attendanceData = {
              labels: ['Present', 'Absent'],
              datasets: [{
                label: 'Attendance',
                data: [eventMetrics.presentCount || 0, eventMetrics.absentCount || 0],
                backgroundColor: [
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(156, 163, 175, 0.8)'
                ],
                borderColor: [
                  'rgba(59, 130, 246, 1)',
                  'rgba(156, 163, 175, 1)'
                ],
                borderWidth: 2,
              }],
            };

            return (
              <div key={event._id} className="card p-6 hover:shadow-cyan-500/10 transition-all duration-300">
                <h3 className="text-xl font-bold text-white mb-4 truncate bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{event.title}</h3>

                {/* Key Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-lg rounded-2xl p-3 border border-cyan-400/30">
                    <div className="text-2xl font-bold text-cyan-400">{eventMetrics.totalRegistrations || 0}</div>
                    <div className="text-xs text-cyan-300">Total Registrations</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-3 border border-purple-400/30">
                    <div className="text-2xl font-bold text-purple-400">{eventMetrics.views || 0}</div>
                    <div className="text-xs text-purple-300">Views</div>
                  </div>
                </div>

                {/* Registration Status Chart - Only show when data is available */}
                {eventMetrics && (eventMetrics.approvedRegistrations > 0 || eventMetrics.pendingRegistrations > 0 || eventMetrics.rejectedRegistrations > 0) ? (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Registration Status</h4>
                    <div className="h-32" role="img" aria-label={`Registration status for ${event.title}: ${eventMetrics.approvedRegistrations || 0} approved, ${eventMetrics.pendingRegistrations || 0} pending, ${eventMetrics.rejectedRegistrations || 0} rejected`}>
                      <Pie
                        data={registrationData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                color: 'rgba(255, 255, 255, 0.8)',
                                font: { size: 10 }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                ): (
                  <div className='text-sm'>Generating Graph.....</div>
                )}

                {/* Attendance Chart - Only show when data is available */}
                {eventMetrics && (eventMetrics.presentCount > 0 || eventMetrics.absentCount > 0) && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-300 mb-2">Attendance</h4>
                    <div className="h-20" role="img" aria-label={`Attendance for ${event.title}: ${eventMetrics.presentCount || 0} present, ${eventMetrics.absentCount || 0} absent`}>
                      <Bar
                        data={attendanceData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                color: 'rgba(255, 255, 255, 0.6)',
                                font: { size: 10 }
                              },
                              grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                              }
                            },
                            x: {
                              ticks: {
                                color: 'rgba(255, 255, 255, 0.6)',
                                font: { size: 10 }
                              },
                              grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                              }
                            }
                          },
                          plugins: {
                            legend: {
                              display: false
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
          )}
        </div>

        {/* Events Section */}
        <div className="card mb-8 hover:shadow-cyan-500/10 transition-all duration-300">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">My Events</h2>
              <button
                onClick={() => navigate('/create-event')}
                className="btn btn-primary px-6 py-3 text-lg"
                aria-label="Create new event"
              >
                Create New Event
              </button>
            </div>

            {/* Search and Controls */}
            <div className="mb-6">
              <div className="flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search events by title, description, category, or venue..."
                  value={eventsSearchTerm}
                  onChange={(e) => setEventsSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-cyan-400/50 focus:outline-none transition-all duration-300"
                  aria-label="Search events"
                />
              </div>
            </div>

            {/* Events List */}
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto" role="table">
                <thead className="bg-white/10">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors"
                      scope="col"
                      onClick={() => handleEventsSort('title')}
                      aria-sort={eventsSortBy === 'title' ? (eventsSortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Title</span>
                        {eventsSortBy === 'title' && (
                          <span className="text-cyan-400">
                            {eventsSortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors"
                      scope="col"
                      onClick={() => handleEventsSort('date')}
                      aria-sort={eventsSortBy === 'date' ? (eventsSortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        {eventsSortBy === 'date' && (
                          <span className="text-cyan-400">
                            {eventsSortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors"
                      scope="col"
                      onClick={() => handleEventsSort('status')}
                      aria-sort={eventsSortBy === 'status' ? (eventsSortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {eventsSortBy === 'status' && (
                          <span className="text-cyan-400">
                            {eventsSortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors"
                      scope="col"
                      onClick={() => handleEventsSort('participants')}
                      aria-sort={eventsSortBy === 'participants' ? (eventsSortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Participants</span>
                        {eventsSortBy === 'participants' && (
                          <span className="text-cyan-400">
                            {eventsSortOrder === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider" scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-white/10">
                  {filteredEvents.map((event) => (
                    <tr key={event._id} className="hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-base font-medium text-white">
                          {event.title}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-base text-white">
                        {event.date ? new Date(event.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <EventStatusBadge event={event} size="sm" />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-base text-white">
                        {event.currentBooked || 0}/{event.maxSeats || '∞'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => navigate(`/events/${event._id}`)}
                            className="btn btn-primary px-3 py-2 text-sm"
                            aria-label={`View event ${event.title}`}
                          >
                            View
                          </button>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="btn btn-secondary px-3 py-2 text-sm"
                              aria-label={`Edit event ${event.title}`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event)}
                              className="btn btn-danger px-3 py-2 text-sm"
                              aria-label={`Delete event ${event.title}`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredEvents.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-lg text-gray-400">
                        {events.length === 0 ? 'No events found. Create your first event!' : 'No events match your search criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Participation Requests Management */}
        <div className="card mb-8 hover:shadow-green-500/10 transition-all duration-300">
          <div className="p-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent mb-6">Participation Requests</h2>

            {/* Search and Sort Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by participant or event..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                  aria-label="Search participation requests"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                  aria-label="Sort by"
                >
                  <option value="registeredOn" className="bg-slate-800">Date Registered</option>
                  <option value="eventTitle" className="bg-slate-800">Event Title</option>
                  <option value="participant" className="bg-slate-800">Participant</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all duration-300"
                  aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full table-auto" role="table">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider" scope="col">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider" scope="col">
                      Participant
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider" scope="col">
                      Registered On
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300 uppercase tracking-wider" scope="col">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-white/10">
                  {(() => {
                    const filteredRegistrations = sortedRegistrations.filter(reg =>
                      searchTerm === '' ||
                      reg.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (reg.participant?.username && reg.participant.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (reg.participant?.email && reg.participant.email.toLowerCase().includes(searchTerm.toLowerCase()))
                    );
                    return (
                      <>
                        {filteredRegistrations.map((reg) => (
                          <tr key={reg._id} className="hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
                            <td className="px-4 py-4 whitespace-nowrap text-base font-medium text-white">
                              {reg.eventTitle}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-base text-white">
                              {reg.participant?.username || 'Unknown'} ({reg.participant?.email || 'Unknown'})
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-base text-white">
                              {new Date(reg.registeredOn).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={() => handleApproveRegistration(reg._id)}
                                  disabled={approvingRegistration === reg._id}
                                  className="btn btn-success px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  aria-label={`Approve registration for ${reg.participant?.username || 'Unknown'}`}
                                >
                                  {approvingRegistration === reg._id ? 'Approving...' : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleRejectRegistration(reg._id)}
                                  disabled={rejectingRegistration === reg._id}
                                  className="btn btn-danger px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                  aria-label={`Reject registration for ${reg.participant?.username || 'Unknown'}`}
                                >
                                  {rejectingRegistration === reg._id ? 'Rejecting...' : 'Reject'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredRegistrations.length === 0 && (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-lg text-gray-400">
                              {sortedRegistrations.length === 0 ? 'No pending registrations' : 'No registrations match your search criteria'}
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Attendance Management Section */}
        <div className="card hover:shadow-orange-500/10 transition-all duration-300">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent mb-4 lg:mb-0">Attendance Management</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>Total Participants:</span>
                <span className="text-orange-400 font-semibold">{participants.length}</span>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-lg font-medium text-gray-300 mb-3">Select Event</label>
              <select
                value={selectedEvent || ''}
                onChange={(e) => handleEventSelect(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:border-orange-400/50 focus:outline-none transition-all duration-300 text-lg hover:bg-white/15"
                aria-label="Select event for attendance management"
              >
                <option value="" className="bg-slate-800">Choose an event</option>
                {events.map(event => (
                  <option key={event._id} value={event._id} className="bg-slate-800">{event.title}</option>
                ))}
              </select>
            </div>

            {selectedEvent && (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-4 border border-green-400/30">
                    <div className="text-2xl font-bold text-green-400">{filteredParticipants.filter(p => attendance.find(a => a.participant._id === p.participant._id)?.attended).length}</div>
                    <div className="text-sm text-green-300">Present</div>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl p-4 border border-red-400/30">
                    <div className="text-2xl font-bold text-red-400">{filteredParticipants.filter(p => !attendance.find(a => a.participant._id === p.participant._id)?.attended).length}</div>
                    <div className="text-sm text-red-300">Absent</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-500/20 to-yellow-500/20 backdrop-blur-lg rounded-2xl p-4 border border-orange-400/30">
                    <div className="text-2xl font-bold text-orange-400">{Math.round((filteredParticipants.filter(p => attendance.find(a => a.participant._id === p.participant._id)?.attended).length / filteredParticipants.length) * 100) || 0}%</div>
                    <div className="text-sm text-orange-300">Attendance Rate</div>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Search Participants</label>
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={attendanceSearch}
                      onChange={(e) => setAttendanceSearch(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-orange-400/50 focus:outline-none transition-all duration-300 hover:bg-white/15"
                      aria-label="Search participants"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Filter by Status</label>
                    <select
                      value={attendanceFilter}
                      onChange={(e) => setAttendanceFilter(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl text-white focus:border-orange-400/50 focus:outline-none transition-all duration-300 hover:bg-white/15"
                      aria-label="Filter attendance status"
                    >
                      <option value="all" className="bg-slate-800">All Participants</option>
                      <option value="present" className="bg-slate-800">Present Only</option>
                      <option value="absent" className="bg-slate-800">Absent Only</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto" role="table">
                    <thead className="bg-gradient-to-r from-white/10 to-white/5">
                      <tr>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider" scope="col">
                          Participant
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider" scope="col">
                          Status
                        </th>
                        <th className="px-4 py-4 text-left text-sm font-semibold text-gray-300 uppercase tracking-wider" scope="col">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/5 divide-y divide-white/10">
                      {paginatedParticipants.map(part => {
                        const att = attendance.find(a => a.participant._id === part.participant._id);
                        return (
                          <tr key={part._id} className="hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-red-500/5 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-base font-medium text-white">{part.participant.username}</div>
                              <div className="text-sm text-gray-400">{part.participant.email}</div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${att?.attended ? 'text-green-400 bg-green-500/20 border border-green-400/30' : 'text-red-400 bg-red-500/20 border border-red-400/30'}`}>
                                <span className={`w-2 h-2 rounded-full mr-2 ${att?.attended ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                {att?.attended ? 'Present' : 'Absent'}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleMarkAttendance(part.participant._id, true)}
                                    disabled={attendanceLoading}
                                    className="btn btn-success px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={`Mark ${part.participant.username} as present`}
                                  >
                                    {attendanceLoading ? '...' : 'Present'}
                                  </button>
                                  <button
                                    onClick={() => handleMarkAttendance(part.participant._id, false)}
                                    disabled={attendanceLoading}
                                    className="btn btn-danger px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label={`Mark ${part.participant.username} as absent`}
                                  >
                                    {attendanceLoading ? '...' : 'Absent'}
                                  </button>
                                </div>
                                {att?.attended && (
                                  <button
                                    onClick={() => {
                                      setSelectedParticipant(part);
                                      setShowCertificateModal(true);
                                    }}
                                    className="btn btn-primary px-3 py-2 text-sm"
                                    aria-label={`Issue certificate for ${part.participant.username}`}
                                  >
                                    Certificate
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {paginatedParticipants.length === 0 && (
                        <tr>
                          <td colSpan="3" className="px-4 py-12 text-center">
                            <div className="text-gray-400">
                              <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-lg">No participants found</p>
                              <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                    <div className="text-sm text-gray-400">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredParticipants.length)} of {filteredParticipants.length} participants
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 hover:border-orange-400/50 transition-all duration-300 font-medium"
                        aria-label="Previous page"
                      >
                        ← Previous
                      </button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                          if (pageNum > totalPages) return null;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`px-3 py-2 rounded-xl transition-all duration-300 font-medium ${
                                currentPage === pageNum
                                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                                  : 'bg-white/10 backdrop-blur-lg border border-white/20 text-white hover:bg-white/20 hover:border-orange-400/50'
                              }`}
                              aria-label={`Page ${pageNum}`}
                              aria-current={currentPage === pageNum ? 'page' : undefined}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg border border-white/20 rounded-xl text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 hover:border-orange-400/50 transition-all duration-300 font-medium"
                        aria-label="Next page"
                      >
                        Next →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Event Modal */}
      {showEditModal && editingEvent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-slate-800 rounded-3xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-4">Edit Event</h3>
            <p className="text-gray-300 mb-6">Redirecting to edit page...</p>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  navigate(`/edit-event/${editingEvent._id}`);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all duration-300"
              >
                Continue
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Event Modal */}
      {showDeleteModal && deletingEvent && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="bg-slate-800 rounded-3xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-bold text-white mb-4">Delete Event</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete "{deletingEvent.title}"? This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={confirmDeleteEvent}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition-all duration-300"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Issuance Modal */}
      {showCertificateModal && selectedParticipant && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowCertificateModal(false)}
        >
          <div
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Issue Certificate</h3>
              <button
                onClick={() => setShowCertificateModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border border-purple-400/30">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedParticipant.participant.username}</p>
                    <p className="text-gray-400 text-sm">{selectedParticipant.participant.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">
                  Certificate File <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    id="certificate-file"
                  />
                  <label
                    htmlFor="certificate-file"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-purple-400 transition-colors bg-white/5 hover:bg-white/10"
                  >
                    {certificateFile ? (
                      <div className="text-center">
                        <svg className="w-8 h-8 text-green-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-green-400 font-medium">{certificateFile.name}</p>
                        <p className="text-gray-400 text-sm">{(certificateFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-gray-300 font-medium">Click to upload certificate</p>
                        <p className="text-gray-500 text-sm">PDF, JPEG, PNG up to 10MB</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {certificatePreview && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-3">Preview</label>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <img
                      src={certificatePreview}
                      alt="Certificate preview"
                      className="w-full h-48 object-contain rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-400/20">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="feePaid"
                    checked={feePaid}
                    onChange={(e) => setFeePaid(e.target.checked)}
                    className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <label htmlFor="feePaid" className="ml-3 text-sm font-medium text-gray-300">
                    Certificate fee has been paid
                  </label>
                </div>
                <div className={`text-sm font-medium ${feePaid ? 'text-green-400' : 'text-gray-500'}`}>
                  {feePaid ? '✓ Confirmed' : 'Pending'}
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button
                onClick={handleIssueCertificate}
                disabled={certificateLoading || !certificateFile}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {certificateLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Issuing...
                  </div>
                ) : (
                  'Issue Certificate'
                )}
              </button>
              <button
                onClick={() => {
                  setShowCertificateModal(false);
                  setCertificateFile(null);
                  setCertificatePreview('');
                  setFeePaid(false);
                }}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl transition-all duration-300 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;

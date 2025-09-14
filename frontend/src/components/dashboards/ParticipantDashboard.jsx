import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { eventsAPI } from '../../services/eventService';
import { bookmarkService, notificationService, certificateService } from '../../services/apiServices';
import { statsAPI } from '../../services/adminService';
import { toast } from 'react-hot-toast';
import CertificateManagement from '../CertificateManagement';
import { Bookmark, Calendar, Users, Award, X, Eye, Bell, CheckCircle, Clock, AlertCircle, Download } from 'lucide-react';

const ParticipantDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [bookmarkedEvents, setBookmarkedEvents] = useState([]);
  const [bookmarkedMedia, setBookmarkedMedia] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const observerRef = useRef(null);

  // Participant Stats State
  const [participantStats, setParticipantStats] = useState(null);
  const [loadingParticipantStats, setLoadingParticipantStats] = useState(false);

  // Redirect if not authenticated or not participant
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.role !== 'participant') {
      toast.error('Access denied. Participant privileges required.');
      navigate('/');
      return;
    }
    fetchRegistrations();
    fetchBookmarkedItems();
    fetchNotifications();
    fetchCertificates();
    fetchParticipantStats();
  }, [isAuthenticated, user, navigate]);

  const fetchRegistrations = async () => {
    try {
      const response = await eventsAPI.getRegistrations();
      setRegistrations(response.registrations || []);
    } catch (error) {
      toast.error('Failed to fetch registrations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarkedItems = async () => {
    try {
      const [eventsResponse, mediaResponse] = await Promise.all([
        bookmarkService.getBookmarkedEvents(),
        bookmarkService.getBookmarkedMedia()
      ]);
      setBookmarkedEvents(eventsResponse.events || []);
      setBookmarkedMedia(mediaResponse.media || []);
    } catch (error) {
      console.error('Error fetching bookmarked items:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotifications({ limit: 10 });
      setNotifications(response.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchCertificates = async () => {
    try {
      const response = await certificateService.getMyCertificates();
      setCertificates(response.certificates || []);
    } catch (error) {
      console.error('Error fetching certificates:', error);
    }
  };

  const fetchParticipantStats = async () => {
    try {
      setLoadingParticipantStats(true);
      const response = await statsAPI.getParticipantStats();
      setParticipantStats(response);
    } catch (error) {
      console.error('Error fetching participant stats:', error);
      toast.error('Failed to fetch participant stats');
    } finally {
      setLoadingParticipantStats(false);
    }
  };

  const handleRemoveBookmark = async (type, id) => {
    try {
      if (type === 'event') {
        await bookmarkService.removeEventBookmark(id);
        setBookmarkedEvents(prev => prev.filter(event => event._id !== id));
        toast.success('Event bookmark removed');
      } else if (type === 'media') {
        await bookmarkService.removeMediaBookmark(id);
        setBookmarkedMedia(prev => prev.filter(media => media._id !== id));
        toast.success('Media bookmark removed');
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast.error('Failed to remove bookmark');
    }
  };

  const downloadTicket = async (registrationId, eventTitle) => {
    try {
      const blob = await eventsAPI.downloadTicket(registrationId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ticket.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Ticket downloaded successfully');
    } catch (error) {
      toast.error('Failed to download ticket');
      console.error(error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Lazy loading with Intersection Observer
  const lazyLoadRef = useCallback((node) => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    });
    if (node) observerRef.current.observe(node);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-5 h-5" />;
      case 'system':
        return <AlertCircle className="w-5 h-5" />;
      case 'announcement':
        return <Bell className="w-5 h-5" />;
      case 'registration':
        return <Users className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'high':
        return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'low':
        return 'text-green-400 bg-green-500/20 border-green-400/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-400/30';
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

      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">Participant Dashboard</h1>
          <p className="text-gray-300">Manage your registrations, bookmarks, and certificates</p>
        </div>

        {/* Tabs */}
        <div className="card mb-8">
          <div className="flex border-b border-white/20">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-4 py-4 text-center font-semibold transition-all duration-300 ${
                activeTab === 'overview'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Eye className="w-5 h-5 mx-auto mb-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('registrations')}
              className={`flex-1 px-4 py-4 text-center font-semibold transition-all duration-300 ${
                activeTab === 'registrations'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-5 h-5 mx-auto mb-2" />
              Registrations
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex-1 px-4 py-4 text-center font-semibold transition-all duration-300 ${
                activeTab === 'saved'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bookmark className="w-5 h-5 mx-auto mb-2" />
              Saved
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex-1 px-4 py-4 text-center font-semibold transition-all duration-300 ${
                activeTab === 'notifications'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Bell className="w-5 h-5 mx-auto mb-2" />
              Notifications
            </button>
            <button
              onClick={() => setActiveTab('certificates')}
              className={`flex-1 px-4 py-4 text-center font-semibold transition-all duration-300 ${
                activeTab === 'certificates'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <Award className="w-5 h-5 mx-auto mb-2" />
              Certificates
            </button>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-6">Dashboard Overview</h2>

                {/* Summary Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Registrations Summary */}
                  <div
                    ref={lazyLoadRef}
                    className="card p-6 hover:border-purple-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 opacity-0 animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-500/20 rounded-xl">
                        <Users className="w-6 h-6 text-purple-400" />
                      </div>
                      <span className="text-2xl font-bold text-white">{participantStats?.registrations?.total || registrations.length}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Total Registrations</h3>
                    <p className="text-gray-400 text-sm">Events you've registered for</p>
                  </div>

                  {/* Saved Events Summary */}
                  <div
                    ref={lazyLoadRef}
                    className="card p-6 hover:border-cyan-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 opacity-0 animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-cyan-500/20 rounded-xl">
                        <Bookmark className="w-6 h-6 text-cyan-400" />
                      </div>
                      <span className="text-2xl font-bold text-white">{participantStats?.bookmarks?.total || (bookmarkedEvents.length + bookmarkedMedia.length)}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Saved Items</h3>
                    <p className="text-gray-400 text-sm">Events and media bookmarked</p>
                  </div>

                  {/* Notifications Summary */}
                  <div
                    ref={lazyLoadRef}
                    className="card p-6 hover:border-yellow-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20 opacity-0 animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-yellow-500/20 rounded-xl">
                        <Bell className="w-6 h-6 text-yellow-400" />
                      </div>
                      <span className="text-2xl font-bold text-white">{participantStats?.notifications?.total || notifications.length}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Notifications</h3>
                    <p className="text-gray-400 text-sm">Recent updates and alerts</p>
                  </div>

                  {/* Certificates Summary */}
                  <div
                    ref={lazyLoadRef}
                    className="card p-6 hover:border-green-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 opacity-0 animate-fade-in"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-500/20 rounded-xl">
                        <Award className="w-6 h-6 text-green-400" />
                      </div>
                      <span className="text-2xl font-bold text-white">{participantStats?.certificates?.total || certificates.length}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Certificates</h3>
                    <p className="text-gray-400 text-sm">Completed certifications</p>
                  </div>
                </div>

                {/* Recent Activity Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Registrations */}
                  <div className="card p-6">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-3 text-purple-400" />
                      Recent Registrations
                    </h3>
                    <div className="space-y-3">
                      {registrations.slice(0, 3).map((reg, index) => (
                        <div
                          key={reg._id}
                          ref={lazyLoadRef}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 opacity-0 animate-fade-in"
                          style={{ animationDelay: `${index * 200}ms` }}
                        >
                          <div>
                            <h4 className="font-medium text-white text-sm">{reg.event.title}</h4>
                            <p className="text-gray-400 text-xs">{new Date(reg.registeredOn).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reg.status)}`}>
                            {reg.status}
                          </span>
                        </div>
                      ))}
                      {registrations.length === 0 && (
                        <p className="text-gray-400 text-center py-4">No registrations yet</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Notifications */}
                  <div className="card p-6">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <Bell className="w-5 h-5 mr-3 text-yellow-400" />
                      Recent Notifications
                    </h3>
                    <div className="space-y-3">
                      {notifications.slice(0, 3).map((notification, index) => (
                        <div
                          key={notification._id}
                          ref={lazyLoadRef}
                          className="flex items-start space-x-3 p-3 bg-white/5 rounded-xl border border-white/10 opacity-0 animate-fade-in"
                          style={{ animationDelay: `${index * 200}ms` }}
                        >
                          <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-white text-sm">{notification.title}</h4>
                            <p className="text-gray-400 text-xs line-clamp-2">{notification.message}</p>
                            <p className="text-gray-500 text-xs mt-1">{new Date(notification.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <p className="text-gray-400 text-center py-4">No notifications yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Registrations Tab */}
            {activeTab === 'registrations' && (
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent mb-6">My Registrations</h2>

                {registrations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {registrations.map((reg, index) => (
                      <div
                        key={reg._id}
                        ref={lazyLoadRef}
                        className="card group p-6 hover:border-purple-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 opacity-0 animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="p-3 bg-purple-500/20 rounded-xl">
                            <Users className="w-6 h-6 text-purple-400" />
                          </div>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(reg.status)}`}>
                            {reg.status}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300 line-clamp-2">
                          {reg.event.title}
                        </h3>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-300">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{reg.event.date ? new Date(reg.event.date).toLocaleDateString() : 'Date TBD'}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-300">
                            <Clock className="w-4 h-4 mr-2 text-gray-400" />
                            <span>Registered: {new Date(reg.registeredOn).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/events/${reg.event._id}`)}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 hover:text-purple-200 rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                          >
                            View Event
                          </button>
                          {reg.status === 'approved' && (
                            <button
                              onClick={() => downloadTicket(reg._id, reg.event.title)}
                              className="px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-green-300 hover:text-green-200 rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-500/20 to-gray-600/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-gray-400/30">
                        <Users className="w-12 h-12 text-gray-400 animate-pulse" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">0</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                      No registrations yet
                    </h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                      Start your journey by registering for exciting events and expanding your knowledge
                    </p>
                    <button
                      onClick={() => navigate('/events')}
                      className="group relative px-8 py-4 bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-xl rounded-2xl font-semibold text-white hover:shadow-2xl hover:shadow-purple-500/40 transform hover:scale-105 transition-all duration-500 border border-purple-400/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <span className="relative z-10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        Browse Events
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Saved Tab */}
            {activeTab === 'saved' && (
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent mb-6">Saved Items</h2>

                {/* Bookmarked Events */}
                {bookmarkedEvents.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                      <Calendar className="w-6 h-6 mr-3 text-purple-400" />
                      Saved Events ({bookmarkedEvents.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {bookmarkedEvents.map((event, index) => (
                        <div
                          key={event._id}
                          className="card group p-5 hover:border-purple-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300 line-clamp-2">
                              {event.title}
                            </h4>
                            <button
                              onClick={() => handleRemoveBookmark('event', event._id)}
                              className="group/btn relative p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                              aria-label="Remove bookmark"
                            >
                              <X className="w-4 h-4" />
                              <div className="absolute inset-0 bg-red-400/10 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                            </button>
                          </div>
                          <p className="text-sm text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                            {event.description?.substring(0, 120)}...
                          </p>
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center text-gray-400">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>{event.date ? new Date(event.date).toLocaleDateString() : 'Date TBD'}</span>
                            </div>
                            <button
                              onClick={() => navigate(`/events/${event._id}`)}
                              className="group/btn relative px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 hover:text-purple-200 rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                            >
                              <span className="relative z-10">View Event</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 to-pink-400/0 group-hover/btn:from-purple-400/10 group-hover/btn:to-pink-400/10 rounded-xl transition-all duration-300"></div>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bookmarked Media */}
                {bookmarkedMedia.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                      <Eye className="w-6 h-6 mr-3 text-cyan-400" />
                      Saved Media ({bookmarkedMedia.length})
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {bookmarkedMedia.map((media, index) => (
                        <div
                          key={media._id}
                          className="card group p-5 hover:border-cyan-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 overflow-hidden"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-bold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-all duration-300 line-clamp-2">
                              {media.title}
                            </h4>
                            <button
                              onClick={() => handleRemoveBookmark('media', media._id)}
                              className="group/btn relative p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                              aria-label="Remove bookmark"
                            >
                              <X className="w-4 h-4" />
                              <div className="absolute inset-0 bg-red-400/10 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                            </button>
                          </div>
                          <div className="relative mb-4 overflow-hidden rounded-xl">
                            <img
                              src={media.thumbnail_url || media.image_url}
                              alt={media.title}
                              className="w-full h-32 object-cover transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center text-gray-400">
                              <span className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full text-cyan-300 capitalize">
                                {media.category?.replace('_', ' ')}
                              </span>
                            </div>
                            <button
                              onClick={() => navigate('/gallery')}
                              className="group/btn relative px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 hover:text-cyan-200 rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                            >
                              <span className="relative z-10">View Gallery</span>
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/0 to-blue-400/0 group-hover/btn:from-cyan-400/10 group-hover/btn:to-blue-400/10 rounded-xl transition-all duration-300"></div>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {bookmarkedEvents.length === 0 && bookmarkedMedia.length === 0 && (
                  <div className="text-center py-16">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-500/20 to-gray-600/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-gray-400/30">
                        <Bookmark className="w-12 h-12 text-gray-400 animate-pulse" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">0</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                      No saved items yet
                    </h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                      Start building your personalized collection by bookmarking events and media items that interest you
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 justify-items-center max-w-lg mx-auto">
                      <button
                        onClick={() => navigate('/events')}
                        className="group relative w-full px-8 py-4 bg-gradient-to-br from-purple-500/90 to-pink-500/90 backdrop-blur-xl rounded-2xl font-semibold text-white hover:shadow-2xl hover:shadow-purple-500/40 transform hover:scale-105 transition-all duration-500 border border-purple-400/30 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative z-10 flex items-center justify-center">
                          <Calendar className="w-5 h-5 mr-2" />
                          Browse Events
                        </span>
                      </button>
                      <button
                        onClick={() => navigate('/gallery')}
                        className="group relative w-full px-8 py-4 bg-gradient-to-br from-cyan-500/90 to-blue-500/90 backdrop-blur-xl rounded-2xl font-semibold text-white hover:shadow-2xl hover:shadow-cyan-500/40 transform hover:scale-105 transition-all duration-500 border border-cyan-400/30 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative z-10 flex items-center justify-center">
                          <Eye className="w-5 h-5 mr-2" />
                          Browse Gallery
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent mb-6">Notifications</h2>

                {notifications.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notifications.map((notification, index) => (
                      <div
                        key={notification._id}
                        ref={lazyLoadRef}
                        className="card group p-6 hover:border-yellow-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/20 opacity-0 animate-fade-in"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className={`p-3 rounded-xl ${getPriorityColor(notification.priority)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                            )}
                            <span className="text-xs text-gray-400 capitalize px-2 py-1 bg-white/10 rounded-full">
                              {notification.priority}
                            </span>
                          </div>
                        </div>

                        <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-yellow-400 group-hover:to-orange-400 group-hover:bg-clip-text transition-all duration-300">
                          {notification.title}
                        </h3>

                        <p className="text-gray-300 text-sm mb-4 leading-relaxed line-clamp-3">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                          <span className="capitalize px-2 py-1 bg-white/10 rounded-full">
                            {notification.type}
                          </span>
                        </div>

                        {!notification.isRead && (
                          <button
                            onClick={() => {
                              // Mark as read functionality could be added here
                              toast.success('Notification marked as read');
                            }}
                            className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 text-yellow-300 hover:text-yellow-200 rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="relative mb-6">
                      <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-500/20 to-gray-600/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-gray-400/30">
                        <Bell className="w-12 h-12 text-gray-400 animate-pulse" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">0</span>
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                      No notifications yet
                    </h3>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                      You'll receive notifications about event updates, registration confirmations, and important announcements here.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Certificates Tab */}
            {activeTab === 'certificates' && (
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent mb-6">Certificates</h2>

                {/* Certificate Status Cards */}
                {certificates.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                      <Award className="w-6 h-6 mr-3 text-green-400" />
                      Your Certificates ({certificates.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {certificates.map((certificate, index) => (
                        <div
                          key={certificate._id}
                          ref={lazyLoadRef}
                          className="card group p-6 hover:border-green-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 opacity-0 animate-fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-500/20 rounded-xl">
                              <Award className="w-6 h-6 text-green-400" />
                            </div>
                            <span className="px-3 py-1 bg-green-500/20 text-green-300 text-xs font-semibold rounded-full">
                              Completed
                            </span>
                          </div>

                          <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-green-400 group-hover:to-emerald-400 group-hover:bg-clip-text transition-all duration-300">
                            {certificate.eventTitle || 'Event Certificate'}
                          </h4>

                          <p className="text-gray-300 text-sm mb-4">
                            Issued on {certificate.issuedDate ? new Date(certificate.issuedDate).toLocaleDateString() : 'N/A'}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="text-xs text-gray-400">
                              Certificate ID: {certificate.certificateId || certificate._id?.slice(-8)}
                            </div>
                            <button
                              onClick={() => {
                                // Download certificate functionality
                                toast.success('Certificate download started');
                              }}
                              className="group/btn relative px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-green-300 hover:text-green-200 rounded-xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
                            >
                              <span className="relative z-10 flex items-center">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                              </span>
                              <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 to-emerald-400/0 group-hover/btn:from-green-400/10 group-hover/btn:to-emerald-400/10 rounded-xl transition-all duration-300"></div>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Request New Certificate Section */}
                <div className="card p-6">
                  <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                    <Award className="w-6 h-6 mr-3 text-purple-400" />
                    Request New Certificate
                  </h3>
                  <CertificateManagement />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>pm 
    </div>
  );
};

export default ParticipantDashboard;
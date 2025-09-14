import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  Award,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  Download,
  Upload,
  BarChart3,
  Activity,
  Star,
  MessageCircle,
  Bell,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { eventsAPI } from '../../services/eventService';
import { statsService, registrationService } from '../../services/apiServices';
import { toast } from 'react-hot-toast';
import ErrorBoundary from '../ErrorBoundary';

const OrganizerDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [organizerStats, setOrganizerStats] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Redirect if not organizer
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user && user.role !== 'organizer') {
      toast.error('Access denied. Organizer privileges required.');
      navigate('/');
      return;
    }
    fetchOrganizerData();
  }, [isAuthenticated, user, navigate]);

  const fetchOrganizerData = async () => {
    try {
      setLoading(true);
      const [statsResponse, eventsResponse] = await Promise.all([
        statsService.getOrganizerStats(),
        eventsAPI.getAll({ organizer: user._id })
      ]);

      setOrganizerStats(statsResponse);
      setMyEvents(eventsResponse.events || []);
    } catch (error) {
      console.error('Error fetching organizer data:', error);
      toast.error('Failed to load organizer dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventRegistrations = async (eventId) => {
    try {
      const response = await registrationService.getRegistrationsForEvent(eventId);
      setRegistrations(response.registrations || []);
      setSelectedEvent(eventId);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    }
  };

  const handleRegistrationAction = async (registrationId, action) => {
    try {
      if (action === 'approve') {
        await registrationService.approveRegistration(registrationId);
        toast.success('Registration approved successfully');
      } else {
        await registrationService.rejectRegistration(registrationId);
        toast.success('Registration rejected successfully');
      }
      
      // Refresh registrations for the selected event
      if (selectedEvent) {
        fetchEventRegistrations(selectedEvent);
      }
    } catch (error) {
      toast.error(`Failed to ${action} registration`);
    }
  };

  const handleEventAction = async (eventId, action) => {
    try {
      if (action === 'cancel') {
        await eventsAPI.cancel(eventId);
        toast.success('Event cancelled successfully');
      } else if (action === 'delete') {
        await eventsAPI.delete(eventId);
        toast.success('Event deleted successfully');
      }
      fetchOrganizerData();
    } catch (error) {
      toast.error(`Failed to ${action} event`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'rejected':
        return 'bg-red-500/20 text-red-400';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading organizer dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 text-white">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div
            className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Organizer Dashboard
                </h1>
                <p className="text-xl text-gray-300">
                  Welcome back, {user.fullName || user.username}! Manage your events and participants.
                </p>
              </div>
              <button
                onClick={() => navigate('/create-event')}
                className="mt-4 lg:mt-0 flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                <span>Create Event</span>
              </button>
            </div>
          </motion.div>

          {/* Stats Overview */}
          {organizerStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'My Events',
                    value: organizerStats.events?.myEvents || 0,
                    icon: Calendar,
                    color: 'from-purple-500 to-purple-600',
                    bgColor: 'from-purple-500/20 to-purple-600/20',
                  },
                  {
                    title: 'Total Registrations',
                    value: organizerStats.registrations?.total || 0,
                    icon: Users,
                    color: 'from-cyan-500 to-blue-500',
                    bgColor: 'from-cyan-500/20 to-blue-500/20',
                  },
                  {
                    title: 'Certificates Issued',
                    value: organizerStats.certificates?.total || 0,
                    icon: Award,
                    color: 'from-yellow-500 to-orange-500',
                    bgColor: 'from-yellow-500/20 to-orange-500/20',
                  },
                  {
                    title: 'Total Views',
                    value: organizerStats.views?.total || 0,
                    icon: Eye,
                    color: 'from-green-500 to-teal-500',
                    bgColor: 'from-green-500/20 to-teal-500/20',
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl hover:scale-105 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 bg-gradient-to-br ${stat.bgColor} rounded-xl`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">{stat.value}</div>
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white">{stat.title}</h3>
                    <div className={`h-1 bg-gradient-to-r ${stat.color} rounded-full mt-2`}></div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
              <div className="flex flex-wrap border-b border-white/20">
                {[
                  { id: 'overview', label: 'Overview', icon: TrendingUp },
                  { id: 'events', label: 'My Events', icon: Calendar },
                  { id: 'registrations', label: 'Registrations', icon: Users },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 min-w-0 px-4 py-4 text-center font-semibold transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <tab.icon className="w-5 h-5 mx-auto mb-2" />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      Dashboard Overview
                    </h2>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Recent Events */}
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-purple-400" />
                          Recent Events
                        </h3>
                        <div className="space-y-3">
                          {myEvents.slice(0, 5).map((event) => (
                            <div key={event._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                              <div>
                                <p className="text-white font-medium">{event.title}</p>
                                <p className="text-gray-400 text-sm">
                                  {event.date ? new Date(event.date).toLocaleDateString() : 'Date TBD'}
                                </p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                {event.status}
                              </span>
                            </div>
                          ))}
                          {myEvents.length === 0 && (
                            <p className="text-gray-400 text-center py-4">No events created yet</p>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Settings className="w-5 h-5 mr-2 text-cyan-400" />
                          Quick Actions
                        </h3>
                        <div className="space-y-3">
                          <button
                            onClick={() => navigate('/create-event')}
                            className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-lg transition-all duration-300"
                          >
                            <Plus className="w-5 h-5 text-purple-400" />
                            <span className="text-white">Create New Event</span>
                          </button>
                          <button
                            onClick={() => navigate('/gallery')}
                            className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 rounded-lg transition-all duration-300"
                          >
                            <Upload className="w-5 h-5 text-cyan-400" />
                            <span className="text-white">Upload Media</span>
                          </button>
                          <button
                            onClick={() => setActiveTab('analytics')}
                            className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-green-500/20 to-teal-500/20 hover:from-green-500/30 hover:to-teal-500/30 rounded-lg transition-all duration-300"
                          >
                            <BarChart3 className="w-5 h-5 text-green-400" />
                            <span className="text-white">View Analytics</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Events Tab */}
                {activeTab === 'events' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        My Events
                      </h2>
                      <button
                        onClick={() => navigate('/create-event')}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Event</span>
                      </button>
                    </div>

                    {myEvents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {myEvents.map((event, index) => (
                          <motion.div
                            key={event._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl hover:scale-105 transition-all duration-300"
                          >
                            {/* Event Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                                  {event.title}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                                  {event.status}
                                </span>
                              </div>
                            </div>

                            {/* Event Details */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center text-sm text-gray-300">
                                <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{event.date ? new Date(event.date).toLocaleDateString() : 'Date TBD'}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-300">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{event.time || 'Time TBD'}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-300">
                                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{event.venue || 'Venue TBD'}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-300">
                                <Users className="w-4 h-4 mr-2 text-gray-400" />
                                <span>
                                  {event.slotCounts?.confirmed || 0} / {event.maxSeats || 'Unlimited'} registered
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => navigate(`/events/${event._id}`)}
                                className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                              >
                                <Eye className="w-4 h-4 mx-auto" />
                              </button>
                              <button
                                onClick={() => navigate(`/edit-event/${event._id}`)}
                                className="flex-1 px-3 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
                              >
                                <Edit className="w-4 h-4 mx-auto" />
                              </button>
                              <button
                                onClick={() => fetchEventRegistrations(event._id)}
                                className="flex-1 px-3 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                              >
                                <Users className="w-4 h-4 mx-auto" />
                              </button>
                              {event.status !== 'completed' && (
                                <button
                                  onClick={() => handleEventAction(event._id, 'cancel')}
                                  className="flex-1 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                                >
                                  <X className="w-4 h-4 mx-auto" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="text-6xl mb-6">📅</div>
                        <h3 className="text-2xl font-bold text-gray-300 mb-2">No events created yet</h3>
                        <p className="text-gray-400 mb-8">Start by creating your first event</p>
                        <button
                          onClick={() => navigate('/create-event')}
                          className="btn btn-primary"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Create Your First Event
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Registrations Tab */}
                {activeTab === 'registrations' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      Registration Management
                    </h2>

                    {selectedEvent ? (
                      <div>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-xl font-semibold text-white">
                            Event Registrations
                          </h3>
                          <button
                            onClick={() => setSelectedEvent(null)}
                            className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition-colors"
                          >
                            Back to Events
                          </button>
                        </div>

                        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead className="bg-white/10 border-b border-white/10">
                                <tr>
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Participant</th>
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Registration Date</th>
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/10">
                                {registrations.map((registration) => (
                                  <tr key={registration._id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                          <span className="text-white text-sm font-bold">
                                            {registration.participant?.username?.charAt(0).toUpperCase()}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="text-white font-medium">
                                            {registration.participant?.fullName || registration.participant?.username}
                                          </p>
                                          <p className="text-gray-400 text-sm">{registration.participant?.email}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-300">
                                      {new Date(registration.registeredOn).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                                        {registration.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4">
                                      {registration.status === 'pending' && (
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => handleRegistrationAction(registration._id, 'approve')}
                                            className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                            title="Approve Registration"
                                          >
                                            <Check className="w-4 h-4" />
                                          </button>
                                          <button
                                            onClick={() => handleRegistrationAction(registration._id, 'reject')}
                                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                            title="Reject Registration"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-gray-300 mb-6">Select an event to view its registrations:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {myEvents.map((event) => (
                            <button
                              key={event._id}
                              onClick={() => fetchEventRegistrations(event._id)}
                              className="text-left p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                            >
                              <h4 className="text-white font-medium mb-2">{event.title}</h4>
                              <p className="text-gray-400 text-sm">
                                {event.slotCounts?.confirmed || 0} registrations
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      Event Analytics
                    </h2>

                    {organizerStats && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h3 className="text-lg font-semibold text-white mb-4">Attendance Rate</h3>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-green-400 mb-2">
                              {organizerStats.attendance?.present && organizerStats.attendance?.present + organizerStats.attendance?.absent > 0
                                ? Math.round((organizerStats.attendance.present / (organizerStats.attendance.present + organizerStats.attendance.absent)) * 100)
                                : 0}%
                            </div>
                            <p className="text-gray-400 text-sm">
                              {organizerStats.attendance?.present || 0} present, {organizerStats.attendance?.absent || 0} absent
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h3 className="text-lg font-semibold text-white mb-4">Registration Rate</h3>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-blue-400 mb-2">
                              {organizerStats.registrations?.approved && organizerStats.registrations?.total > 0
                                ? Math.round((organizerStats.registrations.approved / organizerStats.registrations.total) * 100)
                                : 0}%
                            </div>
                            <p className="text-gray-400 text-sm">
                              {organizerStats.registrations?.approved || 0} approved of {organizerStats.registrations?.total || 0} total
                            </p>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h3 className="text-lg font-semibold text-white mb-4">Event Views</h3>
                          <div className="text-center">
                            <div className="text-4xl font-bold text-purple-400 mb-2">
                              {organizerStats.views?.total || 0}
                            </div>
                            <p className="text-gray-400 text-sm">Total event page views</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default OrganizerDashboard;
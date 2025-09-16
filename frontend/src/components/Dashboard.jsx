import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  Award,
  Settings,
  Clock,
  MapPin,
  Star,
  TrendingUp,
  BookOpen,
  Image,
  Bell,
  CheckCircle,
  User,
  Mail,
  Phone,
  Building,
  Hash,
  Shield,
  Activity,
  Eye,
  Download,
  Bookmark,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { eventsAPI } from '../services/eventService';
import { statsService, registrationService, certificateService, bookmarkService } from '../services/apiServices';
import { toast } from 'react-hot-toast';
import ErrorBoundary from './ErrorBoundary';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userStats, setUserStats] = useState({
    registeredEvents: 0,
    attendedEvents: 0,
    certificatesEarned: 0,
    savedEvents: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  // Refresh dashboard data when user returns to the tab/page
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && user && !loading) {
        fetchDashboardData();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && user && !loading) {
        fetchDashboardData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user, loading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user statistics based on role
      let stats = {};
      if (user.role === 'participant') {
        stats = await statsService.getParticipantStats();
      } else if (user.role === 'organizer') {
        stats = await statsService.getOrganizerStats();
      } else if (user.role === 'admin') {
        stats = await statsService.getAdminStats();
      }

      console.log("Dashboard Stats Response:", stats);
      
      const newUserStats = {
        registeredEvents: stats.registrations?.total || 0,
        attendedEvents: stats.completedEvents?.total || stats.attendance?.present || 0,
        certificatesEarned: stats.certificates?.total || 0,
        savedEvents: stats.bookmarks?.events || 0,
      };
      
      console.log("Setting user stats:", newUserStats);
      setUserStats(newUserStats);

      // Fetch recent registrations for activity
      if (user.role === 'participant') {
        const registrations = await registrationService.getUserRegistrations();
        setRecentActivity(registrations.registrations?.slice(0, 5) || []);
      }

      // Fetch upcoming events
      const events = await eventsAPI.getAll({ limit: 6, status: 'approved' });
      setUpcomingEvents(events.events?.slice(0, 6) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'participant':
        return 'Participant';
      case 'organizer':
        return 'Organizer';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  const getQuickActions = () => {
    const baseActions = [
      {
        title: 'Browse Events',
        description: 'Discover upcoming events',
        icon: Calendar,
        color: 'from-purple-500 to-purple-600',
        action: () => navigate('/events'),
      },
      {
        title: 'Event Gallery',
        description: 'View event photos and videos',
        icon: Image,
        color: 'from-cyan-500 to-blue-500',
        action: () => navigate('/gallery'),
      },
      {
        title: 'Account Settings',
        description: 'Update your profile',
        icon: Settings,
        color: 'from-green-500 to-teal-500',
        action: () => navigate('/edit-profile'),
      },
    ];

    if (user?.role === 'participant') {
      baseActions.splice(2, 0, {
        title: 'My Certificates',
        description: 'View earned certificates',
        icon: Award,
        color: 'from-yellow-500 to-orange-500',
        action: () => navigate('/dashboard?tab=certificates'),
      });
    }

    if (user?.role === 'organizer') {
      baseActions.unshift({
        title: 'Create Event',
        description: 'Organize a new event',
        icon: Calendar,
        color: 'from-purple-500 to-pink-500',
        action: () => navigate('/create-event'),
      });
    }

    if (user?.role === 'admin') {
      baseActions.unshift({
        title: 'Admin Panel',
        description: 'Manage platform',
        icon: Shield,
        color: 'from-red-500 to-pink-500',
        action: () => navigate('/admin'),
      });
    }

    return baseActions;
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 text-white">
        {/* Enhanced Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div
            className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-green-400/10 to-teal-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
            style={{ animationDelay: "4s" }}
          ></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          {/* Debug Info - Remove after fixing */}
          {!loading && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
              <h3 className="text-red-300 font-bold mb-2">Debug Info (Remove after fixing):</h3>
              <p className="text-red-200 text-sm">userStats: {JSON.stringify(userStats, null, 2)}</p>
              <p className="text-red-200 text-sm">user role: {user?.role}</p>
              <p className="text-red-200 text-sm">loading: {loading.toString()}</p>
              <p className="text-red-200 text-sm">upcomingEvents length: {upcomingEvents.length}</p>
            </div>
          )}

          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Welcome to EventSphere!
                </h1>
                <p className="text-xl text-gray-300">
                  Hello, {user.profile?.firstname || user.fullName?.split(' ')[0] || user.username}! 
                  Ready to explore amazing events?
                </p>
              </div>

              {/* Live Clock */}
              <div className="mt-6 lg:mt-0">
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
                  <div className="text-center">
                    <div className="flex items-center justify-center space-x-2 text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                      <Clock className="w-8 h-8 text-purple-400" />
                      <span>{formatTime(currentTime)}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-sm text-gray-300">
                      <MapPin className="w-4 h-4" />
                      <span>{formatDate(currentTime)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Profile Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {user.fullName || `${user.profile?.firstname || ''} ${user.profile?.lastname || ''}`.trim() || user.username}
                    </h3>
                    <p className="text-purple-300 font-medium">@{user.username}</p>
                    <p className="text-gray-400 text-sm">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-lg font-bold text-white">{getRoleDisplayName(user.role)}</div>
                    <div className="text-xs text-gray-400">Role</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-lg font-bold text-white">{user.department || 'N/A'}</div>
                    <div className="text-xs text-gray-400">Department</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-lg font-bold text-white">
                      {user.emailVerified ? (
                        <span className="text-green-400">Verified Account</span>
                      ) : (
                        <span className="text-yellow-400">Pending Verification</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">Status</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="text-lg font-bold text-white">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-400">Member Since</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Your Stats
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: user.role === 'organizer' ? 'Organized Events' : 'Registered Events',
                  value: userStats.registeredEvents,
                  icon: Calendar,
                  color: 'from-purple-500 to-purple-600',
                  bgColor: 'from-purple-500/20 to-purple-600/20',
                },
                {
                  title: user.role === 'organizer' ? 'Total Participants' : 'Events Attended',
                  value: userStats.attendedEvents,
                  icon: Users,
                  color: 'from-cyan-500 to-blue-500',
                  bgColor: 'from-cyan-500/20 to-blue-500/20',
                },
                {
                  title: 'Certificates Earned',
                  value: userStats.certificatesEarned,
                  icon: Award,
                  color: 'from-yellow-500 to-orange-500',
                  bgColor: 'from-yellow-500/20 to-orange-500/20',
                },
                {
                  title: 'Saved Events',
                  value: userStats.savedEvents,
                  icon: Bookmark,
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

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {getQuickActions().map((action, index) => (
                <motion.button
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={action.action}
                  className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 text-left"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all duration-300">
                    {action.title}
                  </h3>
                  <p className="text-gray-300 text-sm">{action.description}</p>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Recent Activity & Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center">
                <Activity className="w-6 h-6 mr-3 text-purple-400" />
                Recent Activity
              </h3>
              
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div
                      key={activity._id || index}
                      className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">
                          Registered for {activity.event?.title || 'Event'}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {activity.registeredOn ? new Date(activity.registeredOn).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        activity.status === 'approved' ? 'bg-green-500/20 text-green-300' :
                        activity.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {activity.status || 'Pending'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400">No recent activity</p>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-gray-300">Profile Created</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                        <Mail className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-gray-300">
                          {user.emailVerified ? 'Email Verification' : 'Email Verification Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center">
                <Calendar className="w-6 h-6 mr-3 text-cyan-400" />
                Upcoming Events
              </h3>
              
              <div className="space-y-4">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event, index) => (
                    <div
                      key={event._id}
                      className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                      onClick={() => navigate(`/events/${event._id}`)}
                    >
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium line-clamp-1">{event.title}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{event.date ? new Date(event.date).toLocaleDateString() : 'Date TBD'}</span>
                          <span>{event.venue || 'Venue TBD'}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                        {event.category || 'Event'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-400">No upcoming events</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Call to Action Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="mt-12"
          >
            <div className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl text-center">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Ready to Explore Events?
              </h2>
              <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                Discover amazing events happening on campus, connect with fellow students, and make the most of your college experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => navigate('/events')}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl font-semibold text-white hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center justify-center">
                    <Calendar className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    Browse Events
                  </div>
                </button>
                <button
                  onClick={() => navigate('/gallery')}
                  className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-semibold text-white hover:shadow-2xl hover:shadow-cyan-500/50 transform hover:scale-105 transition-all duration-300"
                >
                  <div className="flex items-center justify-center">
                    <Image className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                    Event Gallery
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Dashboard;
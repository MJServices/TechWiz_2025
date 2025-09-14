import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Calendar,
  Award,
  TrendingUp,
  UserPlus,
  Settings,
  Shield,
  Bell,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  Search,
  Filter,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  Building,
  Mail,
  Phone,
  Hash,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  userManagementAPI, 
  organizerAPI, 
  announcementAPI, 
  exportAPI, 
  statsAPI 
} from '../../services/adminService';
import { eventsAPI } from '../../services/eventService';
import { toast } from 'react-hot-toast';
import ErrorBoundary from '../ErrorBoundary';

const AdminDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [organizers, setOrganizers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showCreateOrganizerModal, setShowCreateOrganizerModal] = useState(false);
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);

  // Redirect if not admin
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
    fetchAdminData();
  }, [isAuthenticated, user, navigate]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsResponse, usersResponse, eventsResponse, organizersResponse, announcementsResponse] = await Promise.all([
        statsAPI.getAdminStats(),
        userManagementAPI.getAll(),
        eventsAPI.getAll(),
        organizerAPI.getAll(),
        announcementAPI.getAll()
      ]);

      setAdminStats(statsResponse);
      setUsers(usersResponse.users || []);
      setEvents(eventsResponse.events || []);
      setOrganizers(organizersResponse.organizers || []);
      setAnnouncements(announcementsResponse.announcements || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserRoleUpdate = async (userId, newRole) => {
    try {
      await userManagementAPI.updateRole(userId, newRole);
      toast.success('User role updated successfully');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleUserBlock = async (userId) => {
    try {
      await userManagementAPI.toggleBlock(userId);
      toast.success('User status updated successfully');
      fetchAdminData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleEventApproval = async (eventId, action) => {
    try {
      if (action === 'approve') {
        await eventsAPI.approve(eventId);
        toast.success('Event approved successfully');
      } else {
        await eventsAPI.reject(eventId);
        toast.success('Event rejected successfully');
      }
      fetchAdminData();
    } catch (error) {
      toast.error(`Failed to ${action} event`);
    }
  };

  const handleExport = async (type, format) => {
    try {
      let blob;
      let filename;

      if (type === 'users') {
        if (format === 'pdf') {
          blob = await exportAPI.exportUsersToPDF();
          filename = 'users_report.pdf';
        } else {
          blob = await exportAPI.exportUsersToExcel();
          filename = 'users_report.xlsx';
        }
      } else {
        if (format === 'pdf') {
          blob = await exportAPI.exportEventsToPDF();
          filename = 'events_report.pdf';
        } else {
          blob = await exportAPI.exportEventsToExcel();
          filename = 'events_report.xlsx';
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading admin dashboard...</p>
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
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-xl text-gray-300">
              Manage users, events, and platform settings
            </p>
          </motion.div>

          {/* Stats Overview */}
          {adminStats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Total Users',
                    value: adminStats.users?.total || 0,
                    icon: Users,
                    color: 'from-purple-500 to-purple-600',
                    bgColor: 'from-purple-500/20 to-purple-600/20',
                  },
                  {
                    title: 'Total Events',
                    value: adminStats.events?.total || 0,
                    icon: Calendar,
                    color: 'from-cyan-500 to-blue-500',
                    bgColor: 'from-cyan-500/20 to-blue-500/20',
                  },
                  {
                    title: 'Pending Events',
                    value: adminStats.events?.pending || 0,
                    icon: Clock,
                    color: 'from-yellow-500 to-orange-500',
                    bgColor: 'from-yellow-500/20 to-orange-500/20',
                  },
                  {
                    title: 'Total Registrations',
                    value: adminStats.registrations?.total || 0,
                    icon: Award,
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
                  { id: 'users', label: 'Users', icon: Users },
                  { id: 'events', label: 'Events', icon: Calendar },
                  { id: 'organizers', label: 'Organizers', icon: Shield },
                  { id: 'announcements', label: 'Announcements', icon: Bell },
                  { id: 'exports', label: 'Export Data', icon: Download },
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
                      Platform Overview
                    </h2>
                    
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">User Distribution</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Participants</span>
                            <span className="text-white font-medium">{adminStats?.users?.participants || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Organizers</span>
                            <span className="text-white font-medium">{adminStats?.users?.organizers || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Admins</span>
                            <span className="text-white font-medium">
                              {adminStats?.users?.total - (adminStats?.users?.participants || 0) - (adminStats?.users?.organizers || 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">Event Status</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Approved</span>
                            <span className="text-green-400 font-medium">{adminStats?.events?.approved || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Pending</span>
                            <span className="text-yellow-400 font-medium">{adminStats?.events?.pending || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Total</span>
                            <span className="text-white font-medium">{adminStats?.events?.total || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">Registration Stats</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Approved</span>
                            <span className="text-green-400 font-medium">{adminStats?.registrations?.approved || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Pending</span>
                            <span className="text-yellow-400 font-medium">{adminStats?.registrations?.pending || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Total</span>
                            <span className="text-white font-medium">{adminStats?.registrations?.total || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">Pending Events</h3>
                        <div className="space-y-3">
                          {events.filter(event => event.status === 'pending').slice(0, 5).map((event) => (
                            <div key={event._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                              <div>
                                <p className="text-white font-medium">{event.title}</p>
                                <p className="text-gray-400 text-sm">by {event.organizer?.username}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEventApproval(event._id, 'approve')}
                                  className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEventApproval(event._id, 'reject')}
                                  className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {events.filter(event => event.status === 'pending').length === 0 && (
                            <p className="text-gray-400 text-center py-4">No pending events</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4">Recent Users</h3>
                        <div className="space-y-3">
                          {users.slice(0, 5).map((user) => (
                            <div key={user._id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">
                                    {user.username?.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-white font-medium">{user.fullName || user.username}</p>
                                  <p className="text-gray-400 text-sm">{user.role}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                user.emailVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                              }`}>
                                {user.emailVerified ? 'Verified' : 'Pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                        User Management
                      </h2>
                      <div className="flex items-center space-x-4 mt-4 sm:mt-0">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400"
                          />
                        </div>
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value)}
                          className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400"
                        >
                          <option value="all" className="bg-slate-800">All Roles</option>
                          <option value="participant" className="bg-slate-800">Participants</option>
                          <option value="organizer" className="bg-slate-800">Organizers</option>
                          <option value="admin" className="bg-slate-800">Admins</option>
                        </select>
                      </div>
                    </div>

                    {/* Users Table */}
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white/10 border-b border-white/10">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">User</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Role</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Department</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {users
                              .filter(user => 
                                (selectedRole === 'all' || user.role === selectedRole) &&
                                (searchTerm === '' || 
                                  user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  user.email?.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                              )
                              .map((user) => (
                                <tr key={user._id} className="hover:bg-white/5 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                        <span className="text-white font-bold">
                                          {user.username?.charAt(0).toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="text-white font-medium">{user.fullName || user.username}</p>
                                        <p className="text-gray-400 text-sm">{user.email}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <select
                                      value={user.role}
                                      onChange={(e) => handleUserRoleUpdate(user._id, e.target.value)}
                                      className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-purple-400"
                                    >
                                      <option value="participant" className="bg-slate-800">Participant</option>
                                      <option value="organizer" className="bg-slate-800">Organizer</option>
                                      <option value="admin" className="bg-slate-800">Admin</option>
                                    </select>
                                  </td>
                                  <td className="px-6 py-4 text-gray-300">{user.department || 'N/A'}</td>
                                  <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      user.emailVerified 
                                        ? 'bg-green-500/20 text-green-400' 
                                        : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                      {user.emailVerified ? 'Verified' : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleUserBlock(user._id)}
                                        className={`p-2 rounded-lg transition-colors ${
                                          user.isBlocked
                                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                        }`}
                                        title={user.isBlocked ? 'Unblock User' : 'Block User'}
                                      >
                                        {user.isBlocked ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Events Tab */}
                {activeTab === 'events' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      Event Management
                    </h2>

                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white/10 border-b border-white/10">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Event</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Organizer</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Date</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {events.map((event) => (
                              <tr key={event._id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                  <div>
                                    <p className="text-white font-medium">{event.title}</p>
                                    <p className="text-gray-400 text-sm">{event.category}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                  {event.organizer?.username || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 text-gray-300">
                                  {event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    event.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                                    event.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                    event.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {event.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => navigate(`/events/${event._id}`)}
                                      className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                      title="View Event"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    {event.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleEventApproval(event._id, 'approve')}
                                          className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                          title="Approve Event"
                                        >
                                          <Check className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleEventApproval(event._id, 'reject')}
                                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                          title="Reject Event"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Export Tab */}
                {activeTab === 'exports' && (
                  <div>
                    <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                      Export Data
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Users Export */}
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Users className="w-5 h-5 mr-2 text-purple-400" />
                          Export Users
                        </h3>
                        <p className="text-gray-300 text-sm mb-6">
                          Export user data including profiles, roles, and registration information.
                        </p>
                        <div className="space-y-3">
                          <button
                            onClick={() => handleExport('users', 'pdf')}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Export as PDF</span>
                          </button>
                          <button
                            onClick={() => handleExport('users', 'excel')}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span>Export as Excel</span>
                          </button>
                        </div>
                      </div>

                      {/* Events Export */}
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                          <Calendar className="w-5 h-5 mr-2 text-cyan-400" />
                          Export Events
                        </h3>
                        <p className="text-gray-300 text-sm mb-6">
                          Export event data including details, registrations, and analytics.
                        </p>
                        <div className="space-y-3">
                          <button
                            onClick={() => handleExport('events', 'pdf')}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Export as PDF</span>
                          </button>
                          <button
                            onClick={() => handleExport('events', 'excel')}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span>Export as Excel</span>
                          </button>
                        </div>
                      </div>
                    </div>
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

export default AdminDashboard;
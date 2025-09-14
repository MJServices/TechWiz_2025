import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { announcementAPI } from '../services/adminService';
import { toast } from 'react-hot-toast';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, expired
  const { user } = useAuth();

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};

      if (filter === 'active') {
        params.status = 'active';
      } else if (filter === 'expired') {
        params.status = 'expired';
      }

      const response = await announcementAPI.getAll(params);
      setAnnouncements(response.announcements || []);
    } catch (error) {
      console.error('Failed to fetch announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (user) {
      fetchAnnouncements();
    }
  }, [user, fetchAnnouncements]);

  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 1: return {
        color: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: '🟢',
        label: 'Low Priority',
        bgGradient: 'from-green-500/10 to-emerald-500/5'
      };
      case 2: return {
        color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: '🟡',
        label: 'Medium-Low Priority',
        bgGradient: 'from-yellow-500/10 to-orange-500/5'
      };
      case 3: return {
        color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        icon: '🟠',
        label: 'Medium Priority',
        bgGradient: 'from-orange-500/10 to-red-500/5'
      };
      case 4: return {
        color: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: '🔴',
        label: 'High Priority',
        bgGradient: 'from-red-500/10 to-pink-500/5'
      };
      case 5: return {
        color: 'bg-red-600/20 text-red-300 border-red-600/30',
        icon: '🚨',
        label: 'Urgent Priority',
        bgGradient: 'from-red-600/10 to-purple-500/5'
      };
      default: return {
        color: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        icon: '⚪',
        label: 'Unknown Priority',
        bgGradient: 'from-gray-500/10 to-slate-500/5'
      };
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            📢 Announcements
          </h1>
          <p className="text-gray-300 text-lg">Stay updated with the latest news and important information</p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 bg-white/5 backdrop-blur-xl rounded-2xl p-2 border border-white/10">
            {[
              { key: 'all', label: 'All Announcements', icon: '📋' },
              { key: 'active', label: 'Active', icon: '✅' },
              { key: 'expired', label: 'Expired', icon: '⏰' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                  filter === tab.key
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-6">
          {announcements.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">📭</div>
              <h3 className="text-2xl font-semibold text-gray-300 mb-2">No announcements found</h3>
              <p className="text-gray-400 max-w-md mx-auto">
                {filter === 'all'
                  ? "There are no announcements at the moment. Check back later for updates!"
                  : `No ${filter} announcements available.`
                }
              </p>
            </div>
          ) : (
            announcements.map((announcement) => {
              const priorityConfig = getPriorityConfig(announcement.priority);
              const isExpired = announcement.expiresAt && new Date(announcement.expiresAt) < new Date();

              return (
                <div
                  key={announcement._id}
                  className={`bg-gradient-to-br ${priorityConfig.bgGradient} from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                    isExpired ? 'opacity-60' : ''
                  }`}
                >
                  {/* Priority Banner */}
                  <div className={`px-6 py-3 ${priorityConfig.color} border-b border-white/10`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{priorityConfig.icon}</span>
                        <span className="font-semibold">{priorityConfig.label}</span>
                        <span className="text-sm opacity-75">•</span>
                        <span className="text-sm">{getTypeIcon(announcement.type)} {announcement.type}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        {isExpired && (
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full border border-red-500/30">
                            ⏰ Expired
                          </span>
                        )}
                        {!announcement.isActive && !isExpired && (
                          <span className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-full border border-gray-500/30">
                            ⏸️ Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8">
                    {/* Title */}
                    <h2 className="text-2xl font-bold text-white mb-4 leading-tight">
                      {announcement.title}
                    </h2>

                    {/* Content */}
                    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 mb-6">
                      <div
                        className="text-gray-200 leading-relaxed prose prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: announcement.content }}
                      />
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-400">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <span>👤</span>
                          <span>{announcement.createdBy?.username || 'System'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>📅</span>
                          <span>{formatDate(announcement.createdAt)}</span>
                        </div>
                        {announcement.expiresAt && (
                          <div className="flex items-center space-x-2">
                            <span>⏰</span>
                            <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                          </div>
                        )}
                        {announcement.eventId && (
                          <div className="flex items-center space-x-2">
                            <span>🎪</span>
                            <span>{announcement.eventId.title}</span>
                          </div>
                        )}
                      </div>

                      {/* Announcement ID */}
                      <div className="text-xs text-gray-500 font-mono">
                        ID: {announcement._id.slice(-8)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {announcements.length > 0 && (
          <div className="mt-12 text-center">
            <p className="text-gray-400">
              Showing {announcements.length} announcement{announcements.length !== 1 ? 's' : ''}
              {filter !== 'all' && ` (${filter})`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
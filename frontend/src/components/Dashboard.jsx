import { useEffect, useState, useMemo, memo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { bookmarkService, statsService } from "../services/apiServices";

// Function to get display name for user role
const getRoleDisplayName = (role) => {
  switch (role) {
    case 'participant':
      return 'Participant';
    case 'organizer':
      return 'Organizer';
    case 'admin':
      return 'Admin';
    default:
      return 'User';
  }
};
import {
  Clock,
  Calendar,
  User,
  CheckCircle,
  Palette,
  Home,
  TrendingUp,
  ArrowRight,
  Eye,
  Users,
  Settings,
  Upload,
  Activity,
  Mail,
  Phone,
  Edit3,
  Award,
  Bookmark,
  X,
  Star,
} from "lucide-react";
import { motion } from "framer-motion";
import ErrorBoundary from "./ErrorBoundary";

// ReviewModal available; hook up in a dedicated designer profile page later

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);
  // const [showReviewModal, setShowReviewModal] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [openRequests, setOpenRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [selectedSaved, setSelectedSaved] = useState(null);
  const [savedDesignsLoading, setSavedDesignsLoading] = useState(false);
  const [savedDesignsError, setSavedDesignsError] = useState(null);
  const [removingDesign, setRemovingDesign] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);

  const timeAgo = (timestamp) => {
    if (!timestamp) return "Just now";
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const getNotifVisuals = (type) => {
    switch (type) {
      case "project_update":
      case "project_assigned":
      case "project_completed":
        return {
          icon: <Home className="w-5 h-5" />,
          color: "from-purple-500 to-purple-600",
        };
      case "consultation_scheduled":
      case "consultation_reminder":
      case "consultation_cancelled":
        return {
          icon: <Calendar className="w-5 h-5" />,
          color: "from-purple-500 to-purple-600",
        };
      case "review_received":
        return {
          icon: <Award className="w-5 h-5" />,
          color: "from-purple-500 to-purple-600",
        };
      case "message_received":
        return {
          icon: <Mail className="w-5 h-5" />,
          color: "from-purple-500 to-purple-600",
        };
      case "system_announcement":
      case "welcome":
        return {
          icon: <Activity className="w-5 h-5" />,
          color: "from-purple-500 to-purple-600",
        };
      default:
        return {
          icon: <Activity className="w-5 h-5" />,
          color: "from-purple-500 to-purple-600",
        };
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    setIsVisible(true);

    return () => clearInterval(timer);
  }, []);

  // Function to fetch dashboard stats
  const fetchDashboardStats = async () => {
    if (!isAuthenticated || !user) return;

    setStatsLoading(true);
    setStatsError(null);

    try {
      // Fetch user-specific stats based on role
      let userStats = {};
      if (user.role === 'participant') {
        userStats = await statsService.getParticipantStats();
      } else if (user.role === 'organizer') {
        userStats = await statsService.getOrganizerStats();
      } else if (user.role === 'admin') {
        userStats = await statsService.getAdminStats();
      }

      // Structure dashboard data based on user role
      const dashboardData = {
        student: user.role === 'participant' ? {
          registered_events: userStats.registrations?.total || 0
        } : undefined,
        organizer: user.role === 'organizer' ? {
          organized_events: userStats.events?.total || 0
        } : undefined,
        certificates: {
          count: userStats.certificates?.total || 0
        },
        attended_events: {
          count: userStats.completedEvents?.total || 0
        },
        saved_designs: { count: 0 }, // Will be updated separately
        notifications: { recent: [] },
      };

      setDashboard(dashboardData);
    } catch (error) {
      console.error("Failed to load dashboard stats", error);
      setStatsError("Failed to load statistics. Please try again.");
      // Fallback to empty data if fetch fails
      setDashboard({
        student: user.role === 'participant' ? { registered_events: 0 } : undefined,
        organizer: user.role === 'organizer' ? { organized_events: 0 } : undefined,
        certificates: { count: 0 },
        attended_events: { count: 0 },
        saved_designs: { count: 0 },
        notifications: { recent: [] },
      });
    } finally {
      setStatsLoading(false);
    }
  };

  // Function to fetch saved designs
  const fetchSavedDesigns = async () => {
    setSavedDesignsLoading(true);
    setSavedDesignsError(null);

    try {
      const savedMediaResponse = await bookmarkService.getBookmarkedMedia({ limit: 10 });
      const savedDesignsData = savedMediaResponse.media.map(item => ({
        ...item,
        gallery_id: item._id,
        thumbnail_url: item.thumbnailUrl || item.fileUrl,
        image_url: item.fileUrl,
        title: item.title || 'Untitled Design',
        description: item.description || item.caption || 'No description available',
        uploader: {
          username: item.uploadedBy?.username || 'Unknown'
        },
        tags: item.tags || []
      }));

      setSavedDesigns(savedDesignsData);
      // Update count in dashboard
      setDashboard(prev => prev ? {
        ...prev,
        saved_designs: { count: savedDesignsData.length }
      } : prev);
    } catch (error) {
      console.error("Failed to load saved designs", error);
      setSavedDesignsError("Failed to load saved designs. Please try again.");
      setSavedDesigns([]);
    } finally {
      setSavedDesignsLoading(false);
    }
  };

  // Function to handle removing saved design
  const handleRemoveSavedDesign = async (designId) => {
    if (!window.confirm('Are you sure you want to remove this design from your saved list?')) {
      return;
    }

    setRemovingDesign(designId);

    try {
      await bookmarkService.removeMediaBookmark(designId);
      setSavedDesigns(prev => prev.filter(item => (item._id || item.gallery_id) !== designId));
      // Update count in dashboard
      setDashboard(prev => prev ? {
        ...prev,
        saved_designs: { count: prev.saved_designs.count - 1 }
      } : prev);
    } catch (error) {
      console.error("Failed to remove saved design", error);
      alert("Failed to remove design. Please try again.");
    } finally {
      setRemovingDesign(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Initial fetch
    fetchDashboardStats();
    fetchSavedDesigns();

    // Set up polling for real-time updates (every 30 seconds)
    const statsInterval = setInterval(fetchDashboardStats, 30000);
    // Poll saved designs less frequently (every 60 seconds)
    const designsInterval = setInterval(fetchSavedDesigns, 60000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(designsInterval);
    };
  }, [isAuthenticated, user?.role]);

  // Update saved designs count when savedDesigns changes
  useEffect(() => {
    setDashboard(prev => prev ? {
      ...prev,
      saved_designs: { count: savedDesigns.length }
    } : prev);
  }, [savedDesigns.length]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-2xl shadow-purple-500/20"></div>
          <p className="text-white text-base sm:text-lg bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleUploadDesign = () => {
    // For now, navigate to gallery where upload functionality will be available
    // Later we can implement a dedicated upload modal or page
    navigate("/gallery");
  };

  const quickActions = useMemo(() => {
    const actions = [
      {
        icon: <Calendar className="w-6 h-6" />,
        title: "Browse Events",
        description: "Discover upcoming events",
        color: "from-purple-500 to-purple-600",
        bgGradient: "from-purple-500/20 to-purple-600/20",
        action: () => navigate("/events"),
      },
      {
        icon: <Palette className="w-6 h-6" />,
        title: "Event Gallery",
        description: "View event photos and videos",
        color: "from-purple-500 to-purple-600",
        bgGradient: "from-purple-500/20 to-purple-600/20",
        action: () => navigate("/gallery"),
      },
      {
        icon: <Award className="w-6 h-6" />,
        title: "My Certificates",
        description: "Download your certificates",
        color: "from-purple-500 to-purple-600",
        bgGradient: "from-purple-500/20 to-purple-600/20",
        action: () => console.log("Certificates would open"),
      },
      {
        icon: <Settings className="w-6 h-6" />,
        title: "Account Settings",
        description: "Manage your profile",
        color: "from-purple-500 to-purple-600",
        bgGradient: "from-purple-500/20 to-purple-600/20",
        action: () => navigate("/edit-profile"),
      },
    ];

    if (user) {
      actions.push({
        icon: <Star className="w-6 h-6" />,
        title: "Event Feedback",
        description: "Share feedback on events",
        color: "from-purple-500 to-purple-600",
        bgGradient: "from-purple-500/20 to-purple-600/20",
        action: () => console.log("Event feedback would open"),
      });
    }

    return actions;
  }, [user, navigate]);

  const isStudent = user.role === "student" || user.role === "user";
  const isOrganizer = user.role === "organizer" || user.role === "admin";

  const registeredEvents = isStudent
    ? dashboard?.student?.registered_events || 0
    : 0;
  const organizedEvents = isOrganizer
    ? dashboard?.organizer?.organized_events || 0
    : 0;
  const certificatesEarned = dashboard?.certificates?.count ?? 0;
  const eventsAttended = dashboard?.attended_events?.count ?? 0;

  const stats = useMemo(() => [
    {
      number: String(registeredEvents + organizedEvents),
      label: isStudent ? "Registered Events" : "Organized Events",
      icon: <Calendar className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
      change: "+0%",
      trend: "up",
    },
    {
      number: String(eventsAttended),
      label: "Events Attended",
      icon: <Users className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
      change: "+0%",
      trend: "up",
    },
    {
      number: String(certificatesEarned),
      label: "Certificates Earned",
      icon: <Award className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
      change: "+0%",
      trend: "up",
    },
    {
      number: String(savedDesigns.length),
      label: "Saved Designs",
      icon: <Bookmark className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
      change: "+0%",
      trend: "up",
    },
  ], [registeredEvents, organizedEvents, isStudent, eventsAttended, certificatesEarned, savedDesigns.length]);

  const recentActivity = useMemo(() => {
    if (dashboard?.notifications?.recent && dashboard.notifications.recent.length > 0) {
      return dashboard.notifications.recent.map((n) => {
        const visuals = getNotifVisuals(n.type);
        return {
          icon: visuals.icon,
          title: n.title,
          description: n.message,
          time: timeAgo(n.created_at),
          color: visuals.color,
        };
      });
    } else {
      return [
        {
          icon: <User className="w-5 h-5" />,
          title: "Profile Created",
          description: "Welcome to EventSphere!",
          time: "Just now",
          color: "from-purple-500 to-purple-600",
        },
        {
          icon: <Mail className="w-5 h-5" />,
          title: "Email Verification",
          description: user.emailVerified
            ? "Email verified successfully"
            : "Please verify your email",
          time: "Recently",
          color: user.emailVerified
            ? "from-purple-500 to-purple-600"
            : "from-purple-500 to-purple-600",
        },
      ];
    }
  }, [dashboard?.notifications?.recent, user.emailVerified]);

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-white relative overflow-hidden animate-fade-in">
      {/* Enhanced Glassmorphism Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/15 to-purple-600/15 rounded-full blur-3xl animate-pulse backdrop-blur-xl"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-purple-500/10 rounded-full blur-3xl animate-pulse backdrop-blur-xl"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-purple-300/10 to-purple-400/10 rounded-full blur-3xl animate-pulse backdrop-blur-xl"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      {/* Floating Geometric Shapes with Glassmorphism */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/6 w-16 h-16 border-2 border-purple-400/40 backdrop-blur-xl bg-white/10 rotate-45 animate-spin rounded-lg shadow-2xl shadow-purple-500/20"
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className="absolute bottom-1/3 right-1/6 w-12 h-12 bg-gradient-to-r from-purple-400/20 to-purple-500/20 backdrop-blur-xl rounded-full border border-purple-400/40 shadow-lg shadow-purple-500/20"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <header>
          <motion.div
          className={`mb-8 transform transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
          }`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Welcome to EventSphere!
              </h1>
              <p className="text-lg sm:text-xl text-gray-300">
                Hello,{" "}
                <span className="bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent font-semibold">
                  {user.profile?.firstname ||
                    user.firstName ||
                    user.username ||
                    "User"}
                </span>
                ! Ready to explore exciting events?
              </p>
            </div>

            <div className="flex items-center space-x-6 mt-6 lg:mt-0">
              <div className="text-right">
                <div className="flex items-center space-x-3 text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2">
                  <Clock className="w-6 h-6 text-purple-400" />
                  <span>{formatTime(currentTime)}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(currentTime)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        </header>

        <section>
          <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Profile & Quick Actions */}
          <div className="flex-1 space-y-8">
            {/* User Profile Card */}
            <motion.div
              className={`bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-3xl p-10 border border-purple-700/30 shadow-2xl shadow-purple-900/30 overflow-hidden transform transition-all duration-1000 delay-200 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-20 opacity-0"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                      <User className="w-10 h-10 text-white" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center border-4 border-slate-900">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                      {user.profile?.firstname || user.firstName || "User"}{" "}
                      {user.profile?.lastname || user.lastName || ""}
                    </h3>
                    <p className="text-gray-400 text-sm">@{user.username}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          user.emailVerified ? "bg-purple-400" : "bg-purple-500"
                        }`}
                      ></div>
                      <span
                        className={`text-sm ${
                          user.emailVerified
                            ? "text-purple-400"
                            : "text-purple-500"
                        }`}
                      >
                        {user.emailVerified
                          ? "Verified Account"
                          : "Pending Verification"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/edit-profile")}
                  className="p-3 bg-gradient-to-r from-purple-800/15 to-purple-900/15 backdrop-blur-lg rounded-xl border border-purple-700/20 hover:border-purple-600/50 transition-all duration-300 hover:scale-105"
                  aria-label="Edit profile"
                >
                  <Edit3 className="w-5 h-5 text-purple-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-800/15 to-purple-900/15 backdrop-blur-lg rounded-xl border border-purple-700/20">
                  <Mail className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white font-medium text-sm">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-800/15 to-purple-900/15 backdrop-blur-lg rounded-xl border border-purple-700/20">
                  <Award className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Role</p>
                    <p className="text-white font-medium text-sm">
                      {getRoleDisplayName(user.role)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-800/15 to-purple-900/15 backdrop-blur-lg rounded-xl border border-purple-700/20">
                  <Phone className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Contact</p>
                    <p className="text-white font-medium text-sm">
                      {user.profile?.contactNumber || "Not provided"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-800/15 to-purple-900/15 backdrop-blur-lg rounded-xl border border-purple-700/20">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Member Since</p>
                    <p className="text-white font-medium text-sm">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "Recently"}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              className={`transform transition-all duration-1000 delay-400 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-20 opacity-0"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-xl sm:text-2xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
                {quickActions.map((action, index) => (
                  <motion.button
                    key={index}
                    onClick={action.action}
                    className="group relative bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-700/30 hover:border-purple-600/50 transform hover:scale-105 transition-all duration-500 text-left overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${action.bgGradient} opacity-0 group-hover:opacity-100 transition-all duration-500`}
                    ></div>

                    <div className="relative z-10">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 text-white`}
                      >
                        {action.icon}
                      </div>
                      <h4 className="text-base sm:text-lg font-semibold mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-purple-500 group-hover:bg-clip-text transition-all duration-300">
                        {action.title}
                      </h4>
                      <p className="text-gray-400 group-hover:text-gray-300 transition-all duration-300 text-sm">
                        {action.description}
                      </p>
                    </div>

                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <ArrowRight className="w-5 h-5 text-purple-400" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column - Stats, Requests & Activity */}
          <div className="w-full lg:w-80 xl:w-96 space-y-8">
            {/* Stats Cards */}
            <motion.div
              className={`bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-3xl p-10 min-h-[350px] border border-purple-700/30 shadow-2xl shadow-purple-900/30 transform transition-all duration-1000 delay-600 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-20 opacity-0"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                    Your Stats
                  </h3>
                  <p className="text-gray-400 text-sm">Activity overview</p>
                </div>
              </div>

              {statsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-400">Loading statistics...</span>
                </div>
              ) : statsError ? (
                <div className="text-center py-12">
                  <div className="text-red-400 mb-4">
                    <X className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">{statsError}</p>
                  </div>
                  <button
                    onClick={fetchDashboardStats}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white text-sm hover:opacity-90 transition-all duration-300"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {stats.map((stat, index) => (
                    <div
                      key={index}
                      className="group p-4 bg-gradient-to-r from-purple-800/15 to-purple-900/15 backdrop-blur-lg rounded-xl border border-purple-700/20 hover:border-purple-600/40 transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center text-white`}
                          >
                            {stat.icon}
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">{stat.label}</p>
                            <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                              {stat.number}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-sm ${
                              stat.trend === "up"
                                ? "text-purple-400"
                                : "text-purple-500"
                            }`}
                          >
                            {stat.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {(user.role === "designer" ||
              user.role === "designer-pending" ||
              user.role === "admin") && (
              <motion.div
                className={`bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-700/30 shadow-2xl shadow-purple-900/30 transform transition-all duration-1000 delay-700 ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-20 opacity-0"
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                      Consultation Requests
                    </h3>
                    <p className="text-gray-400 text-sm">
                      New requests from clients
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {openRequests.length === 0 && (
                    <div className="p-4 bg-gradient-to-r from-purple-800/15 to-purple-900/15 backdrop-blur-lg rounded-xl border border-purple-700/20 text-gray-400">
                      No open requests right now.
                    </div>
                  )}
                  {openRequests.map((req, index) => (
                    <button
                      key={req.consultation_id || index}
                      onClick={() => setSelectedRequest(req)}
                      className="w-full text-left p-4 bg-gradient-to-r from-purple-800/15 to-purple-900/15 backdrop-blur-lg rounded-xl border border-purple-700/20 hover:border-purple-400/40 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-white">
                            {req.title || "Consultation Request"}
                          </h4>
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {req.description || "No description"}
                          </p>
                          <div className="mt-2 text-xs text-gray-500 flex items-center space-x-3">
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>
                                {req.client?.profile?.firstname}{" "}
                                {req.client?.profile?.lastname}
                              </span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {req.scheduled_date
                                  ? new Date(
                                      req.scheduled_date
                                    ).toLocaleString()
                                  : "TBD"}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Saved Designs */}
            <motion.div
              className={`bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-700/30 shadow-2xl shadow-purple-900/30 transform transition-all duration-1000 delay-750 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-20 opacity-0"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.75 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Bookmark className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                      Saved Designs
                    </h3>
                    <p className="text-gray-400 text-sm">Your favorite designs ({savedDesigns.length})</p>
                  </div>
                </div>
                {savedDesigns.length > 6 && (
                  <button
                    onClick={() => navigate("/gallery?tab=saved")}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors duration-300 flex items-center space-x-1"
                  >
                    <span>View All</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {savedDesignsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-400">Loading saved designs...</span>
                </div>
              ) : savedDesignsError ? (
                <div className="text-center py-12">
                  <div className="text-red-400 mb-4">
                    <X className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">{savedDesignsError}</p>
                  </div>
                  <button
                    onClick={fetchSavedDesigns}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-white text-sm hover:opacity-90 transition-all duration-300"
                  >
                    Retry
                  </button>
                </div>
              ) : savedDesigns.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-800/20 to-purple-900/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-700/20">
                    <Bookmark className="w-10 h-10 text-purple-400" />
                  </div>
                  <p className="text-gray-400 mb-4">No saved designs yet</p>
                  <button
                    onClick={() => navigate("/gallery")}
                    className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl text-white text-sm hover:opacity-90 transition-all duration-300 hover:scale-105"
                  >
                    Browse Gallery
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedDesigns.slice(0, 6).map((item, idx) => (
                    <motion.button
                      key={item._id || item.gallery_id || idx}
                      onClick={() => setSelectedSaved(item)}
                      className="group relative bg-gradient-to-br from-purple-800/15 to-purple-900/15 backdrop-blur-lg rounded-2xl border border-purple-700/20 hover:border-purple-400/50 transition-all duration-300 overflow-hidden hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.1 }}
                    >
                      <div className="aspect-square relative overflow-hidden rounded-t-2xl">
                        <img
                          src={item.thumbnailUrl || item.thumbnail_url || item.fileUrl || item.image_url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveSavedDesign(item._id || item.gallery_id);
                            }}
                            className="w-8 h-8 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500 transition-colors duration-300"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-white font-medium text-sm line-clamp-2 mb-2 group-hover:text-purple-300 transition-colors duration-300">
                          {item.title || 'Untitled Design'}
                        </h4>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">
                            by {item.uploadedBy?.username || item.uploader?.username || 'Unknown'}
                          </p>
                          <div className="flex items-center space-x-1">
                            <Eye className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-500">{item.viewCount || 0}</span>
                          </div>
                        </div>
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.tags.slice(0, 2).map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className="px-2 py-1 bg-purple-800/30 rounded-full text-xs text-purple-300 border border-purple-600/20"
                              >
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 2 && (
                              <span className="px-2 py-1 bg-gray-800/30 rounded-full text-xs text-gray-400">
                                +{item.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              className={`bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-700/30 shadow-2xl shadow-purple-900/30 transform transition-all duration-1000 delay-800 ${
                isVisible
                  ? "translate-y-0 opacity-100"
                  : "translate-y-20 opacity-0"
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                    Recent Activity
                  </h3>
                  <p className="text-gray-400 text-sm">Latest updates</p>
                </div>
              </div>

              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-3 p-4 bg-gradient-to-r from-purple-800/15 to-purple-900/15 backdrop-blur-lg rounded-xl border border-purple-700/20"
                  >
                    <div
                      className={`w-8 h-8 bg-gradient-to-r ${activity.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}
                    >
                      {activity.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-white">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
          </div>

          {/* Call to Action */}
          <motion.div
            className={`mt-8 text-center transform transition-all duration-1000 delay-1000 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            <div className="bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-3xl p-10 border border-purple-700/30 shadow-2xl shadow-purple-900/30">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Ready to Explore Events?
              </h3>
              <p className="text-base sm:text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
                Discover exciting college events, register for competitions, and
                be part of the campus community with EventSphere.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button
                  onClick={() => navigate("/events")}
                  className="group relative px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transform hover:scale-105 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                  <span className="relative z-10 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Browse Events
                  </span>
                </button>
                <button
                  onClick={() => navigate("/gallery")}
                  className="group relative px-8 py-4 bg-gradient-to-r from-purple-800/15 to-purple-900/15 backdrop-blur-lg rounded-2xl font-semibold border border-purple-700/20 hover:border-purple-600/50 transform hover:scale-105 transition-all duration-500"
                >
                  <span className="flex items-center">
                    <Palette className="w-5 h-5 mr-2" />
                    Event Gallery
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </section>
      </div>

      {selectedSaved && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-3xl border border-purple-700/30 shadow-2xl shadow-purple-900/50"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent mb-2">
                    Design Details
                  </h3>
                  <p className="text-gray-400 text-sm">Saved design information</p>
                </div>
                <button
                  onClick={() => setSelectedSaved(null)}
                  className="p-3 rounded-xl bg-purple-800/15 hover:bg-purple-900/15 transition-all duration-300 hover:scale-105 border border-purple-700/20"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="relative group">
                    <img
                      src={selectedSaved.thumbnailUrl || selectedSaved.thumbnail_url || selectedSaved.fileUrl || selectedSaved.image_url}
                      alt={selectedSaved.title}
                      className="w-full aspect-square object-cover rounded-2xl shadow-2xl shadow-purple-900/30"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-purple-800/15 to-purple-900/15 backdrop-blur-lg rounded-xl p-4 border border-purple-700/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <Eye className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-gray-400">Views</span>
                      </div>
                      <p className="text-white font-semibold">{selectedSaved.viewCount || 0}</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-800/15 to-purple-900/15 backdrop-blur-lg rounded-xl p-4 border border-purple-700/20">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-gray-400">Likes</span>
                      </div>
                      <p className="text-white font-semibold">{selectedSaved.likeCount || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-gray-400 text-sm font-medium">Title</label>
                    <p className="text-white font-semibold text-lg mt-1">
                      {selectedSaved.title || 'Untitled Design'}
                    </p>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm font-medium">Description</label>
                    <p className="text-gray-300 mt-1 leading-relaxed">
                      {selectedSaved.description || selectedSaved.caption || "No description provided."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-400 text-sm font-medium">Designer</label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white font-medium">
                          {selectedSaved.uploadedBy?.username || selectedSaved.uploader?.username || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-400 text-sm font-medium">Category</label>
                      <p className="text-white mt-1 capitalize">
                        {selectedSaved.category || 'Other'}
                      </p>
                    </div>
                  </div>

                  {selectedSaved.style && (
                    <div>
                      <label className="text-gray-400 text-sm font-medium">Style</label>
                      <p className="text-white mt-1 capitalize">
                        {selectedSaved.style}
                      </p>
                    </div>
                  )}

                  {selectedSaved.tags && selectedSaved.tags.length > 0 && (
                    <div>
                      <label className="text-gray-400 text-sm font-medium mb-2 block">Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedSaved.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-gradient-to-r from-purple-800/20 to-purple-900/20 backdrop-blur-sm rounded-full border border-purple-600/30 text-sm text-purple-300 hover:bg-purple-700/30 transition-colors duration-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSaved.colorPalette && selectedSaved.colorPalette.length > 0 && (
                    <div>
                      <label className="text-gray-400 text-sm font-medium mb-2 block">Color Palette</label>
                      <div className="flex flex-wrap gap-2">
                        {selectedSaved.colorPalette.map((color, i) => (
                          <div
                            key={i}
                            className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end pt-6 border-t border-purple-700/20">
                <button
                  onClick={() => setSelectedSaved(null)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-700/20 to-gray-800/20 backdrop-blur-lg border border-gray-600/20 text-gray-300 hover:bg-gray-600/20 transition-all duration-300 hover:scale-105"
                >
                  Close
                </button>
                <button
                  onClick={async () => {
                    const designId = selectedSaved._id || selectedSaved.gallery_id;
                    await handleRemoveSavedDesign(designId);
                    setSelectedSaved(null);
                  }}
                  disabled={removingDesign === (selectedSaved._id || selectedSaved.gallery_id)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {removingDesign === (selectedSaved._id || selectedSaved.gallery_id) ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" />
                      <span>Unsave Design</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-fade-in">
          <div className="w-full max-w-2xl bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-3xl border border-purple-700/30 p-6 transition-all duration-500">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-500 bg-clip-text text-transparent">
                Consultation Details
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-lg bg-purple-800/15 hover:bg-purple-900/15 transition-all duration-300 hover:scale-105"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="space-y-3 text-gray-300">
              <div>
                <span className="text-gray-400 text-sm">Title</span>
                <p className="text-white font-medium text-sm">
                  {selectedRequest.title}
                </p>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Description</span>
                <p className="whitespace-pre-wrap">
                  {selectedRequest.description || "No description provided."}
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-6">
                <div>
                  <span className="text-gray-400 text-sm">Client</span>
                  <p className="text-white">
                    {selectedRequest.client?.profile?.firstname}{" "}
                    {selectedRequest.client?.profile?.lastname} (@
                    {selectedRequest.client?.username})
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Scheduled</span>
                  <p className="text-white">
                    {selectedRequest.scheduled_date
                      ? new Date(
                          selectedRequest.scheduled_date
                        ).toLocaleString()
                      : "TBD"}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={async () => {
                  try {
                    // Mock accept functionality
                    setOpenRequests((prev) =>
                      prev.filter(
                        (r) =>
                          r.consultation_id !== selectedRequest.consultation_id
                      )
                    );
                    setSelectedRequest(null);
                  } catch (e) {
                    console.error("Accept failed", e);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105"
              >
                Accept
              </button>
              <button
                onClick={async () => {
                  try {
                    // Mock cancel functionality
                    setOpenRequests((prev) =>
                      prev.filter(
                        (r) =>
                          r.consultation_id !== selectedRequest.consultation_id
                      )
                    );
                    setSelectedRequest(null);
                  } catch (e) {
                    console.error("Cancel failed", e);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold hover:opacity-90 transition-all duration-300 hover:scale-105"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      </main>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </ErrorBoundary>
  );
};

export default memo(Dashboard);

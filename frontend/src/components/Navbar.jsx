import { useState, useEffect, memo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  Home,
  Search,
  Calendar,
  User,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Users,
  Settings,
  Ticket,
  Info,
  Mail,
  Bell,
  Megaphone,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Notifications from "./Notifications";
import { notificationService } from "../services/apiServices";
import ErrorBoundary from "./ErrorBoundary";

function Navbar() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { isAuthenticated, user, logout, hasApprovedRegistrations } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setIsVisible(true);

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (isAuthenticated && user) {
        try {
          const stats = await notificationService.getNotificationStats();
          setUnreadCount(stats.unread || 0);
        } catch (error) {
          console.error("Failed to fetch notification stats:", error);
        }
      }
    };

    fetchUnreadCount();

    // Set up polling for unread count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'organizer': return 'Organizer';
      case 'participant': return 'Participant';
      default: return 'Participant';
    }
  };

  const navItems = isAuthenticated
    ? [

        { name: "Announcements", href: "/announcements", icon: Megaphone },
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "Gallery", href: "/gallery", icon: Search },
        ...(user?.role === "admin"
          ? [{ name: "Admin", href: "/admin", icon: Settings }]
          : []),
        ...(user?.role === "organizer"
          ? [{ name: "Organizer", href: "/organizer", icon: Users }]
          : []),
      ]
    : [
        { name: "Home", href: "/", icon: Home },
        { name: "Gallery", href: "/gallery", icon: Search },
        { name: "About", href: "/about", icon: Info },
        { name: "Contact", href: "/contact", icon: Mail },
      ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ErrorBoundary>
      {/* Enhanced Glass Morphism Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            scrolled
              ? "backdrop-blur-xl bg-gradient-to-br from-purple-900/20 to-slate-900/20 border-b border-purple-400/20 shadow-glass-soft shadow-purple-500/10"
              : "backdrop-blur-xl bg-gradient-to-br from-purple-900/20 to-slate-900/20"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 pr-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className={`group flex items-center space-x-3 transform transition-all duration-1000 ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "-translate-x-20 opacity-0"
              }`}
            > 
              <div className="relative">
                <Home className="w-8 h-8 text-purple-400 animate-pulse group-hover:text-purple-600 transition-colors duration-300" />
                <div className="absolute inset-0 w-8 h-8 bg-bg-purple-500/20 rounded-full blur-lg group-hover:bg-purple-600/30 transition-all duration-300"></div>
              </div>
              <span className="text-2xl sm:text-3xl lg:text-3xl font-bold bg-gradient-to-br from-purple-900 via-white to-purple-900 bg-clip-text text-transparent group-hover:bg-gradient-to-br group-hover:from-purple-900 group-hover:via-white group-hover:to-purple-900 transition-all duration-500">
                EventsSphare
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center">
              <nav className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 lg:gap-4">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.href ||
                    (item.href.startsWith("#") && location.hash === item.href);

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group relative flex items-center justify-center space-x-2 px-3 py-2 rounded-xl transition-all duration-500 transform hover:scale-110 hover:-translate-y-1 ${
                        isActive
                          ? "bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl text-purple-400 border border-purple-400/30"
                          : "hover:text-purple-400 hover:bg-gradient-to-br hover:from-purple-800 hover:to-purple-700 backdrop-blur-xl"
                      } ${
                        isVisible
                          ? "translate-y-0 opacity-100"
                          : "-translate-y-10 opacity-0"
                      }`}
                      style={{ transitionDelay: `${index * 100}ms` }}
                    >
                      <Icon className="w-4 h-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                      <span className="text-sm font-medium">{item.name}</span>

                      {/* Hover effect */}
                      <span className="absolute -bottom-2 left-0 w-0 h-1 bg-gradient-to-br from-purple-900 via-purple5-900 to-purple-900 transition-all duration-500 group-hover:w-full rounded-full"></span>
                      <span className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900/0 group-hover:bg-gradient-to-br group-hover:from-purple-900 group-hover:via-slate-900 group-hover:to-purple-900/10 rounded-xl transition-all duration-300 -z-10"></span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center">
              <div className="flex items-center gap-2 lg:gap-3">
                {isAuthenticated ? (
                  <>
                    {hasApprovedRegistrations && (
                      <Link
                        to="/dashboard"
                        title="My Tickets"
                        className="group relative p-2 lg:p-3 bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-xl border border-purple-400/30 hover:bg-gradient-to-br hover:from-purple-800/30 hover:to-purple-900/30 transition-all duration-300 hover:scale-110"
                      >
                        <Ticket className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400 group-hover:text-purple-400 transition-colors duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900/20 rounded-xl blur-lg group-hover:bg-gradient-to-br group-hover:from-purple-900 group-hover:via-slate-900 group-hover:to-purple-900/30 transition-all duration-300 -z-10"></div>
                      </Link>
                    )}
                    {/* Notifications Button */}
                    <button
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="group relative p-2 lg:p-3 bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-xl border border-purple-400/30 hover:bg-gradient-to-br hover:from-purple-800/30 hover:to-purple-900/30 transition-all duration-300 hover:scale-110"
                      aria-label="Notifications"
                    >
                      <Bell className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400 group-hover:text-purple-400 transition-colors duration-300" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 lg:h-5 lg:w-5 flex items-center justify-center font-medium">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900/20 rounded-xl blur-lg group-hover:bg-gradient-to-br group-hover:from-purple-900 group-hover:via-slate-900 group-hover:to-purple-900/30 transition-all duration-300 -z-10"></div>
                    </button>
                    <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-xl border border-purple-400/30">
                      <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                      <span className="text-xs lg:text-sm font-medium text-white">
                        {user?.firstName || "User"} ({getRoleDisplay(user?.role)})
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-3 lg:px-4 py-2 bg-gradient-to-r from-red-500/20 to-red-600/20 backdrop-blur-xl rounded-xl border border-red-400/50 text-red-300 hover:bg-gradient-to-r hover:from-red-500/30 hover:to-red-600/30 transition-all duration-300 hover:scale-105 text-sm"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="group flex items-center gap-1 lg:gap-2 px-3 lg:px-4 py-2 text-white hover:text-purple-300 transition-all duration-300 hover:scale-105"
                    >
                      <LogIn className="w-4 h-4 group-hover:scale-125 transition-all duration-300" />
                      <span className="text-sm">Login</span>
                    </Link>
                    <Link
                      to="/register"
                      className="group flex items-center gap-1 lg:gap-2 px-4 lg:px-6 py-2 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 rounded-xl font-medium hover:shadow-glass-soft hover:shadow-bg-purple-500/50 transform hover:scale-110 hover:-translate-y-1 transition-all duration-500 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                      <UserPlus className="w-4 h-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 relative z-10" />
                      <span className="relative z-10 text-sm">Sign Up</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden relative p-3 bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-xl border border-purple-400/30 hover:bg-gradient-to-br hover:from-purple-800/30 hover:to-purple-900/30 transition-all duration-300 transform hover:scale-110 hover:rotate-180"
            >
              <div className="relative z-10">
                {menuOpen ? (
                  <X className="w-6 h-6 text-purple-300 animate-spin" />
                ) : (
                  <Menu className="w-6 h-6 text-purple-300 animate-pulse" />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-900/20 rounded-xl blur-lg"></div>
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {menuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-gradient-to-br from-purple-900 to-slate-900 backdrop-blur-xl border-b border-purple-400/20 shadow-glass-soft shadow-purple-500/20">
            <div className="px-6 py-8">
              {/* Mobile Navigation Links */}
              <div className="grid grid-cols-1 gap-3 mb-6">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl text-white border border-purple-400/30"
                          : "hover:bg-gradient-to-br from-purple-800/10 to-slate-900/10 backdrop-blur-xl text-white hover:text-purple-300"
                      }`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <Icon className="w-5 h-5 group-hover:scale-125 transition-all duration-300" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Actions */}
              <div className="pt-6 border-t border-white/20">
                {isAuthenticated ? (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {hasApprovedRegistrations && (
                      <Link
                        to="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        title="My Tickets"
                        className="group flex items-center justify-center p-3 bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-xl border border-purple-400/30 hover:bg-gradient-to-br hover:from-purple-800/30 hover:to-purple-900/30 transition-all duration-300"
                      >
                        <Ticket className="w-5 h-5 text-purple-400 group-hover:text-purple-400 transition-colors duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900/20 rounded-xl blur-lg group-hover:bg-gradient-to-br group-hover:from-purple-900 group-hover:via-slate-900 group-hover:to-purple-900/30 transition-all duration-300 -z-10"></div>
                      </Link>
                    )}
                    {/* Mobile Notifications Button */}
                    <button
                      onClick={() => {
                        setNotificationsOpen(!notificationsOpen);
                        setMenuOpen(false);
                      }}
                      className="group relative flex items-center justify-center p-3 bg-gradient-to-br from-purple-500/20 to-purple-400/20 backdrop-blur-xl rounded-xl border border-purple-400/30 hover:bg-gradient-to-br hover:from-purple-800/30 hover:to-purple-900/30 transition-all duration-300"
                      aria-label="Notifications"
                    >
                      <Bell className="w-5 h-5 text-purple-400 group-hover:text-purple-400 transition-colors duration-300" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-900 to-purple-500/20 rounded-xl blur-lg group-hover:bg-gradient-to-br group-hover:from-purple-900 group-hover:via-slate-900 group-hover:to-purple-900/30 transition-all duration-300 -z-10"></div>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 mb-4">
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 text-white hover:text-purple-300 hover:bg-gradient-to-br from-purple-800/10 to-slate-900/10 backdrop-blur-xl rounded-xl transition-all duration-300"
                    >
                      <LogIn className="w-5 h-5" />
                      <span className="text-sm">Login</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-xl font-medium border border-purple-400/30 hover:bg-gradient-to-br hover:from-purple-800/30 hover:to-purple-900/30 transition-all duration-500"
                    >
                      <UserPlus className="w-5 h-5" />
                      <span className="text-sm">Sign Up</span>
                    </Link>
                  </div>
                )}
                {isAuthenticated && (
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-xl border border-purple-400/30">
                      <User className="w-5 h-5 text-white" />
                      <span className="text-xs sm:text-sm font-medium text-white">
                        {user?.firstName || "User"} ({getRoleDisplay(user?.role)})
                      </span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 bg-gradient-to-br from-red-800/20 to-red-900/20 backdrop-blur-xl rounded-xl border border-red-400/30 text-red-300 hover:bg-gradient-to-br hover:from-red-800/30 hover:to-red-900/30 transition-all duration-300"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Dropdown */}
        <Notifications
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />
      </nav>
    </ErrorBoundary>
  );
}

export default memo(Navbar);

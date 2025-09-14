import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import PropTypes from "prop-types";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

// Fonts
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";

import { useAuth, AuthProvider, SidebarProvider, useSidebar } from "./contexts/AuthContext";
import { lazy, Suspense } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import Sidebar from "./components/Sidebar";

// Lazy load components for better performance
const Navbar = lazy(() => import("./components/Navbar"));
const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const EditProfile = lazy(() => import("./components/EditProfile"));
const Gallery = lazy(() => import("./components/Gallery"));
const Home = lazy(() => import("./components/Home"));
const Events = lazy(() => import("./components/Events"));
const EventDetails = lazy(() => import("./components/EventDetails"));
const Registration = lazy(() => import("./components/Registration"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/ResetPassword"));
const AdminDashboard = lazy(() => import("./components/dashboards/AdminDashboard"));
const OrganizerDashboard = lazy(() => import("./components/dashboards/OrganizerDashboard"));
const CreateEvent = lazy(() => import("./components/CreateEvent"));
const EditEvent = lazy(() => import("./components/EditEvent"));
const EmailVerification = lazy(() => import("./components/EmailVerification"));
const About = lazy(() => import("./components/About"));
const Contact = lazy(() => import("./components/Contact"));
const Announcements = lazy(() => import("./components/Announcements"));

// Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 300_000, // 5 min
    },
  },
});

// Route Guards with Enhanced Access Control

// Public routes whitelist - only these routes are accessible without authentication
const PUBLIC_ROUTES = [
  "/",
  "/products",
  "/login",
  "/register",
  "/verify-email",
  "/email-verification-pending",
  "/forgot-password",
  "/reset-password",
  "/designers",
  "/about",
  "/contact",
];

// Enhanced ProtectedRoute with role-based access control and email verification
const ProtectedRoute = ({
  children,
  requiredRole = null,
  requireEmailVerification = false,
}) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    // Preserve the intended destination for redirect after login
    const returnTo = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  // Check email verification if required
  if (requireEmailVerification && !user.emailVerified) {
    return <Navigate to="/email-verification-pending" replace />;
  }

  // Check role-based access if required
  if (requiredRole && user.role !== requiredRole) {
    // Redirect based on user's actual role
    const redirectPath =
      user.role === "admin" ? "/admin" :
      user.role === "organizer" ? "/organizer" :
      "/dashboard";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.oneOf(["user", "designer", "admin", "organizer"]),
  requireEmailVerification: PropTypes.bool,
};

// Enhanced PublicRoute that restricts unauthenticated users to whitelist only
const PublicRoute = ({ children, allowAuthenticated = false }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner message="Loading..." />;
  }

  // Check if current route is in public whitelist
  const currentPath = location.pathname;
  const isPublicRoute = PUBLIC_ROUTES.some((route) => {
    if (route.includes(":")) {
      // Handle dynamic routes like /verify-email/:token
      const routePattern = route.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(currentPath);
    }
    return currentPath === route || currentPath.startsWith(route + "/");
  });

  // If authenticated user tries to access auth pages, redirect to dashboard
  if (isAuthenticated && !allowAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If unauthenticated user tries to access non-public route, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    const returnTo = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return children;
};

PublicRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowAuthenticated: PropTypes.bool,
};

// Route wrapper that handles both public and protected route logic
const RouteGuard = ({
  children,
  isProtected = false,
  requiredRole = null,
  requireEmailVerification = false,
}) => {
  if (isProtected) {
    return (
      <ProtectedRoute
        requiredRole={requiredRole}
        requireEmailVerification={requireEmailVerification}
      >
        {children}
      </ProtectedRoute>
    );
  }
  return <PublicRoute>{children}</PublicRoute>;
};

RouteGuard.propTypes = {
  children: PropTypes.node.isRequired,
  isProtected: PropTypes.bool,
  requiredRole: PropTypes.oneOf(["user", "designer", "admin"]),
  requireEmailVerification: PropTypes.bool,
};

// Page animation wrapper
const AnimatedPage = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ type: "tween", ease: "anticipate", duration: 0.3 }}
  >
    {children}
  </motion.div>
);

AnimatedPage.propTypes = {
  children: PropTypes.node.isRequired,
};

function AppContent() {
  const { isLoading } = useAuth();
  const { isSidebarOpen } = useSidebar();
  const location = useLocation();

  // Check if sidebar should be shown
  const showSidebar = !['/', '/login', '/register'].includes(location.pathname);

  if (isLoading)
    return <LoadingSpinner message="Initializing application..." />;

  return (
    <div className="App min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 text-white overflow-x-hidden relative">
      {/* Enhanced Glass Morphism Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse shadow-glass"></div>
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse shadow-glass"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/15 to-purple-600/15 rounded-full mix-blend-multiply filter blur-3xl animate-pulse shadow-glass-soft"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        <Navbar />
      </Suspense>
      <Sidebar />
      <main className={`relative z-10 pt-20 backdrop-blur-sm bg-glass-medium/5 border-x border-white/5 transition-all duration-300 ${showSidebar ? (isSidebarOpen ? 'md:ml-70' : 'md:ml-18') : ''}`}>
        <AnimatePresence mode="wait">
          <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
            <Routes>
            {/* Home Route - Always accessible */}
            <Route
              path="/"
              element={
                <PublicRoute allowAuthenticated={true}>
                  <Home />
                </PublicRoute>
              }
            />
            <Route
              path="/products"
              element={
                <PublicRoute allowAuthenticated={true}>
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Products
                      </h1>
                      <p className="text-gray-300">Coming Soon...</p>
                    </div>
                  </div>
                </PublicRoute>
              }
            />
            <Route
              path="/about"
              element={
                <PublicRoute allowAuthenticated={true}>
                  <AnimatedPage>
                    <About />
                  </AnimatedPage>
                </PublicRoute>
              }
            />
            <Route
              path="/contact"
              element={
                <PublicRoute allowAuthenticated={true}>
                  <AnimatedPage>
                    <Contact />
                  </AnimatedPage>
                </PublicRoute>
              }
            />
            {/* Public Routes - Only accessible when not authenticated */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <AnimatedPage>
                    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 flex items-center justify-center p-6">
                      <Login />
                    </div>
                  </AnimatedPage>
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <AnimatedPage>
                    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 flex items-center justify-center p-6">
                      <Register />
                    </div>
                  </AnimatedPage>
                </PublicRoute>
              }
            />

            {/* Email verification routes - Accessible to all */}
            <Route
              path="/verify-email"
              element={
                <PublicRoute allowAuthenticated={true}>
                  <AnimatedPage>
                    <EmailVerification />
                  </AnimatedPage>
                </PublicRoute>
              }
            />
            <Route
              path="/verify-email/:token"
              element={
                <PublicRoute allowAuthenticated={true}>
                  <AnimatedPage>
                    <EmailVerification />
                  </AnimatedPage>
                </PublicRoute>
              }
            />

            {/* Password reset routes - Only accessible when not authenticated */}
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <AnimatedPage>
                    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
                      <ForgotPassword />
                    </div>
                  </AnimatedPage>
                </PublicRoute>
              }
            />
            <Route
              path="/reset-password/:token"
              element={
                <PublicRoute>
                  <AnimatedPage>
                    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
                      <ResetPassword />
                    </div>
                  </AnimatedPage>
                </PublicRoute>
              }
            />

            {/* Protected Routes - Require authentication */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AnimatedPage>
                    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900">
                      <Dashboard />
                    </div>
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gallery"
              element={
                <ProtectedRoute>
                  <AnimatedPage>
                    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                      <Gallery />
                    </div>
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <AnimatedPage>
                    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                      <EditProfile />
                    </div>
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/announcements"
              element={
                <ProtectedRoute>
                  <AnimatedPage>
                    <Announcements />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />

            {/* Events Routes */}
            <Route
              path="/events"
              element={
                <PublicRoute allowAuthenticated={true}>
                  <AnimatedPage>
                    <Events />
                  </AnimatedPage>
                </PublicRoute>
              }
            />
            <Route
              path="/events/:id"
              element={
                <ProtectedRoute>
                  <AnimatedPage>
                    <EventDetails />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/events/:eventId/register"
              element={
                <ProtectedRoute>
                  <AnimatedPage>
                    <Registration />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AnimatedPage>
                    <AdminDashboard />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/organizer"
              element={
                <ProtectedRoute requiredRole="organizer">
                  <AnimatedPage>
                    <OrganizerDashboard />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-event"
              element={
                <ProtectedRoute requiredRole="organizer">
                  <AnimatedPage>
                    <CreateEvent />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-event/:id"
              element={
                <ProtectedRoute requiredRole="organizer">
                  <AnimatedPage>
                    <EditEvent />
                  </AnimatedPage>
                </ProtectedRoute>
              }
            />

            {/* Fallback - Redirect unknown routes to login with return path */}
            <Route
              path="*"
              element={
                <PublicRoute>
                  <Navigate to="/login" replace />
                </PublicRoute>
              }
            />
          </Routes>
          </Suspense>
        </AnimatePresence>
      </main>

      {/* Enhanced Toast notifications with glass morphism */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "rgba(15, 23, 42, 0.8)",
            color: "#f1f5f9",
            borderRadius: "1.5rem",
            boxShadow:
              "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            fontFamily: "Inter, sans-serif",
            fontWeight: 500,
            padding: "16px 20px",
          },
          success: {
            duration: 3000,
            style: {
              background:
                "linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
            },
          },
          error: {
            duration: 4000,
            style: {
              background:
                "linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            },
          },
          loading: {
            style: {
              background:
                "linear-gradient(135deg, rgba(168, 85, 247, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(168, 85, 247, 0.3)",
            },
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <SidebarProvider>
            <AppContent />
          </SidebarProvider>
        </AuthProvider>
      </Router>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}

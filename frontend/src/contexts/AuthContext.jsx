import { createContext, useContext, useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import authService from "../services/authService.js";
import { eventsAPI } from "../services/eventService.js";
import { showWelcome } from "../utils/sweetAlert";

const AuthContext = createContext();

// Sidebar Context
export const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ isSidebarOpen, setIsSidebarOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [hasApprovedRegistrations, setHasApprovedRegistrations] = useState(false);
  const authCheckRef = useRef(false);

  // Function to check approved registrations
  const checkApprovedRegistrations = async () => {
    if (!isAuthenticated || !user) return;
    try {
      const count = await eventsAPI.getApprovedRegistrationsCount();
      setHasApprovedRegistrations(count > 0);
    } catch (error) {
      console.error("Failed to check approved registrations:", error);
      setHasApprovedRegistrations(false);
    }
  };

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      // Prevent multiple simultaneous auth checks
      if (authCheckRef.current) return;
      authCheckRef.current = true;

      try {
        if (authService.isAuthenticated()) {
          // Single API call to get profile (which also verifies token)
          const profileResponse = await authService.getCurrentUser();
          const userData = profileResponse.data.user;

          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // No token or invalid token
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
          setHasApprovedRegistrations(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
        setHasApprovedRegistrations(false);
      } finally {
        setLoading(false);
        authCheckRef.current = false;
      }
    };

    checkAuth();
  }, []);

  // Check approved registrations when user changes
  useEffect(() => {
    if (user && isAuthenticated) {
      checkApprovedRegistrations();
    } else {
      setHasApprovedRegistrations(false);
    }
  }, [user, isAuthenticated]);

  const login = async (email, password) => {
    setIsLoggingIn(true);
    try {
      const response = await authService.login({ email, password });

      // Check if 2FA is required
      if (response.requiresTwoFactor) {
        return {
          success: true,
          requiresTwoFactor: true,
          user: response.user
        };
      }

      const userData = response.user;

      // Set user data
      setUser(userData);
      setIsAuthenticated(true);

      // Check approved registrations
      const count = await eventsAPI.getApprovedRegistrationsCount();
      setHasApprovedRegistrations(count > 0);

      // Show welcome message
      showWelcome(userData.fullName || userData.username);

      return { success: true, user: userData };
    } catch (error) {
      console.error("Login failed:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
        error: error.response?.data?.error,
        emailNotVerified: error.response?.data?.emailNotVerified
      };
    } finally {
      setIsLoggingIn(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);

      return {
        success: true,
        message: response.message || "Registration successful",
        data: response.data,
      };
    } catch (error) {
      console.error("Registration failed:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  // Logout user
  const logout = () => {
    try {
      // Clear token
      authService.logout();

      // Clear user state
      setUser(null);
      setIsAuthenticated(false);
      setHasApprovedRegistrations(false);

      return { success: true };
    } catch (error) {
      console.error("Logout failed:", error);
      return { success: false, message: "Logout failed" };
    }
  };

  const verifyEmail = async (token) => {
    try {
      const response = await authService.verifyEmail(token);

      // After successful verification, we should update the user state if authenticated
      if (response.data.success && isAuthenticated && user) {
        setUser((prevUser) => ({
          ...prevUser,
          emailVerified: true,
        }));
      }

      return { success: true, message: response.data.message };
    } catch (error) {
      console.error("Email verification failed:", error);
      const errorMessage =
        error.response?.data?.message || "Email verification failed";
      return { success: false, message: errorMessage };
    }
  };

  const resendVerification = async (email) => {
    setIsResendingVerification(true);
    try {
      console.log("Resending verification to:", email);
      const response = await authService.resendVerification(email);
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to resend verification";
      return { success: false, message: errorMessage };
    } finally {
      setIsResendingVerification(false);
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const response = await authService.requestPasswordReset(email);
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Password reset request failed";
      return { success: false, message: errorMessage };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await authService.resetPassword(token, password);
      return { success: true, message: response.data.message };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Password reset failed";
      return { success: false, message: errorMessage };
    }
  };

  // Handle successful 2FA verification
  const completeTwoFactorLogin = async () => {
    try {
      // Fetch current user data with the new token
      const profileResponse = await authService.getCurrentUser();
      const userData = profileResponse.data.user;

      // Update user state
      setUser(userData);
      setIsAuthenticated(true);

      // Check approved registrations
      const count = await eventsAPI.getApprovedRegistrationsCount();
      setHasApprovedRegistrations(count > 0);

      // Show welcome message
      showWelcome(userData.fullName || userData.username);

      return { success: true, user: userData };
    } catch (error) {
      console.error("Failed to handle 2FA success:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to complete login"
      };
    }
  };

  // Update user profile
  // const updateProfile = async (profileData) => {
  //   try {
  //     const response = await authService.updateProfile(profileData);
  //     const updatedUser = response.data.user;

  //     setUser(updatedUser);
  //     return { success: true, user: updatedUser };
  //   } catch (error) {
  //     console.error("Profile update failed:", error);
  //     return {
  //       success: false,
  //       message: error.response?.data?.message || "Profile update failed",
  //     };
  //   }
  // };

  const value = {
    user,
    isAuthenticated,
    loading,
    isLoggingIn,
    isResendingVerification,
    hasApprovedRegistrations,
    login,
    register,
    logout,
    verifyEmail,
    resendVerification,
    requestPasswordReset,
    resetPassword,
    completeTwoFactorLogin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

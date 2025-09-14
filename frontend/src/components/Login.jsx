import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { showEmailSent, showError } from "../utils/sweetAlert";
import TwoFactorModal from "./TwoFactorModal";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorUser, setTwoFactorUser] = useState(null);

  const { login, resendVerification, isLoggingIn, isResendingVerification, completeTwoFactorLogin } =
    useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setError,
    clearErrors,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const watchedEmail = watch("email");

  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const onSubmit = async (data) => {
    try {
      clearErrors();
      const result = await login(data.email, data.password);

      // Check if 2FA is required for admin users only
      if (result.requiresTwoFactor && result.user?.role === "admin") {
        setTwoFactorUser(result.user);
        setShowTwoFactorModal(true);
        return;
      }

      // Smart redirect based on user state and return path
      if (result.success) {
        const user = result.user;

        // Only require email verification for admin users
        if (!user.emailVerified && user.role === "admin") {
          navigate("/email-verification-pending");
          return;
        }

        // Redirect to return path or default dashboard
        const redirectPath =
          returnTo && returnTo !== "/login" ? returnTo : "/dashboard";
        navigate(redirectPath, { replace: true });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed";
      const errorCode = error.response?.data?.error;
      const statusCode = error.response?.status;

      setError("root", { message: errorMessage });

      // Navigate to email verification page if email not verified (admin only)
      if (errorCode === "EMAIL_NOT_VERIFIED") {
        navigate("/verify-email");
        return;
      }

      // Show resend verification option for other 403 errors
      if (statusCode === 403) {
        setShowResendVerification(true);
      }
    }
  };

  const handleResendVerification = async () => {
    try {
      const result = await resendVerification(watchedEmail);
      if (result.success) {
        setShowResendVerification(false);
        showEmailSent();
      } else {
        showError("Failed to Send", result.message);
      }
    } catch (error) {
      showError(
        "Error",
        "Failed to resend verification email. Please try again."
      );
    }
  };

  const handleTwoFactorSuccess = async (result) => {
    setShowTwoFactorModal(false);
    setTwoFactorUser(null);

    try {
      // Use the AuthContext function to properly handle 2FA success
      const authResult = await completeTwoFactorLogin();

      if (authResult.success) {
        const user = authResult.user;

        // Only require email verification for admin users after 2FA
        if (!user.emailVerified && user.role === "admin") {
          navigate("/email-verification-pending");
          return;
        }

        // Redirect to return path or default dashboard
        const redirectPath =
          returnTo && returnTo !== "/login" ? returnTo : "/dashboard";
        navigate(redirectPath, { replace: true });
      } else {
        console.error("Failed to handle 2FA success:", authResult.message);
        // Fallback navigation
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Error handling 2FA success:", error);
      // Fallback navigation
      navigate("/dashboard", { replace: true });
    }
  };

  const handleTwoFactorClose = () => {
    setShowTwoFactorModal(false);
    setTwoFactorUser(null);
  };

  const inputVariants = {
    focus: { scale: 1.02, transition: { duration: 0.2 } },
    blur: { scale: 1, transition: { duration: 0.2 } },
  };

  const buttonVariants = {
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
  };

  return (
   <>
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden animate-fade-in">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900/20 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/6 w-16 h-16 border-2 border-purple-900/30 backdrop-blur-sm bg-white/5 rotate-45 animate-spin rounded-lg"
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className="absolute bottom-1/3 right-1/6 w-12 h-12 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900/20 backdrop-blur-sm rounded-full animate-bounce border border-purple-600/30"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <motion.div
        className="relative z-10 w-full max-w-sm sm:max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Premium Glass Morphism Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/20 shadow-glass-soft shadow-accent-pink/20 overflow-hidden">
          {/* Sparkle Effects */}
          <div className="absolute top-4 right-4 opacity-60 animate-pulse">
            <Sparkles className="w-6 h-6 text-purple-900" />
          </div>
          <div
            className="absolute bottom-4 left-4 opacity-60 animate-pulse"
            style={{ animationDelay: "1s" }}
          >
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>

          {/* Header Section */}
          <div className="text-center mb-8 relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 rounded-2xl mb-6 shadow-glass-soft"
            >
              <LogIn className="w-10 h-10 text-white" />
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-ping"></div>
            </motion.div>

            <h2 className="text-2xl md:text-4xl font-bold mb-2 md:mb-3 text-gray-800">
              Welcome Back
            </h2>
            <p className="text-gray-700 text-base md:text-lg">
              Sign in to your
              <span className="text-purple-900 font-semibold mx-1">
                EventSphere
              </span>
              account
            </p>
          </div>

          {/* Error Message */}
          {errors.root && (
            <motion.div
              className="mb-6 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl border border-red-400/30 text-red-300"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-sm font-medium mb-2">{errors.root.message}</p>
              {showResendVerification && (
                <motion.button
                  onClick={handleResendVerification}
                  className="group inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-900/20 to-purple-600/20 backdrop-blur-lg rounded-xl border border-purple-900/30 text-purple-800 hover:from-purple-900/30 hover:to-purple-600/30 transition-all duration-300 text-sm font-medium"
                  disabled={isResendingVerification}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isResendingVerification
                    ? "Sending..."
                    : "Resend Verification Email"}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Login Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 sm:space-y-6 relative z-10"
          >
            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="flex items-center text-gray-700 font-medium"
              >
                <Mail className="w-4 h-4 mr-2 text-purple-900" />
                Email Address
              </label>
              <motion.div
                className="relative"
                variants={inputVariants}
                whileFocus="focus"
              >
                <input
                  type="email"
                  id="email"
                  {...register("email", {
                    required: "Please enter your email address",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message:
                        "Please enter a valid email address (e.g., user@example.com)",
                    },
                  })}
                  className={`w-full px-3 sm:px-4 py-3 sm:py-4 bg-white/10 backdrop-blur-xl rounded-xl border ${
                    errors.email ? "border-red-400/50" : "border-white/20"
                  } text-gray-800 placeholder-gray-500 focus:border-purple-900 focus:outline-none transition-all duration-300 focus:bg-white/10`}
                  placeholder="Enter your email"
                  disabled={isLoggingIn}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/0 to-purple-600/0 focus-within:from-purple-900/10 focus-within:to-purple-600/10 rounded-xl transition-all duration-300 pointer-events-none"></div>
              </motion.div>
              {errors.email && (
                <motion.span
                  className="text-red-600 text-sm font-medium flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.email.message}
                </motion.span>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="flex items-center text-gray-700 font-medium"
              >
                <Lock className="w-4 h-4 mr-2 text-purple-900" />
                Password
              </label>
              <motion.div
                className="relative"
                variants={inputVariants}
                whileFocus="focus"
              >
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  {...register("password", {
                    required: "Please enter your password",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters long",
                    },
                  })}
                  className={`w-full px-3 sm:px-4 py-3 sm:py-4 pr-10 sm:pr-12 bg-white/10 backdrop-blur-xl rounded-xl border ${
                    errors.password ? "border-red-400/50" : "border-white/20"
                  } text-gray-800 placeholder-gray-500 focus:border-purple-900 focus:outline-none transition-all duration-300 focus:bg-white/10`}
                  placeholder="Enter your password"
                  disabled={isLoggingIn}
                />
                <button
                  type="button"
                  className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors duration-300"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoggingIn}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/0 to-purple-600/0 focus-within:from-purple-900/10 focus-within:to-purple-600/10 rounded-xl transition-all duration-300 pointer-events-none"></div>
              </motion.div>
              {errors.password && (
                <motion.span
                  className="text-red-600 text-sm font-medium flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {errors.password.message}
                </motion.span>
              )}
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="group relative w-full px-5 sm:px-6 py-3 sm:py-4 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 rounded-xl font-bold text-base sm:text-lg hover:shadow-glass-soft hover:shadow-purple-600/50 transform hover:scale-105 transition-all duration-500 flex items-center justify-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={isLoggingIn || !isValid}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-800 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

              {isLoggingIn ? (
                <motion.div
                  className="flex items-center relative z-10"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Signing In...
                </motion.div>
              ) : (
                <div className="flex items-center relative z-10">
                  <LogIn className="w-5 h-5 mr-2 sm:mr-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2 sm:ml-3 group-hover:translate-x-2 transition-all duration-300" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            </motion.button>
          </form>

          {/* Footer Links */}
          <div className="mt-6 sm:mt-8 text-center space-y-3 sm:space-y-4 relative z-10">
            <Link
              to="/forgot-password"
              className="inline-block text-purple-900 hover:text-purple-700 font-medium transition-colors duration-300 hover:underline decoration-purple-900/50"
            >
              Forgot your password?
            </Link>

            <div className="flex items-center justify-center space-x-3 sm:space-x-4">
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
              <span className="text-gray-400 text-sm">
                Don&apos;t have an account?
              </span>
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
            </div>

            <Link
              to="/register"
              className="group inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-xl border border-white/20 text-gray-200 hover:text-white hover:border-purple-900/50 transition-all duration-300 font-medium"
            >
              Create Account
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-900/0 via-purple-600/0 to-purple-500/0 hover:from-purple-900/10 hover:via-purple-600/5 hover:to-purple-500/10 blur-2xl transition-all duration-1000 -z-10"></div>
        </div>
      </motion.div>
    </div>

    <style jsx>{`
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .animate-fade-in {
        animation: fade-in 0.8s ease-out;
      }
    `}</style>

    {/* 2FA Modal */}
    <TwoFactorModal
      isOpen={showTwoFactorModal}
      onClose={handleTwoFactorClose}
      user={twoFactorUser}
      onSuccess={handleTwoFactorSuccess}
    />
    </>
  );
};

export default Login;

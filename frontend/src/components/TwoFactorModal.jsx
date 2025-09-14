import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Mail,
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import authService from "../services/authService";

const TwoFactorModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);

  const { sendTwoFactorCode } = useAuth();

  // Timer for resend functionality
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCode("");
      setError("");
      setSuccess("");
      setResendTimer(0);
      setAttemptsLeft(5);
      // Automatically send 2FA code when modal opens
      handleInitialSendCode();
    }
  }, [isOpen]);

  // Function to send initial 2FA code
  const handleInitialSendCode = async () => {
    try {
      await authService.sendTwoFactorCode(user._id);
      setSuccess("Verification code sent to your email");
      setResendTimer(60); // 60 second cooldown
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send code";
      setError(errorMessage);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    setError("");
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setIsResending(true);
    setError("");

    try {
      await authService.sendTwoFactorCode(user._id);
      setSuccess("Verification code sent to your email");
      setResendTimer(60); // 60 second cooldown
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to send code";
      setError(errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await authService.verifyTwoFactorCode(user._id, code);
      setSuccess("Login successful!");
      setTimeout(() => {
        onSuccess(result);
      }, 1000);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Invalid verification code";
      const attempts = error.response?.data?.attemptsLeft;

      setError(errorMessage);
      if (attempts !== undefined) {
        setAttemptsLeft(attempts);
      }

      if (errorMessage.includes("locked")) {
        setTimeout(() => {
          onClose();
        }, 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && code.length === 6 && !isLoading) {
      handleVerifyCode();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glassmorphic Modal */}
          <div
            className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl shadow-purple-500/20 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="two-factor-title"
            aria-describedby="two-factor-description"
          >
            {/* Header */}
            <div className="relative p-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl">
                    <Shield className="w-6 h-6 text-purple-300" />
                  </div>
                  <div>
                    <h2 id="two-factor-title" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Two-Factor Authentication
                    </h2>
                    <p id="two-factor-description" className="text-gray-300 text-sm">Verify your identity</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors duration-300"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* User Info */}
              <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user?.username?.charAt(0).toUpperCase() || "A"}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium">{user?.username}</p>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {/* Instructions */}
              <div className="mb-6">
                <p className="text-gray-300 text-sm leading-relaxed">
                  A 6-digit verification code has been sent to your email address.
                  Please enter it below to complete your login.
                </p>
              </div>

              {/* Code Input */}
              <div className="mb-4">
                <label className="block text-gray-200 text-sm font-semibold mb-3">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  onKeyPress={handleKeyPress}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-4 bg-gradient-to-r from-white/15 to-white/10 backdrop-blur-xl border border-white/30 rounded-xl text-white text-center text-2xl font-mono tracking-widest placeholder-gray-400 focus:border-purple-400/60 focus:outline-none transition-all duration-300 shadow-lg"
                  disabled={isLoading}
                  autoFocus
                  aria-describedby="code-helper"
                  aria-label="Enter 6-digit verification code"
                />
                <p id="code-helper" className="text-gray-400 text-xs mt-2 text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>

              {/* Attempts Left Warning */}
              {attemptsLeft < 5 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border border-yellow-500/30 rounded-xl"
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-300 text-sm">
                      {attemptsLeft} attempts remaining
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-lg border border-red-400/30 rounded-xl"
                    role="alert"
                    aria-live="assertive"
                  >
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <span className="text-red-300 text-sm">{error}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Success Message */}
              <AnimatePresence>
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg border border-green-400/30 rounded-xl"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-300 text-sm">{success}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="space-y-3">
                {/* Verify Button */}
                <motion.button
                  onClick={handleVerifyCode}
                  disabled={code.length !== 6 || isLoading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/40 text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      <span>Verify Code</span>
                    </>
                  )}
                </motion.button>

                {/* Resend Code */}
                <div className="text-center">
                  <button
                    onClick={handleResendCode}
                    disabled={resendTimer > 0 || isResending}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg border border-white/30 rounded-xl text-gray-300 hover:text-white hover:border-purple-400/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : resendTimer > 0 ? (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>Resend in {resendTimer}s</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        <span>Resend Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Cancel */}
                <div className="text-center">
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors duration-300 text-sm"
                  >
                    Cancel Login
                  </button>
                </div>
              </div>
            </div>

            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TwoFactorModal;
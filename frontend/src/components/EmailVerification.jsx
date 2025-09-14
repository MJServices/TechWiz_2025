import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Mail,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Home,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { showError, showSuccess } from "../utils/sweetAlert";
import { Modal, Button, FormInput, ParticlesBackground } from "./common";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification, isResendingVerification } = useAuth();

  const [verificationStatus, setVerificationStatus] = useState('pending'); // 'pending', 'success', 'error'
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationAttempted, setVerificationAttempted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (token && !verificationAttempted) {
      setVerificationAttempted(true);
      handleVerification(token);
    }
  }, [token, verificationAttempted]);

  const handleVerification = async (verificationToken) => {
    setLoading(true);
    try {
      const result = await verifyEmail(verificationToken);
      if (result.success) {
        setVerificationStatus('success');
        setMessage(result.message);
        setShowSuccessModal(true);
        // Redirect to login after 5 seconds to allow user to see the success message
        setTimeout(() => navigate('/login'), 5000);
      } else {
        setVerificationStatus('error');
        setMessage(result.message || 'Verification failed. Please try resending the verification email.');
        setShowErrorModal(true);
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage(error.response?.data?.message || 'Verification failed. Please try resending the verification email.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showError("Email Required", "Please enter your email address");
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showError("Invalid Email", "Please enter a valid email address");
      return;
    }

    try {
      const result = await resendVerification(email);
      if (result.success) {
        setMessage(result.message);
        showSuccess("Verification Email Sent", result.message, { timer: 4000 });
        // Clear the email field after successful send
        setEmail('');
      } else {
        showError("Failed to Send", result.message);
      }
    } catch (error) {
      showError("Failed to Send", error.response?.data?.message || "Failed to resend verification email");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* Particles Background */}
      <ParticlesBackground 
        count={30}
        color="#a855f7"
        opacity={{ min: 0.05, max: 0.2 }}
        size={{ min: 1, max: 3 }}
        speed={{ min: 0.05, max: 0.15 }}
        connectParticles={true}
        connectionOpacity={0.05}
      />

      <motion.div
        className="relative z-10 w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Premium Glass Morphism Card */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-purple-500/20 overflow-hidden">
          {/* Sparkle Effects */}
          <div className="absolute top-4 right-4 opacity-60 animate-pulse">
            <Mail className="w-6 h-6 text-purple-400" />
          </div>
          <div
            className="absolute bottom-4 left-4 opacity-60 animate-pulse"
            style={{ animationDelay: "1s" }}
          >
            <CheckCircle className="w-5 h-5 text-pink-400" />
          </div>

          {/* Header Section */}
          <div className="text-center mb-8 relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-2xl"
            >
              {verificationStatus === 'success' ? (
                <CheckCircle className="w-10 h-10 text-white" />
              ) : verificationStatus === 'error' ? (
                <AlertCircle className="w-10 h-10 text-white" />
              ) : (
                <Mail className="w-10 h-10 text-white" />
              )}
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-ping"></div>
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              {verificationStatus === 'success'
                ? 'Email Verified Successfully!'
                : verificationStatus === 'error'
                ? 'Verification Failed'
                : token
                ? 'Verifying Your Email'
                : 'Email Verification Required'
              }
            </h2>
            <p className="text-gray-300 text-lg">
              {verificationStatus === 'success'
                ? 'Your email has been verified. You will be redirected to login shortly.'
                : verificationStatus === 'error'
                ? 'The verification link is invalid or has expired. Please try resending the verification email.'
                : token
                ? 'Please wait while we verify your email address...'
                : 'Check your email for the verification link or resend it below'
              }
            </p>
          </div>

          {/* Status Messages */}
          {message && (
            <motion.div
              className={`mb-6 p-4 backdrop-blur-lg rounded-2xl border ${
                verificationStatus === 'success'
                  ? 'bg-green-500/20 border-green-400/30 text-green-300'
                  : verificationStatus === 'error'
                  ? 'bg-red-500/20 border-red-400/30 text-red-300'
                  : 'bg-blue-500/20 border-blue-400/30 text-blue-300'
              }`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center">
                {verificationStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : verificationStatus === 'error' ? (
                  <AlertCircle className="w-5 h-5 mr-2" />
                ) : (
                  <RefreshCw className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                )}
                <p className="text-sm font-medium">{message}</p>
              </div>
            </motion.div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center mb-6">
              <motion.div
                className="flex items-center space-x-2 text-purple-400"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span>Verifying...</span>
              </motion.div>
            </div>
          )}

          {/* Resend Verification Form */}
          {(!token || verificationStatus === 'error') && (
            <form onSubmit={handleResendVerification} className="space-y-6 relative z-10">
              <FormInput
                id="email"
                label="Email Address"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isResendingVerification}
                icon={Mail}
              />

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isResendingVerification}
                icon={Mail}
                disabled={isResendingVerification}
              >
                {isResendingVerification ? 'Sending...' : 'Resend Verification Email'}
              </Button>
            </form>
          )}

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4 relative z-10">
            {verificationStatus === 'success' ? (
              <div className="space-y-4">
                <Button
                  onClick={() => navigate('/login')}
                  variant="primary"
                  className="w-full max-w-xs mx-auto"
                  icon={ArrowRight}
                >
                  Continue to Login
                </Button>
                <p className="text-gray-400 text-sm">
                  You will be automatically redirected in a few seconds
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center space-x-4">
                  <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
                  <span className="text-gray-400 text-sm">
                    Need help?
                  </span>
                  <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    as={Link}
                    to="/login"
                    variant="ghost"
                    icon={ArrowRight}
                  >
                    Back to Login
                  </Button>
                  <Button
                    as={Link}
                    to="/"
                    variant="ghost"
                    icon={Home}
                  >
                    Home
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-500/0 via-pink-500/0 to-cyan-500/0 hover:from-purple-500/10 hover:via-pink-500/5 hover:to-cyan-500/10 blur-2xl transition-all duration-1000 -z-10"></div>
        </div>
      </motion.div>

      {/* Success Modal */}
      <Modal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Email Verified Successfully!"
        size="md"
      >
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Verification Complete</h3>
          <p className="text-gray-300 mb-6">{message || 'Your email has been successfully verified. You can now log in to your account.'}</p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="primary"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/login');
              }}
            >
              Continue to Login
            </Button>
          </div>
        </div>
      </Modal>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Verification Failed"
        size="md"
      >
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">Verification Error</h3>
          <p className="text-gray-300 mb-6">{message || 'The verification link is invalid or has expired. Please try resending the verification email.'}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => setShowErrorModal(false)}
            >
              Try Again
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setShowErrorModal(false);
                navigate('/login');
              }}
            >
              Back to Login
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmailVerification;
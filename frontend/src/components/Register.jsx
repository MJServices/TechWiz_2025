import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import {
  UserPlus,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Lock,
  Sparkles,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { showRegistrationSuccess, showError } from "../utils/sweetAlert";
import {
  validateField,
  validationSchemas,
  validators,
} from "../utils/validation";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    department: "",
    enrollmentNo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Per-field error state for instant, inline feedback
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    fullName: "",
    department: "",
    enrollmentNo: "",
  });

  const { register } = useAuth();

  // Build validators per field using existing shared validation schemas
  const fieldValidators = {
    fullName: validationSchemas.registration.fullName,
    department: validationSchemas.registration.department,
    username: validationSchemas.registration.username,
    email: validationSchemas.registration.email,
    password: validationSchemas.registration.password,
    confirmPassword: [
      (value) => (!value ? "Please confirm your password" : null),
      (value) => validators.password.minLength(value, 8),
      () =>
        validators.password.match(formData.password, formData.confirmPassword),
    ],
  };

  const runValidationForField = (name, value) => {
    console.log(name, value);
    const rules = fieldValidators[name];
    if (!rules) return "";
    const errorMsg = validateField(value, rules);
    return errorMsg || "";
  };

  const validateAllFields = () => {
    const nextErrors = { ...fieldErrors };
    Object.keys(fieldValidators).forEach((key) => {
      // Use current values from formData (confirmPassword depends on password)
      const value = formData[key];
      nextErrors[key] = runValidationForField(key, value);
    });

    setFieldErrors(nextErrors);

    // Determine if any error exists for required fields
    const hasErrors = Object.entries(nextErrors).some(([k, v]) => {
      // enrollmentNo is optional; ignore its error if empty
      if (k === "enrollmentNo" && !formData.enrollmentNo) return false;
      return Boolean(v);
    });
    console.log(formData);

    // Required fields completeness check
    const requiredFilled =
      formData.fullName.trim() &&
      formData.department.trim() &&
      formData.username.trim() &&
      formData.email.trim() &&
      formData.password &&
      formData.confirmPassword;

    return !hasErrors && Boolean(requiredFilled);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updated = { ...formData, [name]: value };
    setFormData(updated);

    // Clear top banner messages when user edits
    setError("");
    setSuccess("");

    // Run instant validation for changed field
    const msg = runValidationForField(name, value);

    // If password changes, also re-validate confirmPassword matching
    const confirmMsg =
      name === "password" || name === "confirmPassword"
        ? validators.password.match(
            updated.password,
            updated.confirmPassword
          ) || ""
        : fieldErrors.confirmPassword;

    setFieldErrors((prev) => ({
      ...prev,
      [name]: msg,
      ...(name === "password" || name === "confirmPassword"
        ? { confirmPassword: confirmMsg }
        : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateAllFields();
    if (!isValid) {
      return;
    }

    setLoading(true);
    setError("");

    const { confirmPassword, ...registrationData } = formData;
    console.log(confirmPassword);
    const result = await register(registrationData);

    if (result.success) {
      setSuccess(result.message);
      showRegistrationSuccess().then(() => {
        setTimeout(() => navigate('/verify-email'), 2000);
      });
    } else {
      setError(result.message);
      showError("Registration Failed", result.message);
    }

    setLoading(false);
  };


  const inputVariants = {
    focus: { scale: 1.02, transition: { duration: 0.2 } },
    blur: { scale: 1, transition: { duration: 0.2 } },
  };

  const buttonVariants = {
    hover: { scale: 1.02, transition: { duration: 0.2 } },
    tap: { scale: 0.98, transition: { duration: 0.1 } },
  };

  const inputBorderClass = (key) =>
    fieldErrors[key] ? "border-red-400/50" : "border-white/20";

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-900/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-800/20 to-purple-500/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* Floating Geometric Shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/3 left-1/6 w-16 h-16 border-2 border-purple-900/30 backdrop-blur-sm bg-white/5 rotate-45 animate-spin rounded-lg"
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className="absolute bottom-1/3 right-1/6 w-12 h-12 bg-gradient-to-r from-purple-900/20 to-purple-600/20 backdrop-blur-sm rounded-full animate-bounce border border-purple-600/30"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <motion.div
        className="relative z-10 w-full max-w-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Premium Glass Morphism Card */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-purple-500/20 overflow-hidden">
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
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-900 to-purple-600 rounded-2xl mb-6 shadow-2xl"
            >
              <UserPlus className="w-10 h-10 text-white" />
              <div className="absolute inset-0 bg-white/20 rounded-2xl animate-ping"></div>
            </motion.div>

            <h2 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-purple-900 via-slate-900 to-purple-600 bg-clip-text text-transparent">
              Join EventSphere
            </h2>
            <p className="text-gray-200 text-lg">
              Create your account to participate in
              <span className="bg-gradient-to-r from-purple-900 to-purple-600 bg-clip-text text-transparent font-semibold mx-1">
                college events
              </span>
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <motion.div
              className="mb-6 p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-lg rounded-2xl border border-red-400/30 text-red-300"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <p className="text-sm font-medium">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div
              className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-teal-500/20 backdrop-blur-lg rounded-2xl border border-green-400/30 text-green-300 flex items-center"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              <p className="text-sm font-medium">{success}</p>
            </motion.div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Name Fields Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="firstName"
                  className="flex items-center text-gray-200 font-medium"
                >
                  <User className="w-4 h-4 mr-2 text-purple-900" />
                  Full Name
                </label>
                <motion.div
                  className="relative"
                  variants={inputVariants}
                  whileFocus="focus"
                >
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={`w-full px-4 py-4 bg-white/10 backdrop-blur-xl rounded-xl border ${inputBorderClass(
                      "fullName"
                    )} text-white placeholder-gray-400 focus:border-purple-900/50 focus:outline-none transition-all duration-300 focus:bg-white/10`}
                    placeholder="Enter your first name"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-900/0 to-purple-600/0 focus-within:from-purple-900/10 focus-within:to-purple-600/10 rounded-xl transition-all duration-300 pointer-events-none"></div>
                </motion.div>
                {fieldErrors.fullName && (
                  <motion.span
                    className="text-red-400 text-sm font-medium flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {fieldErrors.firstName}
                  </motion.span>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="department"
                  className="flex items-center text-gray-200 font-medium"
                >
                  <User className="w-4 h-4 mr-2 text-purple-900" />
                  Department
                </label>
                <motion.div
                  className="relative"
                  variants={inputVariants}
                  whileFocus="focus"
                >
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={`w-full px-4 py-4 bg-white/10 backdrop-blur-xl rounded-xl border ${inputBorderClass(
                      "department"
                    )} text-white placeholder-gray-400 focus:border-purple-900/50 focus:outline-none transition-all duration-300 focus:bg-white/10`}
                    placeholder="Enter your Department"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-900/0 to-purple-600/0 focus-within:from-purple-900/10 focus-within:to-purple-600/10 rounded-xl transition-all duration-300 pointer-events-none"></div>
                </motion.div>
                {fieldErrors.department && (
                  <motion.span
                    className="text-red-400 text-sm font-medium flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {fieldErrors.department}
                  </motion.span>
                )}
              </div>
            </div>

            {/* Username Field */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="flex items-center text-gray-200 font-medium"
              >
                <User className="w-4 h-4 mr-2 text-purple-900" />
                Username
              </label>
              <motion.div
                className="relative"
                variants={inputVariants}
                whileFocus="focus"
              >
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`w-full px-4 py-4 bg-white/10 backdrop-blur-xl rounded-xl border ${inputBorderClass(
                    "username"
                  )} text-white placeholder-gray-400 focus:border-purple-900/50 focus:outline-none transition-all duration-300 focus:bg-white/10`}
                  placeholder="Choose a unique username"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/0 to-purple-600/0 focus-within:from-purple-900/10 focus-within:to-purple-600/10 rounded-xl transition-all duration-300 pointer-events-none"></div>
              </motion.div>
              {fieldErrors.username && (
                <motion.span
                  className="text-red-400 text-sm font-medium flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {fieldErrors.username}
                </motion.span>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="flex items-center text-gray-200 font-medium"
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
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={`w-full px-4 py-4 bg-white/10 backdrop-blur-xl rounded-xl border ${inputBorderClass(
                    "email"
                  )} text-white placeholder-gray-400 focus:border-purple-900/50 focus:outline-none transition-all duration-300 focus:bg-white/10`}
                  placeholder="Enter your email address"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/0 to-purple-600/0 focus-within:from-purple-900/10 focus-within:to-purple-600/10 rounded-xl transition-all duration-300 pointer-events-none"></div>
              </motion.div>
              {fieldErrors.email && (
                <motion.span
                  className="text-red-400 text-sm font-medium flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {fieldErrors.email}
                </motion.span>
              )}
            </div>

            {/* Enrollment Number Field */}
            <div className="space-y-2">
              <label
                htmlFor="enrollmentNo"
                className="flex items-center text-gray-200 font-medium"
              >
                <Phone className="w-4 h-4 mr-2 text-purple-900" />
                Enrollment Number
              </label>
              <motion.div
                className="relative"
                variants={inputVariants}
                whileFocus="focus"
              >
                <input
                  type="tel"
                  id="enrollmentNo"
                  name="enrollmentNo"
                  value={formData.enrollmentNo}
                  onChange={handleChange}
                  disabled={loading}
                  className={`w-full px-4 py-4 bg-white/10 backdrop-blur-xl rounded-xl border ${inputBorderClass(
                    "enrollmentNo"
                  )} text-white placeholder-gray-400 focus:border-purple-900/50 focus:outline-none transition-all duration-300 focus:bg-white/10`}
                  placeholder="Enter your phone number"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-900/0 to-purple-600/0 focus-within:from-purple-900/10 focus-within:to-purple-600/10 rounded-xl transition-all duration-300 pointer-events-none"></div>
              </motion.div>
              {fieldErrors.enrollmentNo && formData.enrollmentNo && (
                <motion.span
                  className="text-red-400 text-sm font-medium flex items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {fieldErrors.enrollmentNo}
                </motion.span>
              )}
            </div>

            {/* Password Fields Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="flex items-center text-gray-200 font-medium"
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
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    minLength="8"
                    className={`w-full px-4 py-4 pr-12 bg-white/10 backdrop-blur-xl rounded-xl border ${inputBorderClass(
                      "password"
                    )} text-white placeholder-gray-400 focus:border-purple-900/50 focus:outline-none transition-all duration-300 focus:bg-white/10`}
                    placeholder="Min 8 chars, 1 upper, 1 lower, 1 number"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors duration-300"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-900/0 to-purple-600/0 focus-within:from-purple-900/10 focus-within:to-purple-600/10 rounded-xl transition-all duration-300 pointer-events-none"></div>
                </motion.div>
                {fieldErrors.password && (
                  <motion.span
                    className="text-red-400 text-sm font-medium flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {fieldErrors.password}
                  </motion.span>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="flex items-center text-gray-200 font-medium"
                >
                  <Lock className="w-4 h-4 mr-2 text-purple-900" />
                  Confirm Password
                </label>
                <motion.div
                  className="relative"
                  variants={inputVariants}
                  whileFocus="focus"
                >
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    minLength="8"
                    className={`w-full px-4 py-4 pr-12 bg-white/10 backdrop-blur-xl rounded-xl border ${inputBorderClass(
                      "confirmPassword"
                    )} text-white placeholder-gray-400 focus:border-purple-900/50 focus:outline-none transition-all duration-300 focus:bg-white/10`}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors duration-300"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-900/0 to-purple-600/0 focus-within:from-purple-900/10 focus-within:to-purple-600/10 rounded-xl transition-all duration-300 pointer-events-none"></div>
                </motion.div>
                {fieldErrors.confirmPassword && (
                  <motion.span
                    className="text-red-400 text-sm font-medium flex items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {fieldErrors.confirmPassword}
                  </motion.span>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="group relative w-full px-6 py-4 bg-gradient-to-r from-purple-900 to-purple-600 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-purple-900/50 transform hover:scale-105 transition-all duration-500 flex items-center justify-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              disabled={loading}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-800 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>

              {loading ? (
                <motion.div
                  className="flex items-center relative z-10"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Creating Account...
                </motion.div>
              ) : (
                <div className="flex items-center relative z-10">
                  <UserPlus className="w-5 h-5 mr-3 group-hover:scale-125 group-hover:rotate-12 transition-all duration-300" />
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-all duration-300" />
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-purple-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            </motion.button>
          </form>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-4 relative z-10">
            <div className="flex items-center justify-center space-x-4">
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
              <span className="text-gray-300 text-sm">
                Already have an account?
              </span>
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1"></div>
            </div>

            <Link
              to="/login"
              className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-xl border border-white/20 text-gray-200 hover:text-white hover:border-purple-900/50 transition-all duration-300 font-medium"
            >
              Sign In Instead
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-900/0 via-purple-600/0 to-purple-500/0 hover:from-purple-900/10 hover:via-purple-600/5 hover:to-purple-500/10 blur-2xl transition-all duration-1000 -z-10"></div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;

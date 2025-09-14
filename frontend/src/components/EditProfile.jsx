import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Save,
  ArrowLeft,
  Upload,
  X,
  Edit3,
  Award,
  AlertCircle,
  Loader
} from 'lucide-react';
import { motion } from 'framer-motion';
import { validateForm, validationSchemas } from '../utils/validation';
import { showAlert } from '../utils/sweetAlert';

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    username: '',
    contact_number: '',
    address: '',
    date_of_birth: '',
    gender: ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showRoleUpgrade, setShowRoleUpgrade] = useState(false);
  const [roleUpgradeReason, setRoleUpgradeReason] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData({
        firstname: user.profile?.firstname || '',
        lastname: user.profile?.lastname || '',
        email: user.email || '',
        username: user.username || '',
        contact_number: user.profile?.contact_number || '',
        address: user.profile?.address || '',
        date_of_birth: user.profile?.date_of_birth || '',
        gender: user.profile?.gender || ''
      });
      setImagePreview(user.profile?.profile_image || null);
    }
    setIsVisible(true);
  }, [user]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showAlert('error', 'Invalid file type', 'Please select a JPEG, PNG, or WebP image.');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlert('error', 'File too large', 'Please select an image smaller than 5MB.');
        return;
      }

      setProfileImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!profileImage) return;

    setImageLoading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', profileImage);

      const response = await fetch('/api/v1/profile/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        updateUser(data.data.user);
        setProfileImage(null);
        showAlert('success', 'Success!', 'Profile image updated successfully.');
      } else {
        throw new Error(data.message || 'Failed to update profile image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      showAlert('error', 'Upload failed', error.message || 'Failed to update profile image.');
    } finally {
      setImageLoading(false);
    }
  };

  // Handle image removal
  const handleImageRemove = async () => {
    try {
      const response = await fetch('/api/v1/profile/image', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        updateUser(data.data);
        setImagePreview(null);
        setProfileImage(null);
        showAlert('success', 'Success!', 'Profile image removed successfully.');
      } else {
        throw new Error(data.message || 'Failed to remove profile image');
      }
    } catch (error) {
      console.error('Error removing image:', error);
      showAlert('error', 'Remove failed', error.message || 'Failed to remove profile image.');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateForm(formData, {
      firstname: validationSchemas.registration.firstName,
      lastname: validationSchemas.registration.lastName,
      email: validationSchemas.registration.email,
      username: validationSchemas.registration.username,
      contact_number: validationSchemas.registration.contactNumber
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      showAlert('error', 'Validation Error', 'Please fix the errors below.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        updateUser(data.data);
        showAlert('success', 'Success!', 'Profile updated successfully.');
        navigate('/dashboard');
      } else {
        if (data.errors) {
          const errorObj = {};
          data.errors.forEach(error => {
            errorObj[error.field] = error.message;
          });
          setErrors(errorObj);
        }
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert('error', 'Update failed', error.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  // Handle role upgrade request
  const handleRoleUpgrade = async () => {
    if (!roleUpgradeReason.trim() || roleUpgradeReason.length < 10) {
      showAlert('error', 'Invalid reason', 'Please provide a detailed reason (at least 10 characters).');
      return;
    }

    try {
      const response = await fetch('/api/v1/profile/role-upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          requestedRole: 'designer',
          reason: roleUpgradeReason
        })
      });

      const data = await response.json();

      if (data.success) {
        showAlert('success', 'Request submitted!', data.message);
        setShowRoleUpgrade(false);
        setRoleUpgradeReason('');
      } else {
        throw new Error(data.message || 'Failed to submit role upgrade request');
      }
    } catch (error) {
      console.error('Error submitting role upgrade:', error);
      showAlert('error', 'Request failed', error.message || 'Failed to submit role upgrade request.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Edit Profile
          </h1>
          <p className="text-xl text-gray-300">
            Update your personal information and preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Image Section */}
          <motion.div 
            className={`lg:col-span-1 transform transition-all duration-1000 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-purple-500/20">
              <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Profile Picture
              </h3>
              
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                    {imagePreview ? (
                      <img 
                        src={imagePreview} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-white" />
                    )}
                  </div>
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all duration-300"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {profileImage && (
                  <div className="space-y-3 mb-4">
                    <button
                      onClick={handleImageUpload}
                      disabled={imageLoading}
                      className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {imageLoading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{imageLoading ? 'Uploading...' : 'Upload Image'}</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setProfileImage(null);
                        setImagePreview(user.profile?.profile_image || null);
                      }}
                      className="w-full px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {imagePreview && !profileImage && (
                  <button
                    onClick={handleImageRemove}
                    className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl font-medium hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Remove Image</span>
                  </button>
                )}

                <p className="text-sm text-gray-400 mt-4">
                  Supported formats: JPEG, PNG, WebP<br />
                  Maximum size: 5MB
                </p>
              </div>
            </div>

            {/* Role Upgrade Section */}
            {user.role === 'user' && (
              <div className="mt-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl shadow-purple-500/20">
                <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center">
                  <Award className="w-5 h-5 mr-2 text-cyan-400" />
                  Become a Designer
                </h3>
                
                {!showRoleUpgrade ? (
                  <div>
                    <p className="text-sm text-gray-400 mb-4">
                      Upgrade to designer role to upload and showcase your designs.
                    </p>
                    <button
                      onClick={() => setShowRoleUpgrade(true)}
                      className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                    >
                      Request Upgrade
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <textarea
                      value={roleUpgradeReason}
                      onChange={(e) => setRoleUpgradeReason(e.target.value)}
                      placeholder="Tell us why you want to become a designer..."
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors duration-300 resize-none"
                      rows={4}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleRoleUpgrade}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => {
                          setShowRoleUpgrade(false);
                          setRoleUpgradeReason('');
                        }}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Profile Form */}
          <motion.div 
            className={`lg:col-span-2 transform transition-all duration-1000 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl shadow-purple-500/20">
              <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Personal Information
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      First Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="firstname"
                        value={formData.firstname}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${errors.firstname ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors duration-300`}
                        placeholder="Enter your first name"
                      />
                    </div>
                    {errors.firstname && (
                      <p className="mt-1 text-sm text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.firstname}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="lastname"
                        value={formData.lastname}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${errors.lastname ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors duration-300`}
                        placeholder="Enter your last name"
                      />
                    </div>
                    {errors.lastname && (
                      <p className="mt-1 text-sm text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.lastname}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email and Username */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${errors.email ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors duration-300`}
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Username *
                    </label>
                    <div className="relative">
                      <Edit3 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${errors.username ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors duration-300`}
                        placeholder="Enter your username"
                      />
                    </div>
                    {errors.username && (
                      <p className="mt-1 text-sm text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.username}
                      </p>
                    )}
                  </div>
                </div>

                {/* Contact and Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Contact Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="contact_number"
                        value={formData.contact_number}
                        onChange={handleInputChange}
                        className={`w-full pl-12 pr-4 py-3 bg-white/10 border ${errors.contact_number ? 'border-red-400' : 'border-white/20'} rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors duration-300`}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.contact_number && (
                      <p className="mt-1 text-sm text-red-400 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.contact_number}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400 transition-colors duration-300"
                    >
                      <option value="" className="bg-slate-800">Select gender</option>
                      <option value="male" className="bg-slate-800">Male</option>
                      <option value="female" className="bg-slate-800">Female</option>
                      <option value="other" className="bg-slate-800">Other</option>
                    </select>
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400 transition-colors duration-300"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors duration-300 resize-none"
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  X, 
  Send, 
  AlertCircle, 
  Users, 
  Calendar,
  Target,
  Globe,
  User
} from 'lucide-react';
import { announcementAPI } from '../services/adminService';

const CreateAnnouncement = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'system',
    priority: 3,
    targetRoles: [],
    targetUsers: [],
    expiresAt: '',
    eventId: ''
  });
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    
    if (inputType === 'checkbox' && name === 'targetRoles') {
      setFormData(prev => ({
        ...prev,
        targetRoles: checked 
          ? [...prev.targetRoles, value]
          : prev.targetRoles.filter(role => role !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setLoading(true);
    
    try {
      const submitData = {
        ...formData,
        title: formData.title.trim(),
        content: formData.content.trim(),
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined
      };

      // Clean up empty arrays and strings
      if (submitData.targetRoles.length === 0) delete submitData.targetRoles;
      if (submitData.targetUsers.length === 0) delete submitData.targetUsers;
      if (!submitData.eventId) delete submitData.eventId;
      if (!submitData.expiresAt) delete submitData.expiresAt;

      const response = await announcementAPI.create(submitData);
      
      toast.success('Announcement created successfully!');
      onSuccess?.(response.announcement);
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        type: 'system',
        priority: 3,
        targetRoles: [],
        targetUsers: [],
        expiresAt: '',
        eventId: ''
      });
      
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error(error.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 1: return 'text-green-400';
      case 2: return 'text-yellow-400';
      case 3: return 'text-orange-400';
      case 4: return 'text-red-400';
      case 5: return 'text-red-300';
      default: return 'text-gray-400';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1: return 'Low Priority';
      case 2: return 'Medium-Low Priority';
      case 3: return 'Medium Priority';
      case 4: return 'High Priority';
      case 5: return 'Urgent Priority';
      default: return 'Unknown Priority';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'system': return Globe;
      case 'targeted': return Target;
      case 'event': return Calendar;
      default: return AlertCircle;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-slate-800/95 to-purple-900/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            📢 Create Announcement
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Announcement Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter announcement title..."
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              placeholder="Write your announcement content here..."
              rows={6}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Announcement Type
              </label>
              <div className="relative">
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white focus:border-purple-400/50 focus:outline-none transition-all duration-300 appearance-none"
                >
                  <option value="system" className="bg-slate-800">🌐 System-wide</option>
                  <option value="targeted" className="bg-slate-800">🎯 Targeted</option>
                  <option value="event" className="bg-slate-800">🎪 Event-related</option>
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  {(() => {
                    const IconComponent = getTypeIcon(formData.type);
                    return <IconComponent className="w-5 h-5 text-gray-400" />;
                  })()}
                </div>
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority Level
              </label>
              <div className="space-y-2">
                <input
                  type="range"
                  name="priority"
                  min="1"
                  max="5"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
                <div className={`text-center text-sm font-medium ${getPriorityColor(formData.priority)}`}>
                  {getPriorityLabel(formData.priority)}
                </div>
              </div>
            </div>
          </div>

          {/* Target Roles - Only show for targeted announcements */}
          {formData.type === 'targeted' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Target Roles
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['participant', 'organizer', 'admin'].map((role) => (
                  <label key={role} className="flex items-center space-x-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      name="targetRoles"
                      value={role}
                      checked={formData.targetRoles.includes(role)}
                      onChange={handleInputChange}
                      className="form-checkbox h-4 w-4 text-purple-500 bg-white/10 border-white/20 rounded focus:ring-purple-400"
                    />
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300 capitalize">{role}s</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Expires At (Optional)
            </label>
            <input
              type="datetime-local"
              name="expiresAt"
              value={formData.expiresAt}
              onChange={handleInputChange}
              className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white focus:border-purple-400/50 focus:outline-none transition-all duration-300"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave empty for permanent announcements
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-gray-300 font-medium transition-all duration-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim() || !formData.content.trim()}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl text-white font-medium shadow-lg hover:shadow-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Create Announcement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateAnnouncement;
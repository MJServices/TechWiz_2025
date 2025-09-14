import React, { useState, useEffect, useCallback } from 'react';
import { feedbackAPI } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const EventFeedback = ({ eventId, onFeedbackSubmitted }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    rating: 0,
    comments: '',
    attachments: [],
    componentRatings: {
      venue: 0,
      coordination: 0,
      technical: 0,
      hospitality: 0
    }
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState([]);

  // Debounced validation
  const [debounceTimer, setDebounceTimer] = useState(null);

  const validateField = useCallback((name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'rating':
        if (!value || value < 1 || value > 5) {
          newErrors.rating = 'Please select a rating between 1 and 5 stars';
        } else {
          delete newErrors.rating;
        }
        break;
      case 'comments':
        if (value && value.length > 1000) {
          newErrors.comments = 'Comments must be less than 1000 characters';
        } else {
          delete newErrors.comments;
        }
        break;
      case 'attachments':
        if (value && value.length > 5) {
          newErrors.attachments = 'Maximum 5 attachments allowed';
        } else {
          delete newErrors.attachments;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
  }, [errors]);

  const debouncedValidate = useCallback((name, value) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const timer = setTimeout(() => validateField(name, value), 500);
    setDebounceTimer(timer);
  }, [debounceTimer, validateField]);

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    debouncedValidate(name, value);
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
    validateField('rating', rating);
  };

  const handleComponentRatingChange = (component, rating) => {
    setFormData(prev => ({
      ...prev,
      componentRatings: {
        ...prev.componentRatings,
        [component]: rating
      }
    }));
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    setFiles(prev => [...prev, ...selectedFiles]);
    debouncedValidate('attachments', [...files, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    const newFiles = files.filter((_, i) => i !== index);
    debouncedValidate('attachments', newFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const validationErrors = {};
    if (!formData.rating) validationErrors.rating = 'Rating is required';
    if (formData.comments && formData.comments.length > 1000) {
      validationErrors.comments = 'Comments must be less than 1000 characters';
    }
    if (files.length > 5) validationErrors.attachments = 'Maximum 5 attachments allowed';

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload files first
      const attachmentUrls = [];
      for (const file of files) {
        try {
          const url = await feedbackAPI.uploadAttachment(file);
          attachmentUrls.push(url);
        } catch (uploadError) {
          console.error('Failed to upload file:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      // Submit feedback
      const feedbackData = {
        eventId,
        ...formData,
        attachments: attachmentUrls
      };

      await feedbackAPI.submit(feedbackData);
      toast.success('Feedback submitted successfully! Check your email for confirmation.');
      onFeedbackSubmitted?.();
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      toast.error(error.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating, onChange, interactive = true) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onChange(star)}
            className={`text-2xl ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'} ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
            disabled={!interactive}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-6">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
        Share Your Feedback
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
         <div>
           <label className="block text-white font-medium mb-2">
             Overall Rating <span className="text-red-400">*</span>
           </label>
           <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
             {renderStars(formData.rating, handleRatingChange)}
           </div>
           {errors.rating && <p className="text-red-400 text-sm mt-1">{errors.rating}</p>}
         </div>

        {/* Component Ratings */}
         <div>
           <h3 className="text-white font-medium mb-3">Detailed Ratings (Optional)</h3>
           <div className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 p-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[
                 { key: 'venue', label: 'Venue' },
                 { key: 'coordination', label: 'Coordination' },
                 { key: 'technical', label: 'Technical Support' },
                 { key: 'hospitality', label: 'Hospitality' }
               ].map(({ key, label }) => (
                 <div key={key}>
                   <label className="block text-gray-300 text-sm mb-1">{label}</label>
                   {renderStars(formData.componentRatings[key], (rating) => handleComponentRatingChange(key, rating))}
                 </div>
               ))}
             </div>
           </div>
         </div>

        {/* Comments */}
        <div>
          <label htmlFor="comments" className="block text-white font-medium mb-2">
            Comments (Optional)
          </label>
          <textarea
            id="comments"
            name="comments"
            value={formData.comments}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            placeholder="Share your thoughts about the event..."
            maxLength={1000}
          />
          <div className="flex justify-between text-sm text-gray-400 mt-1">
            {errors.comments && <span className="text-red-400">{errors.comments}</span>}
            <span className="ml-auto">{formData.comments.length}/1000</span>
          </div>
        </div>

        {/* File Attachments */}
        <div>
          <label htmlFor="attachments" className="block text-white font-medium mb-2">
            Attachments (Optional)
          </label>
          <div className="space-y-3">
            <input
              type="file"
              id="attachments"
              multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="attachments"
              className="inline-flex items-center px-4 py-2 bg-white/10 border border-white/20 rounded-xl cursor-pointer hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Choose Files
            </label>
            <p className="text-sm text-gray-400">Max 5 files, images, PDF, or documents</p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 mt-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-white text-sm">{file.name}</span>
                    <span className="text-gray-400 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    aria-label="Remove file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          {errors.attachments && <p className="text-red-400 text-sm mt-1">{errors.attachments}</p>}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !!errors.rating}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/30 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventFeedback;
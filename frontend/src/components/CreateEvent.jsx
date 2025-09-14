import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { validateForm, validationSchemas } from '../utils/validation';
import ErrorBoundary from './ErrorBoundary';

const CreateEvent = () => {
   console.log('[DEBUG] CreateEvent component mounted');
   const { user, isAuthenticated } = useAuth();
   const navigate = useNavigate();
   const [loading, setLoading] = useState(false);
   const [errors, setErrors] = useState({});
   const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical',
    date: '',
    time: '',
    venue: '',
    maxSeats: 0,
    waitlistEnabled: false,
    bannerImage: '',
    rulebook: ''
  });

  // Redirect if not authenticated or not an organizer/admin
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: '/events/create' } });
      return;
    }

    if (user && user.role !== 'organizer' && user.role !== 'admin') {
      toast.error('You do not have permission to create events');
      navigate('/events');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    const validation = validateForm(formData, validationSchemas.eventCreation);
    if (!validation.isValid) {
      setErrors(validation.errors);
      toast.error('Please fix the errors below');
      return;
    }

    setLoading(true);
     setErrors({});

     console.log('[DEBUG] Attempting to create event with data:', formData);
     try {
       const response = await eventsAPI.create(formData);
      toast.success('Event created successfully! It will be visible to participants once approved by an admin.');
      navigate(`/events/${response.data._id}`);
    } catch (error) {
      console.error('Failed to create event:', error);
      toast.error(error.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div
            className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="mb-6">
            <button
              onClick={() => navigate('/events')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center transition-colors duration-300"
              aria-label="Back to Events"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Back to Events
            </button>
          </div>

          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden hover:shadow-cyan-500/10 transition-all duration-300">
            <div className="p-6 md:p-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-8">Create New Event</h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-white font-semibold mb-3 text-lg" htmlFor="title">
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  aria-required="true"
                  aria-describedby={errors.title ? "title-error" : undefined}
                  className={`w-full px-4 py-3 bg-white/10 backdrop-blur-lg border rounded-xl text-white placeholder-gray-400 focus:border-cyan-400/50 focus:outline-none transition-all duration-300 ${
                    errors.title ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                  }`}
                  placeholder="Enter event title"
                />
                {errors.title && (
                  <p id="title-error" className="mt-2 text-sm text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-white font-semibold mb-3 text-lg" htmlFor="description">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows="6"
                  aria-describedby={errors.description ? "description-error" : undefined}
                  className={`w-full px-4 py-3 bg-white/10 backdrop-blur-lg border rounded-xl text-white placeholder-gray-400 focus:border-cyan-400/50 focus:outline-none transition-all duration-300 resize-vertical ${
                    errors.description ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                  }`}
                  placeholder="Describe your event in detail..."
                ></textarea>
                {errors.description && (
                  <p id="description-error" className="mt-2 text-sm text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white font-semibold mb-3" htmlFor="category">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  aria-describedby={errors.category ? "category-error" : undefined}
                  className={`w-full px-4 py-3 bg-white/10 backdrop-blur-lg border rounded-xl text-white focus:border-cyan-400/50 focus:outline-none transition-all duration-300 ${
                    errors.category ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                  }`}
                >
                  <option value="" className="bg-slate-800">Select a category</option>
                  <option value="technical" className="bg-slate-800">Technical</option>
                  <option value="cultural" className="bg-slate-800">Cultural</option>
                  <option value="sports" className="bg-slate-800">Sports</option>
                  <option value="workshop" className="bg-slate-800">Workshop</option>
                  <option value="seminar" className="bg-slate-800">Seminar</option>
                  <option value="competition" className="bg-slate-800">Competition</option>
                  <option value="other" className="bg-slate-800">Other</option>
                </select>
                {errors.category && (
                  <p id="category-error" className="mt-2 text-sm text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.category}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white font-semibold mb-3" htmlFor="venue">
                  Venue *
                </label>
                <input
                  type="text"
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                  aria-describedby={errors.venue ? "venue-error" : undefined}
                  className={`w-full px-4 py-3 bg-white/10 backdrop-blur-lg border rounded-xl text-white placeholder-gray-400 focus:border-cyan-400/50 focus:outline-none transition-all duration-300 ${
                    errors.venue ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                  }`}
                  placeholder="Enter venue location"
                />
                {errors.venue && (
                  <p id="venue-error" className="mt-2 text-sm text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.venue}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white font-semibold mb-3" htmlFor="date">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  aria-describedby={errors.date ? "date-error" : undefined}
                  className={`w-full px-4 py-3 bg-white/10 backdrop-blur-lg border rounded-xl text-white focus:border-cyan-400/50 focus:outline-none transition-all duration-300 ${
                    errors.date ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                  }`}
                />
                {errors.date && (
                  <p id="date-error" className="mt-2 text-sm text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.date}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white font-semibold mb-3" htmlFor="time">
                  Time *
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                  aria-describedby={errors.time ? "time-error" : undefined}
                  className={`w-full px-4 py-3 bg-white/10 backdrop-blur-lg border rounded-xl text-white focus:border-cyan-400/50 focus:outline-none transition-all duration-300 ${
                    errors.time ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                  }`}
                />
                {errors.time && (
                  <p id="time-error" className="mt-2 text-sm text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.time}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-white font-semibold mb-3" htmlFor="maxSeats">
                  Maximum Seats (0 for unlimited)
                </label>
                <input
                  type="number"
                  id="maxSeats"
                  name="maxSeats"
                  value={formData.maxSeats}
                  onChange={handleChange}
                  min="0"
                  aria-describedby={errors.maxSeats ? "maxSeats-error" : undefined}
                  className={`w-full px-4 py-3 bg-white/10 backdrop-blur-lg border rounded-xl text-white placeholder-gray-400 focus:border-cyan-400/50 focus:outline-none transition-all duration-300 ${
                    errors.maxSeats ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                  }`}
                  placeholder="0"
                />
                {errors.maxSeats && (
                  <p id="maxSeats-error" className="mt-2 text-sm text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.maxSeats}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="waitlistEnabled"
                  name="waitlistEnabled"
                  checked={formData.waitlistEnabled}
                  onChange={handleChange}
                  className="h-5 w-5 text-cyan-400 focus:ring-cyan-400 border-white/20 rounded bg-white/10 backdrop-blur-lg"
                />
                <label className="text-white font-medium cursor-pointer" htmlFor="waitlistEnabled">
                  Enable waitlist when full
                </label>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-white font-semibold mb-3" htmlFor="bannerImage">
                  Banner Image URL (optional)
                </label>
                <input
                  type="url"
                  id="bannerImage"
                  name="bannerImage"
                  value={formData.bannerImage}
                  onChange={handleChange}
                  aria-describedby={errors.bannerImage ? "bannerImage-error" : undefined}
                  className={`w-full px-4 py-3 bg-white/10 backdrop-blur-lg border rounded-xl text-white placeholder-gray-400 focus:border-cyan-400/50 focus:outline-none transition-all duration-300 ${
                    errors.bannerImage ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                  }`}
                  placeholder="https://example.com/image.jpg"
                />
                {errors.bannerImage && (
                  <p id="bannerImage-error" className="mt-2 text-sm text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.bannerImage}
                  </p>
                )}
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-white font-semibold mb-3" htmlFor="rulebook">
                  Rulebook URL (optional)
                </label>
                <input
                  type="url"
                  id="rulebook"
                  name="rulebook"
                  value={formData.rulebook}
                  onChange={handleChange}
                  aria-describedby={errors.rulebook ? "rulebook-error" : undefined}
                  className={`w-full px-4 py-3 bg-white/10 backdrop-blur-lg border rounded-xl text-white placeholder-gray-400 focus:border-cyan-400/50 focus:outline-none transition-all duration-300 ${
                    errors.rulebook ? 'border-red-400/50 bg-red-500/10' : 'border-white/20'
                  }`}
                  placeholder="https://example.com/rulebook.pdf"
                />
                {errors.rulebook && (
                  <p id="rulebook-error" className="mt-2 text-sm text-red-400 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.rulebook}
                  </p>
                )}
              </div>

                  <div className="col-span-1 md:col-span-2 mt-8">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg hover:shadow-cyan-500/30 text-white px-6 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 text-lg font-semibold"
                      aria-describedby={loading ? "loading-status" : undefined}
                    >
                      {loading ? (
                        <span id="loading-status" className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Event...
                        </span>
                      ) : (
                        'Create Event'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </ErrorBoundary>
  );
};

export default memo(CreateEvent);
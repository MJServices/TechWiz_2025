import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { certificateService } from '../services/apiServices';
import { showSuccess, showError } from '../utils/sweetAlert';

const CertificateManagement = () => {
  const { user, isAuthenticated } = useAuth();
  const [attendedEvents, setAttendedEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingEvents, setFetchingEvents] = useState(true);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Fetch attended events on component mount
  useEffect(() => {
    const fetchAttendedEvents = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await certificateService.getAttendedEvents();
        setAttendedEvents(response.events || []);
      } catch (error) {
        console.error('Failed to fetch attended events:', error);
        showError('Failed to load attended events');
      } finally {
        setFetchingEvents(false);
      }
    };

    fetchAttendedEvents();
  }, [isAuthenticated]);

  // Debounced validation function
  const debouncedValidate = useCallback((value) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      const newErrors = {};

      if (!value) {
        newErrors.event = 'Please select an event';
      }

      setErrors(newErrors);
    }, 300); // 300ms debounce

    setDebounceTimer(timer);
  }, [debounceTimer]);

  // Real-time validation with debouncing
  useEffect(() => {
    debouncedValidate(selectedEventId);
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [selectedEventId, debouncedValidate, debounceTimer]);

  const handleEventChange = (e) => {
    setSelectedEventId(e.target.value);
    setSubmitted(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    if (Object.keys(errors).length > 0 || !selectedEventId) {
      return;
    }

    setLoading(true);
    try {
      await certificateService.requestCertificate(selectedEventId);
      showSuccess('Certificate request submitted successfully!');
      setSelectedEventId('');
      setSubmitted(false);
    } catch (error) {
      console.error('Failed to request certificate:', error);
      showError(error.message || 'Failed to submit certificate request');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-glass-light backdrop-blur-md rounded-2xl border border-white/20 shadow-glass">
        <p className="text-center text-gray-600">Please log in to request certificates.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl rounded-2xl border border-purple-400/30 shadow-2xl">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Request Certificate
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Personal Details Section */}
        <div className="bg-gradient-to-br from-purple-800/15 to-purple-900/15 backdrop-blur-xl p-4 sm:p-6 rounded-xl border border-purple-400/20 shadow-2xl">
          <h3 className="text-lg font-semibold text-white mb-4">Personal Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={user?.fullName || user?.username || ''}
                readOnly
                className="w-full px-3 py-2 border border-white/20 rounded-lg bg-glass-light backdrop-blur-sm cursor-not-allowed shadow-inner"
                aria-describedby="name-desc"
              />
              <p id="name-desc" className="text-xs text-gray-400 mt-1">
                This information will appear on your certificate
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full px-3 py-2 border border-white/20 rounded-lg bg-glass-light backdrop-blur-sm cursor-not-allowed shadow-inner"
                aria-describedby="email-desc"
              />
              <p id="email-desc" className="text-xs text-gray-400 mt-1">
                Used for certificate delivery
              </p>
            </div>
          </div>
        </div>

        {/* Event Selection */}
        <div>
          <label
            htmlFor="event-select"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Select Event Attended *
          </label>
          {fetchingEvents ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
              <span className="ml-2 text-gray-300">Loading events...</span>
            </div>
          ) : attendedEvents.length === 0 ? (
            <p className="text-gray-300 py-4">
              No attended events found. You must attend an event to request a certificate.
            </p>
          ) : (
            <select
              id="event-select"
              value={selectedEventId}
              onChange={handleEventChange}
              className={`w-full px-3 py-2 border rounded-lg bg-glass-light backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 shadow-inner transition-all duration-200 ${
                errors.event && submitted ? 'border-red-400 bg-red-50/10' : 'border-white/20'
              }`}
              aria-describedby={errors.event && submitted ? "event-error" : "event-desc"}
              aria-invalid={errors.event && submitted ? "true" : "false"}
            >
              <option value="">Choose an event...</option>
              {attendedEvents.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.title} - {new Date(event.date).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
          {errors.event && submitted && (
            <p id="event-error" className="text-red-400 text-sm mt-2 bg-red-50/10 backdrop-blur-sm px-3 py-2 rounded-lg border border-red-200/20" role="alert">
              {errors.event}
            </p>
          )}
          {!fetchingEvents && attendedEvents.length > 0 && (
            <p id="event-desc" className="text-xs text-gray-400 mt-1">
              Only events you have attended are shown
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading || fetchingEvents || attendedEvents.length === 0}
            className="px-6 py-3 bg-gradient-to-br from-purple-800/20 to-purple-900/20 backdrop-blur-xl text-white rounded-xl border border-purple-400/30 hover:bg-gradient-to-br hover:from-purple-800/30 hover:to-purple-900/30 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-2xl hover:shadow-purple-500/30"
            aria-describedby="submit-desc"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </span>
            ) : (
              'Request Certificate'
            )}
          </button>
        </div>
        <p id="submit-desc" className="text-xs text-gray-400 text-center">
          Certificate requests are processed within 24-48 hours
        </p>
      </form>
    </div>
  );
};

export default CertificateManagement;
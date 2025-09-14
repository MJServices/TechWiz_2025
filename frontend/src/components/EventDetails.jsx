import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventService, registrationService, bookmarkService } from '../services/apiServices';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import EventFeedback from './EventFeedback';
import { toast } from 'react-hot-toast';
import { Bookmark } from 'lucide-react';

const EventDetails = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [userRegistration, setUserRegistration] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEventDetails();
    if (isAuthenticated) {
      checkUserRegistration();
      checkBookmarkStatus();
    }
  }, [id, isAuthenticated]);

  const fetchEventDetails = async () => {
    setLoading(true);
    try {
      console.log('[EventDetails] Fetching event details for ID:', id);
      const response = await eventService.getEventById(id);
      console.log('[EventDetails] Full response object:', response);
      console.log('[EventDetails] Response data type:', typeof response);
      console.log('[EventDetails] Response data keys:', Object.keys(response));
      console.log('[EventDetails] Response data:', response);
      console.log('[EventDetails] Checking response.event:', response.event);
      console.log('[EventDetails] Checking response.data:', response.data);
      console.log('[EventDetails] Checking response.data.event:', response.data?.event);
      console.log('[EventDetails] Checking response.data directly as event:', response.data);

      // Try different ways to access the event
      let eventData = null;
      if (response.data?.event) {
        eventData = response.data.event;
        console.log('Found event in response.data.event');
      } else if (response.event) {
        eventData = response.event;
        console.log('Found event in response.event');
      } else if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
        // Check if response.data is the event object itself
        if (response.data.title || response.data._id) {
          eventData = response.data;
          console.log('Response.data appears to be the event object directly');
        } else if (response.data.data?.event) {
          // Handle nested response structure
          eventData = response.data.data.event;
          console.log('Found event in response.data.data.event');
        }
      }

      console.log('Final eventData:', eventData);

      if (!eventData) {
        console.error('Could not extract event data from response');
        toast.error('Failed to load event details - invalid response format');
        return;
      }

      setEvent(eventData);
    } catch (err) {
      console.error('Error fetching event details:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      console.error('Error response status:', err.response?.status);
      if (err.response?.status === 404) {
        setEvent(null);
      } else {
        toast.error('Failed to load event details');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkUserRegistration = async () => {
    try {
      const response = await registrationService.getUserRegistrations();
      const registration = response.data.find(reg => reg.event === id);
      setUserRegistration(registration || null);
    } catch (err) {
      console.error('Error checking registration status:', err);
    }
  };

  const checkBookmarkStatus = async () => {
    try {
      const response = await bookmarkService.checkEventBookmark(id);
      setIsBookmarked(response.isBookmarked);
    } catch (err) {
      console.error('Error checking bookmark status:', err);
      setIsBookmarked(false);
    }
  };

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to bookmark events');
      navigate('/login', { state: { returnTo: `/events/${id}` } });
      return;
    }

    const newBookmarkStatus = !isBookmarked;
    setIsBookmarked(newBookmarkStatus); // Optimistic update

    try {
      if (newBookmarkStatus) {
        await bookmarkService.addEventBookmark(id);
        toast.success('Event bookmarked successfully');
      } else {
        await bookmarkService.removeEventBookmark(id);
        toast.success('Bookmark removed successfully');
      }
    } catch (error) {
      console.error('Bookmark toggle error:', error);
      setIsBookmarked(!newBookmarkStatus); // Revert on error
      toast.error(error.response?.data?.message || 'Failed to update bookmark');
    }
  };

  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to register for this event');
      navigate('/login', { state: { returnTo: `/events/${id}` } });
      return;
    }

    setRegistering(true);
    try {
      await registrationService.registerForEvent(id, {});
      toast.success('Successfully registered for the event');
      checkUserRegistration();
    } catch (err) {
      console.error('Registration failed:', err);
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!userRegistration) return;
    
    try {
      await registrationService.cancelRegistration(userRegistration._id);
      toast.success('Registration cancelled successfully');
      setUserRegistration(null);
    } catch (err) {
      console.error('Failed to cancel registration:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel registration');
    }
  };

  const handleEditEvent = () => {
    navigate(`/edit-event/${id}`);
  };

  const handleApproveEvent = async () => {
    try {
      await eventService.approveEvent(id);
      toast.success('Event approved successfully');
      fetchEventDetails();
    } catch (err) {
      console.error('Failed to approve event:', err);
      toast.error('Failed to approve event');
    }
  };

  const handleCancelEvent = async () => {
    try {
      await eventService.cancelEvent(id);
      toast.success('Event cancelled successfully');
      fetchEventDetails();
    } catch (err) {
      console.error('Failed to cancel event:', err);
      toast.error('Failed to cancel event');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading event details..." />;
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-500">Event not found or has been removed.</p>
        <button
          onClick={() => navigate('/events')}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-300"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isOrganizer = user && event.organizer === user._id;
  const isAdmin = user && user.role === 'admin';
  const canEdit = isOrganizer || isAdmin;
  const canApprove = isAdmin && event.status === 'pending';
  const canCancel = (isOrganizer || isAdmin) && ['pending', 'approved'].includes(event.status);
  const canRegister = isAuthenticated &&
                     !isOrganizer &&
                     !userRegistration &&
                     event.status === 'approved' &&
                     (event.maxSeats === 0 || event.seatsAvailable > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
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
            className="text-purple-400 hover:text-purple-300 flex items-center transition-colors duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Events
          </button>
        </div>

        <div className="card">
        {event.bannerImage && (
          <div className="h-64 overflow-hidden">
            <img
              src={event.bannerImage}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{event.title}</h1>
            <span className={`badge ${
              event.status === 'approved' ? 'badge-success' :
              event.status === 'pending' ? 'badge-warning' :
              event.status === 'cancelled' ? 'badge-error' :
              'badge-info'
            }`}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="col-span-2">
              <h2 className="text-xl font-semibold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">About this event</h2>
              <p className="text-gray-300 whitespace-pre-line mb-6">{event.description}</p>

              {event.rulebook && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">Rulebook</h2>
                  <a
                    href={event.rulebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 flex items-center transition-colors duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                    </svg>
                    Download Rulebook
                  </a>
                </div>
              )}
            </div>

            <div className="card-body">
              <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">Event Details</h2>
              
              <div className="mb-4">
                <h3 className="text-gray-400 text-sm">Date & Time</h3>
                <p className="text-white">{formattedDate} • {event.time}</p>
              </div>

              <div className="mb-4">
                <h3 className="text-gray-400 text-sm">Venue</h3>
                <p className="text-white">{event.venue}</p>
              </div>

              <div className="mb-4">
                <h3 className="text-gray-400 text-sm">Category</h3>
                <p className="text-white capitalize">{event.category}</p>
              </div>

              {event.maxSeats > 0 && (
                <div className="mb-4">
                  <h3 className="text-gray-400 text-sm">Capacity</h3>
                  <p className="text-white">
                    {event.currentBooked} / {event.maxSeats} registered
                    <span className="block text-sm text-cyan-400">
                      {event.seatsAvailable} seats available
                    </span>
                  </p>
                </div>
              )}
              
              {userRegistration && (
                <div className="mb-6 p-3 badge-success rounded-xl">
                  <p className="font-medium">You are registered for this event</p>
                  <p className="text-sm">Registration status: {userRegistration.status}</p>

                  {userRegistration.status === 'confirmed' && (
                    <button
                      onClick={handleCancelRegistration}
                      className="mt-2 w-full btn btn-danger"
                    >
                      Cancel Registration
                    </button>
                  )}
                </div>
              )}

              {/* Bookmark Button */}
              {isAuthenticated && (
                <button
                  onClick={handleBookmarkToggle}
                  className={`group relative w-full flex items-center justify-center px-6 py-3 rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    isBookmarked
                      ? "badge-info"
                      : "btn btn-outline"
                  }`}
                  aria-label={isBookmarked ? "Remove bookmark" : "Bookmark event"}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Bookmark className={`w-5 h-5 mr-3 relative z-10 transition-all duration-300 ${
                    isBookmarked
                      ? "fill-current animate-pulse"
                      : "group-hover:fill-blue-300"
                  }`} />
                  <span className="relative z-10 font-medium">
                    {isBookmarked ? "Bookmarked" : "Bookmark Event"}
                  </span>
                  {isBookmarked && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                  )}
                </button>
              )}

              {canRegister && (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full btn btn-primary disabled:opacity-50"
                >
                  {registering ? 'Registering...' : 'Register Now'}
                </button>
              )}

              {!isAuthenticated && (
                <button
                  onClick={() => navigate('/login', { state: { returnTo: `/events/${id}` } })}
                  className="w-full btn btn-primary"
                >
                  Login to Register
                </button>
              )}

              {canEdit && (
                <div className="mt-4 flex flex-col space-y-2">
                  <button
                    onClick={handleEditEvent}
                    className="w-full btn btn-outline"
                  >
                    Edit Event
                  </button>

                  {canApprove && (
                    <button
                      onClick={handleApproveEvent}
                      className="w-full btn btn-success"
                    >
                      Approve Event
                    </button>
                  )}

                  {canCancel && (
                    <button
                      onClick={handleCancelEvent}
                      className="w-full btn btn-danger"
                    >
                      Cancel Event
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Section for Registered Users */}
        {isAuthenticated && userRegistration && userRegistration.status === 'confirmed' && (
          <div className="mt-8">
            <EventFeedback
              eventId={id}
              onFeedbackSubmitted={() => {
                // Optional: refresh event details or show success message
                toast.success('Thank you for your feedback!');
              }}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
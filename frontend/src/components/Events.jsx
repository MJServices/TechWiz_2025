import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Filter,
  Search,
  Star,
  BookOpen,
  Award,
  Bookmark,
  X,
  ChevronDown,
  User,
  Building,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { eventsAPI } from "../services/eventService";
import { bookmarkService } from "../services/apiServices";
import { toast } from "react-hot-toast";
import EventStatusBadge from "./EventStatusBadge";
import { calculateEventStatus } from "../utils/eventUtils";

const Events = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedVenue, setSelectedVenue] = useState("");
  const [selectedOrganizer, setSelectedOrganizer] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [minCapacity, setMinCapacity] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [bookmarkedEvents, setBookmarkedEvents] = useState(new Set());
  const [organizers, setOrganizers] = useState([]);
  const [venues, setVenues] = useState([]);
  const [departments, setDepartments] = useState([]);

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "technical", label: "Technical" },
    { value: "cultural", label: "Cultural" },
    { value: "sports", label: "Sports" },
    { value: "workshop", label: "Workshop" },
    { value: "seminar", label: "Seminar" },
    { value: "competition", label: "Competition" },
    { value: "other", label: "Other" },
  ];

  const statuses = [
    { value: "all", label: "All Events" },
    { value: "upcoming", label: "Upcoming" },
    { value: "ongoing", label: "Ongoing" },
    { value: "completed", label: "Completed" },
    { value: "approved", label: "Approved" },
    { value: "pending", label: "Pending" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const departmentOptions = [
    { value: "all", label: "All Departments" },
    { value: "Computer Science", label: "Computer Science" },
    { value: "Information Technology", label: "Information Technology" },
    { value: "Electronics", label: "Electronics" },
    { value: "Mechanical", label: "Mechanical" },
    { value: "Civil", label: "Civil" },
    { value: "Electrical", label: "Electrical" },
    { value: "Business Administration", label: "Business Administration" },
    { value: "Other", label: "Other" },
  ];

  // Extract unique values for filters
  const extractFilterOptions = (events) => {
    const uniqueOrganizers = new Set();
    const uniqueVenues = new Set();
    const uniqueDepartments = new Set();
    const searchTerms = new Set();

    events.forEach(event => {
      if (event.organizer) {
        if (event.organizer.username) uniqueOrganizers.add(event.organizer.username);
        if (event.organizer.department) uniqueDepartments.add(event.organizer.department);
      }
      if (event.venue) uniqueVenues.add(event.venue);
      if (event.title) searchTerms.add(event.title);
      if (event.description) {
        // Extract keywords from description
        const words = event.description.split(' ').filter(word => word.length > 3);
        words.forEach(word => searchTerms.add(word));
      }
      if (event.tags) {
        event.tags.forEach(tag => searchTerms.add(tag));
      }
    });

    setOrganizers(Array.from(uniqueOrganizers).sort());
    setVenues(Array.from(uniqueVenues).sort());
    setDepartments(Array.from(uniqueDepartments).sort());
    setSearchSuggestions(Array.from(searchTerms).slice(0, 20)); // Limit to 20 suggestions
  };

  // Fetch bookmark status for events
  const fetchBookmarkStatus = async (eventIds) => {
    if (!isAuthenticated || !eventIds.length) return;

    try {
      const bookmarkPromises = eventIds.map(eventId =>
        bookmarkService.checkEventBookmark(eventId).catch(() => ({ isBookmarked: false }))
      );
      const results = await Promise.all(bookmarkPromises);
      const bookmarkedSet = new Set();
      results.forEach((result, index) => {
        if (result.isBookmarked) {
          bookmarkedSet.add(eventIds[index]);
        }
      });
      setBookmarkedEvents(bookmarkedSet);
    } catch (error) {
      console.error("Error fetching bookmark status:", error);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const params = {};

        // Build query parameters
        if (searchTerm) params.q = searchTerm;
        if (selectedCategory !== "all") params.category = selectedCategory;
        if (selectedStatus !== "all") params.status = selectedStatus;
        if (selectedVenue) params.venue = selectedVenue;
        if (selectedOrganizer) params.organizer = selectedOrganizer;
        if (selectedDepartment !== "all") params.department = selectedDepartment;
        if (startDate) params.from = startDate.toISOString().split('T')[0];
        if (endDate) params.to = endDate.toISOString().split('T')[0];
        if (minCapacity) params.minCapacity = minCapacity;
        if (maxCapacity) params.maxCapacity;

        const res = await eventsAPI.getAll(params);
        console.log("Fetched events:", res.events);

        console.log("Events API Response:", res);
        console.log("Events Array:", res.events);
        
        if (res.events && Array.isArray(res.events)) {
          console.log("Setting events:", res.events.length, "events found");
          setEvents(res.events);
          setFilteredEvents(res.events);
          // Extract filter options from events
          extractFilterOptions(res.events);
          // Fetch bookmark status for the events
          const eventIds = res.events.map(event => event._id);
          fetchBookmarkStatus(eventIds);
        } else {
          console.log("No events array found in response:", res);
          setEvents([]);
          setFilteredEvents([]);
          setError("No events data received from server");
        }
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to fetch events. Please try again later.");
        setEvents([]);
        setFilteredEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [
    searchTerm,
    selectedCategory,
    selectedStatus,
    selectedVenue,
    selectedOrganizer,
    selectedDepartment,
    startDate,
    endDate,
    minCapacity,
    maxCapacity,
    isAuthenticated
  ]);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(value.length > 0);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setSelectedVenue("");
    setSelectedOrganizer("");
    setSelectedDepartment("all");
    setDateRange([null, null]);
    setMinCapacity("");
    setMaxCapacity("");
    setShowSuggestions(false);
  };

  // Client-side filtering for real-time status (keeping this for additional client-side filtering if needed)
  useEffect(() => {
    if (!events.length) {
      setFilteredEvents([]);
      return;
    }

    let filtered = events;

    // Additional client-side filtering can be added here if needed
    // For now, most filtering is done server-side

    setFilteredEvents(filtered);
  }, [events]);

  // Client-side filtering removed - now using server-side filtering

  const handleRegister = async (eventId) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    try {
      // Find the event
      const event = events.find(e => e._id === eventId);
      console.log(event)
      if (!event) return;

      // Optimistically update UI
      setEvents((prev) =>
        prev.map((event) =>
          event._id === eventId
            ? {
                ...event,
                isRegistered: !event.isRegistered,
                slotCounts: {
                  ...event.slotCounts,
                  confirmed: event.isRegistered
                    ? Math.max(0, (event.slotCounts?.confirmed || 0) - 1)
                    : (event.slotCounts?.confirmed || 0) + 1,
                },
                slotsLeft: event.slotsLeft !== null
                  ? event.isRegistered
                    ? event.slotsLeft + 1
                    : Math.max(0, event.slotsLeft - 1)
                  : null,
              }
            : event
        )
      );

      // Call registration API
      await eventsAPI.register(eventId);

    } catch (error) {
      console.error("Registration error:", error);
      // Revert optimistic update on error
      setEvents((prev) =>
        prev.map((event) =>
          event._id === eventId
            ? {
                ...event,
                isRegistered: !event.isRegistered,
                slotCounts: {
                  ...event.slotCounts,
                  confirmed: event.isRegistered
                    ? (event.slotCounts?.confirmed || 0) + 1
                    : Math.max(0, (event.slotCounts?.confirmed || 0) - 1),
                },
                slotsLeft: event.slotsLeft !== null
                  ? event.isRegistered
                    ? Math.max(0, event.slotsLeft - 1)
                    : event.slotsLeft + 1
                  : null,
              }
            : event
        )
      );
    }
  };

  const handleBookmarkToggle = async (eventId) => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    const isCurrentlyBookmarked = bookmarkedEvents.has(eventId);

    // Optimistically update UI
    setBookmarkedEvents(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyBookmarked) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });

    try {
      if (isCurrentlyBookmarked) {
        await bookmarkService.removeEventBookmark(eventId);
        toast.success("Event bookmark removed successfully");
      } else {
        await bookmarkService.addEventBookmark(eventId);
        toast.success("Event bookmarked successfully");
      }
    } catch (error) {
      console.error("Bookmark toggle error:", error);
      // Revert optimistic update on error
      setBookmarkedEvents(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyBookmarked) {
          newSet.add(eventId);
        } else {
          newSet.delete(eventId);
        }
        return newSet;
      });
      toast.error(error.response?.data?.message || "Failed to update bookmark");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "upcoming":
        return "from-blue-500 to-cyan-500";
      case "ongoing":
        return "from-green-500 to-teal-500";
      case "completed":
        return "from-gray-500 to-slate-500";
      default:
        return "from-purple-500 to-pink-500";
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "Technical":
        return "from-blue-500 to-cyan-500";
      case "Cultural":
        return "from-purple-500 to-pink-500";
      case "Sports":
        return "from-green-500 to-teal-500";
      case "Workshop":
        return "from-orange-500 to-red-500";
      case "Seminar":
        return "from-indigo-500 to-purple-500";
      case "Competition":
        return "from-yellow-500 to-orange-500";
      default:
        return "from-gray-500 to-slate-500";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4">Error Loading Events</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            EventSphere Events
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover and register for exciting college events. From technical
            competitions to cultural celebrations, find your perfect event.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 animate-slide-up">
          <div className="card">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search with Auto-complete */}
              <div className="flex-1 relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search events, titles, descriptions, tags..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    onFocus={() => setShowSuggestions(searchTerm.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Auto-complete Suggestions */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-slate-800/95 backdrop-blur-lg rounded-xl border border-white/20 max-h-48 overflow-y-auto">
                    {searchSuggestions
                      .filter(suggestion =>
                        suggestion.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .slice(0, 10)
                      .map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl"
                        >
                          {suggestion}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Filter Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-primary flex items-center"
                >
                  <Filter className="w-5 h-5 mr-2" />
                  Filters
                  {(selectedCategory !== "all" || selectedStatus !== "all" || selectedVenue || selectedOrganizer || selectedDepartment !== "all" || startDate || endDate || minCapacity || maxCapacity) && (
                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      Active
                    </span>
                  )}
                </button>

                {(selectedCategory !== "all" || selectedStatus !== "all" || selectedVenue || selectedOrganizer || selectedDepartment !== "all" || startDate || endDate || minCapacity || maxCapacity) && (
                  <button
                    onClick={clearAllFilters}
                    className="btn btn-outline flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-white/20 animate-slide-down">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                    >
                      {categories.map((category) => (
                        <option
                          key={category.value}
                          value={category.value}
                          className="bg-slate-800"
                        >
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Status
                    </label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                    >
                      {statuses.map((status) => (
                        <option
                          key={status.value}
                          value={status.value}
                          className="bg-slate-800"
                        >
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Department Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Department
                    </label>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                    >
                      {departmentOptions.map((dept) => (
                        <option
                          key={dept.value}
                          value={dept.value}
                          className="bg-slate-800"
                        >
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Venue Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Venue
                    </label>
                    <select
                      value={selectedVenue}
                      onChange={(e) => setSelectedVenue(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                    >
                      <option value="" className="bg-slate-800">All Venues</option>
                      {venues.map((venue) => (
                        <option
                          key={venue}
                          value={venue}
                          className="bg-slate-800"
                        >
                          {venue}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Organizer Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Organizer
                    </label>
                    <select
                      value={selectedOrganizer}
                      onChange={(e) => setSelectedOrganizer(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                    >
                      <option value="" className="bg-slate-800">All Organizers</option>
                      {organizers.map((organizer) => (
                        <option
                          key={organizer}
                          value={organizer}
                          className="bg-slate-800"
                        >
                          {organizer}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date Range
                    </label>
                    <div className="relative">
                      <DatePicker
                        selectsRange={true}
                        startDate={startDate}
                        endDate={endDate}
                        onChange={(update) => setDateRange(update)}
                        placeholderText="Select date range"
                        className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                        calendarClassName="bg-slate-800 border border-white/20 rounded-xl"
                        dayClassName={(date) => "text-white hover:bg-purple-500 rounded-lg"}
                        wrapperClassName="w-full"
                      />
                      <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>

                  {/* Capacity Filters */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Min Capacity
                    </label>
                    <input
                      type="number"
                      placeholder="Min seats"
                      value={minCapacity}
                      onChange={(e) => setMinCapacity(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Max Capacity
                    </label>
                    <input
                      type="number"
                      placeholder="Max seats"
                      value={maxCapacity}
                      onChange={(e) => setMaxCapacity(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Debug Info - Remove after fixing */}
        {!loading && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl">
            <h3 className="text-red-300 font-bold mb-2">Debug Info (Remove after fixing):</h3>
            <p className="text-red-200 text-sm">filteredEvents length: {filteredEvents.length}</p>
            <p className="text-red-200 text-sm">events length: {events.length}</p>
            <p className="text-red-200 text-sm">loading: {loading.toString()}</p>
            <p className="text-red-200 text-sm">error: {error || "null"}</p>
            {filteredEvents.length > 0 && (
              <p className="text-red-200 text-sm">First event: {filteredEvents[0]?.title || "No title"}</p>
            )}
          </div>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.5, 
                delay: index * 0.1,
                ease: "easeOut"
              }}
              className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl hover:shadow-purple-500/20 hover:scale-105 transition-all duration-500 overflow-hidden"
            >
              {/* Event Image with Gradient Overlay */}
              <div className="relative h-52 overflow-hidden rounded-t-3xl">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10"></div>
                <img
                  src={event.bannerImage || "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500"}
                  alt={event.title || "Event"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=500";
                  }}
                />
                
                {/* Floating Category Badge */}
                <div className="absolute top-4 left-4 z-20">
                  <span className="px-3 py-1 bg-gradient-to-r from-purple-500/90 to-pink-500/90 backdrop-blur-lg rounded-full text-white text-xs font-semibold shadow-lg">
                    {event.category || "Event"}
                  </span>
                </div>
                
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <EventStatusBadge event={event} size="sm" />
                </div>

                {/* Bookmark Button Overlay */}
                {isAuthenticated && (
                  <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBookmarkToggle(event._id);
                      }}
                      className={`p-3 rounded-2xl transition-all duration-500 transform hover:scale-110 focus:outline-none ${
                        bookmarkedEvents.has(event._id)
                          ? "bg-gradient-to-br from-blue-500/90 to-cyan-500/90 backdrop-blur-xl text-white shadow-xl"
                          : "bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-xl border border-white/30 text-white hover:border-blue-400/50"
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarkedEvents.has(event._id) ? "fill-current" : ""}`} />
                    </button>
                  </div>
                )}
              </div>

              {/* Event Content */}
              <div className="p-6 flex-1 flex flex-col">
                {/* Event Title */}
                <h3 className="text-xl font-bold mb-3 leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all duration-300 line-clamp-2">
                  {event.title || "Untitled Event"}
                </h3>

                {/* Event Description */}
                <p className="text-gray-300 text-sm mb-4 line-clamp-2 flex-grow">
                  {event.description || "No description available."}
                </p>

                {/* Event Meta Info */}
                <div className="space-y-3 mb-6">
                  {/* Date & Time Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-300">
                      <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                        <Calendar className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{event.date ? new Date(event.date).toLocaleDateString() : "Date TBD"}</p>
                        <p className="text-xs text-gray-400">{event.time || "Time TBD"}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Venue Row */}
                  <div className="flex items-center text-sm text-gray-300">
                    <div className="p-2 bg-cyan-500/20 rounded-lg mr-3">
                      <MapPin className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="font-medium text-white line-clamp-1">{event.venue || "Venue TBD"}</span>
                  </div>

                  {/* Seats Info */}
                  <div className="flex items-center text-sm">
                    <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                      <Users className="w-4 h-4 text-green-400" />
                    </div>
                    {(() => {
                      const totalSeats = event.maxSeats || 0;
                      const registered = event.slotCounts?.confirmed || 0;
                      const remaining = event.slotsLeft !== null ? event.slotsLeft : (totalSeats > 0 ? Math.max(totalSeats - registered, 0) : null);
                      const isFull = remaining !== null && remaining <= 0;
                      const isLimited = totalSeats > 0;

                      return (
                        <div className="flex flex-col">
                          {isLimited ? (
                            <>
                              <span className={`font-semibold text-sm ${isFull ? 'text-red-400' : remaining <= 5 ? 'text-orange-400' : 'text-green-400'}`}>
                                {isFull ? 'Event Full' : `${remaining} seats left`}
                              </span>
                              <span className="text-xs text-gray-400">
                                {registered}/{totalSeats} registered
                              </span>
                            </>
                          ) : (
                            <span className="text-green-400 font-medium text-sm">Unlimited seats</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Tags */}
                {(event.tags && event.tags.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.tags.slice(0, 2).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="px-2 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full text-xs text-purple-300 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                    {event.tags.length > 2 && (
                      <span className="px-2 py-1 bg-white/10 border border-white/20 rounded-full text-xs text-gray-400">
                        +{event.tags.length - 2} more
                      </span>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 mt-auto">
                  {isAuthenticated ? (
                    <button
                      onClick={() => handleRegister(event._id)}
                      disabled={
                        event.status === "completed" ||
                        (event.slotsLeft !== null && event.slotsLeft <= 0)
                      }
                      className={`flex-1 flex items-center justify-center px-4 py-3 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:hover:scale-100 ${
                        event.isRegistered
                          ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 text-green-300 shadow-lg shadow-green-500/20"
                          : (event.slotsLeft !== null && event.slotsLeft <= 0)
                          ? "bg-gray-500/20 border border-gray-500/30 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30"
                      }`}
                    >
                      {event.isRegistered ? (
                        <>
                          <Award className="w-4 h-4 mr-2" />
                          Registered
                        </>
                      ) : (event.slotsLeft !== null && event.slotsLeft <= 0) ? (
                        "Full"
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4 mr-2" />
                          Register
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => (window.location.href = "/login")}
                      className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-semibold shadow-lg shadow-purple-500/30 transition-all duration-300 transform hover:scale-105"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Login to Register
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/events/${event._id}`)}
                    className="px-4 py-3 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 text-gray-300 hover:border-cyan-400/50 hover:text-cyan-300 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
            </motion.div>
          ))}
        </div>

        {/* No Events Message */}
        {filteredEvents.length === 0 && !loading && (
          <div className="text-center py-12 animate-fade-in">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-300">
              No events found
            </h3>
            <p className="text-gray-400">
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slide-down {
          from { opacity: 0; height: 0; }
          to { opacity: 1; height: auto; }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.2s both;
        }

        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out both;
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Date Picker Custom Styles */
        .react-datepicker-wrapper {
          width: 100%;
        }

        .react-datepicker__input-container input {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          color: white;
          padding: 0.75rem 1rem;
          width: 100%;
          font-size: 0.875rem;
          transition: all 0.3s;
        }

        .react-datepicker__input-container input:focus {
          border-color: rgba(168, 85, 247, 0.5);
          outline: none;
        }

        .react-datepicker__input-container input::placeholder {
          color: #9ca3af;
        }

        .react-datepicker {
          background: #1e293b;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          font-family: inherit;
        }

        .react-datepicker__header {
          background: #0f172a;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 0.75rem 0.75rem 0 0;
          padding: 1rem;
        }

        .react-datepicker__current-month,
        .react-datepicker-time__header {
          color: white;
          font-weight: 600;
          font-size: 1rem;
        }

        .react-datepicker__day-names,
        .react-datepicker__week {
          display: flex;
          justify-content: space-around;
        }

        .react-datepicker__day-name,
        .react-datepicker__day {
          color: #e2e8f0;
          width: 2rem;
          height: 2rem;
          line-height: 2rem;
          text-align: center;
          margin: 0.125rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .react-datepicker__day:hover {
          background: rgba(168, 85, 247, 0.2);
          color: white;
        }

        .react-datepicker__day--selected,
        .react-datepicker__day--in-selecting-range,
        .react-datepicker__day--in-range {
          background: #8b5cf6;
          color: white;
        }

        .react-datepicker__day--selected:hover {
          background: #7c3aed;
        }

        .react-datepicker__day--keyboard-selected {
          background: rgba(168, 85, 247, 0.3);
          color: white;
        }

        .react-datepicker__day--today {
          background: rgba(255, 255, 255, 0.1);
          color: #fbbf24;
        }

        .react-datepicker__navigation {
          background: none;
          border: none;
          cursor: pointer;
          outline: none;
          top: 1rem;
          width: 1.5rem;
          height: 1.5rem;
          border-radius: 0.375rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .react-datepicker__navigation:hover {
          background: rgba(168, 85, 247, 0.2);
        }

        .react-datepicker__navigation-icon::before {
          border-color: #e2e8f0;
          border-width: 2px 2px 0 0;
        }

        .react-datepicker__triangle {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default Events;
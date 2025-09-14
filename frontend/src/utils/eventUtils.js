// Event utility functions for status calculation and formatting

/**
 * Calculate the real-time status of an event based on current time
 * @param {Object} event - Event object with date, time, endTime
 * @returns {string} - 'upcoming', 'live', 'completed'
 */
export const calculateEventStatus = (event) => {
  if (!event || !event.date || !event.time || !event.endTime) {
    return 'upcoming'; // Default if data is missing
  }

  const now = new Date();
  const eventDate = new Date(event.date);

  // Parse start time
  const [startTime, startPeriod] = event.time.split(' ');
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startHour24 = startPeriod === 'PM' && startHour !== 12 ? startHour + 12 :
                      startPeriod === 'AM' && startHour === 12 ? 0 : startHour;

  // Parse end time
  const [endTime, endPeriod] = event.endTime.split(' ');
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const endHour24 = endPeriod === 'PM' && endHour !== 12 ? endHour + 12 :
                    endPeriod === 'AM' && endHour === 12 ? 0 : endHour;

  // Set start and end dates
  const startDateTime = new Date(eventDate);
  startDateTime.setHours(startHour24, startMinute, 0, 0);

  const endDateTime = new Date(eventDate);
  endDateTime.setHours(endHour24, endMinute, 0, 0);

  if (now < startDateTime) {
    return 'upcoming';
  } else if (now >= startDateTime && now <= endDateTime) {
    return 'live';
  } else {
    return 'completed';
  }
};

/**
 * Get status color for UI styling
 * @param {string} status - Event status
 * @returns {string} - Tailwind CSS color class
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'live':
      return 'bg-green-500 text-white';
    case 'upcoming':
      return 'bg-blue-500 text-white';
    case 'completed':
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};

/**
 * Get status label for display
 * @param {string} status - Event status
 * @returns {string} - Human-readable status label
 */
export const getStatusLabel = (status) => {
  switch (status) {
    case 'live':
      return 'Live';
    case 'upcoming':
      return 'Upcoming';
    case 'completed':
      return 'Completed';
    default:
      return 'Unknown';
  }
};

/**
 * Format event date and time for display
 * @param {Object} event - Event object
 * @returns {string} - Formatted date and time string
 */
export const formatEventDateTime = (event) => {
  if (!event || !event.date) return '';

  const date = new Date(event.date).toLocaleDateString();
  const timeRange = event.endTime ? `${event.time} - ${event.endTime}` : event.time;

  return `${date} at ${timeRange}`;
};
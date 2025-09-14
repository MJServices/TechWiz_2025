import React, { useState, useEffect } from 'react';
import { calculateEventStatus, getStatusColor, getStatusLabel } from '../utils/eventUtils';

/**
 * EventStatusBadge component displays the real-time status of an event
 * @param {Object} event - Event object
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 * @param {boolean} showIcon - Whether to show status icon
 */
const EventStatusBadge = ({ event, size = 'md', showIcon = true }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Update status every 30 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const status = calculateEventStatus(event);
  const colorClass = getStatusColor(status);
  const label = getStatusLabel(status);

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  // Icon based on status
  const getIcon = () => {
    if (!showIcon) return null;

    switch (status) {
      case 'live':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="3" />
            <path d="M10 1a9 9 0 100 18 9 9 0 000-18zm0 16a7 7 0 110-14 7 7 0 010 14z" />
          </svg>
        );
      case 'upcoming':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'completed':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${colorClass}`}>
      {getIcon()}
      {label}
    </span>
  );
};

export default EventStatusBadge;
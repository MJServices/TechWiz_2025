// models/Venue.js
import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  facilities: [{
    type: String,
    trim: true
  }],
  images: [{
    type: String // URLs to venue images
  }],
  status: {
    type: String,
    enum: ['available', 'unavailable', 'maintenance'],
    default: 'available'
  },
  // For dynamic capacity management
  availableDates: [{
    date: {
      type: Date,
      required: true
    },
    timeSlots: [{
      startTime: {
        type: String, // e.g., "10:00 AM"
        required: true
      },
      endTime: {
        type: String, // e.g., "12:00 PM"
        required: true
      },
      isBooked: {
        type: Boolean,
        default: false
      },
      bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null
      }
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on save
venueSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check venue availability for a specific date and time
venueSchema.methods.checkAvailability = function(date, startTime, endTime) {
  const dateObj = new Date(date);
  const dateString = dateObj.toISOString().split('T')[0];
  
  const availableDate = this.availableDates.find(ad => 
    new Date(ad.date).toISOString().split('T')[0] === dateString
  );
  
  if (!availableDate) return false;
  
  // Check if there's any time slot that conflicts with the requested time
  const conflictingSlot = availableDate.timeSlots.find(slot => {
    // Simple check: if the requested time overlaps with any booked slot
    if (slot.isBooked) {
      if (startTime <= slot.endTime && endTime >= slot.startTime) {
        return true; // There's a conflict
      }
    }
    return false;
  });
  
  return !conflictingSlot;
};

// Method to book a venue for a specific date and time
venueSchema.methods.bookVenue = function(date, startTime, endTime, eventId) {
  const dateObj = new Date(date);
  const dateString = dateObj.toISOString().split('T')[0];
  
  let availableDate = this.availableDates.find(ad => 
    new Date(ad.date).toISOString().split('T')[0] === dateString
  );
  
  if (!availableDate) {
    // Create a new date entry if it doesn't exist
    availableDate = {
      date: dateObj,
      timeSlots: []
    };
    this.availableDates.push(availableDate);
  }
  
  // Add the new time slot
  availableDate.timeSlots.push({
    startTime,
    endTime,
    isBooked: true,
    bookedBy: eventId
  });
  
  return this.save();
};

export default mongoose.model('Venue', venueSchema);
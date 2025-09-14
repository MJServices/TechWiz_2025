// models/Event.js
import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['technical', 'cultural', 'sports', 'workshop', 'seminar', 'competition', 'other']
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String, // e.g., "10:00 AM"
    required: true
  },
  endTime: {
    type: String, // e.g., "12:00 PM"
    required: true
  },
  // Original venue field (string) for backward compatibility
  venue: {
    type: String,
    required: true
  },
  // New venue reference field
  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue'
  },
  // Venue capacity at the time of booking
  venueCapacity: {
    type: Number
  },
  // Custom capacity override (if different from venue capacity)
  maxSeats: {
    type: Number,
    required: true,
    min: 1
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxParticipants: {
    type: Number,
    default: 0, // 0 means unlimited
    min: 0
  },
  currentBooked: {
    type: Number,
    default: 0
  },
  seatsAvailable: {
    type: Number,
    default: function() {
      return this.maxSeats > 0 ? this.maxSeats - this.currentBooked : 0;
    }
  },
  waitlistEnabled: {
    type: Boolean,
    default: false
  },
  // Maximum waitlist size
  maxWaitlist: {
    type: Number,
    default: 0 // 0 means no waitlist
  },
  // Current waitlist count
  currentWaitlisted: {
    type: Number,
    default: 0
  },
  // Real-time tracking
  registrationDeadline: {
    type: Date
  },
  // Auto-approval settings
  autoApproveRegistrations: {
    type: Boolean,
    default: false
  },
  bannerImage: {
    type: String // URL to banner image
  },
  rulebook: {
    type: String // URL to rulebook file
  },
  tags: [{
    type: String,
    trim: true
  }],
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'ongoing', 'completed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update seatsAvailable on save (virtual or middleware)
eventSchema.pre('save', function(next) {
  if (this.maxSeats > 0) {
    this.seatsAvailable = this.maxSeats - this.currentBooked;
  }
  this.updatedAt = Date.now();
  next();
});

// Method to check if registration is possible
eventSchema.methods.canRegister = function() {
  // Check if event is in a registrable state
  if (this.status !== 'approved' && this.status !== 'ongoing') {
    return { canRegister: false, reason: 'Event is not open for registration' };
  }
  
  // Check if registration deadline has passed
  if (this.registrationDeadline && new Date() > this.registrationDeadline) {
    return { canRegister: false, reason: 'Registration deadline has passed' };
  }
  
  // Check if seats are available
  if (this.seatsAvailable <= 0) {
    // Check if waitlist is enabled and has space
    if (this.waitlistEnabled && (this.maxWaitlist === 0 || this.currentWaitlisted < this.maxWaitlist)) {
      return { canRegister: true, waitlist: true };
    }
    return { canRegister: false, reason: 'No seats available and waitlist is full or disabled' };
  }
  
  return { canRegister: true, waitlist: false };
};

// Method to update registration counts
eventSchema.methods.updateRegistrationCounts = async function(session = null) {
  const Registration = mongoose.model('Registration');
  
  // Count approved registrations
  const approvedCount = await Registration.countDocuments(
    { event: this._id, status: 'approved' },
    { session }
  );
  
  // Count waitlisted registrations
  const waitlistedCount = await Registration.countDocuments(
    { event: this._id, status: 'waitlist' },
    { session }
  );
  
  this.currentBooked = approvedCount;
  this.currentWaitlisted = waitlistedCount;
  this.seatsAvailable = Math.max(this.maxSeats - this.currentBooked, 0);
  
  return this.save({ session });
};

export default mongoose.model('Event', eventSchema);
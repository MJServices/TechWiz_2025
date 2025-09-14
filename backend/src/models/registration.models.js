// models/Registration.js
import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  registeredOn: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'waitlist'],
    default: 'pending'
  },
  // Position in waitlist (if applicable)
  waitlistPosition: {
    type: Number,
    default: null
  },
  // Attendance tracking
  attended: {
    type: Boolean,
    default: false
  },
  checkInTime: {
    type: Date
  },
  // Ticket information
  icsTicket: {
    type: String, // Store the ICS content for approved registrations
    default: null
  },
  // QR code for check-in
  qrCode: {
    type: String,
    default: null
  },
  // Additional fields for participant information
  additionalInfo: {
    type: Map,
    of: String,
    default: () => ({})
  },
  // Notes from organizers
  notes: {
    type: String
  }
}, { timestamps: true });

// Index for querying by event and status
registrationSchema.index({ event: 1, status: 1 });
registrationSchema.index({ event: 1, participant: 1 }, { unique: true });

// Method to move from waitlist to approved
registrationSchema.methods.moveFromWaitlist = async function(session = null) {
  if (this.status !== 'waitlist') {
    throw new Error('Registration is not on waitlist');
  }
  
  this.status = 'approved';
  this.waitlistPosition = null;
  
  return this.save({ session });
};

// Static method to process waitlist when a spot becomes available
registrationSchema.statics.processWaitlist = async function(eventId, session = null) {
  // Find the next waitlisted registration for this event
  const nextInWaitlist = await this.findOne(
    { event: eventId, status: 'waitlist' },
    null,
    { sort: { waitlistPosition: 1 }, session }
  ).populate('event');
  
  if (!nextInWaitlist) {
    return null; // No one in waitlist
  }
  
  // Move to approved status
  await nextInWaitlist.moveFromWaitlist(session);
  
  // Update waitlist positions for remaining waitlisted registrations
  await this.updateMany(
    { event: eventId, status: 'waitlist', waitlistPosition: { $gt: nextInWaitlist.waitlistPosition } },
    { $inc: { waitlistPosition: -1 } },
    { session }
  );
  
  // Update event registration counts
  const Event = mongoose.model('Event');
  const event = await Event.findById(eventId, null, { session });
  if (event) {
    await event.updateRegistrationCounts(session);
  }
  
  return nextInWaitlist;
};

export default mongoose.model('Registration', registrationSchema);
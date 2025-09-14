import Registration from '../models/registration.models.js';
import Event from '../models/event.models.js';
import User from '../models/user.models.js';
import Notification from '../models/notification.models.js';
import { buildICS } from '../utils/ics.js';
import { sendRegistrationApprovalEmail, sendRegistrationRejectionEmail, sendNewRegistrationEmail, sendWaitlistNotificationEmail, sendWaitlistPromotionEmail } from '../services/emailService.js';
import mongoose from 'mongoose';
import QRCode from 'qrcode';

async function getCounts(eventId) {
  const approved = await Registration.countDocuments({ event: eventId, status: 'approved' });
  const pending = await Registration.countDocuments({ event: eventId, status: 'pending' });
  const waitlisted = await Registration.countDocuments({ event: eventId, status: 'waitlist' });
  return { approved, pending, waitlisted };
}

// Helper function to combine date and time into a Date object
function combineDateTime(date, time) {
  try {
    if (!time || typeof time !== 'string') return null;
    const parts = time.split(' ');
    let timeStr = parts[0];
    let period = parts[1];
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;
    let hour24 = hours;
    if (period) {
      period = period.toUpperCase();
      if (period === 'PM' && hours !== 12) hour24 = hours + 12;
      else if (period === 'AM' && hours === 12) hour24 = 0;
    } else {
      // Assume 24h format if no period
      hour24 = hours;
    }
    if (hour24 < 0 || hour24 > 23 || minutes < 0 || minutes > 59) return null;
    const combined = new Date(date);
    if (isNaN(combined.getTime())) return null;
    combined.setHours(hour24, minutes, 0, 0);
    return combined;
  } catch (error) {
    console.error('Error in combineDateTime:', error);
    return null;
  }
}

// Generate QR code for registration
async function generateQRCode(registrationId) {
  try {
    const qrData = JSON.stringify({
      registrationId,
      timestamp: Date.now()
    });
    
    return await QRCode.toDataURL(qrData);
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
}

export const registerForEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { eventId, additionalInfo } = req.body;
    
    // Find event and check if registration is possible
    const event = await Event.findById(eventId).populate('organizer', 'username email');
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is already registered
    const existingRegistration = await Registration.findOne({ 
      event: eventId, 
      participant: req.user._id 
    });
    
    if (existingRegistration) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'You are already registered for this event' });
    }
    
    // Check if event is open for registration
    const registrationStatus = event.canRegister();
    if (!registrationStatus.canRegister) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: registrationStatus.reason });
    }
    
    // Determine registration status based on availability
    let registrationData = {
      event: eventId,
      participant: req.user._id,
      additionalInfo: additionalInfo || {}
    };
    
    // If auto-approve is enabled and seats are available, approve immediately
    if (event.autoApproveRegistrations && !registrationStatus.waitlist) {
      registrationData.status = 'approved';
    } 
    // If waitlist is needed
    else if (registrationStatus.waitlist) {
      registrationData.status = 'waitlist';
      
      // Get current max waitlist position
      const maxPositionReg = await Registration.findOne(
        { event: eventId, status: 'waitlist' },
        { waitlistPosition: 1 },
        { sort: { waitlistPosition: -1 }, session }
      );
      
      registrationData.waitlistPosition = maxPositionReg ? maxPositionReg.waitlistPosition + 1 : 1;
    }
    // Otherwise, set as pending
    else {
      registrationData.status = 'pending';
    }
    
    // Create registration
    const registration = await Registration.create([registrationData], { session });
    const reg = registration[0];
    
    // If approved immediately, generate QR code and ticket
    if (reg.status === 'approved') {
      // Generate QR code
      const qrCode = await generateQRCode(reg._id);
      if (qrCode) {
        reg.qrCode = qrCode;
        await reg.save({ session });
      }
      
      // Generate ICS ticket
      const startDate = combineDateTime(event.date, event.time);
      if (startDate && !isNaN(startDate.getTime())) {
        const endDate = combineDateTime(event.date, event.endTime) || 
                       new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
        
        const icsContent = buildICS({
          title: event.title,
          description: event.description,
          location: event.venue,
          start: startDate,
          end: endDate,
          url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${event._id}`
        });
        
        reg.icsTicket = icsContent;
        await reg.save({ session });
      }
      
      // Update event counts
      event.currentBooked += 1;
      event.seatsAvailable = Math.max(event.maxSeats - event.currentBooked, 0);
      await event.save({ session });
    } 
    // If waitlisted, update event waitlist count
    else if (reg.status === 'waitlist') {
      event.currentWaitlisted += 1;
      await event.save({ session });
    }
    
    // Send appropriate notifications
    const participant = await User.findById(req.user._id).select('username email');
    
    // Email to organizer
    const populatedReg = { 
      ...reg.toObject(), 
      event, 
      participant 
    };
    
    // Send email based on registration status
    if (reg.status === 'approved') {
      sendRegistrationApprovalEmail(populatedReg).catch(err => 
        console.error('Failed to send registration approval email:', err)
      );
    } else if (reg.status === 'waitlist') {
      sendWaitlistNotificationEmail(populatedReg).catch(err => 
        console.error('Failed to send waitlist notification email:', err)
      );
    } else {
      sendNewRegistrationEmail(populatedReg, event.organizer).catch(err => 
        console.error('Failed to send new registration email:', err)
      );
    }
    
    // Real-time notification to organizer
    try {
      const io = req.app.get('io');
      await Notification.createAndSend(
        event.organizer._id,
        {
          type: 'registration',
          title: 'New Registration',
          message: `${participant.username} has registered for your event: ${event.title}`,
          data: { 
            eventId: event._id,
            registrationId: reg._id,
            status: reg.status
          },
          priority: 'medium'
        },
        io
      );
    } catch (error) {
      console.error('Failed to send registration notification:', error);
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({ 
      registration: reg, 
      counts: await getCounts(eventId),
      waitlistPosition: reg.status === 'waitlist' ? reg.waitlistPosition : null
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error in registerForEvent:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const cancelRegistration = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    // Find registration
    const reg = await Registration.findOne({ 
      _id: id, 
      participant: req.user._id 
    }).populate('event').session(session);
    
    if (!reg) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    const originalStatus = reg.status;
    const originalWaitlistPosition = reg.waitlistPosition;
    
    // Update registration status
    reg.status = 'cancelled';
    reg.waitlistPosition = null;
    await reg.save({ session });
    
    // Update event counts based on original status
    const event = reg.event;
    
    if (originalStatus === 'approved') {
      event.currentBooked = Math.max(event.currentBooked - 1, 0);
      event.seatsAvailable = Math.min(event.maxSeats, event.seatsAvailable + 1);
      await event.save({ session });
      
      // Process waitlist if enabled
      if (event.waitlistEnabled && event.currentWaitlisted > 0) {
        const promotedRegistration = await Registration.processWaitlist(event._id, session);
        
        if (promotedRegistration) {
          // Send notification to promoted participant
          const promotedParticipant = await User.findById(promotedRegistration.participant).select('username email');
          
          // Generate QR code and ticket for promoted registration
          const qrCode = await generateQRCode(promotedRegistration._id);
          if (qrCode) {
            promotedRegistration.qrCode = qrCode;
            await promotedRegistration.save({ session });
          }
          
          // Generate ICS ticket
          const startDate = combineDateTime(event.date, event.time);
          if (startDate && !isNaN(startDate.getTime())) {
            const endDate = combineDateTime(event.date, event.endTime) || 
                          new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
            
            const icsContent = buildICS({
              title: event.title,
              description: event.description,
              location: event.venue,
              start: startDate,
              end: endDate,
              url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${event._id}`
            });
            
            promotedRegistration.icsTicket = icsContent;
            await promotedRegistration.save({ session });
          }
          
          // Send email notification
          sendWaitlistPromotionEmail({
            ...promotedRegistration.toObject(),
            event,
            participant: promotedParticipant
          }).catch(err => 
            console.error('Failed to send waitlist promotion email:', err)
          );
          
          // Send real-time notification
          try {
            const io = req.app.get('io');
            await Notification.createAndSend(
              promotedParticipant._id,
              {
                type: 'registration',
                title: 'Registration Approved',
                message: `You've been moved from the waitlist to approved status for: ${event.title}`,
                data: { 
                  eventId: event._id,
                  registrationId: promotedRegistration._id
                },
                priority: 'high'
              },
              io
            );
          } catch (error) {
            console.error('Failed to send waitlist promotion notification:', error);
          }
        }
      }
    } 
    else if (originalStatus === 'waitlist') {
      event.currentWaitlisted = Math.max(event.currentWaitlisted - 1, 0);
      await event.save({ session });
      
      // Update waitlist positions for those behind this registration
      if (originalWaitlistPosition) {
        await Registration.updateMany(
          { 
            event: event._id, 
            status: 'waitlist', 
            waitlistPosition: { $gt: originalWaitlistPosition } 
          },
          { $inc: { waitlistPosition: -1 } },
          { session }
        );
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({ 
      registration: reg, 
      counts: await getCounts(reg.event._id)
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error in cancelRegistration:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const myRegistrations = async (req, res) => {
  try {
    const regs = await Registration.find({ participant: req.user._id })
      .populate({
        path: 'event',
        populate: {
          path: 'venueId',
          select: 'name location capacity'
        }
      });
    
    res.json({ registrations: regs });
  } catch (error) {
    console.error('Error in myRegistrations:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const eventRegistrations = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = { event: req.params.eventId };
    
    // Add status filter if provided
    if (status) {
      filter.status = status;
    }
    
    // Add search filter if provided
    if (search) {
      // We need to join with the User model to search by username or email
      const users = await User.find({
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      filter.participant = { $in: users.map(u => u._id) };
    }
    
    const regs = await Registration.find(filter)
      .populate('participant', 'username fullName email')
      .sort({ createdAt: -1 });
    
    res.json({ 
      registrations: regs,
      counts: await getCounts(req.params.eventId)
    });
  } catch (error) {
    console.error('Error in eventRegistrations:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const approveRegistration = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const reg = await Registration.findById(id)
      .populate('event')
      .populate('participant', 'username email')
      .session(session);
    
    if (!reg) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    if (!reg.event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (req.user.role !== 'admin' && req.user._id.toString() !== reg.event.organizer.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Check if registration is already approved
    if (reg.status === 'approved') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Registration is already approved' });
    }
    
    // Check available seats
    const approvedCount = await Registration.countDocuments(
      { event: reg.event._id, status: 'approved' },
      { session }
    );
    
    if (approvedCount >= reg.event.maxSeats) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'No seats available' });
    }
    
    // Update registration status
    const originalStatus = reg.status;
    reg.status = 'approved';
    
    // If moving from waitlist, clear waitlist position
    if (originalStatus === 'waitlist') {
      const originalPosition = reg.waitlistPosition;
      reg.waitlistPosition = null;
      
      // Update positions for those behind this registration
      await Registration.updateMany(
        { 
          event: reg.event._id, 
          status: 'waitlist', 
          waitlistPosition: { $gt: originalPosition } 
        },
        { $inc: { waitlistPosition: -1 } },
        { session }
      );
      
      // Update event waitlist count
      reg.event.currentWaitlisted = Math.max(reg.event.currentWaitlisted - 1, 0);
    }
    
    // Generate QR code
    const qrCode = await generateQRCode(reg._id);
    if (qrCode) {
      reg.qrCode = qrCode;
    }
    
    // Generate ICS ticket
    const startDate = combineDateTime(reg.event.date, reg.event.time);
    if (startDate && !isNaN(startDate.getTime())) {
      const endDate = combineDateTime(reg.event.date, reg.event.endTime) || 
                     new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour
      
      const icsContent = buildICS({
        title: reg.event.title,
        description: reg.event.description,
        location: reg.event.venue,
        start: startDate,
        end: endDate,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${reg.event._id}`
      });
      
      reg.icsTicket = icsContent;
    }
    
    await reg.save({ session });
    
    // Update event counts
    reg.event.currentBooked += 1;
    reg.event.seatsAvailable = Math.max(reg.event.maxSeats - reg.event.currentBooked, 0);
    await reg.event.save({ session });
    
    // Send email notification to participant
    sendRegistrationApprovalEmail(reg).catch(err => 
      console.error('Failed to send registration approval email:', err)
    );
    
    // Send real-time notification
    try {
      const io = req.app.get('io');
      await Notification.createAndSend(
        reg.participant._id,
        {
          type: 'registration',
          title: 'Registration Approved',
          message: `Your registration for ${reg.event.title} has been approved`,
          data: { 
            eventId: reg.event._id,
            registrationId: reg._id
          },
          priority: 'high'
        },
        io
      );
    } catch (error) {
      console.error('Failed to send registration approval notification:', error);
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({ 
      registration: reg,
      counts: await getCounts(reg.event._id)
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error in approveRegistration:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const rejectRegistration = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const reg = await Registration.findById(id)
      .populate('event')
      .populate('participant', 'username email')
      .session(session);
    
    if (!reg) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    if (req.user.role !== 'admin' && req.user._id.toString() !== reg.event.organizer.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Update registration status
    const originalStatus = reg.status;
    reg.status = 'rejected';
    
    // If rejecting from waitlist, clear waitlist position and update others
    if (originalStatus === 'waitlist') {
      const originalPosition = reg.waitlistPosition;
      reg.waitlistPosition = null;
      
      // Update positions for those behind this registration
      await Registration.updateMany(
        { 
          event: reg.event._id, 
          status: 'waitlist', 
          waitlistPosition: { $gt: originalPosition } 
        },
        { $inc: { waitlistPosition: -1 } },
        { session }
      );
      
      // Update event waitlist count
      reg.event.currentWaitlisted = Math.max(reg.event.currentWaitlisted - 1, 0);
      await reg.event.save({ session });
    }
    // If rejecting from approved, update event counts and process waitlist
    else if (originalStatus === 'approved') {
      reg.event.currentBooked = Math.max(reg.event.currentBooked - 1, 0);
      reg.event.seatsAvailable = Math.min(reg.event.maxSeats, reg.event.seatsAvailable + 1);
      await reg.event.save({ session });
      
      // Process waitlist if enabled
      if (reg.event.waitlistEnabled && reg.event.currentWaitlisted > 0) {
        await Registration.processWaitlist(reg.event._id, session);
      }
    }
    
    await reg.save({ session });
    
    // Send email notification to participant
    sendRegistrationRejectionEmail(reg).catch(err => 
      console.error('Failed to send registration rejection email:', err)
    );
    
    // Send real-time notification
    try {
      const io = req.app.get('io');
      await Notification.createAndSend(
        reg.participant._id,
        {
          type: 'registration',
          title: 'Registration Rejected',
          message: `Your registration for ${reg.event.title} has been rejected`,
          data: { 
            eventId: reg.event._id,
            registrationId: reg._id
          },
          priority: 'medium'
        },
        io
      );
    } catch (error) {
      console.error('Failed to send registration rejection notification:', error);
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({ 
      registration: reg,
      counts: await getCounts(reg.event._id)
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error in rejectRegistration:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const downloadTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const reg = await Registration.findById(id)
      .populate('event')
      .populate('participant', 'username fullName email');
    
    if (!reg) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    if (reg.participant._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    if (reg.status !== 'approved') {
      return res.status(400).json({ message: 'Ticket only available for approved registrations' });
    }
    
    if (!reg.icsTicket) {
      return res.status(404).json({ message: 'Ticket not generated' });
    }
    
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="${reg.event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_ticket.ics"`);
    res.send(reg.icsTicket);
  } catch (error) {
    console.error('Error in downloadTicket:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getAvailableSeats = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).populate('venueId', 'name capacity');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    const approvedCount = await Registration.countDocuments({ event: id, status: 'approved' });
    const waitlistedCount = await Registration.countDocuments({ event: id, status: 'waitlist' });
    const pendingCount = await Registration.countDocuments({ event: id, status: 'pending' });
    
    const available = Math.max(event.maxSeats - approvedCount, 0);
    
    // Get real-time registration status
    const registrationStatus = event.canRegister();
    
    res.json({ 
      availableSeats: available, 
      maxSeats: event.maxSeats, 
      bookedSeats: approvedCount,
      waitlistedCount,
      pendingCount,
      waitlistEnabled: event.waitlistEnabled,
      maxWaitlist: event.maxWaitlist,
      currentWaitlisted: waitlistedCount,
      canRegister: registrationStatus.canRegister,
      registrationMessage: registrationStatus.reason || null,
      wouldBeWaitlisted: registrationStatus.waitlist || false,
      venue: event.venueId ? {
        id: event.venueId._id,
        name: event.venueId.name,
        capacity: event.venueId.capacity
      } : null
    });
  } catch (error) {
    console.error('Error in getAvailableSeats:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getWaitlistPosition = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if user is on waitlist for this event
    const registration = await Registration.findOne({
      event: eventId,
      participant: req.user._id,
      status: 'waitlist'
    });
    
    if (!registration) {
      return res.status(404).json({ message: 'You are not on the waitlist for this event' });
    }
    
    res.json({
      waitlistPosition: registration.waitlistPosition,
      registrationId: registration._id,
      registeredOn: registration.registeredOn
    });
  } catch (error) {
    console.error('Error in getWaitlistPosition:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

export const getRegistrationQR = async (req, res) => {
  try {
    const { id } = req.params;
    const registration = await Registration.findById(id)
      .populate('event', 'title')
      .populate('participant', 'username');
    
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    if (registration.participant._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    if (registration.status !== 'approved') {
      return res.status(400).json({ message: 'QR code only available for approved registrations' });
    }
    
    // Generate QR code if not already present
    if (!registration.qrCode) {
      const qrCode = await generateQRCode(registration._id);
      if (qrCode) {
        registration.qrCode = qrCode;
        await registration.save();
      } else {
        return res.status(500).json({ message: 'Failed to generate QR code' });
      }
    }
    
    res.json({
      qrCode: registration.qrCode,
      event: {
        id: registration.event._id,
        title: registration.event.title
      },
      participant: {
        username: registration.participant.username
      },
      registrationId: registration._id
    });
  } catch (error) {
    console.error('Error in getRegistrationQR:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
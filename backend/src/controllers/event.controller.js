import Event from '../models/event.models.js';
import Registration from '../models/registration.models.js';
import User from '../models/user.models.js';
import Notification from '../models/notification.models.js';
import Attendance from '../models/attendance.models.js';
import Venue from '../models/venue.models.js';
import { sendEventCreationEmail, sendEventApprovalEmail, sendEventRejectionEmail, sendEventUpdateEmail, sendEventCancellationEmail } from '../services/emailService.js';
import mongoose from 'mongoose';

export const createEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const body = req.body;
    
    // Check if venue ID is provided and exists
    if (body.venueId) {
      const venue = await Venue.findById(body.venueId).session(session);
      if (!venue) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'Venue not found' });
      }
      
      // Set venue name from venue object for backward compatibility
      body.venue = venue.name;
      
      // If maxSeats not specified, use venue capacity
      if (!body.maxSeats) {
        body.maxSeats = venue.capacity;
      }
      
      // Check if venue is available for the specified date and time
      if (body.date && body.time && body.endTime) {
        const isAvailable = venue.checkAvailability(body.date, body.time, body.endTime);
        if (!isAvailable) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({ message: 'Venue is not available for the specified date and time' });
        }
      }
    }
    
    // Create event
    const event = await Event.create([{ ...body, organizer: req.user._id, status: 'pending' }], { session });
    
    // If venue is specified, book it
    if (body.venueId && body.date && body.time && body.endTime) {
      const venue = await Venue.findById(body.venueId).session(session);
      await venue.bookVenue(body.date, body.time, body.endTime, event[0]._id);
    }
    
    // Send email notification to all users asynchronously
    const organizer = await User.findById(req.user._id).select('username email');
    sendEventCreationEmail(event[0], organizer).catch(err => console.error('Failed to send event creation email:', err));
    
    // Send real-time notification to all users
    try {
      const io = req.app.get('io');
      const allUsers = await User.find({}, '_id');
      const notificationPromises = allUsers.map(user =>
        Notification.createAndSend(user._id, {
          type: 'event',
          title: 'New Event Created',
          message: `${organizer.username} created a new event: ${event[0].title}`,
          data: { eventId: event[0]._id },
          priority: 'medium'
        }, io)
      );
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Failed to send event creation notifications:', error);
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({ event: event[0] });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event', error: error.message });
  }
};

export const updateEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const allowed = [
      'title', 'description', 'category', 'date', 'time', 'endTime',
      'venue', 'venueId', 'maxSeats', 'bannerImage', 'rulebook',
      'waitlistEnabled', 'maxWaitlist', 'status', 'tags',
      'registrationDeadline', 'autoApproveRegistrations'
    ];
    
    const updates = {};
    allowed.forEach((f) => { 
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });
    
    // Find the event
    const event = await Event.findOne({ 
      _id: id, 
      organizer: req.user.role === 'organizer' ? req.user._id : undefined 
    }).session(session);
    
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Handle venue changes
    if (updates.venueId && updates.venueId !== event.venueId?.toString()) {
      // Check if new venue exists
      const newVenue = await Venue.findById(updates.venueId).session(session);
      if (!newVenue) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: 'New venue not found' });
      }
      
      // Set venue name from venue object for backward compatibility
      updates.venue = newVenue.name;
      
      // Check if venue is available for the specified date and time
      const dateToCheck = updates.date || event.date;
      const startTimeToCheck = updates.time || event.time;
      const endTimeToCheck = updates.endTime || event.endTime;
      
      const isAvailable = newVenue.checkAvailability(dateToCheck, startTimeToCheck, endTimeToCheck);
      if (!isAvailable) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'New venue is not available for the specified date and time' });
      }
      
      // Book the new venue
      await newVenue.bookVenue(dateToCheck, startTimeToCheck, endTimeToCheck, event._id);
      
      // If maxSeats not specified in updates but venue changed, use new venue capacity
      if (updates.maxSeats === undefined) {
        updates.maxSeats = newVenue.capacity;
      }
      
      // Release the old venue booking if there was one
      if (event.venueId) {
        const oldVenue = await Venue.findById(event.venueId).session(session);
        if (oldVenue) {
          // Logic to release old venue booking would go here
          // This depends on how venue bookings are implemented
        }
      }
    }
    
    // Check if maxSeats is being reduced below current bookings
    if (updates.maxSeats !== undefined) {
      const approvedCount = await Registration.countDocuments({ 
        event: id, 
        status: 'approved' 
      }).session(session);
      
      if (updates.maxSeats < approvedCount) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ 
          message: 'Cannot reduce maximum seats below current bookings',
          currentBookings: approvedCount
        });
      }
    }
    
    // Apply updates
    Object.assign(event, updates);
    
    // Recalculate seats available
    if (updates.maxSeats !== undefined) {
      event.seatsAvailable = Math.max(event.maxSeats - event.currentBooked, 0);
    }
    
    await event.save({ session });
    
    // Send email notification to registered participants asynchronously
    if (Object.keys(updates).length > 0) {
      const registrations = await Registration.find({ 
        event: id, 
        status: 'approved' 
      }).populate('participant', 'username email').session(session);
      
      const participants = registrations.map(reg => reg.participant);
      if (participants.length > 0) {
        sendEventUpdateEmail(event, participants).catch(err => 
          console.error('Failed to send event update email:', err)
        );
      }
      
      // Send real-time notifications
      try {
        const io = req.app.get('io');
        const notificationPromises = participants.map(participant =>
          Notification.createAndSend(participant._id, {
            type: 'event',
            title: 'Event Updated',
            message: `The event "${event.title}" has been updated`,
            data: { eventId: event._id },
            priority: 'medium'
          }, io)
        );
        await Promise.all(notificationPromises);
      } catch (error) {
        console.error('Failed to send event update notifications:', error);
      }
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({ event });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event', error: error.message });
  }
};

export const listEvents = async (req, res) => {
  try {
    const { 
      q, category, status, from, to, venue, venueId, organizer, 
      minCapacity, maxCapacity, department, waitlistEnabled,
      page = 1, limit = 10, sort = 'date'
    } = req.query;
    
    const filter = {};
    
    // Search functionality
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }
    
    // Basic filters
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (venue) filter.venue = { $regex: venue, $options: 'i' };
    if (venueId) filter.venueId = venueId;
    if (organizer) filter.organizer = organizer;
    if (department) filter.department = department;
    if (waitlistEnabled !== undefined) filter.waitlistEnabled = waitlistEnabled === 'true';
    
    // Date range filter
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    
    // Capacity filters
    if (minCapacity || maxCapacity) {
      filter.maxSeats = {};
      if (minCapacity) filter.maxSeats.$gte = parseInt(minCapacity);
      if (maxCapacity) filter.maxSeats.$lte = parseInt(maxCapacity);
    }
    
    // For participants and non-auth users, only show approved events
    if (!req.user || req.user.role === 'participant') {
      filter.status = 'approved';
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sorting
    let sortOption = {};
    switch (sort) {
      case 'date':
        sortOption = { date: 1 };
        break;
      case '-date':
        sortOption = { date: -1 };
        break;
      case 'title':
        sortOption = { title: 1 };
        break;
      case '-title':
        sortOption = { title: -1 };
        break;
      case 'capacity':
        sortOption = { maxSeats: 1 };
        break;
      case '-capacity':
        sortOption = { maxSeats: -1 };
        break;
      default:
        sortOption = { date: 1 };
    }
    
    // Execute query with pagination
    const events = await Event.find(filter)
      .populate('organizer', 'username fullName department')
      .populate('venueId', 'name location capacity')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const total = await Event.countDocuments(filter);
    
    // Enhance events with registration counts
    const withCounts = await Promise.all(events.map(async (e) => {
      const regCount = await Registration.countDocuments({ event: e._id, status: 'approved' });
      const waitCount = await Registration.countDocuments({ event: e._id, status: 'waitlist' });
      const pendingCount = await Registration.countDocuments({ event: e._id, status: 'pending' });
      
      return { 
        ...e.toObject(), 
        slotCounts: { 
          approved: regCount, 
          waitlist: waitCount,
          pending: pendingCount
        }, 
        slotsLeft: e.maxSeats > 0 ? Math.max(e.maxSeats - regCount, 0) : null,
        venue: {
          name: e.venue,
          ...(e.venueId ? {
            id: e.venueId._id,
            location: e.venueId.location,
            capacity: e.venueId.capacity
          } : {})
        }
      };
    }));
    
    res.json({ 
      events: withCounts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error listing events:', error);
    res.status(500).json({ message: 'Failed to list events', error: error.message });
  }
};

export const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'username fullName')
      .populate('venueId', 'name location capacity');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Increment view count
    event.views += 1;
    await event.save();
    
    // Get registration counts
    const approvedCount = await Registration.countDocuments({ event: event._id, status: 'approved' });
    const waitlistCount = await Registration.countDocuments({ event: event._id, status: 'waitlist' });
    const pendingCount = await Registration.countDocuments({ event: event._id, status: 'pending' });
    
    // Check if user is registered
    let userRegistration = null;
    if (req.user) {
      userRegistration = await Registration.findOne({ 
        event: event._id, 
        participant: req.user._id 
      });
    }
    
    // Get registration status
    const registrationStatus = event.canRegister();
    
    res.json({ 
      event: {
        ...event.toObject(),
        registrationCounts: {
          approved: approvedCount,
          waitlist: waitlistCount,
          pending: pendingCount,
          total: approvedCount + waitlistCount + pendingCount
        },
        slotsLeft: Math.max(event.maxSeats - approvedCount, 0),
        userRegistration: userRegistration ? {
          id: userRegistration._id,
          status: userRegistration.status,
          waitlistPosition: userRegistration.waitlistPosition
        } : null,
        canRegister: registrationStatus.canRegister,
        registrationMessage: registrationStatus.reason || null,
        wouldBeWaitlisted: registrationStatus.waitlist || false,
        venue: {
          name: event.venue,
          ...(event.venueId ? {
            id: event.venueId._id,
            location: event.venueId.location,
            capacity: event.venueId.capacity
          } : {})
        }
      }
    });
  } catch (error) {
    console.error('Error in getEvent:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Failed to get event', error: error.message });
  }
};

export const approveEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id, 
      { status: 'approved' }, 
      { new: true, session }
    ).populate('organizer', 'username email');
    
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Send email notification to organizer asynchronously
    sendEventApprovalEmail(event, event.organizer).catch(err => 
      console.error('Failed to send event approval email:', err)
    );
    
    // Send real-time notification
    try {
      const io = req.app.get('io');
      await Notification.createAndSend(
        event.organizer._id,
        {
          type: 'event',
          title: 'Event Approved',
          message: `Your event "${event.title}" has been approved`,
          data: { eventId: event._id },
          priority: 'high'
        },
        io
      );
    } catch (error) {
      console.error('Failed to send event approval notification:', error);
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({ event });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error approving event:', error);
    res.status(500).json({ message: 'Failed to approve event', error: error.message });
  }
};

export const rejectEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id, 
      { status: 'rejected' }, 
      { new: true, session }
    ).populate('organizer', 'username email');
    
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Send email notification to organizer asynchronously
    sendEventRejectionEmail(event, event.organizer).catch(err => 
      console.error('Failed to send event rejection email:', err)
    );
    
    // Send real-time notification
    try {
      const io = req.app.get('io');
      await Notification.createAndSend(
        event.organizer._id,
        {
          type: 'event',
          title: 'Event Rejected',
          message: `Your event "${event.title}" has been rejected`,
          data: { eventId: event._id },
          priority: 'high'
        },
        io
      );
    } catch (error) {
      console.error('Failed to send event rejection notification:', error);
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({ event });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error rejecting event:', error);
    res.status(500).json({ message: 'Failed to reject event', error: error.message });
  }
};

export const cancelEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const event = await Event.findById(req.params.id).session(session);
    
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (req.user.role === 'organizer' && event.organizer.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Update event status
    event.status = 'cancelled';
    await event.save({ session });
    
    // Get all registrations for this event
    const registrations = await Registration.find({ 
      event: event._id,
      status: { $in: ['approved', 'pending', 'waitlist'] }
    }).populate('participant', 'username email').session(session);
    
    // Update all registrations to cancelled
    await Registration.updateMany(
      { event: event._id, status: { $in: ['approved', 'pending', 'waitlist'] } },
      { status: 'cancelled' },
      { session }
    );
    
    // Send cancellation notifications
    const participants = registrations.map(reg => reg.participant);
    
    // Send email notifications
    sendEventCancellationEmail(event, participants).catch(err => 
      console.error('Failed to send event cancellation emails:', err)
    );
    
    // Send real-time notifications
    try {
      const io = req.app.get('io');
      const notificationPromises = participants.map(participant =>
        Notification.createAndSend(participant._id, {
          type: 'event',
          title: 'Event Cancelled',
          message: `The event "${event.title}" has been cancelled`,
          data: { eventId: event._id },
          priority: 'high'
        }, io)
      );
      await Promise.all(notificationPromises);
    } catch (error) {
      console.error('Failed to send event cancellation notifications:', error);
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({ 
      event,
      cancelledRegistrations: registrations.length
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error cancelling event:', error);
    res.status(500).json({ message: 'Failed to cancel event', error: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const event = await Event.findById(req.params.id).session(session);
    
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Event not found' });
    }
    
    if (req.user.role === 'organizer' && event.organizer.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Check if event has any registrations
    const registrationsCount = await Registration.countDocuments({ event: event._id }).session(session);
    
    if (registrationsCount > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: 'Cannot delete event with registrations. Cancel the event instead.',
        registrationsCount
      });
    }
    
    // Delete event
    await Event.findByIdAndDelete(req.params.id, { session });
    
    // Release venue booking if applicable
    if (event.venueId) {
      // Logic to release venue booking would go here
      // This depends on how venue bookings are implemented
    }
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({ message: 'Event deleted' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event', error: error.message });
  }
};

export const getMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).populate('venueId', 'name capacity');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is the organizer or admin
    if (req.user.role === 'organizer' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    // Get registrations
    const registrations = await Registration.find({ event: id });
    
    // Basic metrics
    const totalRegistrations = registrations.length;
    const approvedCount = registrations.filter(r => r.status === 'approved').length;
    const pendingCount = registrations.filter(r => r.status === 'pending').length;
    const rejectedCount = registrations.filter(r => r.status === 'rejected').length;
    const waitlistedCount = registrations.filter(r => r.status === 'waitlist').length;
    const cancelledCount = registrations.filter(r => r.status === 'cancelled').length;
    
    // Attendance metrics
    const approvedRegistrations = await Registration.find({ 
      event: id, 
      status: 'approved' 
    }).populate('participant');
    
    const participantIds = approvedRegistrations
      .filter(reg => reg.participant && reg.participant._id)
      .map(reg => reg.participant?._id)
      .filter(id => id);
    
    const attendanceRecords = await Attendance.find({
      event: id,
      participant: { $in: participantIds }
    });
    
    const presentCount = attendanceRecords.filter(a => a.attended).length;
    const absentCount = approvedCount - presentCount;
    
    // Registration trend (by day)
    const registrationsByDay = {};
    registrations.forEach(reg => {
      const date = new Date(reg.registeredOn).toISOString().split('T')[0];
      if (!registrationsByDay[date]) {
        registrationsByDay[date] = 0;
      }
      registrationsByDay[date]++;
    });
    
    // Convert to array for easier frontend processing
    const registrationTrend = Object.entries(registrationsByDay).map(([date, count]) => ({
      date,
      count
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Venue utilization
    const venueUtilization = event.venueId ? 
      Math.round((approvedCount / event.venueId.capacity) * 100) : 
      Math.round((approvedCount / event.maxSeats) * 100);
    
    res.json({
      metrics: {
        totalRegistrations,
        approvedRegistrations: approvedCount,
        pendingRegistrations: pendingCount,
        rejectedRegistrations: rejectedCount,
        waitlistedRegistrations: waitlistedCount,
        cancelledRegistrations: cancelledCount,
        presentCount,
        absentCount,
        attendanceRate: approvedCount > 0 ? Math.round((presentCount / approvedCount) * 100) : 0,
        views: event.views || 0,
        registrationTrend,
        venueUtilization,
        seatsAvailable: event.seatsAvailable,
        maxSeats: event.maxSeats,
        venue: event.venueId ? {
          id: event.venueId._id,
          name: event.venueId.name,
          capacity: event.venueId.capacity
        } : null,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ message: 'Failed to fetch metrics', error: error.message });
  }
};
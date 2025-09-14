import Venue from '../models/venue.models.js';
import Event from '../models/event.models.js';
import mongoose from 'mongoose';

// Create a new venue
export const createVenue = async (req, res) => {
  try {
    const { name, description, location, capacity, facilities, images, status, availableDates } = req.body;
    
    // Check if venue with the same name already exists
    const existingVenue = await Venue.findOne({ name });
    if (existingVenue) {
      return res.status(400).json({ message: 'Venue with this name already exists' });
    }
    
    const venue = await Venue.create({
      name,
      description,
      location,
      capacity,
      facilities,
      images,
      status,
      availableDates: availableDates || []
    });
    
    res.status(201).json({ venue });
  } catch (error) {
    console.error('Error creating venue:', error);
    res.status(500).json({ message: 'Failed to create venue', error: error.message });
  }
};

// Get all venues with filtering options
export const listVenues = async (req, res) => {
  try {
    const { q, status, minCapacity, maxCapacity, date, location } = req.query;
    const filter = {};
    
    // Search functionality
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Basic filters
    if (status) filter.status = status;
    if (location) filter.location = { $regex: location, $options: 'i' };
    
    // Capacity filters
    if (minCapacity || maxCapacity) {
      filter.capacity = {};
      if (minCapacity) filter.capacity.$gte = parseInt(minCapacity);
      if (maxCapacity) filter.capacity.$lte = parseInt(maxCapacity);
    }
    
    // Date availability filter
    if (date) {
      const dateObj = new Date(date);
      const dateString = dateObj.toISOString().split('T')[0];
      
      filter['availableDates.date'] = {
        $gte: new Date(dateString),
        $lt: new Date(new Date(dateString).setDate(new Date(dateString).getDate() + 1))
      };
    }
    
    const venues = await Venue.find(filter).sort({ name: 1 });
    res.json({ venues });
  } catch (error) {
    console.error('Error listing venues:', error);
    res.status(500).json({ message: 'Failed to list venues', error: error.message });
  }
};

// Get a single venue by ID
export const getVenue = async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.json({ venue });
  } catch (error) {
    console.error('Error getting venue:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.status(500).json({ message: 'Failed to get venue', error: error.message });
  }
};

// Update a venue
export const updateVenue = async (req, res) => {
  try {
    const { name, description, location, capacity, facilities, images, status, availableDates } = req.body;
    
    // Check if venue with the same name already exists (except this one)
    if (name) {
      const existingVenue = await Venue.findOne({ name, _id: { $ne: req.params.id } });
      if (existingVenue) {
        return res.status(400).json({ message: 'Venue with this name already exists' });
      }
    }
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (capacity !== undefined) updates.capacity = capacity;
    if (facilities !== undefined) updates.facilities = facilities;
    if (images !== undefined) updates.images = images;
    if (status !== undefined) updates.status = status;
    if (availableDates !== undefined) updates.availableDates = availableDates;
    
    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    res.json({ venue });
  } catch (error) {
    console.error('Error updating venue:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.status(500).json({ message: 'Failed to update venue', error: error.message });
  }
};

// Delete a venue
export const deleteVenue = async (req, res) => {
  try {
    // Check if venue is being used by any events
    const events = await Event.find({ venue: req.params.id });
    if (events.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete venue as it is being used by events',
        events: events.map(e => ({ id: e._id, title: e.title }))
      });
    }
    
    const venue = await Venue.findByIdAndDelete(req.params.id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Error deleting venue:', error);
    if (error.name === 'CastError') {
      return res.status(404).json({ message: 'Venue not found' });
    }
    res.status(500).json({ message: 'Failed to delete venue', error: error.message });
  }
};

// Check venue availability for a specific date and time
export const checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime } = req.query;
    
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Date, start time, and end time are required' });
    }
    
    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    const isAvailable = venue.checkAvailability(date, startTime, endTime);
    
    res.json({ 
      isAvailable,
      venue: {
        id: venue._id,
        name: venue.name,
        capacity: venue.capacity,
        status: venue.status
      }
    });
  } catch (error) {
    console.error('Error checking venue availability:', error);
    res.status(500).json({ message: 'Failed to check venue availability', error: error.message });
  }
};

// Book a venue for an event
export const bookVenue = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { date, startTime, endTime, eventId } = req.body;
    
    if (!date || !startTime || !endTime || !eventId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Date, start time, end time, and event ID are required' });
    }
    
    // Check if venue exists
    const venue = await Venue.findById(id).session(session);
    if (!venue) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    // Check if event exists
    const event = await Event.findById(eventId).session(session);
    if (!event) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if venue is available
    const isAvailable = venue.checkAvailability(date, startTime, endTime);
    if (!isAvailable) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Venue is not available for the specified date and time' });
    }
    
    // Book the venue
    await venue.bookVenue(date, startTime, endTime, eventId);
    
    // Update the event with venue information
    event.venue = venue._id;
    event.venueCapacity = venue.capacity;
    await event.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.json({ 
      message: 'Venue booked successfully',
      venue: {
        id: venue._id,
        name: venue.name,
        capacity: venue.capacity
      },
      event: {
        id: event._id,
        title: event.title
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error booking venue:', error);
    res.status(500).json({ message: 'Failed to book venue', error: error.message });
  }
};

// Get venue availability calendar
export const getAvailabilityCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const venue = await Venue.findById(id);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }
    
    // Filter available dates within the specified range
    const filteredDates = venue.availableDates.filter(ad => {
      const dateObj = new Date(ad.date);
      return dateObj >= new Date(startDate) && dateObj <= new Date(endDate);
    });
    
    // Get events that are using this venue
    const events = await Event.find({
      venue: id,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).select('title date time endTime');
    
    res.json({
      venue: {
        id: venue._id,
        name: venue.name,
        capacity: venue.capacity,
        status: venue.status
      },
      availabilityCalendar: filteredDates,
      events
    });
  } catch (error) {
    console.error('Error getting venue availability calendar:', error);
    res.status(500).json({ message: 'Failed to get venue availability calendar', error: error.message });
  }
};
import { Router } from 'express';
import { authorize, protect } from '../middlewares/auth.js';
import { 
  createVenue, 
  listVenues, 
  getVenue, 
  updateVenue, 
  deleteVenue, 
  checkAvailability, 
  bookVenue, 
  getAvailabilityCalendar 
} from '../controllers/venue.controller.js';

const router = Router();

// Public routes
router.get('/', listVenues);
router.get('/:id', getVenue);
router.get('/:id/availability', checkAvailability);
router.get('/:id/calendar', getAvailabilityCalendar);

// Protected routes - Admin only
router.post('/', protect, authorize('admin'), createVenue);
router.patch('/:id', protect, authorize('admin'), updateVenue);
router.delete('/:id', protect, authorize('admin'), deleteVenue);

// Protected routes - Organizers and Admins
router.post('/:id/book', protect, authorize('organizer', 'admin'), bookVenue);

export default router;
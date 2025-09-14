import { Router } from 'express';
import { authorize, protect, optionalProtect } from '../middlewares/auth.js';
import { 
  approveEvent, 
  cancelEvent, 
  createEvent, 
  deleteEvent, 
  getEvent, 
  getMetrics, 
  listEvents, 
  rejectEvent, 
  updateEvent 
} from '../controllers/event.controller.js';
import { getAvailableSeats } from '../controllers/registration.controller.js';

const router = Router();

// Public endpoints
router.get('/', optionalProtect, listEvents);
router.get('/:id', optionalProtect, getEvent);
router.get('/:id/seats', getAvailableSeats);

// Protected endpoints - Metrics
router.get('/:id/metrics', protect, authorize('organizer', 'admin'), getMetrics);

// Protected endpoints - Event management
router.post('/', protect, authorize('organizer', 'admin'), createEvent);
router.patch('/:id', protect, authorize('organizer', 'admin'), updateEvent);
router.patch('/:id/approve', protect, authorize('admin'), approveEvent);
router.patch('/:id/reject', protect, authorize('admin'), rejectEvent);
router.post('/:id/cancel', protect, authorize('organizer', 'admin'), cancelEvent);
router.delete('/:id', protect, authorize('organizer', 'admin'), deleteEvent);

export default router;
import { Router } from 'express';
import { authorize, protect } from '../middlewares/auth.js';
import { 
  approveRegistration, 
  cancelRegistration, 
  downloadTicket, 
  eventRegistrations, 
  getAvailableSeats, 
  getRegistrationQR, 
  getWaitlistPosition, 
  myRegistrations, 
  registerForEvent, 
  rejectRegistration 
} from '../controllers/registration.controller.js';

const router = Router();

// Registration endpoints
router.post('/', protect, authorize('participant', 'organizer', 'admin'), registerForEvent);
router.get('/me', protect, myRegistrations);
router.get('/event/:eventId', protect, authorize('organizer', 'admin'), eventRegistrations);
router.patch('/:id/approve', protect, authorize('admin', 'organizer'), approveRegistration);
router.patch('/:id/reject', protect, authorize('admin', 'organizer'), rejectRegistration);
router.get('/:id/ticket', protect, authorize('participant'), downloadTicket);
router.post('/:id/cancel', protect, cancelRegistration);

// New endpoints for dynamic capacity management
router.get('/event/:eventId/seats', getAvailableSeats);
router.get('/event/:eventId/waitlist-position', protect, authorize('participant'), getWaitlistPosition);
router.get('/:id/qr', protect, authorize('participant'), getRegistrationQR);

export default router;
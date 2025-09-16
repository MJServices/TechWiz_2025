import { Router } from 'express';
import { authorize, protect } from '../middlewares/auth.js';
import { upload, uploadToCloudinaryMiddleware, handleMulterError } from '../middlewares/upload.js';
import { eventMedia, gallery, uploadMedia, getUserGallery, updateMedia, deleteMedia, likeMedia } from '../controllers/media.controller.js';

const r = Router();

r.get('/gallery', gallery);
r.get('/gallery/user/:userId', getUserGallery);
r.get('/event/:eventId', eventMedia);

// Upload endpoint with file handling middleware
r.post('/', 
  protect, 
  authorize('organizer', 'admin'),
  upload.single('file'), // Handle single file upload
  handleMulterError, // Handle multer errors
  uploadToCloudinaryMiddleware, // Upload to Cloudinary
  uploadMedia // Process and save to database
);

r.put('/:id', protect, updateMedia);
r.delete('/:id', protect, deleteMedia);
r.post('/:id/like', protect, likeMedia);

export default r;

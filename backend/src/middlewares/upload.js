import multer from 'multer';
import { uploadToCloudinary } from '../config/cloudinary.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept only image and video files
  const allowedMimes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/avi',
    'video/mkv',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  }
});

// Middleware to handle Cloudinary upload
export const uploadToCloudinaryMiddleware = async (req, res, next) => {
  try {
    if (!req.file && !req.files) {
      return next();
    }

    const uploadPromises = [];
    const files = req.files ? Object.values(req.files).flat() : [req.file];

    for (let file of files) {
      if (file && file.buffer) {
        const folder = req.body.folder || 'eventsphere/media';
        
        // Determine file type and set appropriate transformations
        const isVideo = file.mimetype.startsWith('video/');
        const transformations = isVideo 
          ? [
              { width: 1920, height: 1080, crop: 'limit' },
              { quality: 'auto:good' },
              { format: 'mp4' }
            ]
          : [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ];

        uploadPromises.push(
          uploadToCloudinary(file.buffer, {
            folder,
            transformation: transformations,
            resource_type: isVideo ? 'video' : 'image'
          })
        );
      }
    }

    const uploadResults = await Promise.all(uploadPromises);
    
    // Check for any failed uploads
    const failedUploads = uploadResults.filter(result => !result.success);
    if (failedUploads.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some file uploads failed',
        errors: failedUploads.map(f => f.error)
      });
    }

    // Add upload results to request object
    req.uploadResults = uploadResults;
    
    // If single file, add to req.uploadResult for backward compatibility
    if (uploadResults.length === 1) {
      req.uploadResult = uploadResults[0];
    }

    next();
  } catch (error) {
    console.error('Upload middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'File upload failed',
      error: error.message
    });
  }
};

// Error handling middleware for multer
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 50MB.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files per upload.'
      });
    }
  }
  
  if (err.message === 'Invalid file type. Only images and videos are allowed.') {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next(err);
};
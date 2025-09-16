import Media from '../models/media.model.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

export const uploadMedia = async (req, res) => {
  try {
    const {
      eventId,
      title,
      description,
      category,
      style,
      tags,
      colorPalette
    } = req.body;

    // Check if file was uploaded via Cloudinary middleware
    if (!req.uploadResult && !req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided. Please upload an image or video file.'
      });
    }

    let fileUrl, thumbnailUrl, fileType, publicId;

    // If using Cloudinary middleware result
    if (req.uploadResult) {
      fileUrl = req.uploadResult.url;
      thumbnailUrl = req.uploadResult.thumbnailUrl;
      publicId = req.uploadResult.publicId;
      fileType = req.file ? (req.file.mimetype.startsWith('video/') ? 'video' : 'image') : 'image';
    }
    // If manual file buffer upload
    else if (req.file && req.file.buffer) {
      const folder = eventId ? `eventsphere/events/${eventId}` : 'eventsphere/media';
      const isVideo = req.file.mimetype.startsWith('video/');
      
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder,
        resource_type: isVideo ? 'video' : 'image'
      });

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload file to cloud storage',
          error: uploadResult.error
        });
      }

      fileUrl = uploadResult.url;
      thumbnailUrl = uploadResult.thumbnailUrl;
      publicId = uploadResult.publicId;
      fileType = isVideo ? 'video' : 'image';
    }

    const mediaData = {
      fileType,
      fileUrl,
      thumbnailUrl,
      publicId, // Store for future deletion
      uploadedBy: req.user._id,
      title: title || description || 'Untitled Media',
      description: description || '',
      category: category || 'other',
      style: style || 'modern',
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim()).filter(tag => tag)) : [],
      colorPalette: colorPalette || []
    };

    // Add eventId if provided (for event media)
    if (eventId) {
      mediaData.event = eventId;
    }

    const media = await Media.create(mediaData);
    
    // Populate the uploadedBy field
    await media.populate('uploadedBy', 'firstname lastname username profile');
    
    res.status(201).json({ 
      success: true, 
      media,
      message: 'Media uploaded successfully'
    });
    
  } catch (error) {
    console.error('Error uploading media:', error);
    
    // If there was a Cloudinary upload, try to clean it up
    if (req.uploadResult && req.uploadResult.publicId) {
      await deleteFromCloudinary(req.uploadResult.publicId).catch(console.error);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to upload media',
      error: error.message
    });
  }
};

export const eventMedia = async (req, res) => {
  const list = await Media.find({ event: req.params.eventId }).sort({ createdAt: -1 });
  res.json({ media: list });
};

export const gallery = async (req, res) => {
  const { category, style, search, tags, featured, limit = 50, page = 1 } = req.query;

  const filter = {};
  const searchFilter = [];

  // Category filter
  if (category && category !== 'all') {
    filter.category = category;
  }

  // Style filter
  if (style && style !== 'all') {
    filter.style = style;
  }

  // Featured filter
  if (featured === 'true') {
    filter.isFeatured = true;
  }

  // Search functionality
  if (search) {
    searchFilter.push(
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    );
  }

  // Tags filter
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim());
    filter.tags = { $in: tagArray };
  }

  // Combine filters
  if (searchFilter.length > 0) {
    filter.$or = searchFilter;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const items = await Media.find(filter)
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ isFeatured: -1, createdAt: -1 })
    .populate('uploadedBy', 'firstname lastname profile');

  const total = await Media.countDocuments(filter);

  // Transform data to match frontend expectations
  const transformedItems = items.filter(item => item != null).map(item => ({
    gallery_id: item._id,
    title: item.title || item.caption || `${item.fileType.charAt(0).toUpperCase() + item.fileType.slice(1)} Design`,
    description: item.description || item.caption || '',
    thumbnail_url: item.thumbnailUrl || item.fileUrl,
    image_url: item.fileUrl,
    category: item.category || 'other',
    style: item.style || 'modern',
    tags: item.tags || [],
    view_count: item.viewCount || 0,
    like_count: item.likeCount || 0,
    uploader: item.uploadedBy ? {
      user_id: item.uploadedBy._id,
      profile: {
        firstname: item.uploadedBy.firstname || 'Unknown',
        lastname: item.uploadedBy.lastname || 'User'
      }
    } : {
      user_id: null,
      profile: {
        firstname: 'Unknown',
        lastname: 'User'
      }
    },
    is_featured: item.isFeatured || false,
    color_palette: item.colorPalette || [],
    created_at: item.createdAt
  }));

  res.json({
    success: true,
    media: transformedItems,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

export const getUserGallery = async (req, res) => {
  const { limit = 50, page = 1 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const items = await Media.find({ uploadedBy: req.params.userId })
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 })
    .populate('uploadedBy', 'firstname lastname profile');

  const total = await Media.countDocuments({ uploadedBy: req.params.userId });

  // Transform data to match frontend expectations
  const transformedItems = items.filter(item => item != null).map(item => ({
    gallery_id: item._id,
    title: item.title || item.caption || `${item.fileType.charAt(0).toUpperCase() + item.fileType.slice(1)} Design`,
    description: item.description || item.caption || '',
    thumbnail_url: item.thumbnailUrl || item.fileUrl,
    image_url: item.fileUrl,
    category: item.category || 'other',
    style: item.style || 'modern',
    tags: item.tags || [],
    view_count: item.viewCount || 0,
    like_count: item.likeCount || 0,
    uploader: item.uploadedBy ? {
      user_id: item.uploadedBy._id,
      profile: {
        firstname: item.uploadedBy.firstname || 'Unknown',
        lastname: item.uploadedBy.lastname || 'User'
      }
    } : {
      user_id: null,
      profile: {
        firstname: 'Unknown',
        lastname: 'User'
      }
    },
    is_featured: item.isFeatured || false,
    color_palette: item.colorPalette || [],
    created_at: item.createdAt
  }));

  res.json({
    success: true,
    media: transformedItems,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
};

export const updateMedia = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Validate that user can only update their own media
  const media = await Media.findById(id);
  if (!media) return res.status(404).json({ success: false, message: 'Media not found' });

  if (media.uploadedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Unauthorized to update this media' });
  }

  // Handle tags array
  if (updates.tags && typeof updates.tags === 'string') {
    updates.tags = updates.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
  }

  const updatedMedia = await Media.findByIdAndUpdate(id, updates, { new: true });
  res.json({ success: true, media: updatedMedia });
};

export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await Media.findById(id);
    
    if (!media) {
      return res.status(404).json({ success: false, message: 'Media not found' });
    }

    // Check if user is the owner or has admin/organizer role
    const isOwner = media.uploadedBy.toString() === req.user._id.toString();
    const isAdminOrOrganizer = ['admin', 'organizer'].includes(req.user.role);

    if (!isOwner && !isAdminOrOrganizer) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this media' });
    }

    // Delete from Cloudinary if publicId exists
    if (media.publicId) {
      const cloudinaryResult = await deleteFromCloudinary(media.publicId);
      if (!cloudinaryResult.success) {
        console.warn('Failed to delete from Cloudinary:', cloudinaryResult.error);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete from database
    await Media.findByIdAndDelete(id);
    
    res.json({ 
      success: true, 
      message: 'Media deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting media:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete media',
      error: error.message
    });
  }
};

export const likeMedia = async (req, res) => {
  const { id } = req.params;

  const media = await Media.findById(id);
  if (!media) return res.status(404).json({ success: false, message: 'Media not found' });

  // Toggle like (simplified - in production you'd track user likes)
  const newLikeCount = media.likeCount + 1; // Simplified increment
  await Media.findByIdAndUpdate(id, { likeCount: newLikeCount });

  res.json({
    success: true,
    message: 'Liked',
    data: { like_count: newLikeCount }
  });
};

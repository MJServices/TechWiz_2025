import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Grid,
  List,
  Heart,
  Download,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Bookmark,
  Share2,
  MoreVertical,
  User,
  Calendar,
  Tag,
  Star,
  Play,
  Pause,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { mediaService, bookmarkService } from '../services/apiServices';
import { toast } from 'react-hot-toast';
import UploadModal from './UploadModal';
import ErrorBoundary from './ErrorBoundary';

const Gallery = () => {
  const { user, isAuthenticated } = useAuth();
  const [media, setMedia] = useState([]);
  const [filteredMedia, setFilteredMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStyle, setSelectedStyle] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [bookmarkedItems, setBookmarkedItems] = useState(new Set());
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef(null);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'living_room', label: 'Living Room' },
    { value: 'bedroom', label: 'Bedroom' },
    { value: 'kitchen', label: 'Kitchen' },
    { value: 'bathroom', label: 'Bathroom' },
    { value: 'dining_room', label: 'Dining Room' },
    { value: 'office', label: 'Office' },
    { value: 'outdoor', label: 'Outdoor' },
    { value: 'other', label: 'Other' },
  ];

  const styles = [
    { value: 'all', label: 'All Styles' },
    { value: 'modern', label: 'Modern' },
    { value: 'contemporary', label: 'Contemporary' },
    { value: 'traditional', label: 'Traditional' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'industrial', label: 'Industrial' },
    { value: 'scandinavian', label: 'Scandinavian' },
    { value: 'bohemian', label: 'Bohemian' },
    { value: 'rustic', label: 'Rustic' },
    { value: 'art_deco', label: 'Art Deco' },
    { value: 'mid_century', label: 'Mid Century' },
    { value: 'other', label: 'Other' },
  ];

  // Fetch media data
  useEffect(() => {
    fetchMedia();
    if (isAuthenticated) {
      fetchBookmarkStatus();
    }
  }, [selectedCategory, selectedStyle, isAuthenticated]);

  // Filter media based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredMedia(media);
    } else {
      const filtered = media.filter(item =>
        item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredMedia(filtered);
    }
  }, [media, searchTerm]);

  // Auto-play slideshow
  useEffect(() => {
    if (isPlaying && selectedMedia && filteredMedia.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % filteredMedia.length);
      }, 3000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, selectedMedia, filteredMedia.length]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStyle !== 'all') params.style = selectedStyle;

      const response = await mediaService.getGallery(params);
      setMedia(response.media || []);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast.error('Failed to load gallery');
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookmarkStatus = async () => {
    if (!isAuthenticated || media.length === 0) return;

    try {
      const bookmarkPromises = media.map(item =>
        bookmarkService.checkMediaBookmark(item.gallery_id).catch(() => ({ isBookmarked: false }))
      );
      const results = await Promise.all(bookmarkPromises);
      const bookmarkedSet = new Set();
      results.forEach((result, index) => {
        if (result.isBookmarked) {
          bookmarkedSet.add(media[index].gallery_id);
        }
      });
      setBookmarkedItems(bookmarkedSet);
    } catch (error) {
      console.error('Error fetching bookmark status:', error);
    }
  };

  const handleBookmarkToggle = async (mediaId) => {
    if (!isAuthenticated) {
      toast.error('Please login to bookmark items');
      return;
    }

    const isCurrentlyBookmarked = bookmarkedItems.has(mediaId);

    // Optimistic update
    setBookmarkedItems(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyBookmarked) {
        newSet.delete(mediaId);
      } else {
        newSet.add(mediaId);
      }
      return newSet;
    });

    try {
      if (isCurrentlyBookmarked) {
        await bookmarkService.removeMediaBookmark(mediaId);
        toast.success('Bookmark removed');
      } else {
        await bookmarkService.addMediaBookmark(mediaId);
        toast.success('Item bookmarked');
      }
    } catch (error) {
      // Revert optimistic update
      setBookmarkedItems(prev => {
        const newSet = new Set(prev);
        if (isCurrentlyBookmarked) {
          newSet.add(mediaId);
        } else {
          newSet.delete(mediaId);
        }
        return newSet;
      });
      toast.error('Failed to update bookmark');
    }
  };

  const handleLike = async (mediaId) => {
    if (!isAuthenticated) {
      toast.error('Please login to like items');
      return;
    }

    try {
      await mediaService.toggleLike(mediaId);
      // Update local state
      setMedia(prev => prev.map(item => 
        item.gallery_id === mediaId 
          ? { ...item, like_count: (item.like_count || 0) + 1 }
          : item
      ));
      toast.success('Liked!');
    } catch (error) {
      toast.error('Failed to like item');
    }
  };

  const openLightbox = (item, index) => {
    setSelectedMedia(item);
    setCurrentImageIndex(index);
  };

  const closeLightbox = () => {
    setSelectedMedia(null);
    setIsPlaying(false);
  };

  const navigateImage = (direction) => {
    if (direction === 'next') {
      setCurrentImageIndex(prev => (prev + 1) % filteredMedia.length);
    } else {
      setCurrentImageIndex(prev => (prev - 1 + filteredMedia.length) % filteredMedia.length);
    }
  };

  const handleShare = async (item) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: item.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg">Loading gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 text-white">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
          <div
            className="absolute top-3/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/15 to-blue-500/15 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Event Gallery
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Explore stunning photos and videos from past events. Get inspired and relive the amazing moments.
            </p>
          </motion.div>

          {/* Search and Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search gallery..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300"
                  >
                    <Filter className="w-5 h-5" />
                    Filters
                  </button>

                  <div className="flex bg-white/10 rounded-xl border border-white/20 overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 transition-all duration-300 ${
                        viewMode === 'grid' ? 'bg-purple-500 text-white' : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 transition-all duration-300 ${
                        viewMode === 'list' ? 'bg-purple-500 text-white' : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>

                  {isAuthenticated && (user.role === 'organizer' || user.role === 'admin') && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
                    >
                      <Upload className="w-5 h-5" />
                      Upload
                    </button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-white/20"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Category
                        </label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                        >
                          {categories.map((category) => (
                            <option key={category.value} value={category.value} className="bg-slate-800">
                              {category.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Style
                        </label>
                        <select
                          value={selectedStyle}
                          onChange={(e) => setSelectedStyle(e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white focus:border-purple-400/50 focus:outline-none transition-all duration-300"
                        >
                          {styles.map((style) => (
                            <option key={style.value} value={style.value} className="bg-slate-800">
                              {style.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Gallery Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {filteredMedia.length > 0 ? (
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                  : 'grid-cols-1'
              }`}>
                {filteredMedia.map((item, index) => (
                  <motion.div
                    key={item.gallery_id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/20 shadow-2xl hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={item.thumbnail_url || item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                        onClick={() => openLightbox(item, index)}
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-4 left-4 right-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLike(item.gallery_id);
                                }}
                                className="p-2 bg-white/20 backdrop-blur-lg rounded-full hover:bg-white/30 transition-all duration-300"
                              >
                                <Heart className="w-4 h-4 text-white" />
                              </button>
                              <span className="text-white text-sm">{item.like_count || 0}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {isAuthenticated && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBookmarkToggle(item.gallery_id);
                                  }}
                                  className={`p-2 backdrop-blur-lg rounded-full transition-all duration-300 ${
                                    bookmarkedItems.has(item.gallery_id)
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-white/20 text-white hover:bg-white/30'
                                  }`}
                                >
                                  <Bookmark className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleShare(item);
                                }}
                                className="p-2 bg-white/20 backdrop-blur-lg rounded-full hover:bg-white/30 transition-all duration-300"
                              >
                                <Share2 className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* View Count */}
                      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-lg rounded-full px-3 py-1 flex items-center space-x-1">
                        <Eye className="w-3 h-3 text-white" />
                        <span className="text-white text-xs">{item.view_count || 0}</span>
                      </div>

                      {/* Featured Badge */}
                      {item.is_featured && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full px-3 py-1">
                          <Star className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 group-hover:bg-clip-text transition-all duration-300">
                        {item.title}
                      </h3>
                      
                      {item.description && (
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      {/* Tags */}
                      {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {item.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between text-sm text-gray-400">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>
                            {item.uploader?.profile?.firstname || 'Unknown'} {item.uploader?.profile?.lastname || 'User'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-6">🖼️</div>
                <h3 className="text-2xl font-bold text-gray-300 mb-2">No media found</h3>
                <p className="text-gray-400 mb-8">
                  {searchTerm || selectedCategory !== 'all' || selectedStyle !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No media has been uploaded yet'}
                </p>
                {isAuthenticated && (user.role === 'organizer' || user.role === 'admin') && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="btn btn-primary"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload First Media
                  </button>
                )}
              </div>
            )}
          </motion.div>

          {/* Lightbox Modal */}
          <AnimatePresence>
            {selectedMedia && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/90 backdrop-blur-lg z-50 flex items-center justify-center p-4"
                onClick={closeLightbox}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative max-w-4xl w-full max-h-[90vh] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-white/20">
                    <div>
                      <h3 className="text-xl font-bold text-white">{filteredMedia[currentImageIndex]?.title}</h3>
                      <p className="text-gray-300 text-sm">
                        {currentImageIndex + 1} of {filteredMedia.length}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {filteredMedia.length > 1 && (
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                      )}
                      <button
                        onClick={closeLightbox}
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="relative">
                    <img
                      src={filteredMedia[currentImageIndex]?.image_url}
                      alt={filteredMedia[currentImageIndex]?.title}
                      className="w-full max-h-[60vh] object-contain"
                    />

                    {/* Navigation */}
                    {filteredMedia.length > 1 && (
                      <>
                        <button
                          onClick={() => navigateImage('prev')}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 backdrop-blur-lg rounded-full hover:bg-black/70 transition-all duration-300"
                        >
                          <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                        <button
                          onClick={() => navigateImage('next')}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 backdrop-blur-lg rounded-full hover:bg-black/70 transition-all duration-300"
                        >
                          <ChevronRight className="w-6 h-6 text-white" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-white/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLike(filteredMedia[currentImageIndex]?.gallery_id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        >
                          <Heart className="w-4 h-4" />
                          <span>{filteredMedia[currentImageIndex]?.like_count || 0}</span>
                        </button>
                        
                        {isAuthenticated && (
                          <button
                            onClick={() => handleBookmarkToggle(filteredMedia[currentImageIndex]?.gallery_id)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                              bookmarkedItems.has(filteredMedia[currentImageIndex]?.gallery_id)
                                ? 'bg-purple-500 text-white'
                                : 'bg-white/10 hover:bg-white/20'
                            }`}
                          >
                            <Bookmark className="w-4 h-4" />
                            <span>
                              {bookmarkedItems.has(filteredMedia[currentImageIndex]?.gallery_id) ? 'Saved' : 'Save'}
                            </span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleShare(filteredMedia[currentImageIndex])}
                          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = filteredMedia[currentImageIndex]?.image_url;
                            link.download = filteredMedia[currentImageIndex]?.title || 'image';
                            link.click();
                          }}
                          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {filteredMedia[currentImageIndex]?.description && (
                      <p className="text-gray-300 mt-4">
                        {filteredMedia[currentImageIndex].description}
                      </p>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upload Modal */}
          <UploadModal
            isOpen={showUploadModal}
            onClose={() => setShowUploadModal(false)}
            onUploadSuccess={() => {
              fetchMedia();
              setShowUploadModal(false);
            }}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Gallery;
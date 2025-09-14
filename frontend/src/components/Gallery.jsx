import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  Grid,
  List,
  Heart,
  Eye,
  Upload,
  X,
  ChevronDown,
  Star,
  Tag,
  Calendar,
  User,
  Sparkles,
  Bookmark,
  Edit3,
  ZoomIn,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize2,
  Minimize2,
  Sliders,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { mediaService } from "../services/apiServices.js";
import { toast } from "react-hot-toast";
import UploadModal from "./UploadModal";

const dedupeById = (items) => {
  const map = new Map();
  for (const it of items || []) {
    const id = it?.gallery_id ?? it?.id;
    if (id != null && !map.has(id)) map.set(id, it);
  }
  return Array.from(map.values());
};

const Gallery = () => {
  const { user } = useAuth();
  const [galleryItems, setGalleryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [displayMode, setDisplayMode] = useState("masonry"); // 'masonry', 'grid', 'list', 'carousel'
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStyle, setSelectedStyle] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewMode, setViewMode] = useState("all"); // 'all' or 'my-designs'
  const [userDesigns, setUserDesigns] = useState([]);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isCarouselPlaying, setIsCarouselPlaying] = useState(false);
  const carouselRef = useRef(null);

  // Handle escape key for modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (zoomModalOpen) {
          setZoomModalOpen(false);
        } else if (selectedItem) {
          setSelectedItem(null);
        }
      }
    };

    if (zoomModalOpen || selectedItem) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [zoomModalOpen, selectedItem]);

  const canUpload =
    !!user && (user.role === "designer" || user.role === "admin");
  const canDelete = (item) => {
    if (!user) return false;
    const isOwner = myUserId && item.uploader?.user_id === myUserId;
    const isAdminOrOrganizer = ['admin', 'organizer'].includes(user.role);
    return isOwner || isAdminOrOrganizer;
  };
  // const [showReviewModal, setShowReviewModal] = useState(false);
  const myUserId = user?.user_id ?? user?.id ?? user?.userId ?? null;
  const [savedIds, setSavedIds] = useState(new Set());

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "living_room", label: "Living Room" },
    { value: "bedroom", label: "Bedroom" },
    { value: "kitchen", label: "Kitchen" },
    { value: "bathroom", label: "Bathroom" },
    { value: "dining_room", label: "Dining Room" },
    { value: "office", label: "Office" },
    { value: "outdoor", label: "Outdoor" },
    { value: "other", label: "Other" },
  ];

  const styles = [
    { value: "all", label: "All Styles" },
    { value: "modern", label: "Modern" },
    { value: "contemporary", label: "Contemporary" },
    { value: "traditional", label: "Traditional" },
    { value: "minimalist", label: "Minimalist" },
    { value: "industrial", label: "Industrial" },
    { value: "scandinavian", label: "Scandinavian" },
    { value: "bohemian", label: "Bohemian" },
    { value: "rustic", label: "Rustic" },
    { value: "art_deco", label: "Art Deco" },
    { value: "mid_century", label: "Mid Century" },
    { value: "other", label: "Other" },
  ];

  // Fetch gallery data from API
  useEffect(() => {
    const fetchGalleryItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await mediaService.getGallery();
        if (response?.media) {
          const unique = dedupeById(response.media);
          setGalleryItems(unique);
          setFilteredItems(unique);
        } else {
          setGalleryItems([]);
          setFilteredItems([]);
        }
      } catch (error) {
        console.error("Error fetching gallery items:", error);
        setError("Failed to load gallery items. Please try again.");
        // Fallback to empty array if API fails
        setGalleryItems([]);
        setFilteredItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryItems();
  }, []);

  // Fetch saved designs for current user
  useEffect(() => {
    const fetchSaved = async () => {
      if (!user) return;
      try {
        let page = 1;
        let totalPages = 1;
        const all = [];
        do {
          const res = await mediaService.getSavedDesigns({ page });
          const p = res.data?.data;
          all.push(...(p?.items || []));
          totalPages = p?.pagination?.total_pages || 1;
          page += 1;
        } while (page <= totalPages);
        setSavedIds(new Set(all.map((i) => i.gallery_id)));
      } catch (e) {
        // ignore
      }
    };
    fetchSaved();
  }, [user]);

  // Fetch user's own designs if they are a designer
  useEffect(() => {
    const fetchUserDesigns = async () => {
      if (
        myUserId &&
        (user?.role === "designer" ||
          user?.role === "designer-pending" ||
          user?.role === "admin")
      ) {
        try {
          const response = await mediaService.getUserGallery(myUserId);
          if (response?.media) {
            setUserDesigns(dedupeById(response.media));
          } else {
            setUserDesigns([]);
          }
        } catch (error) {
          console.error("Error fetching user designs:", error);
        }
      }
    };

    fetchUserDesigns();
  }, [user, myUserId]);

  // Filter items based on search and filters
  useEffect(() => {
    let filtered = viewMode === "my-designs" ? userDesigns : galleryItems;

    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (item.tags && item.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          ))
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (selectedStyle !== "all") {
      filtered = filtered.filter((item) => item.style === selectedStyle);
    }

    setFilteredItems(filtered);
  }, [
    searchTerm,
    selectedCategory,
    selectedStyle,
    galleryItems,
    userDesigns,
    viewMode,
  ]);

  // const handleUpload = async (uploadData) => {
  //   try {
  //     const response = await api.post("/media", uploadData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //     });

  //     if (response.data.success) {
  //       // Add the new item to the gallery and user designs
  //       const newItem = response.data.data;
  //       setGalleryItems((prev) => dedupeById([newItem, ...prev]));
  //       setUserDesigns((prev) => dedupeById([newItem, ...prev]));
  //       // Show success message
  //       alert("Design uploaded successfully!");
  //       // Switch to "My Designs" view to show the uploaded item immediately
  //       setViewMode("my-designs");
  //     }
  //   } catch (error) {
  //     console.error("Upload failed:", error);
  //     alert("Upload failed. Please try again.");
  //   }
  // };

  const handleSave = async (itemId) => {
    try {
      const res = await mediaService.toggleSave(itemId);
      const saved = res.data?.data?.saved;
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (saved) next.add(itemId);
        else next.delete(itemId);
        return next;
      });
      if (saved) {
        toast.success("Design saved successfully");
      } else {
        toast.success("Design removed from saved");
      }
    } catch (e) {
      console.error("Save toggle failed:", e);
      toast.error("Failed to update save status");
    }
  };

  const handleLike = async (itemId) => {
    try {
      const response = await mediaService.toggleLike(itemId);

      if (response.success) {
        const updateLikes = (items) =>
          items.map((item) =>
            item.gallery_id === itemId
              ? { ...item, like_count: response.data.like_count }
              : item
          );

        setGalleryItems(updateLikes);
        setUserDesigns(updateLikes);
      }
    } catch (error) {
      console.error("Error liking gallery item:", error);
    }
  };

  const handleDeleteDesign = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this design?")) {
      return;
    }

    try {
      const response = await mediaService.deleteMedia(itemId);

      if (response.success) {
        // Remove from both lists
        setGalleryItems((prev) =>
          prev.filter((item) => item.gallery_id !== itemId)
        );
        setUserDesigns((prev) =>
          prev.filter((item) => item.gallery_id !== itemId)
        );
        toast.success("Design deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting design:", error);
      toast.error("Failed to delete design. Please try again.");
    }
  };

  const handleImageClick = (item) => {
    setZoomedImage(item);
    setZoomModalOpen(true);
  };

  const handleCarouselPlay = () => {
    setIsCarouselPlaying(!isCarouselPlaying);
  };

  const handleCarouselNext = () => {
    setCarouselIndex((prev) => (prev + 1) % filteredItems.length);
  };

  const handleCarouselPrev = () => {
    setCarouselIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
  };

  // Auto-play carousel
  useEffect(() => {
    let interval;
    if (isCarouselPlaying && displayMode === 'carousel' && filteredItems.length > 0) {
      interval = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % filteredItems.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isCarouselPlaying, displayMode, filteredItems.length]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading gallery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Gallery</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-indigo-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "4s" }}
        ></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
              Design Gallery
            </h1>
            <p className="text-lg text-gray-300">
              Discover inspiring interior designs from our talented community
            </p>
          </div>

          <div className="flex space-x-4 mt-4 lg:mt-0">
            {(user?.role === "designer" ||
              user?.role === "designer-pending" ||
              user?.role === "admin") && (
              <div className="flex bg-gradient-to-r from-glass-pastel/10 to-glass-pastel/5 backdrop-blur-lg rounded-xl p-1 border border-pastel-pink/20">
                <button
                  onClick={() => setViewMode("all")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    viewMode === "all"
                      ? "bg-gradient-to-r from-vibrant-magenta to-vibrant-cyan text-white shadow-glass-soft"
                      : "text-neutral-500 hover:text-accent-purple"
                  }`}
                >
                  All Designs
                </button>
                <button
                  onClick={() => setViewMode("my-designs")}
                  className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                    viewMode === "my-designs"
                      ? "bg-gradient-to-r from-vibrant-magenta to-vibrant-cyan text-white shadow-glass-soft"
                      : "text-neutral-500 hover:text-accent-purple"
                  }`}
                >
                  My Designs ({userDesigns.length})
                </button>
              </div>
            )}

            {canUpload && (
              <motion.button
                onClick={() => setShowUploadModal(true)}
                className="btn btn-primary"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-cyan-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                <span className="relative z-10 flex items-center space-x-2">
                  <Upload size={20} />
                  <span>Upload Design</span>
                </span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl shadow-purple-500/20 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-500"
                size={20}
              />
              <input
                type="text"
                placeholder="Search designs, styles, or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-xl border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 transition-all duration-300"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-glass-pastel/10 to-glass-pastel/5 backdrop-blur-lg rounded-xl border border-pastel-pink/20 hover:border-accent-purple/60 transition-all duration-300 hover:scale-105"
            >
              <Filter size={20} />
              <span>Filters</span>
              <ChevronDown
                size={16}
                className={`transform transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Display Mode Toggle */}
            <div className="flex bg-gradient-to-r from-glass-pastel/10 to-glass-pastel/5 backdrop-blur-lg rounded-xl p-1 border border-pastel-pink/20">
              <button
                onClick={() => setDisplayMode("masonry")}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  displayMode === "masonry"
                    ? "bg-gradient-to-r from-vibrant-magenta to-vibrant-cyan text-white shadow-glass-soft"
                    : "text-neutral-500 hover:text-accent-purple"
                }`}
                title="Masonry Layout"
              >
                <Sliders size={20} />
              </button>
              <button
                onClick={() => setDisplayMode("grid")}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  displayMode === "grid"
                    ? "bg-gradient-to-r from-vibrant-magenta to-vibrant-cyan text-white shadow-glass-soft"
                    : "text-neutral-500 hover:text-accent-purple"
                }`}
                title="Grid Layout"
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setDisplayMode("carousel")}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  displayMode === "carousel"
                    ? "bg-gradient-to-r from-vibrant-magenta to-vibrant-cyan text-white shadow-glass-soft"
                    : "text-neutral-500 hover:text-accent-purple"
                }`}
                title="Carousel View"
              >
                <Play size={20} />
              </button>
              <button
                onClick={() => setDisplayMode("list")}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  displayMode === "list"
                    ? "bg-gradient-to-r from-vibrant-magenta to-vibrant-cyan text-white shadow-glass-soft"
                    : "text-neutral-500 hover:text-accent-purple"
                }`}
                title="List View"
              >
                <List size={20} />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="pt-6 border-t border-white/20 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-300 mb-2">
                        Category
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-xl border border-white/20 text-white focus:outline-none focus:border-purple-400/50 transition-all duration-300"
                      >
                        {categories.map((category) => (
                          <option
                            key={category.value}
                            value={category.value}
                            className="bg-slate-800 text-white"
                          >
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
                        className="w-full px-4 py-3 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-xl border border-white/20 text-white focus:outline-none focus:border-purple-400/50 transition-all duration-300"
                      >
                        {styles.map((style) => (
                          <option
                            key={style.value}
                            value={style.value}
                            className="bg-slate-800 text-white"
                          >
                            {style.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Count */}
        <motion.div
          className="flex justify-between items-center mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-gray-300">
            Showing{" "}
            <span className="text-vibrant-magenta font-semibold">
              {filteredItems.length}
            </span>{" "}
            of{" "}
            <span className="text-vibrant-cyan font-semibold">
              {galleryItems.length}
            </span>{" "}
            designs
          </p>
        </motion.div>

        {/* Gallery Display Modes */}
        {displayMode === "masonry" && (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 lg:gap-6 xl:gap-8 space-y-4 lg:space-y-6 xl:space-y-8">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.gallery_id}
                className="group relative bg-gradient-to-br from-glass-pastel/10 to-glass-pastel/5 backdrop-blur-3xl rounded-2xl overflow-hidden border border-pastel-pink/20 hover:border-accent-purple/60 cursor-pointer transform hover:scale-105 transition-all duration-500 shadow-glass-soft hover:shadow-accent-pink/20 break-inside-avoid"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => handleImageClick(item)}
              >
                <div className="relative">
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full object-cover rounded-t-2xl"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

                  {item.is_featured && (
                    <div className="absolute top-3 left-3">
                      <span className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-semibold rounded-full">
                        <Star size={12} />
                        <span>Featured</span>
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 flex space-x-2">
                    <span className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-lg rounded-full text-xs">
                      <Eye size={12} />
                      <span>{item.view_count}</span>
                    </span>
                    <span className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-red-500/80 to-pink-500/80 backdrop-blur-lg rounded-full text-xs">
                      <Heart size={12} />
                      <span>{item.like_count}</span>
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(item);
                      }}
                      className="p-2 bg-white/20 backdrop-blur-lg rounded-full hover:bg-white/30 transition-colors"
                    >
                      <ZoomIn className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <User size={12} />
                      <Link
                        to={`/designers/${item.uploader.user_id}`}
                        className="hover:text-white underline-offset-2 hover:underline"
                      >
                        {item.uploader.profile.firstname}{" "}
                        {item.uploader.profile.lastname}
                      </Link>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={12} />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {item.tags && item.tags.length > 0 ? (
                      <>
                        {item.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-full text-xs text-gray-300 border border-white/10"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-full text-xs text-gray-300 border border-white/10">
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="px-2 py-1 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-full text-xs text-gray-400 border border-white/10">
                        No tags
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {displayMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 xl:gap-8">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.gallery_id}
                className="group relative bg-gradient-to-br from-glass-pastel/10 to-glass-pastel/5 backdrop-blur-3xl rounded-2xl overflow-hidden border border-pastel-pink/20 hover:border-accent-purple/60 cursor-pointer transform hover:scale-105 transition-all duration-500 shadow-glass-soft hover:shadow-accent-pink/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -4 }}
                onClick={() => handleImageClick(item)}
              >
                <div className="relative">
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

                  {item.is_featured && (
                    <div className="absolute top-3 left-3">
                      <span className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-semibold rounded-full">
                        <Star size={12} />
                        <span>Featured</span>
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 flex space-x-2">
                    <span className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-purple-500/80 to-pink-500/80 backdrop-blur-lg rounded-full text-xs">
                      <Eye size={12} />
                      <span>{item.view_count}</span>
                    </span>
                    <span className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-red-500/80 to-pink-500/80 backdrop-blur-lg rounded-full text-xs">
                      <Heart size={12} />
                      <span>{item.like_count}</span>
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave(item.gallery_id);
                      }}
                      className={`group relative flex items-center space-x-1 px-3 py-2 bg-gradient-to-br focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                        savedIds.has(item.gallery_id)
                          ? "from-blue-500/90 to-cyan-500/90 backdrop-blur-xl text-white shadow-lg shadow-blue-500/30"
                          : "from-white/10 to-white/5 backdrop-blur-xl text-gray-300 hover:text-blue-300"
                      } rounded-full text-xs border border-white/20 hover:border-blue-400/50 transition-all duration-500 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Bookmark size={12} className={`relative z-10 transition-all duration-300 ${
                        savedIds.has(item.gallery_id)
                          ? "fill-current animate-pulse"
                          : "group-hover:fill-blue-300"
                      }`} />
                      <span className="relative z-10 font-medium">
                        {savedIds.has(item.gallery_id) ? "Saved" : "Save"}
                      </span>
                      {savedIds.has(item.gallery_id) && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                      )}
                    </button>
                  </div>

                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleImageClick(item);
                      }}
                      className="p-2 bg-white/20 backdrop-blur-lg rounded-full hover:bg-white/30 transition-colors"
                    >
                      <ZoomIn className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center space-x-1">
                      <User size={12} />
                      <Link
                        to={`/designers/${item.uploader.user_id}`}
                        className="hover:text-white underline-offset-2 hover:underline"
                      >
                        {item.uploader.profile.firstname}{" "}
                        {item.uploader.profile.lastname}
                      </Link>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={12} />
                      <span>{formatDate(item.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {item.tags && item.tags.length > 0 ? (
                      <>
                        {item.tags.slice(0, 3).map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-2 py-1 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-full text-xs text-gray-300 border border-white/10"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-full text-xs text-gray-300 border border-white/10">
                            +{item.tags.length - 3}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="px-2 py-1 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-full text-xs text-gray-400 border border-white/10">
                        No tags
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {displayMode === "carousel" && filteredItems.length > 0 && (
          <div className="relative">
            <div className="relative h-96 md:h-[500px] lg:h-[600px] overflow-hidden rounded-3xl">
              <motion.div
                ref={carouselRef}
                className="flex h-full"
                animate={{ x: `-${carouselIndex * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {filteredItems.map((item, index) => (
                  <div key={item.gallery_id} className="flex-shrink-0 w-full h-full relative">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => handleImageClick(item)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <h3 className="text-2xl md:text-3xl font-bold mb-2">{item.title}</h3>
                      <p className="text-gray-200 mb-4 line-clamp-2">{item.description}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center space-x-1">
                          <User size={16} />
                          <span>{item.uploader.profile.firstname} {item.uploader.profile.lastname}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye size={16} />
                          <span>{item.view_count}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Heart size={16} />
                          <span>{item.like_count}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            <div className="flex justify-center items-center space-x-4 mt-6">
              <button
                onClick={handleCarouselPrev}
                className="p-3 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-lg rounded-full hover:from-white/30 hover:to-white/20 transition-all duration-300"
              >
                <RotateCcw size={20} className="text-white" />
              </button>

              <button
                onClick={handleCarouselPlay}
                className="p-3 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-lg rounded-full hover:from-white/30 hover:to-white/20 transition-all duration-300"
              >
                {isCarouselPlaying ? <Pause size={20} className="text-white" /> : <Play size={20} className="text-white" />}
              </button>

              <button
                onClick={handleCarouselNext}
                className="p-3 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-lg rounded-full hover:from-white/30 hover:to-white/20 transition-all duration-300"
              >
                <RotateCw size={20} className="text-white" />
              </button>
            </div>

            <div className="flex justify-center space-x-2 mt-4">
              {filteredItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCarouselIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === carouselIndex
                      ? "bg-white shadow-lg"
                      : "bg-white/50 hover:bg-white/75"
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {displayMode === "list" && (
          <div className="space-y-6">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.gallery_id}
                className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-purple-400/50 cursor-pointer transform hover:scale-[1.02] transition-all duration-500 shadow-2xl hover:shadow-purple-500/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex flex-col sm:flex-row gap-4 lg:gap-6">
                  <div className="relative md:w-64 md:h-40 w-full h-48 flex-shrink-0">
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-full object-cover rounded-xl"
                      loading="lazy"
                    />
                    {item.is_featured && (
                      <div className="absolute top-3 left-3">
                        <span className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs font-semibold rounded-full">
                          <Star size={12} />
                          <span>Featured</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 group-hover:bg-clip-text transition-all duration-300">
                        {item.title}
                      </h3>
                      <div className="flex space-x-3 text-sm text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Eye size={16} />
                          <span>{item.view_count}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLike(item.gallery_id);
                          }}
                          className="flex items-center space-x-1 hover:text-red-400 transition-colors"
                        >
                          <Heart size={16} />
                          <span>{item.like_count}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSave(item.gallery_id);
                          }}
                          className={`group relative flex items-center space-x-2 px-3 py-2 rounded-xl transition-all duration-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                            savedIds.has(item.gallery_id)
                              ? "bg-gradient-to-br from-blue-500/90 to-cyan-500/90 backdrop-blur-xl text-white shadow-lg shadow-blue-500/30 border border-blue-400/30"
                              : "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl text-gray-300 hover:text-blue-300 border border-white/20 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/20"
                          }`}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <Bookmark size={16} className={`relative z-10 transition-all duration-300 ${
                            savedIds.has(item.gallery_id)
                              ? "fill-current animate-pulse"
                              : "group-hover:fill-blue-300"
                          }`} />
                          <span className="relative z-10 font-medium">
                            {savedIds.has(item.gallery_id) ? "Saved" : "Save"}
                          </span>
                          {savedIds.has(item.gallery_id) && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                          )}
                        </button>

                        {canDelete(item) && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newTitle =
                                  window.prompt("Edit title", item.title) ??
                                  item.title;
                                const newDesc =
                                  window.prompt(
                                    "Edit description",
                                    item.description || ""
                                  ) ?? item.description;
                                if (newTitle != null) {
                                  mediaService
                                    .updateMedia(item.gallery_id, {
                                      title: newTitle,
                                      description: newDesc,
                                    })
                                    .then((resp) => {
                                      if (resp.success) {
                                        setGalleryItems((prev) =>
                                          prev.map((it) =>
                                            it.gallery_id === item.gallery_id
                                              ? {
                                                  ...it,
                                                  title: newTitle,
                                                  description: newDesc,
                                                }
                                              : it
                                          )
                                        );
                                        setUserDesigns((prev) =>
                                          prev.map((it) =>
                                            it.gallery_id === item.gallery_id
                                              ? {
                                                  ...it,
                                                  title: newTitle,
                                                  description: newDesc,
                                                }
                                              : it
                                          )
                                        );
                                      }
                                    })
                                    .catch((err) =>
                                      console.error("Edit failed", err)
                                    );
                                }
                              }}
                              className="flex items-center space-x-1 hover:text-cyan-400 transition-colors"
                            >
                              <Edit3 size={16} />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDesign(item.gallery_id);
                              }}
                              className="flex items-center space-x-1 hover:text-red-400 transition-colors"
                            >
                              <X size={16} />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4">{item.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags && item.tags.length > 0 ? (
                        item.tags.map((tag, tagIndex) => (
                          <span
                            key={tagIndex}
                            className="px-3 py-1 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-full text-sm text-gray-300 border border-white/10"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span className="px-3 py-1 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-lg rounded-full text-sm text-gray-400 border border-white/10">
                          No tags
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <div className="flex items-center space-x-1">
                        <User size={16} />
                        <Link
                          to={`/designers/${item.uploader.user_id}`}
                          className="hover:text-white underline-offset-2 hover:underline"
                        >
                          {item.uploader.profile.firstname}{" "}
                          {item.uploader.profile.lastname}
                        </Link>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar size={16} />
                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No designs found
            </h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search terms or filters to find more designs.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedStyle("all");
              }}
              className="btn btn-ghost"
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* Zoom Modal */}
        <AnimatePresence>
          {zoomModalOpen && zoomedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setZoomModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative max-w-7xl max-h-[90vh] w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={zoomedImage.image_url}
                  alt={zoomedImage.title}
                  className="w-full h-full object-contain rounded-2xl"
                />

                <div className="absolute top-4 right-4 flex space-x-2">
                  <button
                    onClick={() => setZoomModalOpen(false)}
                    className="p-3 bg-black/50 backdrop-blur-lg rounded-full hover:bg-black/70 transition-all duration-300"
                  >
                    <X size={24} className="text-white" />
                  </button>
                </div>

                <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-lg rounded-xl p-4">
                  <h3 className="text-xl font-bold text-white mb-2">{zoomedImage.title}</h3>
                  <p className="text-gray-200 text-sm mb-3">{zoomedImage.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-300">
                    <span>By {zoomedImage.uploader.profile.firstname} {zoomedImage.uploader.profile.lastname}</span>
                    <div className="flex space-x-4">
                      <span className="flex items-center space-x-1">
                        <Eye size={16} />
                        <span>{zoomedImage.view_count}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Heart size={16} />
                        <span>{zoomedImage.like_count}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedItem(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.title}
                    className="w-full h-64 md:h-96 object-cover rounded-t-3xl"
                    loading="lazy"
                  />
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 p-3 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-lg rounded-full hover:from-white/30 hover:to-white/20 transition-all duration-300"
                  >
                    <X size={20} className="text-white" />
                  </button>
                  {selectedItem.is_featured && (
                    <div className="absolute top-4 left-4">
                      <span className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-sm font-semibold rounded-full">
                        <Star size={16} />
                        <span>Featured</span>
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-white">
                      {selectedItem.title}
                    </h2>
                    <div className="flex space-x-4 text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Eye size={20} />
                        <span>{selectedItem.view_count}</span>
                      </span>
                      <button
                        onClick={() => handleLike(selectedItem.gallery_id)}
                        className="flex items-center space-x-1 hover:text-red-400 transition-colors"
                      >
                        <Heart size={20} />
                        <span>{selectedItem.like_count}</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-300 mb-6">
                    {selectedItem.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h4 className="font-semibold text-white mb-2">Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Category:</span>
                          <span className="capitalize text-white">
                            {selectedItem.category.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Style:</span>
                          <span className="capitalize text-white">
                            {selectedItem.style.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Designer:</span>
                          <Link
                            to={`/designers/${selectedItem.uploader.user_id}`}
                            className="text-white underline-offset-2 hover:underline"
                          >
                            {selectedItem.uploader.profile.firstname}{" "}
                            {selectedItem.uploader.profile.lastname}
                          </Link>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Date:</span>
                          <span className="text-white">
                            {formatDate(selectedItem.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-white mb-2">
                        Color Palette
                      </h4>
                      <div className="flex space-x-2">
                        {selectedItem.color_palette && selectedItem.color_palette.length > 0 ? (
                          selectedItem.color_palette.map((color, index) => (
                            <div
                              key={index}
                              className="w-8 h-8 rounded-full border-2 border-white/20"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))
                        ) : (
                          <p className="text-gray-400 text-sm">No color palette available</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedItem.tags && selectedItem.tags.length > 0 ? (
                        selectedItem.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-lg rounded-full text-sm text-purple-300 border border-purple-400/30"
                          >
                            <Tag size={12} />
                            <span>{tag}</span>
                          </span>
                        ))
                      ) : (
                        <span className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-gray-500/20 to-gray-600/20 backdrop-blur-lg rounded-full text-sm text-gray-400 border border-gray-400/30">
                          <Tag size={12} />
                          <span>No tags</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Admin/Organizer Actions */}
                  {canDelete(selectedItem) && (
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <div className="flex space-x-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDesign(selectedItem.gallery_id);
                          }}
                          className="btn btn-danger flex-1 flex items-center justify-center space-x-2"
                        >
                          <X className="w-5 h-5" />
                          <span>Delete Design</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Review Button - Only show if looking at someone else's design */}
                  {user && selectedItem.uploader.user_id !== user.user_id && (
                    <div className="mt-6 pt-6 border-t border-white/20">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Review modal would open");
                        }}
                        className="btn btn-primary w-full flex items-center justify-center space-x-2"
                      >
                        <Star className="w-5 h-5" />
                        <span>Write a Review</span>
                      </button>
                    </div>
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
            // Refresh gallery data
            const fetchGalleryItems = async () => {
              try {
                const response = await mediaService.getGallery();
                if (response?.media) {
                  const unique = dedupeById(response.media);
                  setGalleryItems(unique);
                  setFilteredItems(unique);
                }
              } catch (error) {
                console.error("Error refreshing gallery:", error);
              }
            };
            fetchGalleryItems();
          }}
        />
      </div>
    </div>
  );
};

export default Gallery;

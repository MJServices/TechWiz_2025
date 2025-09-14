import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import { mediaService } from "../services/apiServices.js";
import { toast } from "react-hot-toast";

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "living_room",
    style: "modern",
    tags: "",
  });
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !uploading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, uploading]);

  const categories = [
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

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add("border-purple-400", "bg-purple-500/10");
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-purple-400", "bg-purple-500/10");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove("border-purple-400", "bg-purple-500/10");
    }

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFiles = (selectedFiles) => {
    const imageFiles = selectedFiles.filter(
      (file) => file.type.startsWith("image/") && file.size <= 10 * 1024 * 1024 // 10MB limit
    );

    if (imageFiles.length !== selectedFiles.length) {
      toast.error("Only image files under 10MB are allowed");
    }

    setFiles((prev) => [...prev, ...imageFiles].slice(0, 5)); // Max 5 files
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadData = new FormData();

        uploadData.append("file", file);
        uploadData.append("title", formData.title);
        uploadData.append("description", formData.description);
        uploadData.append("category", formData.category);
        uploadData.append("style", formData.style);
        uploadData.append("tags", formData.tags);

        // Simulate progress
        setUploadProgress((prev) => ({ ...prev, [i]: 0 }));

        // Upload file
        await mediaService.uploadMedia(uploadData);

        setUploadProgress((prev) => ({ ...prev, [i]: 100 }));
      }

      toast.success("Design uploaded successfully!");
      onUploadSuccess && onUploadSuccess();
      handleClose();
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress({});
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setFiles([]);
      setFormData({
        title: "",
        description: "",
        category: "living_room",
        style: "modern",
        tags: "",
      });
      setUploadProgress({});
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !uploading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, uploading, handleClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
                <Upload className="w-6 h-6" />
                <span>Upload Design</span>
              </h2>
              <button
                onClick={handleClose}
                disabled={uploading}
                className="p-2 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Images *
                </label>
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-purple-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div className="space-y-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white mb-2">
                        Drop images here or click to browse
                      </p>
                      <p className="text-sm text-gray-400">
                        PNG, JPG, GIF up to 10MB each (max 5 files)
                      </p>
                    </div>
                  </div>
                </div>

                {/* File Preview */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 bg-slate-700/50 rounded-lg p-3"
                      >
                        <div className="w-10 h-10 bg-slate-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        {uploadProgress[index] !== undefined && (
                          <div className="flex items-center space-x-2">
                            {uploadProgress[index] === 100 ? (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : uploading ? (
                              <Loader className="w-5 h-5 text-purple-400 animate-spin" />
                            ) : null}
                          </div>
                        )}
                        {!uploading && (
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-1 hover:bg-red-500/20 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                    placeholder="Enter design title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-purple-400 transition-colors"
                  >
                    {categories.map((category) => (
                      <option
                        key={category.value}
                        value={category.value}
                        className="bg-slate-700 text-white"
                      >
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Style
                </label>
                <select
                  name="style"
                  value={formData.style}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-purple-400 transition-colors"
                >
                  {styles.map((style) => (
                    <option
                      key={style.value}
                      value={style.value}
                      className="bg-slate-700 text-white"
                    >
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors resize-none"
                  placeholder="Describe your design..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                  placeholder="Enter tags separated by commas"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={uploading}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || files.length === 0}
                  className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading && <Loader className="w-4 h-4 animate-spin" />}
                  <span>{uploading ? "Uploading..." : "Upload Design"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UploadModal;
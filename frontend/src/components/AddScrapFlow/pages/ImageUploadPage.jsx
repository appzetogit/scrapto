import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadAPI } from '../../../modules/shared/utils/api';
import { useAuth } from '../../../modules/shared/context/AuthContext';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const ImageUploadPage = () => {
  const staticTexts = [
    "Upload Scrap Images",
    "Step 2 of 4",
    "Selected Categories:",
    "Drag & drop images here or click to browse",
    "Choose from Gallery",
    "Take Photo",
    "Add More Images",
    "Uploading...",
    "Continue with",
    "Image",
    "Images",
    "Upload at least one image to continue",
    "Please login again to upload images.",
    "Failed to upload images. Please try again.",
    "Plastic",
    "Metal",
    "Paper",
    "Electronics",
    "Copper",
    "Aluminium",
    "Steel",
    "Brass"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Guard: require auth and selected categories
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth/login', { replace: true });
      return;
    }

    const stored = sessionStorage.getItem('selectedCategories');
    if (stored) {
      setSelectedCategories(JSON.parse(stored));
    } else {
      // If no categories selected, redirect back
      navigate('/add-scrap/category', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleFileSelect = (files) => {
    const imageFiles = Array.from(files).filter(file =>
      file.type.startsWith('image/')
    );

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages(prev => [...prev, {
          id: Date.now() + Math.random(),
          file: file,
          preview: e.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleRemoveImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleContinue = async () => {
    if (uploadedImages.length === 0 || isUploading) return;
    setIsUploading(true);

    try {
      const files = uploadedImages.map((img) => img.file).filter(Boolean);
      const res = await uploadAPI.uploadOrderImages(files);
      const uploaded = res.data?.files || [];

      const imagesData = uploaded.map((file, idx) => ({
        id: uploadedImages[idx]?.id || file.publicId || file.url,
        preview: uploadedImages[idx]?.preview || file.url,
        name: uploadedImages[idx]?.name || file.publicId || 'image',
        url: file.url,
        publicId: file.publicId
      }));

      sessionStorage.setItem('uploadedImages', JSON.stringify(imagesData));
      navigate('/add-scrap/weight');
    } catch (error) {
      console.error('Upload failed:', error);
      if (error.status === 401) {
        alert(getTranslatedText('Please login again to upload images.'));
        navigate('/auth/login', { replace: true });
      } else {
        alert(getTranslatedText(error.message || 'Failed to upload images. Please try again.'));
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraClick = () => {
    // Trigger file input with camera option (mobile)
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: '#f4ebe2' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 md:p-6 border-b" style={{ borderColor: 'rgba(100, 148, 110, 0.2)' }}>
        <button
          onClick={() => navigate('/add-scrap/category')}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#2d3748' }}>
            <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2
          className="text-lg md:text-2xl font-bold"
          style={{ color: '#2d3748' }}
        >
          {getTranslatedText("Upload Scrap Images")}
        </h2>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Progress Indicator */}
      <div className="px-3 md:px-6 pt-3 md:pt-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full" style={{ backgroundColor: 'rgba(100, 148, 110, 0.2)' }}>
            <motion.div
              initial={{ width: '25%' }}
              animate={{ width: '50%' }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ backgroundColor: '#64946e' }}
            />
          </div>
          <span className="text-xs md:text-sm" style={{ color: '#718096' }}>{getTranslatedText("Step 2 of 4")}</span>
        </div>
      </div>

      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <div className="px-3 md:px-6 pt-3">
          <p className="text-xs md:text-sm mb-2" style={{ color: '#718096' }}>
            {getTranslatedText("Selected Categories:")}
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map((cat) => (
              <span
                key={cat.id}
                className="px-2 py-1 rounded-full text-xs md:text-sm font-medium"
                style={{ backgroundColor: '#64946e', color: '#ffffff' }}
              >
                {getTranslatedText(cat.name)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-24 md:pb-6">
        {/* Image Upload Zone */}
        {uploadedImages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 md:p-12 text-center transition-all duration-300 ${isDragging ? 'border-[#64946e] bg-[rgba(100,148,110,0.1)]' : 'border-[rgba(100,148,110,0.3)]'
              }`}
            style={{ backgroundColor: isDragging ? 'rgba(100, 148, 110, 0.1)' : '#ffffff' }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="flex flex-col items-center"
            >
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: '#64946e' }} className="md:w-10 md:h-10">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3
                className="text-base md:text-xl font-semibold mb-2"
                style={{ color: '#2d3748' }}
              >
                {getTranslatedText("Upload Scrap Images")}
              </h3>
              <p
                className="text-xs md:text-sm mb-4"
                style={{ color: '#718096' }}
              >
                {getTranslatedText("Drag & drop images here or click to browse")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-semibold transition-all duration-300 transform hover:scale-105"
                  style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#5a8263'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#64946e'}
                >
                  {getTranslatedText("Choose from Gallery")}
                </button>
                <button
                  onClick={handleCameraClick}
                  className="px-4 py-2 md:px-6 md:py-3 rounded-full text-sm md:text-base font-semibold transition-all duration-300 transform hover:scale-105 border-2"
                  style={{ borderColor: '#64946e', color: '#64946e', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(100, 148, 110, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  📷 {getTranslatedText("Take Photo")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Uploaded Images Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {uploadedImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="relative aspect-square rounded-xl overflow-hidden shadow-md group"
                >
                  <img
                    src={image.preview}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleRemoveImage(image.id)}
                    className="absolute top-2 right-2 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: 'rgba(229, 62, 62, 0.9)' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white md:w-4 md:h-4">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Add More Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 md:py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all duration-300"
              style={{ borderColor: '#64946e', color: '#64946e' }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'rgba(100, 148, 110, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              <span className="text-sm md:text-base font-semibold">{getTranslatedText("Add More Images")}</span>
            </motion.button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>

      {/* Footer with Continue Button - Fixed on Mobile */}
      <div
        className="fixed md:relative bottom-0 left-0 right-0 p-3 md:p-6 border-t z-50"
        style={{
          borderColor: 'rgba(100, 148, 110, 0.2)',
          backgroundColor: '#f4ebe2'
        }}
      >
        {uploadedImages.length > 0 ? (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={handleContinue}
            disabled={isUploading}
            className="w-full py-3 md:py-4 rounded-full text-white font-semibold text-sm md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-60"
            style={{ backgroundColor: '#64946e' }}
            onMouseEnter={(e) => { if (!isUploading) e.target.style.backgroundColor = '#5a8263'; }}
            onMouseLeave={(e) => { if (!isUploading) e.target.style.backgroundColor = '#64946e'; }}
          >
            {isUploading ? getTranslatedText('Uploading...') : `${getTranslatedText("Continue with")} ${uploadedImages.length} ${uploadedImages.length === 1 ? getTranslatedText('Image') : getTranslatedText('Images')}`}
          </motion.button>
        ) : (
          <p
            className="text-xs md:text-sm text-center"
            style={{ color: '#718096' }}
          >
            {getTranslatedText("Upload at least one image to continue")}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default ImageUploadPage;


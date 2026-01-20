import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { uploadAPI } from "../../../shared/utils/api";
import { useAuth } from "../../../shared/context/AuthContext";
import { FaArrowLeft, FaCamera, FaImage } from "react-icons/fa";

import { usePageTranslation } from "../../../../hooks/usePageTranslation";

const staticTexts = [
  "Service Details",
  "Please describe what needs to be cleaned.",
  "Failed to upload images. Please try again.",
  "What needs cleaning?",
  "Describe the area, type of waste, and any specific requirements...",
  "Add Photos (Optional)",
  "Add",
  "Uploading...",
  "Continue",
];

const ServiceDetailsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const fileInputRef = useRef(null);

  const { getTranslatedText } = usePageTranslation(staticTexts);

  const [service, setService] = useState(null);
  const [description, setDescription] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth/login", { replace: true });
      return;
    }

    const stateService = location.state?.selectedService;
    if (stateService) {
      setService(stateService);
    } else {
      // Restore from session if refresh
      const stored = sessionStorage.getItem("selectedService");
      if (stored) {
        setService(JSON.parse(stored));
      } else {
        navigate("/categories", { replace: true });
      }
    }
  }, [isAuthenticated, location, navigate]);

  // Save service to session
  useEffect(() => {
    if (service) {
      sessionStorage.setItem("selectedService", JSON.stringify(service));
    }
  }, [service]);

  const handleFileSelect = (files) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            file: file,
            preview: e.target.result,
            name: file.name,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (imageId) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleContinue = async () => {
    if (!description.trim()) {
      alert(getTranslatedText("Please describe what needs to be cleaned."));
      return;
    }

    setIsUploading(true);
    try {
      let imagesData = [];
      // Upload images if any
      if (uploadedImages.length > 0) {
        const files = uploadedImages.map((img) => img.file).filter(Boolean);
        if (files.length > 0) {
          const res = await uploadAPI.uploadOrderImages(files);
          const uploaded = res.data?.files || [];
          imagesData = uploaded.map((file, idx) => ({
            id: file.publicId || file.url,
            preview: file.url,
            url: file.url,
            publicId: file.publicId,
          }));
        }
      }

      // Save details to session
      const serviceDetails = {
        serviceType: service.name,
        description: description,
        images: imagesData,
        fee: service.price,
      };
      sessionStorage.setItem("serviceDetails", JSON.stringify(serviceDetails));

      // Navigate to Address
      navigate("/book-service/address");
    } catch (error) {
      console.error("Upload failed:", error);
      alert(getTranslatedText("Failed to upload images. Please try again."));
    } finally {
      setIsUploading(false);
    }
  };

  if (!service) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: "#f4ebe2" }}>
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={() => navigate("/categories")}
          className="p-2 rounded-full hover:bg-gray-100">
          <FaArrowLeft />
        </button>
        <h1 className="text-lg font-bold text-gray-800">
          {getTranslatedText("Service Details")}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {/* Service Card */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
            🧹
          </div>
          <div>
            <h2 className="font-bold text-gray-800">{service.name}</h2>
            <p className="text-sm text-gray-500">{service.description}</p>
            <p className="text-red-500 font-bold mt-1">Fee: ₹{service.price}</p>
          </div>
        </div>

        {/* Description Input */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            {getTranslatedText("What needs cleaning?")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={getTranslatedText(
              "Describe the area, type of waste, and any specific requirements..."
            )}
            rows={4}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          />
        </div>

        {/* Image Upload */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            {getTranslatedText("Add Photos (Optional)")}
          </label>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {uploadedImages.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden group">
                <img
                  src={img.preview}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveImage(img.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-500 transition-colors">
              <FaImage size={24} />
              <span className="text-xs mt-1">{getTranslatedText("Add")}</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          onClick={handleContinue}
          disabled={isUploading}
          className="w-full py-3 rounded-xl font-bold text-white shadow-lg disabled:opacity-70"
          style={{ backgroundColor: "#22c55e" }}>
          {isUploading
            ? getTranslatedText("Uploading...")
            : getTranslatedText("Continue")}
        </button>
      </div>
    </motion.div>
  );
};

export default ServiceDetailsPage;

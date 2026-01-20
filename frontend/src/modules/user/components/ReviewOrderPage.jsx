import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaStar,
  FaSpinner,
  FaCloudUploadAlt,
  FaTimes,
} from "react-icons/fa";
import { orderAPI, reviewAPI, uploadAPI } from "../../shared/utils/api";
import RatingInput from "../../shared/components/RatingInput";
import { usePageTranslation } from "../../../hooks/usePageTranslation";

const ReviewOrderPage = () => {
  const staticTexts = [
    "Order not found",
    "Failed to fetch order details",
    "Please select a rating",
    "Scrapper information missing",
    "Failed to submit review",
    "Go Back",
    "Rate & Review",
    "You are rating",
    "Scrapper",
    "Order #",
    "Tap to rate",
    "Excellent!",
    "Good",
    "Average",
    "Poor",
    "Terrible",
    "What went well?",
    "punctual",
    "friendly",
    "professional",
    "helpful",
    "clean",
    "efficient",
    "polite",
    "reliable",
    "Write a Review",
    "Title (e.g., Great Service!)",
    "Tell us more about your experience...",
    "Add Photos (Optional)",
    "Add",
    "Submitting...",
    "Submit Review",
    "/user/my-requests",
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState([]);
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);

  // Available tags
  const availableTags = [
    "punctual",
    "friendly",
    "professional",
    "helpful",
    "clean",
    "efficient",
    "polite",
    "reliable",
  ];

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await orderAPI.getById(orderId);
        if (response.success && response.data) {
          setOrder(response.data);
          // If already reviewed, maybe redirect to view review?
          // For now, let's assume we are creating a new one.
          // In a real app, we check if response.data.review exists.
          if (response.data.review) {
            // If review exists, we could redirect or show edit mode.
            // For simplicity, let's just alert or show "Already Reviewed"
          }
        } else {
          setError("Order not found");
        }
      } catch (err) {
        setError(
          err.message || getTranslatedText("Failed to fetch order details")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Create local previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setPreviewImages((prev) => [...prev, ...newPreviews]);

    // Upload to server (Cloudinary)
    // In a real implementation, we should show a loading state for upload
    try {
      // Assuming uploadAPI.uploadOrderImages returns an array of { url, publicId }
      // We reuse order image upload endpoint or Create a new one for reviews if needed
      // But typically we can just use the generic upload service
      const response = await uploadAPI.uploadOrderImages(files);
      if (response.success && response.data?.files) {
        setImages((prev) => [...prev, ...response.data.files]);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      // Remove previews if failed
    }
  };

  const toggleTag = (tag) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    setSubmitting(true);
    try {
      let scrapperId;
      if (typeof order.scrapper === "string") {
        scrapperId = order.scrapper;
      } else if (order.scrapper && (order.scrapper._id || order.scrapper.id)) {
        scrapperId = order.scrapper._id || order.scrapper.id;
      } else {
        throw new Error("Scrapper information missing");
      }

      await reviewAPI.create({
        orderId,
        scrapperId,
        rating,
        comment,
        title,
        tags,
        images,
      });
      navigate("/user/my-requests"); // Go back to orders
    } catch (err) {
      setError(err.message || getTranslatedText("Failed to submit review"));
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f4ebe2" }}>
        <FaSpinner
          className="animate-spin text-4xl"
          style={{ color: "#64946e" }}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: "#f4ebe2" }}>
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-500 underline">
          {getTranslatedText("Go Back")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: "#f4ebe2" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-4 py-4 shadow-sm"
        style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full">
            <FaArrowLeft size={20} style={{ color: "#2d3748" }} />
          </button>
          <h1 className="text-xl font-bold" style={{ color: "#2d3748" }}>
            Rate & Review
          </h1>
        </div>
      </div>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          {/* Scrapper Info */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
              style={{
                backgroundColor: "rgba(100, 148, 110, 0.15)",
                color: "#64946e",
              }}>
              {order.scrapper?.name?.[0] || "S"}
            </div>
            <div>
              <p className="text-sm text-gray-500">You are rating</p>
              <h2 className="text-xl font-bold" style={{ color: "#2d3748" }}>
                {order.scrapper?.name || "Scrapper"}
              </h2>
              <p className="text-xs text-gray-400">
                Order #
                {order.requestId || order._id?.slice(-6) || order.id || ""}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Star Input */}
            <div className="flex flex-col items-center justify-center p-4">
              <RatingInput value={rating} onChange={setRating} size="lg" />
              <p className="mt-2 text-sm text-gray-500">
                {rating === 0
                  ? "Tap to rate"
                  : rating === 5
                  ? "Excellent!"
                  : rating === 4
                  ? "Good"
                  : rating === 3
                  ? "Average"
                  : rating === 2
                  ? "Poor"
                  : "Terrible"}
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-700">
                What went well?
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      tags.includes(tag)
                        ? "bg-green-100 border-green-200 text-green-700"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}>
                    {getTranslatedText(
                      tag.charAt(0).toUpperCase() + tag.slice(1)
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Title & Comment */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                {getTranslatedText("Write a Review")}
              </label>
              <input
                type="text"
                placeholder={getTranslatedText("Title (e.g., Great Service!)")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
              />
              <textarea
                rows={4}
                placeholder={getTranslatedText(
                  "Tell us more about your experience..."
                )}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Photos */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">
                Add Photos (Optional)
              </label>
              <div className="flex gap-4 overflow-x-auto pb-2">
                <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:text-green-500 transition-colors">
                  <FaCloudUploadAlt size={24} />
                  <span className="text-xs mt-1">Add</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                {previewImages.map((src, idx) => (
                  <div key={idx} className="w-20 h-20 relative flex-shrink-0">
                    <img
                      src={src}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImages((prev) =>
                          prev.filter((_, i) => i !== idx)
                        );
                        // In real app, remove from 'images' state too if already uploaded
                      }}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md text-red-500">
                      <FaTimes size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#64946e" }}>
              {submitting
                ? getTranslatedText("Submitting...")
                : getTranslatedText("Submit Review")}
            </button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default ReviewOrderPage;

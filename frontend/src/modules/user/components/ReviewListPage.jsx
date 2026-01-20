import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaArrowLeft, FaSpinner, FaTimesCircle } from "react-icons/fa";
import { reviewAPI } from "../../shared/utils/api";
import ReviewCard from "../../shared/components/ReviewCard";
import { usePageTranslation } from "../../../hooks/usePageTranslation";

const ReviewListPage = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const staticTexts = [
    "Failed to load reviews",
    "Are you sure you want to delete this review?",
    "Failed to delete review",
    "My Reviews",
    "You haven't written any reviews yet.",
  ];

  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await reviewAPI.getMyReviews();
        if (response.success) {
          setReviews(response.data.reviews || []);
        } else {
          setError(getTranslatedText("Failed to load reviews"));
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError(getTranslatedText("Failed to load reviews"));
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const handleDelete = async (review) => {
    if (
      !window.confirm(
        getTranslatedText("Are you sure you want to delete this review?")
      )
    )
      return;
    try {
      await reviewAPI.delete(review._id);
      setReviews((prev) => prev.filter((r) => r._id !== review._id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert(getTranslatedText("Failed to delete review"));
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

  return (
    <div className="min-h-screen pb-10" style={{ backgroundColor: "#f4ebe2" }}>
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
            {getTranslatedText("My Reviews")}
          </h1>
        </div>
      </div>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        {error && (
          <div className="text-center p-8 bg-white rounded-xl">
            <FaTimesCircle className="mx-auto text-red-500 mb-2" size={32} />
            <p className="text-gray-600">{error}</p>
          </div>
        )}

        {!loading && !error && reviews.length === 0 && (
          <div className="text-center p-12 bg-white rounded-xl">
            <p className="text-gray-500">
              {getTranslatedText("You haven't written any reviews yet.")}
            </p>
          </div>
        )}

        {reviews.map((review) => (
          <ReviewCard
            key={review._id}
            review={review}
            showActions={true}
            isOwner={true}
            onDelete={handleDelete}
          />
        ))}
      </main>
    </div>
  );
};

export default ReviewListPage;

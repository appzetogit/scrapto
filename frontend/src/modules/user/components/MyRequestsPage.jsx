import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaTruck,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaFilter,
  FaTimes,
  FaImage,
  FaWeight,
  FaRupeeSign,
  FaSpinner,
  FaComments,
  FaStar,
  FaPhone,
} from "react-icons/fa";
import { HiClock, HiCheckCircle, HiXCircle } from "react-icons/hi";
import { MdPending, MdLocalShipping, MdDone } from "react-icons/md";
import { orderAPI } from "../../shared/utils/api";
import { usePageTranslation } from "../../../hooks/usePageTranslation";

const MyRequestsPage = () => {
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const staticTexts = [
    "Failed to load requests",
    "Are you sure you want to cancel this request?",
    "Failed to cancel request",
    "Pending",
    "Accepted",
    "On the Way",
    "Completed",
    "Cancelled",
    "All",
    "Today",
    "Yesterday",
    "days ago",
    "My Requests",
    "Loading your requests...",
    "Error loading requests",
    "Retry",
    "No requests found",
    "You haven't created any pickup requests yet",
    "No {filter} requests",
    "Weight",
    "Est. Price",
    "Scrapper",
    "Notes: ",
    "Address not provided",
    "Book {category}",
    "Sell your {category} scrap",
    " at ",
    "Total",
    "Request ",
    "kg",
    "Cancel Request",
    "Rate & Review",
    "Chat",
    "Call",
    "Cancelling...",
    "Reviewed",
    "Cancelled on",
    "Completed on",
  ];

  const { getTranslatedText } = usePageTranslation(staticTexts);

  // Transform backend order to frontend format
  const transformOrder = (order) => {
    // Extract unique categories from scrapItems
    const categories = [
      ...new Set(
        order.scrapItems?.map((item) => {
          // Capitalize first letter
          return item.category.charAt(0).toUpperCase() + item.category.slice(1);
        }) || []
      ),
    ];

    // Extract image URLs
    const images = order.images?.map((img) => img.url || img) || [];

    // Format address
    const addressParts = [];
    if (order.pickupAddress?.street)
      addressParts.push(order.pickupAddress.street);
    if (order.pickupAddress?.city) addressParts.push(order.pickupAddress.city);
    if (order.pickupAddress?.state)
      addressParts.push(order.pickupAddress.state);
    if (order.pickupAddress?.pincode)
      addressParts.push(order.pickupAddress.pincode);
    const address =
      addressParts.join(", ") || getTranslatedText("Address not provided");

    // Generate requestId from order _id
    const requestId = `REQ-${order._id.toString().slice(-6).toUpperCase()}`;

    // Map status: confirmed -> accepted for UI
    let displayStatus = order.status;
    if (order.status === "confirmed") {
      displayStatus = "accepted";
    }

    // Format phone number
    let scrapperPhone = null;
    if (order.scrapper?.phone) {
      const phone = order.scrapper.phone.toString();
      scrapperPhone = phone.length === 10 ? `+91 ${phone}` : phone;
    }

    return {
      id: order._id,
      requestId,
      categories,
      images,
      weight: order.totalWeight || 0,
      estimatedPrice: order.totalAmount || 0,
      status: displayStatus,
      createdAt: order.createdAt,
      completedAt: order.completedDate,
      cancelledAt: order.status === "cancelled" ? order.updatedAt : null,
      scrapperName: order.scrapper?.name || null,
      scrapperPhone,
      address,
      notes: order.notes || "",
      hasReview: !!order.review, // Check if review ID exists
    };
  };

  // Fetch orders from backend
  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      const queryParams =
        selectedFilter !== "all"
          ? `status=${selectedFilter === "accepted" ? "confirmed" : selectedFilter
          }`
          : "";
      const response = await orderAPI.getMy(queryParams);

      if (response.success && response.data?.orders) {
        const transformedOrders = response.data.orders.map(transformOrder);
        setRequests(transformedOrders);
      } else {
        setError(getTranslatedText("Failed to load requests"));
        setRequests([]);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError(err.message || getTranslatedText("Failed to load requests"));
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [selectedFilter]);

  // Initial load and filter change
  useEffect(() => {
    setLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  // Real-time polling: refresh every 10 seconds for pending/accepted/in_progress orders
  useEffect(() => {
    const hasActiveOrders = requests.some((req) =>
      ["pending", "accepted", "in_progress"].includes(req.status)
    );

    if (!hasActiveOrders) return;

    const interval = setInterval(() => {
      fetchOrders();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [requests, fetchOrders]);

  // Refresh on page visibility (tab switch) only
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchOrders();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchOrders]);

  // Cancel order handler
  const handleCancelOrder = async (orderId) => {
    if (
      !window.confirm(
        getTranslatedText("Are you sure you want to cancel this request?")
      )
    ) {
      return;
    }

    try {
      setCancellingId(orderId);
      await orderAPI.cancel(orderId, "Cancelled by user");
      // Refresh orders after cancellation
      await fetchOrders();
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert(err.message || getTranslatedText("Failed to cancel request"));
    } finally {
      setCancellingId(null);
    }
  };

  const statusConfig = {
    pending: {
      label: getTranslatedText("Pending"),
      color: "#f59e0b",
      bgColor: "rgba(245, 158, 11, 0.1)",
      icon: MdPending,
    },
    accepted: {
      label: getTranslatedText("Accepted"),
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.1)",
      icon: HiCheckCircle,
    },
    in_progress: {
      label: getTranslatedText("On the Way"),
      color: "#8b5cf6",
      bgColor: "rgba(139, 92, 246, 0.1)",
      icon: MdLocalShipping,
    },
    completed: {
      label: getTranslatedText("Completed"),
      color: "#64946e",
      bgColor: "rgba(100, 148, 110, 0.1)",
      icon: FaCheckCircle,
    },
    cancelled: {
      label: getTranslatedText("Cancelled"),
      color: "#ef4444",
      bgColor: "rgba(239, 68, 68, 0.1)",
      icon: FaTimesCircle,
    },
  };

  const filters = [
    { id: "all", label: getTranslatedText("All") },
    { id: "pending", label: getTranslatedText("Pending") },
    { id: "accepted", label: getTranslatedText("Accepted") },
    { id: "in_progress", label: getTranslatedText("On the Way") },
    { id: "completed", label: getTranslatedText("Completed") },
    { id: "cancelled", label: getTranslatedText("Cancelled") },
  ];

  const filteredRequests =
    selectedFilter === "all"
      ? requests
      : requests.filter((req) => req.status === selectedFilter);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return getTranslatedText("Today");
    if (diffDays === 1) return getTranslatedText("Yesterday");
    if (diffDays < 7) return `${diffDays} ${getTranslatedText("days ago")}`;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-20 md:pb-0"
      style={{ backgroundColor: "#f4ebe2" }}>
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-4 md:px-6 lg:px-8 py-4 md:py-6"
        style={{ backgroundColor: "#f4ebe2" }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-full hover:opacity-70 transition-opacity"
              style={{ color: "#64946e" }}>
              <FaTimes size={20} />
            </button>
            <h1
              className="text-xl md:text-2xl font-bold"
              style={{ color: "#2d3748" }}>
              {getTranslatedText("My Requests")}
            </h1>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Stats Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="mb-4 md:mb-6">
          <div
            className="rounded-2xl p-4 md:p-6"
            style={{ backgroundColor: "#ffffff" }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                {
                  label: getTranslatedText("Total"),
                  value: requests.length,
                  color: "#2d3748",
                },
                {
                  label: getTranslatedText("Pending"),
                  value: requests.filter((r) => r.status === "pending").length,
                  color: "#f59e0b",
                },
                {
                  label: getTranslatedText("On the Way"),
                  value: requests.filter((r) => r.status === "in_progress")
                    .length,
                  color: "#8b5cf6",
                },
                {
                  label: getTranslatedText("Completed"),
                  value: requests.filter((r) => r.status === "completed")
                    .length,
                  color: "#64946e",
                },
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="text-center">
                  <p
                    className="text-2xl md:text-3xl font-bold mb-1"
                    style={{ color: stat.color }}>
                    {stat.value}
                  </p>
                  <p
                    className="text-xs md:text-sm"
                    style={{ color: "#718096" }}>
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-4 md:mb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 md:px-6 md:py-2.5 rounded-lg font-semibold text-xs md:text-sm whitespace-nowrap transition-all ${selectedFilter === filter.id ? "text-white" : "text-gray-600"
                  }`}
                style={{
                  backgroundColor:
                    selectedFilter === filter.id ? "#64946e" : "#ffffff",
                  border:
                    selectedFilter === filter.id
                      ? "none"
                      : "1px solid rgba(100, 148, 110, 0.15)",
                }}>
                {filter.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl p-12 text-center"
            style={{ backgroundColor: "#ffffff" }}>
            <FaSpinner
              className="animate-spin mx-auto mb-4"
              size={32}
              style={{ color: "#64946e" }}
            />
            <p style={{ color: "#718096" }}>
              {getTranslatedText("Loading your requests...")}
            </p>
          </motion.div>
        )}

        {/* Error State */}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-8 md:p-12 text-center"
            style={{ backgroundColor: "#ffffff" }}>
            <FaTimesCircle
              size={48}
              className="mx-auto mb-4"
              style={{ color: "#ef4444" }}
            />
            <h3
              className="text-lg md:text-xl font-bold mb-2"
              style={{ color: "#2d3748" }}>
              {getTranslatedText("Error loading requests")}
            </h3>
            <p
              className="text-sm md:text-base mb-4"
              style={{ color: "#718096" }}>
              {error}
            </p>
            <button
              onClick={fetchOrders}
              className="px-6 py-2 rounded-lg text-white font-semibold"
              style={{ backgroundColor: "#64946e" }}>
              {getTranslatedText("Retry")}
            </button>
          </motion.div>
        )}

        {/* Requests List */}
        {!loading && !error && (
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
            {filteredRequests.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-8 md:p-12 text-center"
                style={{ backgroundColor: "#ffffff" }}>
                <FaTruck
                  size={48}
                  className="mx-auto mb-4"
                  style={{ color: "#a0aec0" }}
                />
                <h3
                  className="text-lg md:text-xl font-bold mb-2"
                  style={{ color: "#2d3748" }}>
                  {getTranslatedText("No requests found")}
                </h3>
                <p
                  className="text-sm md:text-base"
                  style={{ color: "#718096" }}>
                  {selectedFilter === "all"
                    ? getTranslatedText(
                      "You haven't created any pickup requests yet"
                    )
                    : getTranslatedText("No {filter} requests", {
                      filter: filters
                        .find((f) => f.id === selectedFilter)
                        ?.label.toLowerCase(),
                    })}
                </p>
              </motion.div>
            ) : (
              filteredRequests.map((request, index) => {
                const status = statusConfig[request.status];
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="rounded-xl p-4 md:p-6"
                    style={{
                      backgroundColor: "#ffffff",
                      border: "1px solid rgba(100, 148, 110, 0.15)",
                    }}>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3
                            className="font-bold text-base md:text-lg"
                            style={{ color: "#2d3748" }}>
                            {request.requestId}
                          </h3>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                            style={{
                              backgroundColor: status.bgColor,
                              color: status.color,
                            }}>
                            <StatusIcon size={12} />
                            {status.label}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 text-xs md:text-sm"
                          style={{ color: "#718096" }}>
                          <FaCalendarAlt size={12} />
                          <span>
                            {formatDate(request.createdAt)} at{" "}
                            {formatTime(request.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Categories */}
                    {request.categories && request.categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {request.categories.map((category, catIndex) => (
                          <span
                            key={catIndex}
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: "rgba(100, 148, 110, 0.1)",
                              color: "#64946e",
                            }}>
                            {category}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Images Preview */}
                    {request.images && request.images.length > 0 && (
                      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
                        {request.images.slice(0, 3).map((img, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden flex-shrink-0 relative"
                            style={{ backgroundColor: "#e5ddd4" }}>
                            <img
                              src={img}
                              alt={`Request ${imgIndex + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          </div>
                        ))}
                        {request.images.length > 3 && (
                          <div
                            className="w-16 h-16 md:w-20 md:h-20 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: "rgba(100, 148, 110, 0.1)",
                            }}>
                            <span
                              className="text-xs font-bold"
                              style={{ color: "#64946e" }}>
                              +{request.images.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <FaWeight size={14} style={{ color: "#64946e" }} />
                        <div>
                          <p className="text-xs" style={{ color: "#718096" }}>
                            {getTranslatedText("Weight")}
                          </p>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "#2d3748" }}>
                            {request.weight.toFixed(1)}{" "}
                            {getTranslatedText("kg")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaRupeeSign size={14} style={{ color: "#64946e" }} />
                        <div>
                          <p className="text-xs" style={{ color: "#718096" }}>
                            {getTranslatedText("Est. Price")}
                          </p>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: "#2d3748" }}>
                            ₹{request.estimatedPrice.toFixed(0)}
                          </p>
                        </div>
                      </div>
                      {request.scrapperName && (
                        <div className="flex items-center gap-2 min-w-0">
                          <FaTruck size={14} className="flex-shrink-0" style={{ color: "#64946e" }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs" style={{ color: "#718096" }}>
                              {getTranslatedText("Scrapper")}
                            </p>
                            <p
                              className="text-sm font-semibold truncate"
                              style={{ color: "#2d3748" }}>
                              {request.scrapperName}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    {request.address && (
                      <div
                        className="flex items-start gap-2 mb-3 p-2 rounded-lg"
                        style={{
                          backgroundColor: "rgba(100, 148, 110, 0.05)",
                        }}>
                        <FaMapMarkerAlt
                          size={14}
                          className="mt-0.5 flex-shrink-0"
                          style={{ color: "#64946e" }}
                        />
                        <p
                          className="text-xs md:text-sm flex-1"
                          style={{ color: "#4a5568" }}>
                          {request.address}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {request.notes && (
                      <div className="mb-3">
                        <p
                          className="text-xs md:text-sm"
                          style={{ color: "#718096" }}>
                          <span className="font-medium">
                            {getTranslatedText("Notes: ")}
                          </span>
                          {request.notes}
                        </p>
                      </div>
                    )}

                    {/* Status Timeline */}
                    {request.status === "completed" && request.completedAt && (
                      <div
                        className="pt-3 border-t"
                        style={{ borderColor: "rgba(100, 148, 110, 0.15)" }}>
                        <p className="text-xs" style={{ color: "#718096" }}>
                          {getTranslatedText("Completed on")}{" "}
                          {formatDate(request.completedAt)} at{" "}
                          {formatTime(request.completedAt)}
                        </p>
                      </div>
                    )}

                    {request.status === "cancelled" && request.cancelledAt && (
                      <div
                        className="pt-3 border-t"
                        style={{ borderColor: "rgba(100, 148, 110, 0.15)" }}>
                        <p className="text-xs" style={{ color: "#ef4444" }}>
                          {getTranslatedText("Cancelled on")}{" "}
                          {formatDate(request.cancelledAt)} at{" "}
                          {formatTime(request.cancelledAt)}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {request.status === "pending" && (
                      <div
                        className="flex gap-2 mt-3 pt-3 border-t"
                        style={{ borderColor: "rgba(100, 148, 110, 0.15)" }}>
                        <button
                          onClick={() => handleCancelOrder(request.id)}
                          disabled={cancellingId === request.id}
                          className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          style={{
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                          }}
                          onMouseEnter={(e) => {
                            if (!e.target.disabled) {
                              e.target.style.backgroundColor =
                                "rgba(239, 68, 68, 0.2)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!e.target.disabled) {
                              e.target.style.backgroundColor =
                                "rgba(239, 68, 68, 0.1)";
                            }
                          }}>
                          {cancellingId === request.id ? (
                            <>
                              <FaSpinner className="animate-spin" size={12} />
                              {getTranslatedText("Cancelling...")}
                            </>
                          ) : (
                            getTranslatedText("Cancel Request")
                          )}
                        </button>
                      </div>
                    )}

                    {/* Action Buttons for Accepted/In Progress Orders */}
                    {(request.status === "accepted" ||
                      request.status === "in_progress") &&
                      request.scrapperName && (
                        <div
                          className="flex gap-2 mt-3 pt-3 border-t"
                          style={{ borderColor: "rgba(100, 148, 110, 0.15)" }}>
                          {request.status === "in_progress" && (
                            <button
                              onClick={() => navigate(`/track-order/${request.id}`)}
                              className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold text-white text-center transition-all flex items-center justify-center gap-2"
                              style={{ backgroundColor: "#ea580c" }} // Orange for Track
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#c2410c";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "#ea580c";
                              }}>
                              <FaMapMarkerAlt size={14} />
                              {getTranslatedText("Track")}
                            </button>
                          )}
                          <button
                            onClick={() =>
                              navigate(`/chat`, {
                                state: { orderId: request.id },
                              })
                            }
                            className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold text-white text-center transition-all flex items-center justify-center gap-2"
                            style={{ backgroundColor: "#64946e" }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "#5a8263";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "#64946e";
                            }}>
                            <FaComments size={14} />
                            {getTranslatedText("Chat")}
                          </button>
                          {request.scrapperPhone && (
                            <a
                              href={`tel:${request.scrapperPhone.replace(
                                /\s/g,
                                ""
                              )}`}
                              className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold text-white text-center transition-all flex items-center justify-center gap-2"
                              style={{ backgroundColor: "#8b5cf6" }} // Purple for Call
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#7c3aed";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "#8b5cf6";
                              }}>
                              <FaPhone size={14} />
                              {getTranslatedText("Call")}
                            </a>
                          )}
                        </div>
                      )}

                    {/* Action Buttons for Completed Orders */}
                    {request.status === "completed" && request.scrapperName && (
                      <div
                        className="flex gap-2 mt-3 pt-3 border-t"
                        style={{ borderColor: "rgba(100, 148, 110, 0.15)" }}>
                        {request.hasReview ? (
                          <button
                            disabled
                            className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold text-white text-center transition-all flex items-center justify-center gap-2 opacity-70 cursor-not-allowed"
                            style={{ backgroundColor: "#f59e0b" }}>
                            <FaStar size={14} />
                            {getTranslatedText("Reviewed")}
                          </button>
                        ) : (
                          <button
                            onClick={() =>
                              navigate(`/review-order/${request.id}`)
                            }
                            className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold text-white text-center transition-all flex items-center justify-center gap-2"
                            style={{ backgroundColor: "#f59e0b" }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "#d97706";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "#f59e0b";
                            }}>
                            <FaStar size={14} />
                            {getTranslatedText("Rate & Review")}
                          </button>
                        )}
                        <button
                          onClick={() =>
                            navigate(`/chat`, {
                              state: { orderId: request.id },
                            })
                          }
                          className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold text-white text-center transition-all flex items-center justify-center gap-2"
                          style={{ backgroundColor: "#64946e" }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#5a8263";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#64946e";
                          }}>
                          <FaComments size={14} />
                          {getTranslatedText("Chat")}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default MyRequestsPage;

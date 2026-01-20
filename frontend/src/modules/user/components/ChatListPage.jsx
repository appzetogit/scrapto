import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import { chatAPI } from "../../shared/utils/api";
import { FaComments, FaSpinner, FaSearch } from "react-icons/fa";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { useDynamicTranslation } from "../../../hooks/useDynamicTranslation";

const ChatListPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("active"); // active, archived

  const staticTexts = [
    "Loading chats...",
    "Messages",
    "Search chats...",
    "Active",
    "Archived",
    "No chats found",
    "Try a different search term",
    "Start a conversation from an active order",
    "Just now",
    "m ago",
    "h ago",
    "d ago",
    "Unknown User",
    "Failed to load chats",
    "Order: ",
    "No messages yet",
  ];

  const { getTranslatedText } = usePageTranslation(staticTexts);
  const { translateText: translateDynamic } = useDynamicTranslation();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    loadChats();

    // Refresh chats every 30 seconds
    const interval = setInterval(() => {
      loadChats();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, navigate, filter]);

  const loadChats = async () => {
    try {
      setError(null);
      const query = `status=${filter}&limit=50`;
      const response = await chatAPI.getMyChats(query);

      if (response.success && response.data?.chats) {
        setChats(response.data.chats);
      } else {
        setError(getTranslatedText("Failed to load chats"));
        setChats([]);
      }
    } catch (err) {
      console.error("Error loading chats:", err);
      setError(err.message || getTranslatedText("Failed to load chats"));
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now - messageDate;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return getTranslatedText("Just now");
    if (minutes < 60) return `${minutes}${getTranslatedText("m ago")}`;
    if (minutes < 1440)
      return `${Math.floor(minutes / 60)}${getTranslatedText("h ago")}`;
    const days = Math.floor(minutes / 1440);
    if (days < 7) return `${days}${getTranslatedText("d ago")}`;
    return messageDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const getOtherUser = (chat) => {
    if (!chat) return null;
    return chat.scrapper || chat.user;
  };

  const getUnreadCount = (chat) => {
    if (!chat) return 0;
    return user.role === "user"
      ? chat.unreadCount?.user || 0
      : chat.unreadCount?.scrapper || 0;
  };

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;
    const otherUser = getOtherUser(chat);
    const searchLower = searchQuery.toLowerCase();
    return (
      otherUser?.name?.toLowerCase().includes(searchLower) ||
      otherUser?.phone?.includes(searchQuery) ||
      chat.lastMessage?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f4ebe2" }}>
        <div className="text-center">
          <FaSpinner
            className="animate-spin mx-auto mb-4"
            style={{ color: "#64946e", fontSize: "2rem" }}
          />
          <p style={{ color: "#2d3748" }}>
            {getTranslatedText("Loading chats...")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f4ebe2" }}>
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1
            className="text-2xl md:text-3xl font-bold"
            style={{ color: "#2d3748" }}>
            {getTranslatedText("Messages")}
          </h1>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <FaSearch
              className="absolute left-4 top-1/2 transform -translate-y-1/2"
              style={{ color: "#718096" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getTranslatedText("Search chats...")}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
              style={{
                borderColor: "rgba(100, 148, 110, 0.3)",
                backgroundColor: "#ffffff",
                color: "#2d3748",
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                filter === "active" ? "text-white" : "text-gray-700"
              }`}
              style={{
                backgroundColor:
                  filter === "active" ? "#64946e" : "rgba(100, 148, 110, 0.1)",
              }}>
              {getTranslatedText("Active")}
            </button>
            <button
              onClick={() => setFilter("archived")}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                filter === "archived" ? "text-white" : "text-gray-700"
              }`}
              style={{
                backgroundColor:
                  filter === "archived"
                    ? "#64946e"
                    : "rgba(100, 148, 110, 0.1)",
              }}>
              {getTranslatedText("Archived")}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="p-3 rounded-xl text-sm"
            style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
            {error}
          </div>
        )}

        {/* Chats List */}
        {filteredChats.length === 0 ? (
          <div className="text-center py-12">
            <FaComments
              className="mx-auto mb-4"
              style={{ color: "#9ca3af", fontSize: "3rem" }}
            />
            <p
              className="text-lg font-semibold mb-2"
              style={{ color: "#2d3748" }}>
              {getTranslatedText("No chats found")}
            </p>
            <p className="text-sm" style={{ color: "#718096" }}>
              {searchQuery
                ? getTranslatedText("Try a different search term")
                : getTranslatedText(
                    "Start a conversation from an active order"
                  )}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChats.map((chat) => {
              const otherUser = getOtherUser(chat);
              const unreadCount = getUnreadCount(chat);
              const otherUserName =
                otherUser?.name || getTranslatedText("Unknown User");
              const otherUserInitials =
                otherUserName
                  .split(" ")
                  .map((n) => n[0])
                  .join("") || "U";

              return (
                <motion.div
                  key={chat._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    navigate(`/chat/${chat._id}`, {
                      state: { orderId: chat.orderId?._id || chat.orderId },
                    })
                  }
                  className="rounded-2xl p-4 shadow-lg cursor-pointer transition-all"
                  style={{ backgroundColor: "#ffffff" }}>
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold relative flex-shrink-0"
                      style={{
                        backgroundColor: "rgba(100, 148, 110, 0.15)",
                        color: "#64946e",
                      }}>
                      {otherUserInitials}
                      {unreadCount > 0 && (
                        <div
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: "#ef4444" }}>
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className="text-base font-semibold truncate"
                          style={{ color: "#2d3748" }}>
                          {otherUserName}
                        </h3>
                        <span
                          className="text-xs flex-shrink-0 ml-2"
                          style={{ color: "#9ca3af" }}>
                          {formatTime(chat.lastMessageAt)}
                        </span>
                      </div>
                      <p
                        className="text-sm truncate"
                        style={{ color: "#718096" }}>
                        {chat.lastMessage ||
                          getTranslatedText("No messages yet")}
                      </p>
                      {chat.orderId && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: "#9ca3af" }}>
                          {getTranslatedText("Order: ")}
                          {chat.orderId.status || getTranslatedText("Active")}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatListPage;

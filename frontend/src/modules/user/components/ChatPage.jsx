import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import { chatAPI } from "../../shared/utils/api";
import socketClient from "../../shared/utils/socketClient";
import { FaSpinner } from "react-icons/fa";
import { usePageTranslation } from "../../../hooks/usePageTranslation";

const ChatPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId: chatIdParam } = useParams();
  const { user, isAuthenticated } = useAuth();

  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const staticTexts = [
    "Failed to create/get chat",
    "Failed to load messages",
    "Missing Order ID or Chat ID",
    "Failed to load chat",
    "Loading chat...",
    "Type a message...",
    "Send",
    "Scrapper",
    "User",
    "is typing...",
    "No messages yet. Start the conversation!",
    "Chat with",
    "Back to Chats",
    "Failed to create/get chat",
    "Failed to load messages",
    "Missing Order ID or Chat ID",
    "Failed to load chat",
    "Error loading more messages",
    "Unknown User",
    "• Online",
    "Go Back",
    "Initializing Chat...",
    "Chat not found",
    "Order ID or Chat ID is required",
    "Failed to send message",
    "Just now",
    "m ago",
    "h ago",
  ];

  const { getTranslatedText } = usePageTranslation(staticTexts);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentPageRef = useRef(1);
  const chatIdRef = useRef(null);

  // Get orderId from location state or URL
  const orderId =
    location.state?.orderId ||
    new URLSearchParams(location.search).get("orderId");
  const chatId = chatIdParam || location.state?.chatId;

  // Initialize chat - create or get existing
  const initializeChat = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let currentChatId = chatId;

      // If orderId provided but no chatId, create/get chat for that order
      if (orderId && !currentChatId) {
        const createResponse = await chatAPI.getOrCreate(orderId);
        if (createResponse.success && createResponse.data?.chat) {
          currentChatId = createResponse.data.chat._id;
          chatIdRef.current = currentChatId;
          setChat(createResponse.data.chat);

          // Load messages for the chat
          const messagesResponse = await chatAPI.getMessages(currentChatId);
          if (messagesResponse.success && messagesResponse.data?.messages) {
            setMessages(messagesResponse.data.messages || []);
          }
        } else {
          throw new Error(getTranslatedText("Failed to create/get chat"));
        }
      } else if (currentChatId) {
        // Get existing chat - first get chat info, then messages
        chatIdRef.current = currentChatId;
        const messagesResponse = await chatAPI.getMessages(currentChatId);
        if (messagesResponse.success && messagesResponse.data?.messages) {
          setMessages(messagesResponse.data.messages || []);
          // Try to get chat info from order if available
          if (orderId) {
            const chatResponse = await chatAPI.getOrCreate(orderId);
            if (chatResponse.success && chatResponse.data?.chat) {
              setChat(chatResponse.data.chat);
            }
          }
        } else {
          throw new Error(getTranslatedText("Failed to load messages"));
        }
      } else {
        // If neither orderId nor chatId is present, we cannot initialize chat
        console.warn(getTranslatedText("Missing Order ID or Chat ID"));
        setLoading(false);
        // Don't throw error immediately, let UI handle empty state if needed
        return;
      }

      // Connect to Socket.io
      const token = localStorage.getItem("token");
      if (token && currentChatId) {
        socketClient.connect(token);

        // Join chat room
        socketClient.joinChat(currentChatId);

        // Listen for new messages
        socketClient.onMessage((message) => {
          // Backend sends message object directly, check if it belongs to this chat
          if (
            message &&
            message.chat &&
            message.chat.toString() === currentChatId
          ) {
            setMessages((prev) => {
              // Check if message already exists
              const exists = prev.some((m) => m._id === message._id);
              if (!exists) {
                return [...prev, message];
              }
              return prev;
            });

            // Mark as read if user is viewing
            if (document.visibilityState === "visible") {
              chatAPI.markAsRead(currentChatId).catch(console.error);
            }
          }
        });

        // Listen for typing indicators
        socketClient.onTyping((data) => {
          if (data.chatId === currentChatId && data.userId !== user?._id) {
            setOtherUserTyping(data.isTyping);
            if (data.isTyping) {
              setTimeout(() => setOtherUserTyping(false), 3000);
            }
          }
        });

        // Listen for read receipts
        socketClient.onMessagesRead((data) => {
          if (data.chatId === currentChatId) {
            // Update read status of messages
            setMessages((prev) =>
              prev.map((msg) =>
                msg.senderId._id === data.userId ? { ...msg, read: true } : msg
              )
            );
          }
        });

        // Listen for errors
        socketClient.onError((error) => {
          console.error("Socket error:", error);
        });
      }

      // Mark messages as read
      if (currentChatId) {
        await chatAPI.markAsRead(currentChatId);
      }
    } catch (err) {
      console.error("Error initializing chat:", err);
      setError(err.message || getTranslatedText("Failed to load chat"));
    } finally {
      setLoading(false);
    }
  }, [chatId, orderId, user]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!chatIdRef.current || loadingMore || !hasMoreMessages) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPageRef.current + 1;
      const response = await chatAPI.getMessages(chatIdRef.current, nextPage);

      if (response.success && response.data?.messages) {
        const newMessages = response.data.messages;
        setMessages((prev) => [...newMessages, ...prev]);
        setHasMoreMessages(newMessages.length > 0);
        currentPageRef.current = nextPage;
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error(getTranslatedText("Error loading more messages"), err);
      setHasMoreMessages(false);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreMessages]);

  // Initialize on mount
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate("/login");
      return;
    }

    // Prevent body scrolling
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalHeight = document.body.style.height;

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.height = "100%";
    document.body.style.width = "100%";
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.height = "100%";

    initializeChat();

    // Cleanup
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.height = originalHeight;
      document.body.style.width = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.height = "";

      // Leave chat room and disconnect socket
      if (chatIdRef.current) {
        socketClient.leaveChat(chatIdRef.current);
      }
      socketClient.offMessage();
      socketClient.offTyping();
      socketClient.offMessagesRead();
    };
  }, [isAuthenticated, user, navigate, initializeChat]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle scroll to load more messages
  const handleScroll = useCallback(
    (e) => {
      const container = e.target;
      if (container.scrollTop === 0 && hasMoreMessages && !loadingMore) {
        const previousScrollHeight = container.scrollHeight;
        loadMoreMessages().then(() => {
          // Maintain scroll position after loading
          setTimeout(() => {
            container.scrollTop = container.scrollHeight - previousScrollHeight;
          }, 0);
        });
      }
    },
    [hasMoreMessages, loadingMore, loadMoreMessages]
  );

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!chatIdRef.current) return;

    // Send typing indicator
    socketClient.sendTyping(chatIdRef.current, true);
    setIsTyping(true);

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketClient.sendTyping(chatIdRef.current, false);
      setIsTyping(false);
    }, 2000);
  }, []);

  // Send message
  const handleSendMessage = async () => {
    if (inputMessage.trim() === "" || !chatIdRef.current || sending) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketClient.sendTyping(chatIdRef.current, false);
    setIsTyping(false);

    try {
      // Optimistically add message to UI
      const tempMessage = {
        _id: `temp_${Date.now()}`,
        content: messageText,
        sender: {
          _id: user._id,
          name: user.name,
          profileImage: user.profileImage,
        },
        senderId: {
          _id: user._id,
          name: user.name,
          profileImage: user.profileImage,
        },
        createdAt: new Date(),
        readBy: [],
      };
      setMessages((prev) => [...prev, tempMessage]);

      // Send via API (which also triggers socket broadcast)
      const response = await chatAPI.sendMessage(
        chatIdRef.current,
        messageText
      );

      if (response.success && response.data?.message) {
        // Replace temp message with real message
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempMessage._id ? response.data.message : msg
          )
        );

        // Mark as read
        await chatAPI.markAsRead(chatIdRef.current);
      } else {
        // Remove temp message on error
        setMessages((prev) =>
          prev.filter((msg) => msg._id !== tempMessage._id)
        );
        throw new Error("Failed to send message");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send message");
      // Remove temp message
      setMessages((prev) =>
        prev.filter((msg) => !msg._id?.startsWith("temp_"))
      );
    } finally {
      setSending(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else {
      handleTyping();
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
    return messageDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle window resize for mobile browsers
  useEffect(() => {
    const handleResize = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      document.documentElement.style.removeProperty("--vh");
    };
  }, []);

  // Get other user info (scrapper or user)
  const getOtherUser = () => {
    if (!chat) return null;
    const isUser = user.role === "user";
    return isUser ? chat.scrapper : chat.user;
  };

  const otherUser = getOtherUser();

  if (loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: "#f4ebe2" }}>
        <div className="text-center">
          <FaSpinner
            className="animate-spin mx-auto mb-4"
            style={{ color: "#64946e", fontSize: "2rem" }}
          />
          <p style={{ color: "#2d3748" }}>Loading chat...</p>
        </div>
      </div>
    );
  }

  if (error && !chat) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ backgroundColor: "#f4ebe2" }}>
        <div className="text-center max-w-md">
          <p className="mb-4 text-lg font-medium" style={{ color: "#2d3748" }}>
            {getTranslatedText(
              error === "Order ID or Chat ID is required"
                ? "Chat not found"
                : error
            )}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 rounded-xl font-semibold text-white shadow-md transition-transform active:scale-95"
            style={{ backgroundColor: "#64946e" }}>
            {getTranslatedText("Go Back")}
          </button>
        </div>
      </div>
    );
  }

  // If chat is missing but no error (e.g. initialization phase), show loading or empty state
  if (!chat && !loading) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ backgroundColor: "#f4ebe2" }}>
        <div className="text-center">
          <p className="text-lg text-gray-600">
            {getTranslatedText("Initializing Chat...")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 w-full flex flex-col"
      style={{
        backgroundColor: "#f4ebe2",
        height: "calc(var(--vh, 1vh) * 100)",
        width: "100vw",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        touchAction: "none",
      }}>
      {/* Fixed Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b z-10 flex-shrink-0"
        style={{
          borderColor: "rgba(100, 148, 110, 0.2)",
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
        }}>
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors active:opacity-70"
          style={{ backgroundColor: "rgba(100, 148, 110, 0.1)" }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: "#2d3748" }}>
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {otherUser && (
          <div className="flex items-center gap-3 flex-1 px-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold relative"
              style={{
                backgroundColor: "rgba(100, 148, 110, 0.15)",
                color: "#64946e",
              }}>
              {otherUser.name
                ?.split(" ")
                .map((n) => n[0])
                .join("") || "U"}
              {/* Online indicator - TODO: Implement real online status */}
              <div
                className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                style={{
                  backgroundColor: "#10b981",
                  borderColor: "#ffffff",
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-base font-semibold truncate"
                style={{ color: "#2d3748" }}>
                {getTranslatedText(otherUser.name) ||
                  getTranslatedText("Unknown User")}
              </h3>
              <div className="flex items-center gap-1">
                {otherUserTyping && (
                  <span className="text-xs italic" style={{ color: "#718096" }}>
                    {getTranslatedText("is typing...")}
                  </span>
                )}
                {!otherUserTyping && (
                  <span className="text-xs" style={{ color: "#10b981" }}>
                    {getTranslatedText("• Online")}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            if (otherUser?.phone) {
              window.location.href = `tel:${otherUser.phone}`;
            }
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors active:opacity-70"
          style={{ backgroundColor: "rgba(100, 148, 110, 0.1)" }}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            style={{ color: "#64946e" }}>
            <path
              d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Scrollable Messages Area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{
          backgroundColor: "#f4ebe2",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-y",
          overscrollBehavior: "contain",
        }}>
        {loadingMore && (
          <div className="text-center py-2">
            <FaSpinner
              className="animate-spin mx-auto"
              style={{ color: "#64946e" }}
            />
          </div>
        )}

        <div className="space-y-3 pb-2">
          {messages.map((message) => {
            const isUserMessage =
              message.senderId?._id === user._id ||
              message.senderType === "user";
            const senderName = getTranslatedText(
              message.senderId?.name || "Unknown"
            );
            const senderInitials =
              getTranslatedText(senderName)
                .split(" ")
                .map((n) => n[0])
                .join("") || "U";

            return (
              <motion.div
                key={message._id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex ${
                  isUserMessage ? "justify-end" : "justify-start"
                }`}>
                <div
                  className={`flex items-end gap-2 max-w-[85%] ${
                    isUserMessage ? "flex-row-reverse" : "flex-row"
                  }`}>
                  {/* Avatar */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{
                      backgroundColor: isUserMessage
                        ? "rgba(100, 148, 110, 0.2)"
                        : "rgba(100, 148, 110, 0.15)",
                      color: "#64946e",
                    }}>
                    {senderInitials}
                  </div>

                  {/* Message Bubble */}
                  <div className="flex flex-col">
                    <div
                      className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                        isUserMessage ? "rounded-tr-md" : "rounded-tl-md"
                      }`}
                      style={{
                        backgroundColor: isUserMessage ? "#64946e" : "#ffffff",
                        color: isUserMessage ? "#ffffff" : "#2d3748",
                        boxShadow: isUserMessage
                          ? "0 2px 8px rgba(100, 148, 110, 0.2)"
                          : "0 1px 3px rgba(0,0,0,0.1)",
                      }}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {getTranslatedText(message.content) || message.message}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] mt-1 px-1 ${
                        isUserMessage ? "text-right" : "text-left"
                      }`}
                      style={{ color: "#9ca3af" }}>
                      {formatTime(message.createdAt)}
                      {isUserMessage && message.read && (
                        <span className="ml-1">✓✓</span>
                      )}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Input Area */}
      <div
        className="px-4 border-t flex-shrink-0 z-10"
        style={{
          borderColor: "rgba(100, 148, 110, 0.2)",
          backgroundColor: "#ffffff",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.05)",
          paddingTop: "12px",
          paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        }}>
        {error && (
          <div
            className="mb-2 p-2 rounded-lg text-xs"
            style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}>
            {error}
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => {
                setInputMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              disabled={sending}
              className="w-full py-2.5 px-4 rounded-2xl border-2 focus:outline-none resize-none text-sm disabled:opacity-50"
              style={{
                borderColor: inputMessage
                  ? "#64946e"
                  : "rgba(100, 148, 110, 0.3)",
                color: "#2d3748",
                backgroundColor: "#f9fafb",
                minHeight: "44px",
                maxHeight: "100px",
                transition: "all 0.2s ease",
              }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(
                  e.target.scrollHeight,
                  100
                )}px`;
              }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSendMessage}
            disabled={inputMessage.trim() === "" || sending}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 disabled:opacity-50"
            style={{
              backgroundColor:
                inputMessage.trim() && !sending
                  ? "#64946e"
                  : "rgba(100, 148, 110, 0.3)",
              color: "#ffffff",
              boxShadow:
                inputMessage.trim() && !sending
                  ? "0 4px 12px rgba(100, 148, 110, 0.3)"
                  : "none",
            }}>
            {sending ? (
              <FaSpinner className="animate-spin" />
            ) : inputMessage.trim() ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            ) : (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatPage;

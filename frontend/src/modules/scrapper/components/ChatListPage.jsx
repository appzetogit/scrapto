import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { chatAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import { FaComments, FaSpinner, FaSearch } from 'react-icons/fa';

const ChatListPage = () => {
  const staticTexts = [
    "Messages",
    "Search chats...",
    "Active",
    "Archived",
    "No chats found",
    "Try a different search term",
    "Start a conversation from an active order",
    "Loading chats...",
    "Failed to load chats",
    "Just now",
    "{minutes}m ago",
    "{hours}h ago",
    "{days}d ago",
    "Unknown User",
    "No messages yet",
    "Order:",
    "U"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('active'); // active, archived

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'scrapper') {
      navigate('/scrapper/login');
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
        setError(getTranslatedText('Failed to load chats'));
        setChats([]);
      }
    } catch (err) {
      console.error('Error loading chats:', err);
      setError(err.message || getTranslatedText('Failed to load chats'));
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const messageDate = new Date(date);
    const diff = now - messageDate;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return getTranslatedText('Just now');
    if (minutes < 60) return getTranslatedText("{minutes}m ago", { minutes });
    if (minutes < 1440) return getTranslatedText("{hours}h ago", { hours: Math.floor(minutes / 60) });
    const days = Math.floor(minutes / 1440);
    if (days < 7) return getTranslatedText("{days}d ago", { days });
    return messageDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getOtherUser = (chat) => {
    if (!chat) return null;
    return chat.user; // For scrapper, other user is always the user who created the order
  };

  const getUnreadCount = (chat) => {
    if (!chat) return 0;
    return chat.unreadCount?.scrapper || 0;
  };

  const filteredChats = chats.filter(chat => {
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <FaSpinner className="animate-spin mx-auto mb-4 text-3xl text-emerald-500" />
          <p className="text-white">{getTranslatedText("Loading chats...")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-gray-900 to-black">
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {getTranslatedText("Messages")}
          </h1>
        </div>

        {/* Search and Filter */}
        <div className="space-y-3">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={getTranslatedText("Search chats...")}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 border-white/10 bg-zinc-900 text-white focus:border-emerald-500 placeholder-gray-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${filter === 'active' ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'
                }`}
            >
              {getTranslatedText("Active")}
            </button>
            <button
              onClick={() => setFilter('archived')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${filter === 'archived' ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-gray-400 hover:bg-zinc-800'
                }`}
            >
              {getTranslatedText("Archived")}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-xl text-sm bg-red-100 text-red-600">
            {error}
          </div>
        )}

        {/* Chats List */}
        {filteredChats.length === 0 ? (
          <div className="text-center py-12">
            <FaComments className="mx-auto mb-4 text-gray-600 text-5xl" />
            <p className="text-lg font-semibold mb-2 text-white">
              {getTranslatedText("No chats found")}
            </p>
            <p className="text-sm text-gray-400">
              {searchQuery ? getTranslatedText('Try a different search term') : getTranslatedText('Start a conversation from an active order')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredChats.map((chat) => {
              const otherUser = getOtherUser(chat);
              const unreadCount = getUnreadCount(chat);
              const otherUserName = otherUser?.name || getTranslatedText('Unknown User');
              const otherUserInitials = otherUserName.split(' ').map(n => n[0]).join('') || getTranslatedText('U');

              return (
                <motion.div
                  key={chat._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/scrapper/chat/${chat._id}`, {
                    state: { orderId: chat.orderId?._id || chat.orderId }
                  })}
                  className="rounded-2xl p-4 shadow-lg cursor-pointer transition-all bg-black border border-white/10 hover:border-emerald-500/50"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold relative flex-shrink-0 bg-emerald-900/30 text-emerald-400"
                    >
                      {otherUserInitials}
                      {unreadCount > 0 && (
                        <div
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white bg-red-500"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-semibold truncate text-white">
                          {otherUserName}
                        </h3>
                        <span className="text-xs flex-shrink-0 ml-2 text-gray-400">
                          {formatTime(chat.lastMessageAt)}
                        </span>
                      </div>
                      <p className="text-sm truncate text-gray-400">
                        {chat.lastMessage || getTranslatedText('No messages yet')}
                      </p>
                      {chat.orderId && (
                        <p className="text-xs mt-1 text-gray-500">
                          {getTranslatedText("Order:")} {getTranslatedText(chat.orderId.status) || getTranslatedText('Active')}
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


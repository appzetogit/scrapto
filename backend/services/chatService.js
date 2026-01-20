import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import logger from '../utils/logger.js';

/**
 * Get or create a chat for an order
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID (user or scrapper)
 * @param {string} userType - 'user' or 'scrapper'
 * @returns {Promise<Object>} Chat object
 */
export const getOrCreateChat = async (orderId, userId, userType) => {
  try {
    // Check if chat already exists
    let chat = await Chat.findOne({ orderId })
      .populate('user', 'name phone email')
      .populate('scrapper', 'name phone email');

    if (chat) {
      return chat;
    }

    // Get order to find participants
    const order = await Order.findById(orderId)
      .populate('user', 'name phone email')
      .populate('scrapper', 'name phone email');

    if (!order) {
      throw new Error('Order not found');
    }

    // Verify user has access to this order
    if (userType === 'user' && order.user._id.toString() !== userId) {
      throw new Error('Unauthorized access to order');
    }

    if (userType === 'scrapper' && order.scrapper && order.scrapper._id.toString() !== userId) {
      throw new Error('Unauthorized access to order');
    }

    // Check if scrapper is assigned
    if (!order.scrapper) {
      throw new Error('No scrapper assigned to this order yet');
    }

    // Create new chat
    chat = await Chat.create({
      orderId: order._id,
      user: order.user._id,
      scrapper: order.scrapper._id,
      participants: [
        {
          userId: order.user._id,
          userType: 'user',
          role: 'user'
        },
        {
          userId: order.scrapper._id,
          userType: 'scrapper',
          role: 'scrapper'
        }
      ],
      status: 'active'
    });

    // Populate and return
    chat = await Chat.findById(chat._id)
      .populate('user', 'name phone email')
      .populate('scrapper', 'name phone email');

    logger.info(`Chat created for order: ${orderId}`);
    return chat;
  } catch (error) {
    logger.error('Error in getOrCreateChat:', error);
    throw error;
  }
};

/**
 * Get chat by ID with messages
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID
 * @param {string} userType - 'user' or 'scrapper'
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Chat with messages
 */
export const getChatById = async (chatId, userId, userType, options = {}) => {
  try {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    // Get chat
    const chat = await Chat.findOne({
      _id: chatId,
      $or: [
        { user: userId, 'participants.userType': userType === 'user' ? 'user' : 'scrapper' },
        { scrapper: userId, 'participants.userType': userType === 'scrapper' ? 'scrapper' : 'user' }
      ]
    })
      .populate('user', 'name phone email profileImage')
      .populate('scrapper', 'name phone email profilePic');

    if (!chat) {
      throw new Error('Chat not found or unauthorized');
    }

    // Get messages (latest first, then reverse for display)
    const messages = await Message.find({ chatId: chat._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('senderId', 'name phone email profileImage profilePic');

    // Reverse to show oldest first
    messages.reverse();

    // Get total message count
    const totalMessages = await Message.countDocuments({ chatId: chat._id });

    return {
      chat,
      messages,
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit),
        hasMore: skip + messages.length < totalMessages
      }
    };
  } catch (error) {
    logger.error('Error in getChatById:', error);
    throw error;
  }
};

/**
 * Get messages for a chat
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID
 * @param {string} userType - 'user' or 'scrapper'
 * @param {Object} options - Pagination options
 * @returns {Promise<Object>} Messages with pagination
 */
export const getChatMessages = async (chatId, userId, userType, options = {}) => {
  try {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    // Verify chat exists and user has access
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Verify user is participant
    const isParticipant = chat.participants.some(
      p => p.userId.toString() === userId.toString()
    );

    if (!isParticipant) {
      throw new Error('Unauthorized: Not a participant in this chat');
    }

    // Get messages (latest first, then reverse for display)
    const messages = await Message.find({ chatId: chat._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('senderId', 'name phone email profileImage profilePic');

    // Reverse to show oldest first
    messages.reverse();

    // Get total message count
    const totalMessages = await Message.countDocuments({ chatId: chat._id });

    return {
      messages,
      pagination: {
        page,
        limit,
        total: totalMessages,
        pages: Math.ceil(totalMessages / limit),
        hasMore: skip + messages.length < totalMessages
      }
    };
  } catch (error) {
    logger.error('Error in getChatMessages:', error);
    throw error;
  }
};

/**
 * Get all chats for a user/scrapper
 * @param {string} userId - User ID
 * @param {string} userType - 'user' or 'scrapper'
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of chats
 */
export const getMyChats = async (userId, userType, options = {}) => {
  try {
    const { status = 'active', page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    // Build query based on user type
    const query = {
      status,
      $or: [
        { user: userId },
        { scrapper: userId }
      ]
    };

    const chats = await Chat.find(query)
      .populate('user', 'name phone email profileImage')
      .populate('scrapper', 'name phone email profilePic')
      .populate('orderId', 'status totalAmount scrapItems')
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await Chat.countDocuments(query);

    return {
      chats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error('Error in getMyChats:', error);
    throw error;
  }
};

/**
 * Send a message in a chat
 * @param {string} chatId - Chat ID
 * @param {string} senderId - Sender user ID
 * @param {string} senderType - 'user' or 'scrapper'
 * @param {string} message - Message text
 * @param {Array} attachments - Array of attachments
 * @returns {Promise<Object>} Created message
 */
export const sendMessage = async (chatId, senderId, senderType, message, attachments = []) => {
  try {
    // Verify chat exists and user has access
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Verify sender is participant
    const isParticipant = chat.participants.some(
      p => p.userId.toString() === senderId.toString()
    );

    if (!isParticipant) {
      throw new Error('Unauthorized: Not a participant in this chat');
    }

    // Determine message type
    let messageType = 'text';
    if (attachments.length > 0) {
      const hasImage = attachments.some(a => a.type === 'image');
      messageType = hasImage ? 'image' : 'text';
    }

    // Create message
    const newMessage = await Message.create({
      chatId: chat._id,
      senderId,
      senderType,
      message: message.trim(),
      messageType,
      attachments,
      delivered: true // Assume delivered when created via API
    });

    // Update chat's last message
    await chat.updateLastMessage(message);

    // Increment unread count for the other participant
    const otherUserType = senderType === 'user' ? 'scrapper' : 'user';
    await chat.incrementUnread(otherUserType);

    // Populate and return
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'name phone email profileImage profilePic');

    logger.info(`Message sent in chat: ${chatId} by ${senderType}: ${senderId}`);
    return populatedMessage;
  } catch (error) {
    logger.error('Error in sendMessage:', error);
    throw error;
  }
};

/**
 * Mark messages as read
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID
 * @param {string} userType - 'user' or 'scrapper'
 * @returns {Promise<Object>} Updated chat
 */
export const markAsRead = async (chatId, userId, userType) => {
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Verify user is participant
    const isParticipant = chat.participants.some(
      p => p.userId.toString() === userId.toString()
    );

    if (!isParticipant) {
      throw new Error('Unauthorized: Not a participant in this chat');
    }

    // Mark all unread messages as read
    await Message.updateMany(
      {
        chatId: chat._id,
        senderId: { $ne: userId }, // Messages not sent by this user
        read: false
      },
      {
        $push: {
          readBy: {
            userId,
            readAt: new Date()
          }
        },
        $set: {
          read: true
        }
      }
    );

    // Reset unread count
    await chat.resetUnread(userType);

    logger.info(`Messages marked as read in chat: ${chatId} by ${userType}: ${userId}`);
    return chat;
  } catch (error) {
    logger.error('Error in markAsRead:', error);
    throw error;
  }
};

/**
 * Archive a chat
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated chat
 */
export const archiveChat = async (chatId, userId) => {
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new Error('Chat not found');
    }

    // Verify user is participant
    const isParticipant = chat.participants.some(
      p => p.userId.toString() === userId.toString()
    );

    if (!isParticipant) {
      throw new Error('Unauthorized: Not a participant in this chat');
    }

    chat.status = 'archived';
    await chat.save();

    logger.info(`Chat archived: ${chatId} by user: ${userId}`);
    return chat;
  } catch (error) {
    logger.error('Error in archiveChat:', error);
    throw error;
  }
};

/**
 * Get unread message count for a user
 * @param {string} userId - User ID
 * @param {string} userType - 'user' or 'scrapper'
 * @returns {Promise<Number>} Unread count
 */
export const getUnreadCount = async (userId, userType) => {
  try {
    const chats = await Chat.find({
      $or: [
        { user: userId },
        { scrapper: userId }
      ],
      status: 'active'
    });

    let totalUnread = 0;
    chats.forEach(chat => {
      if (userType === 'user') {
        totalUnread += chat.unreadCount.user || 0;
      } else {
        totalUnread += chat.unreadCount.scrapper || 0;
      }
    });

    return totalUnread;
  } catch (error) {
    logger.error('Error in getUnreadCount:', error);
    throw error;
  }
};


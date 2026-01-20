import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import * as chatService from '../services/chatService.js';
import { broadcastToChat, notifyUser } from '../services/socketService.js';
import logger from '../utils/logger.js';

// @desc    Get all chats for current user/scrapper
// @route   GET /api/chats
// @access  Private
export const getMyChats = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.role === 'scrapper' ? 'scrapper' : 'user';
  
  const { status = 'active', page = 1, limit = 20 } = req.query;

  const result = await chatService.getMyChats(userId, userType, {
    status,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  sendSuccess(res, 'Chats retrieved successfully', result);
});

// @desc    Get messages for a chat
// @route   GET /api/chats/:chatId/messages
// @access  Private
export const getChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;
  const userType = req.user.role === 'scrapper' ? 'scrapper' : 'user';
  
  const { page = 1, limit = 50 } = req.query;

  const result = await chatService.getChatMessages(chatId, userId, userType, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  sendSuccess(res, 'Messages retrieved successfully', result);
});

// @desc    Get chat by ID with messages
// @route   GET /api/chats/:chatId
// @access  Private
export const getChatById = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;
  const userType = req.user.role === 'scrapper' ? 'scrapper' : 'user';
  
  const { page = 1, limit = 50 } = req.query;

  const result = await chatService.getChatById(chatId, userId, userType, {
    page: parseInt(page),
    limit: parseInt(limit)
  });

  sendSuccess(res, 'Chat retrieved successfully', result);
});

// @desc    Get or create chat for an order (GET)
// @route   GET /api/chats/order/:orderId
// @access  Private
export const getOrCreateChatForOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const userType = req.user.role === 'scrapper' ? 'scrapper' : 'user';

  if (!orderId) {
    return sendError(res, 'Order ID is required', 400);
  }

  const chat = await chatService.getOrCreateChat(orderId, userId, userType);

  sendSuccess(res, 'Chat retrieved/created successfully', { chat });
});

// @desc    Create or get chat for an order (POST)
// @route   POST /api/chats
// @access  Private
export const createChat = asyncHandler(async (req, res) => {
  const { orderId } = req.body;
  const userId = req.user.id;
  const userType = req.user.role === 'scrapper' ? 'scrapper' : 'user';

  if (!orderId) {
    return sendError(res, 'Order ID is required', 400);
  }

  const chat = await chatService.getOrCreateChat(orderId, userId, userType);

  sendSuccess(res, 'Chat retrieved/created successfully', { chat }, 201);
});

// @desc    Send message in chat
// @route   POST /api/chats/:chatId/messages
// @access  Private
export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  // Support both 'message' and 'content' field names
  const message = req.body.message || req.body.content;
  const attachments = req.body.attachments || [];
  const userId = req.user.id;
  const userType = req.user.role === 'scrapper' ? 'scrapper' : 'user';

  if (!message || message.trim() === '') {
    return sendError(res, 'Message is required', 400);
  }

  if (message.length > 5000) {
    return sendError(res, 'Message cannot be more than 5000 characters', 400);
  }

  const newMessage = await chatService.sendMessage(chatId, userId, userType, message, attachments);

  // Broadcast message via Socket.io
  try {
    broadcastToChat(chatId, 'new_message', {
      message: newMessage
    });
  } catch (error) {
    logger.warn('Socket.io broadcast failed, but message saved:', error);
  }

  sendSuccess(res, 'Message sent successfully', { message: newMessage }, 201);
});

// @desc    Mark messages as read
// @route   PUT /api/chats/:chatId/read
// @access  Private
export const markAsRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;
  const userType = req.user.role === 'scrapper' ? 'scrapper' : 'user';

  const chat = await chatService.markAsRead(chatId, userId, userType);

  // Notify other participant via Socket.io
  try {
    broadcastToChat(chatId, 'messages_read', {
      userId,
      chatId
    });
  } catch (error) {
    logger.warn('Socket.io broadcast failed:', error);
  }

  sendSuccess(res, 'Messages marked as read', { chat });
});

// @desc    Archive chat
// @route   PUT /api/chats/:chatId/archive
// @access  Private
export const archiveChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user.id;

  const chat = await chatService.archiveChat(chatId, userId);

  sendSuccess(res, 'Chat archived successfully', { chat });
});

// @desc    Get unread message count
// @route   GET /api/chats/unread-count
// @access  Private
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userType = req.user.role === 'scrapper' ? 'scrapper' : 'user';

  const count = await chatService.getUnreadCount(userId, userType);

  sendSuccess(res, 'Unread count retrieved', { unreadCount: count });
});


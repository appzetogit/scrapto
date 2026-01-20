import express from 'express';
import {
  getMyChats,
  getChatById,
  getChatMessages,
  createChat,
  getOrCreateChatForOrder,
  sendMessage,
  markAsRead,
  archiveChat,
  getUnreadCount
} from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validator.js';
import {
  createChatValidator,
  sendMessageValidator
} from '../validators/chatValidator.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Get all chats for current user/scrapper
router.get('/my-chats', getMyChats);
router.get('/', getMyChats); // Alias for backward compatibility

// Get or create chat for an order (GET method)
router.get('/order/:orderId', getOrCreateChatForOrder);

// Create or get chat for an order (POST method)
router.post('/', createChatValidator, validate, createChat);

// Get messages for a chat (must be before /:chatId route)
router.get('/:chatId/messages', getChatMessages);

// Get chat by ID with messages
router.get('/:chatId', getChatById);

// Send message in chat
router.post('/:chatId/messages', sendMessageValidator, validate, sendMessage);

// Mark messages as read (support both PUT and POST)
router.put('/:chatId/read', markAsRead);
router.post('/:chatId/read', markAsRead);

// Archive chat
router.put('/:chatId/archive', archiveChat);

export default router;


import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { sendMessage, markAsRead } from './chatService.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import logger from '../utils/logger.js';

let io = null;

/**
 * Initialize Socket.io server
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.io instance
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'scrapto-dev-secret-key-change-in-production-2024');
      socket.userId = decoded.id;
      socket.userType = decoded.role === 'scrapper' ? 'scrapper' : decoded.role === 'admin' ? 'admin' : 'user';
      socket.userRole = decoded.role;

      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.userId} (${socket.userType})`);

    // Join user's personal room for notifications
    socket.join(`user_${socket.userId}`);

    // Handle joining a chat room (support both event names)
    socket.on('joinChat', async (chatId) => {
      // Handle both string and object formats
      const actualChatId = typeof chatId === 'string' ? chatId : chatId?.chatId;
      await handleJoinChat(socket, actualChatId);
    });

    socket.on('join_chat', async ({ chatId }) => {
      await handleJoinChat(socket, chatId);
    });

    const handleJoinChat = async (socket, chatId) => {
      try {
        // Verify user has access to this chat
        const chat = await Chat.findById(chatId);
        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        // Check if user is participant
        const isParticipant = chat.participants.some(
          p => p.userId.toString() === socket.userId.toString()
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'Unauthorized access to chat' });
          return;
        }

        // Join chat room
        socket.join(`chat_${chatId}`);
        logger.info(`User ${socket.userId} joined chat: ${chatId}`);

        // Emit confirmation
        socket.emit('joined_chat', { chatId });
      } catch (error) {
        logger.error('Error joining chat:', error);
        socket.emit('error', { message: 'Error joining chat' });
      }
    };

    // Handle leaving a chat room (support both event names)
    socket.on('leaveChat', (chatId) => {
      const actualChatId = typeof chatId === 'string' ? chatId : chatId?.chatId;
      socket.leave(`chat_${actualChatId}`);
      logger.info(`User ${socket.userId} left chat: ${actualChatId}`);
    });

    socket.on('leave_chat', ({ chatId }) => {
      socket.leave(`chat_${chatId}`);
      logger.info(`User ${socket.userId} left chat: ${chatId}`);
    });

    // Handle sending a message
    socket.on('send_message', async ({ chatId, message, attachments = [] }) => {
      try {
        // Send message via service
        const newMessage = await sendMessage(
          chatId,
          socket.userId,
          socket.userType,
          message,
          attachments
        );

        // Get chat to find other participant
        const chat = await Chat.findById(chatId)
          .populate('user', 'name phone email')
          .populate('scrapper', 'name phone email');

        if (!chat) {
          socket.emit('error', { message: 'Chat not found' });
          return;
        }

        // Emit to all users in the chat room (support both event names)
        const messageData = newMessage;
        io.to(`chat_${chatId}`).emit('newMessage', messageData);
        io.to(`chat_${chatId}`).emit('new_message', {
          message: newMessage,
          chat: chat
        });

        // Notify the other participant if they're not in the chat room
        const otherUserId = socket.userId === chat.user._id.toString()
          ? chat.scrapper._id.toString()
          : chat.user._id.toString();

        // Check if other user is online
        const otherUserSockets = await io.in(`user_${otherUserId}`).fetchSockets();
        if (otherUserSockets.length === 0) {
          // User is offline, they'll get notification when they come online
          // You can integrate with notification service here
        }

        logger.info(`Message sent via socket in chat: ${chatId}`);
      } catch (error) {
        logger.error('Error sending message via socket:', error);
        socket.emit('error', { message: error.message || 'Error sending message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', ({ chatId, isTyping }) => {
      // Broadcast typing status to other users in chat
      socket.to(`chat_${chatId}`).emit('typing', {
        userId: socket.userId,
        userType: socket.userType,
        isTyping,
        chatId
      });
    });

    // Handle read receipt
    socket.on('mark_read', async ({ chatId }) => {
      try {
        await markAsRead(chatId, socket.userId, socket.userType);

        // Notify other participant that messages were read
        socket.to(`chat_${chatId}`).emit('messages_read', {
          userId: socket.userId,
          chatId
        });

        logger.info(`Messages marked as read via socket in chat: ${chatId}`);
      } catch (error) {
        logger.error('Error marking messages as read:', error);
        socket.emit('error', { message: 'Error marking messages as read' });
      }
    });

    // Handle Location Tracking
    socket.on('join_tracking', ({ orderId }) => {
      socket.join(`tracking_${orderId}`);
      logger.info(`User ${socket.userId} joined tracking for order: ${orderId}`);
    });

    socket.on('leave_tracking', ({ orderId }) => {
      socket.leave(`tracking_${orderId}`);
      logger.info(`User ${socket.userId} left tracking for order: ${orderId}`);
    });

    socket.on('scrapper_location_update', (data) => {
      // data: { orderId, location: {lat, lng}, heading }
      // Broadcast to everyone in the tracking room EXCEPT the sender (scrapper)
      socket.to(`tracking_${data.orderId}`).emit('scrapper_location_update', data);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.userId}`);
    });
  });

  logger.info('Socket.io server initialized');
  return io;
};

/**
 * Get Socket.io instance
 * @returns {Object} Socket.io instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

/**
 * Broadcast message to a specific chat room
 * @param {string} chatId - Chat ID
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
export const broadcastToChat = (chatId, event, data) => {
  if (!io) {
    logger.warn('Socket.io not initialized, cannot broadcast');
    return;
  }
  io.to(`chat_${chatId}`).emit(event, data);
};

/**
 * Send notification to a specific user
 * @param {string} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Data to send
 */
export const notifyUser = (userId, event, data) => {
  if (!io) {
    logger.warn('Socket.io not initialized, cannot notify user');
    return;
  }
  io.to(`user_${userId}`).emit(event, data);
};


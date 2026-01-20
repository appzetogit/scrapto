import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../../config/apiConfig.js';

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to Socket.io server
   * @param {string} token - JWT token for authentication
   * @returns {Object} Socket instance
   */
  connect(token) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return this.socket;
    }

    // Disconnect existing connection if any
    if (this.socket) {
      this.socket.disconnect();
    }

    // Socket.io needs base URL without /api
    const socketUrl = API_BASE_URL.replace('/api', '') || 'http://localhost:7000';

    this.socket = io(socketUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected = false;
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('✅ Socket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('🔄 Socket reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket reconnection failed');
      this.isConnected = false;
    });

    return this.socket;
  }

  /**
   * Disconnect from Socket.io server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
      console.log('Socket disconnected');
    }
  }

  /**
   * Join a chat room
   * @param {string} chatId - Chat ID
   */
  joinChat(chatId) {
    if (this.socket) {
      this.socket.emit('joinChat', chatId);
      console.log('Joined chat:', chatId);
    } else {
      console.warn('Socket not initialized, cannot join chat');
    }
  }

  /**
   * Leave a chat room
   * @param {string} chatId - Chat ID
   */
  leaveChat(chatId) {
    if (this.socket) {
      this.socket.emit('leaveChat', chatId);
      console.log('Left chat:', chatId);
    }
  }

  /**
   * Send a message via socket
   * @param {string} chatId - Chat ID
   * @param {string} message - Message text
   * @param {Array} attachments - Array of attachments
   */
  sendMessage(chatId, message, attachments = []) {
    if (this.socket) {
      this.socket.emit('send_message', { chatId, message, attachments });
    } else {
      console.warn('Socket not initialized, message will be sent via API');
    }
  }

  /**
   * Listen for new messages
   * @param {Function} callback - Callback function
   */
  onMessage(callback) {
    if (this.socket) {
      const listener = (data) => {
        callback(data);
      };
      this.socket.on('newMessage', listener);
      this.listeners.set('newMessage', listener);
    }
  }

  /**
   * Remove message listener
   */
  offMessage() {
    if (this.socket) {
      this.socket.off('newMessage');
      this.listeners.delete('newMessage');
    }
  }

  /**
   * Listen for typing indicators
   * @param {Function} callback - Callback function
   */
  onTyping(callback) {
    if (this.socket) {
      const listener = (data) => {
        callback(data);
      };
      this.socket.on('typing', listener);
      this.listeners.set('typing', listener);
    }
  }

  /**
   * Remove typing listener
   */
  offTyping() {
    if (this.socket) {
      this.socket.off('typing');
      this.listeners.delete('typing');
    }
  }

  /**
   * Send typing indicator
   * @param {string} chatId - Chat ID
   * @param {boolean} isTyping - Whether user is typing
   */
  sendTyping(chatId, isTyping) {
    if (this.socket) {
      this.socket.emit('typing', { chatId, isTyping });
    }
  }

  /**
   * Mark messages as read via socket
   * @param {string} chatId - Chat ID
   */
  markAsRead(chatId) {
    if (this.socket) {
      this.socket.emit('mark_read', { chatId });
    }
  }

  /**
   * Listen for read receipts
   * @param {Function} callback - Callback function
   */
  onMessagesRead(callback) {
    if (this.socket) {
      const listener = (data) => {
        callback(data);
      };
      this.socket.on('messages_read', listener);
      this.listeners.set('messages_read', listener);
    }
  }

  /**
   * Remove read receipt listener
   */
  offMessagesRead() {
    if (this.socket) {
      this.socket.off('messages_read');
      this.listeners.delete('messages_read');
    }
  }

  /**
   * Listen for chat joined confirmation
   * @param {Function} callback - Callback function
   */
  onJoinedChat(callback) {
    if (this.socket) {
      this.socket.on('joined_chat', callback);
    }
  }

  /**
   * Listen for errors
   * @param {Function} callback - Callback function
   */
  onError(callback) {
    if (this.socket) {
      this.socket.on('error', callback);
    }
  }

  /**
   * Join a tracking room for an order
   * @param {string} orderId - Order ID
   */
  joinTracking(orderId) {
    if (this.socket) {
      this.socket.emit('join_tracking', { orderId });
      console.log('Joined tracking:', orderId);
    }
  }

  /**
   * Leave a tracking room
   * @param {string} orderId - Order ID
   */
  leaveTracking(orderId) {
    if (this.socket) {
      this.socket.emit('leave_tracking', { orderId });
      console.log('Left tracking:', orderId);
    }
  }

  /**
   * Send location update
   * @param {Object} data - Location data { orderId, location: {lat, lng}, heading }
   */
  sendLocationUpdate(data) {
    if (this.socket) {
      this.socket.emit('scrapper_location_update', data);
    }
  }

  /**
   * Listen for location updates
   * @param {Function} callback - Callback function
   */
  onLocationUpdate(callback) {
    if (this.socket) {
      const listener = (data) => {
        callback(data);
      };
      this.socket.on('scrapper_location_update', listener);
      this.listeners.set('scrapper_location_update', listener);
    }
  }

  /**
   * Remove location update listener
   */
  offLocationUpdate() {
    if (this.socket) {
      this.socket.off('scrapper_location_update');
      this.listeners.delete('scrapper_location_update');
    }
  }

  /**
   * Get connection status
   * @returns {boolean} Connection status
   */
  getConnectionStatus() {
    return this.isConnected && this.socket?.connected;
  }
}

// Export singleton instance
const socketClient = new SocketClient();
export default socketClient;


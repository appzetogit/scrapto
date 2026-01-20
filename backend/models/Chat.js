import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  scrapper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scrapper',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'closed'],
    default: 'active',
    index: true
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  lastMessage: {
    type: String,
    default: ''
  },
  unreadCount: {
    user: {
      type: Number,
      default: 0
    },
    scrapper: {
      type: Number,
      default: 0
    }
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userType: {
      type: String,
      enum: ['user', 'scrapper'],
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'scrapper'],
      required: true
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
chatSchema.index({ user: 1, lastMessageAt: -1 });
chatSchema.index({ scrapper: 1, lastMessageAt: -1 });
chatSchema.index({ orderId: 1 }, { unique: true });
chatSchema.index({ status: 1, lastMessageAt: -1 });

// Method to update last message
chatSchema.methods.updateLastMessage = function(messageText) {
  this.lastMessage = messageText.length > 100 
    ? messageText.substring(0, 100) + '...' 
    : messageText;
  this.lastMessageAt = new Date();
  return this.save();
};

// Method to increment unread count
chatSchema.methods.incrementUnread = function(userType) {
  if (userType === 'user') {
    this.unreadCount.user += 1;
  } else if (userType === 'scrapper') {
    this.unreadCount.scrapper += 1;
  }
  return this.save();
};

// Method to reset unread count
chatSchema.methods.resetUnread = function(userType) {
  if (userType === 'user') {
    this.unreadCount.user = 0;
  } else if (userType === 'scrapper') {
    this.unreadCount.scrapper = 0;
  }
  return this.save();
};

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;


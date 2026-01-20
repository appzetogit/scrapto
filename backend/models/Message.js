import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  senderType: {
    type: String,
    enum: ['user', 'scrapper'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [5000, 'Message cannot be more than 5000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'location', 'system'],
    default: 'text'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'file'],
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      default: ''
    },
    size: {
      type: Number,
      default: 0
    }
  }],
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  delivered: {
    type: Boolean,
    default: false
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ chatId: 1, read: 1 });

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  // Check if already read by this user
  const alreadyRead = this.readBy.some(
    read => read.userId.toString() === userId.toString()
  );
  
  if (!alreadyRead) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
    this.read = true;
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function() {
  this.delivered = true;
  return this.save();
};

const Message = mongoose.model('Message', messageSchema);

export default Message;


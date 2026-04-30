import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketplaceRequest',
    required: true,
    index: true
  },
  scrapperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scrapper',
    required: true,
    index: true
  },
  bidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  message: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'negotiating', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    default: null
  }
}, {
  timestamps: true
});

// Ensure a scrapper can only have one active bid per request
bidSchema.index({ requestId: 1, scrapperId: 1 }, { unique: true });

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;

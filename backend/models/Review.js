import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true // One review per order
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
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    index: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comment cannot be more than 1000 characters']
  },
  tags: [{
    type: String,
    enum: ['punctual', 'friendly', 'professional', 'helpful', 'clean', 'efficient', 'polite', 'reliable'],
    trim: true
  }],
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: String // For Cloudinary deletion
  }],
  helpfulCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending',
    index: true
  },
  moderationNotes: {
    type: String,
    default: null
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  moderatedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
reviewSchema.index({ scrapper: 1, createdAt: -1 }); // Get reviews by scrapper, sorted by date
reviewSchema.index({ user: 1, createdAt: -1 }); // Get reviews by user, sorted by date
reviewSchema.index({ status: 1, createdAt: -1 }); // Get reviews by status
reviewSchema.index({ rating: 1 }); // Filter by rating

// Method to approve review
reviewSchema.methods.approve = function (adminId, notes = null) {
  this.status = 'approved';
  this.moderatedBy = adminId;
  this.moderatedAt = new Date();
  if (notes) {
    this.moderationNotes = notes;
  }
  return this.save();
};

// Method to reject review
reviewSchema.methods.reject = function (adminId, notes) {
  this.status = 'rejected';
  this.moderatedBy = adminId;
  this.moderatedAt = new Date();
  this.moderationNotes = notes || 'Review rejected by admin';
  return this.save();
};

// Method to flag review
reviewSchema.methods.flag = function () {
  this.status = 'flagged';
  return this.save();
};

// Calculate average rating after save
reviewSchema.statics.calculateAverageRating = async function (scrapperId) {
  const stats = await this.aggregate([
    {
      $match: { scrapper: scrapperId, status: { $in: ['approved', 'pending'] } } // Include pending for immediate feedback? usually approved only. Let's include pending for now as auto-approval is common, or let's stick to 'approved' if moderation is strict. Given the current code has moderation, maybe 'approved'? But default is pending. Let's include both or just active. The schema has 'pending', 'approved'. Let's assume reviews are visible immediately or pending moderation shouldn't count? 
      // Decision: Let's count 'approved' and 'pending' (assuming 'pending' is default visible until flagged). OR strict moderation.
      // Let's stick to counting ALL except rejected/flagged to be instant, unless moderation is strict.
      // Changing match to: status: { $in: ['pending', 'approved'] }
    },
    {
      $group: {
        _id: '$scrapper',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
        breakdown_5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
        breakdown_4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
        breakdown_3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
        breakdown_2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
        breakdown_1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
      }
    }
  ]);

  try {
    if (stats.length > 0) {
      await mongoose.model('Scrapper').findByIdAndUpdate(scrapperId, {
        'rating.average': stats[0].avgRating.toFixed(1),
        'rating.count': stats[0].nRating,
        'rating.breakdown': {
          5: stats[0].breakdown_5,
          4: stats[0].breakdown_4,
          3: stats[0].breakdown_3,
          2: stats[0].breakdown_2,
          1: stats[0].breakdown_1
        },
        'rating.lastUpdated': new Date()
      });
    } else {
      await mongoose.model('Scrapper').findByIdAndUpdate(scrapperId, {
        'rating.average': 0,
        'rating.count': 0,
        'rating.breakdown': { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      });
    }
  } catch (err) {
    console.error(err);
  }
};

// Call calculateAverageRating after save
reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.scrapper);
});

const Review = mongoose.model('Review', reviewSchema);

export default Review;




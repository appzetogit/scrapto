import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Scrapper from '../models/Scrapper.js';
import { ORDER_STATUS } from '../config/constants.js';

class ReviewService {
  async createReview(userId, reviewData) {
    const { orderId, scrapperId, rating, title, comment, tags, images } = reviewData;

    // 1. Check if order exists and belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      const error = new Error('Order not found');
      error.statusCode = 404;
      throw error;
    }

    if (order.user.toString() !== userId.toString()) {
      const error = new Error('Not authorized to review this order');
      error.statusCode = 403;
      throw error;
    }

    // 2. Check if order is completed
    if (order.status !== ORDER_STATUS.COMPLETED) {
      const error = new Error('Cannot review an incomplete order');
      error.statusCode = 400;
      throw error;
    }

    // 3. Check if scrapper matches
    if (order.scrapper.toString() !== scrapperId) {
      const error = new Error('Scrapper does not match order');
      error.statusCode = 400;
      throw error;
    }

    // 4. Check if review already exists
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      const error = new Error('Review already exists for this order');
      error.statusCode = 400;
      throw error;
    }

    // 5. Create Review
    const review = await Review.create({
      order: orderId,
      user: userId,
      scrapper: scrapperId,
      rating,
      title,
      comment,
      tags,
      images,
      status: 'approved' // Auto-approve for now
    });

    // 6. Update Order
    order.review = review._id;
    await order.save();

    return review;
  }

  async getReviewsByScrapper(scrapperId, query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const finder = { scrapper: scrapperId, status: 'approved' };

    // Filter by rating if provided
    if (query.rating) {
      finder.rating = query.rating;
    }

    const total = await Review.countDocuments(finder);
    const reviews = await Review.find(finder)
      .populate('user', 'firstName lastName profilePic')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getMyReviews(userId, query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const finder = { user: userId };

    const total = await Review.countDocuments(finder);
    const reviews = await Review.find(finder)
      .populate('scrapper', 'name profilePic')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getReviewById(reviewId) {
    const review = await Review.findById(reviewId)
      .populate('user', 'firstName lastName profilePic')
      .populate('scrapper', 'name profilePic');

    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }
    return review;
  }

  async updateReview(reviewId, userId, updateData) {
    const review = await Review.findById(reviewId);
    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    if (review.user.toString() !== userId.toString()) {
      const error = new Error('Not authorized to update this review');
      error.statusCode = 403;
      throw error;
    }

    // Allow updates to rating, title, comment, tags, images
    if (updateData.rating) review.rating = updateData.rating;
    if (updateData.title !== undefined) review.title = updateData.title;
    if (updateData.comment !== undefined) review.comment = updateData.comment;
    if (updateData.tags) review.tags = updateData.tags;
    if (updateData.images) review.images = updateData.images;

    // If content changed, maybe set status to pending? For now keep approved.

    await review.save();
    return review;
  }

  async deleteReview(reviewId, userId, role = 'user') {
    const review = await Review.findById(reviewId);
    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    if (role !== 'admin' && review.user.toString() !== userId.toString()) {
      const error = new Error('Not authorized to delete this review');
      error.statusCode = 403;
      throw error;
    }

    const scrapperId = review.scrapper;

    // Remove reference from order
    await Order.findByIdAndUpdate(review.order, { $unset: { review: 1 } });

    await review.deleteOne();

    // Recalculate rating
    await Review.calculateAverageRating(scrapperId);

    return { message: 'Review deleted successfully' };
  }

  async getAllReviews(query) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const finder = {};

    if (query.status) {
      finder.status = query.status;
    }

    if (query.rating) {
      finder.rating = query.rating;
    }

    if (query.scrapper) {
      finder.scrapper = query.scrapper;
    }

    const total = await Review.countDocuments(finder);
    const reviews = await Review.find(finder)
      .populate('user', 'firstName lastName email profilePic')
      .populate('scrapper', 'name email profilePic')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    return {
      reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateReviewStatus(reviewId, status) {
    const review = await Review.findById(reviewId);
    if (!review) {
      const error = new Error('Review not found');
      error.statusCode = 404;
      throw error;
    }

    review.status = status;
    await review.save();

    // Recalculate rating if status changed to/from approved
    if (status === 'approved' || status === 'rejected') {
      await Review.calculateAverageRating(review.scrapper);
    }

    return review;
  }

  async getReviewAnalytics() {
    const stats = await Review.aggregate([
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          total5Star: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          total4Star: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          total3Star: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          total2Star: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          total1Star: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    return stats[0] || {
      totalReviews: 0,
      avgRating: 0,
      total5Star: 0,
      total4Star: 0,
      total3Star: 0,
      total2Star: 0,
      total1Star: 0
    };
  }
}

export default new ReviewService();

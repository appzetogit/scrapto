import Joi from 'joi';

export const createReviewSchema = Joi.object({
  orderId: Joi.string().required().messages({
    'string.empty': 'Order ID is required',
    'any.required': 'Order ID is required'
  }),
  scrapperId: Joi.string().required().messages({
    'string.empty': 'Scrapper ID is required',
    'any.required': 'Scrapper ID is required'
  }),
  rating: Joi.number().min(1).max(5).required().messages({
    'number.min': 'Rating must be at least 1 star',
    'number.max': 'Rating cannot exceed 5 stars',
    'any.required': 'Rating is required'
  }),
  title: Joi.string().max(100).optional().allow(''),
  comment: Joi.string().max(1000).optional().allow(''),
  tags: Joi.array().items(Joi.string().valid('punctual', 'friendly', 'professional', 'helpful', 'clean', 'efficient', 'polite', 'reliable')).optional(),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().required(),
      publicId: Joi.string().optional()
    })
  ).optional()
});

export const updateReviewSchema = Joi.object({
  rating: Joi.number().min(1).max(5).optional(),
  title: Joi.string().max(100).optional().allow(''),
  comment: Joi.string().max(1000).optional().allow(''),
  tags: Joi.array().items(Joi.string().valid('punctual', 'friendly', 'professional', 'helpful', 'clean', 'efficient', 'polite', 'reliable')).optional(),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().required(),
      publicId: Joi.string().optional()
    })
  ).optional()
});

export const replyReviewSchema = Joi.object({
  reply: Joi.string().max(500).required().messages({
    'string.empty': 'Reply cannot be empty',
    'string.max': 'Reply cannot exceed 500 characters'
  })
});

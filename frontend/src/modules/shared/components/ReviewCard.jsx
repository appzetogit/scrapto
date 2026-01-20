import { motion } from 'framer-motion';
import { FaStar, FaThumbsUp, FaFlag } from 'react-icons/fa';
import RatingDisplay from './RatingDisplay';

/**
 * ReviewCard Component
 * Displays a single review card
 */
const ReviewCard = ({ 
  review, 
  showActions = false,
  onEdit = null,
  onDelete = null,
  onFlag = null,
  isOwner = false
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Mask user name for privacy (show first letter only)
  const maskUserName = (name) => {
    if (!name) return 'Anonymous';
    const parts = name.split(' ');
    if (parts.length === 1) {
      return `${name[0]}***`;
    }
    return `${parts[0][0]}${parts[parts.length - 1][0]}***`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 md:p-6 shadow-sm border"
      style={{ 
        backgroundColor: '#ffffff',
        borderColor: 'rgba(100, 148, 110, 0.2)'
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: 'rgba(100, 148, 110, 0.15)', color: '#64946e' }}
          >
            {review.user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h4 className="font-semibold" style={{ color: '#2d3748' }}>
              {maskUserName(review.user?.name || 'Anonymous User')}
            </h4>
            <p className="text-xs" style={{ color: '#718096' }}>
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        {/* Rating Stars */}
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              size={16}
              style={{ 
                color: i < review.rating ? '#fbbf24' : '#d1d5db'
              }}
              className={i < review.rating ? 'fill-current' : ''}
            />
          ))}
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <h5 className="font-semibold mb-2" style={{ color: '#2d3748' }}>
          {review.title}
        </h5>
      )}

      {/* Comment */}
      {review.comment && (
        <p className="text-sm mb-3 leading-relaxed" style={{ color: '#4a5568' }}>
          {review.comment}
        </p>
      )}

      {/* Tags */}
      {review.tags && review.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {review.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-full text-xs font-medium"
              style={{ 
                backgroundColor: 'rgba(100, 148, 110, 0.1)',
                color: '#64946e'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Images */}
      {review.images && review.images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {review.images.slice(0, 3).map((image, index) => (
            <img
              key={index}
              src={image.url || image}
              alt={`Review image ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg"
              style={{ border: '1px solid rgba(100, 148, 110, 0.2)' }}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: 'rgba(100, 148, 110, 0.1)' }}>
          {isOwner && onEdit && (
            <button
              onClick={() => onEdit(review)}
              className="text-sm font-medium transition-colors"
              style={{ color: '#64946e' }}
            >
              Edit
            </button>
          )}
          {isOwner && onDelete && (
            <button
              onClick={() => onDelete(review)}
              className="text-sm font-medium transition-colors"
              style={{ color: '#ef4444' }}
            >
              Delete
            </button>
          )}
          {!isOwner && onFlag && (
            <button
              onClick={() => onFlag(review)}
              className="flex items-center gap-1 text-sm font-medium transition-colors"
              style={{ color: '#f59e0b' }}
            >
              <FaFlag size={12} />
              Flag
            </button>
          )}
          {/* Helpful button (future feature) */}
          <button
            className="flex items-center gap-1 text-sm font-medium transition-colors"
            style={{ color: '#718096' }}
            disabled
          >
            <FaThumbsUp size={12} />
            Helpful ({review.helpfulCount || 0})
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default ReviewCard;




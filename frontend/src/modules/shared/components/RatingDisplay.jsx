import { FaStar } from 'react-icons/fa';

/**
 * RatingDisplay Component
 * Displays average rating with stars and breakdown
 */
const RatingDisplay = ({ 
  averageRating = 0, 
  totalReviews = 0, 
  breakdown = null,
  showBreakdown = false,
  size = 'md' // 'sm', 'md', 'lg'
}) => {
  const starSize = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex flex-col gap-2">
      {/* Average Rating */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[...Array(fullStars)].map((_, i) => (
            <FaStar 
              key={i} 
              size={starSize} 
              style={{ color: '#fbbf24' }} 
              className="fill-current"
            />
          ))}
          {hasHalfStar && (
            <div className="relative" style={{ width: starSize, height: starSize }}>
              <FaStar 
                size={starSize} 
                style={{ color: '#d1d5db' }} 
                className="absolute fill-current"
              />
              <div 
                className="absolute overflow-hidden"
                style={{ width: starSize / 2, height: starSize }}
              >
                <FaStar 
                  size={starSize} 
                  style={{ color: '#fbbf24' }} 
                  className="fill-current"
                />
              </div>
            </div>
          )}
          {[...Array(emptyStars)].map((_, i) => (
            <FaStar 
              key={i} 
              size={starSize} 
              style={{ color: '#d1d5db' }} 
              className="fill-current"
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="font-bold"
            style={{ 
              color: '#2d3748',
              fontSize: size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px'
            }}
          >
            {averageRating.toFixed(1)}
          </span>
          {totalReviews > 0 && (
            <span 
              style={{ 
                color: '#718096',
                fontSize: size === 'sm' ? '12px' : size === 'lg' ? '16px' : '14px'
              }}
            >
              ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          )}
        </div>
      </div>

      {/* Rating Breakdown */}
      {showBreakdown && breakdown && (
        <div className="flex flex-col gap-1 mt-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = breakdown[rating] || 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={rating} className="flex items-center gap-2">
                <div className="flex items-center gap-1" style={{ width: '60px' }}>
                  <span style={{ color: '#2d3748', fontSize: '12px', fontWeight: '600' }}>
                    {rating}
                  </span>
                  <FaStar size={12} style={{ color: '#fbbf24' }} className="fill-current" />
                </div>
                <div 
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: '#e2e8f0', maxWidth: '200px' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ 
                      backgroundColor: '#fbbf24',
                      width: `${percentage}%`
                    }}
                  />
                </div>
                <span style={{ color: '#718096', fontSize: '12px', minWidth: '40px' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;




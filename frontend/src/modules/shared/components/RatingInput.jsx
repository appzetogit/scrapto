import { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { motion } from 'framer-motion';

/**
 * RatingInput Component
 * Interactive star rating input (1-5)
 */
const RatingInput = ({ 
  value = 0, 
  onChange, 
  size = 'lg', // 'sm', 'md', 'lg'
  disabled = false,
  showLabel = true
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const starSize = size === 'sm' ? 20 : size === 'lg' ? 32 : 24;

  const handleStarClick = (rating) => {
    if (!disabled && onChange) {
      onChange(rating);
    }
  };

  const handleStarHover = (rating) => {
    if (!disabled) {
      setHoveredRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoveredRating(0);
    }
  };

  const displayRating = hoveredRating || value;

  return (
    <div className="flex flex-col gap-2">
      {showLabel && (
        <label 
          className="font-semibold"
          style={{ color: '#2d3748', fontSize: size === 'sm' ? '14px' : '16px' }}
        >
          Rating {value > 0 && `(${value} star${value > 1 ? 's' : ''})`}
        </label>
      )}
      <div 
        className="flex items-center gap-1"
        onMouseLeave={handleMouseLeave}
      >
        {[1, 2, 3, 4, 5].map((rating) => (
          <motion.button
            key={rating}
            type="button"
            whileHover={!disabled ? { scale: 1.1 } : {}}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            onClick={() => handleStarClick(rating)}
            onMouseEnter={() => handleStarHover(rating)}
            disabled={disabled}
            className={`transition-all ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
            style={{ 
              padding: '4px',
              border: 'none',
              background: 'transparent'
            }}
          >
            <FaStar
              size={starSize}
              style={{ 
                color: rating <= displayRating ? '#fbbf24' : '#d1d5db',
                transition: 'color 0.2s ease'
              }}
              className={rating <= displayRating ? 'fill-current' : ''}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default RatingInput;




import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const SwipeSlider = ({ onAccept, disabled = false }) => {
  const staticTexts = [
    "Slide to Accept",
    "Accepted!",
    "→ Slide Right"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const [progress, setProgress] = useState(0);
  const sliderRef = useRef(null);
  const thumbRef = useRef(null);
  const x = useMotionValue(0);
  const [sliderWidth, setSliderWidth] = useState(0);

  // Get slider width
  useEffect(() => {
    const updateWidth = () => {
      if (sliderRef.current) {
        const width = sliderRef.current.offsetWidth;
        setSliderWidth(width);
      }
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (sliderRef.current) {
      resizeObserver.observe(sliderRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate progress
  const progressValue = useTransform(x, (latest) => {
    if (sliderWidth === 0) return 0;
    const thumbWidth = 40;
    const maxDrag = sliderWidth - thumbWidth;
    const percent = (latest / maxDrag) * 100;
    return Math.min(100, Math.max(0, percent));
  });

  // Update progress state
  useEffect(() => {
    const unsubscribe = progressValue.on('change', (value) => {
      const rounded = Math.round(value);
      setProgress(rounded);
    });
    return () => unsubscribe();
  }, [progressValue]);

  // Handle drag end
  const handleDragEnd = (event, info) => {
    const currentProgress = progressValue.get();
    console.log('🎯 Drag End - Progress:', currentProgress.toFixed(1) + '%');

    if (currentProgress >= 85 && !disabled) {
      // Accept
      console.log('✅ Accepting request!');
      if (onAccept && typeof onAccept === 'function') {
        onAccept();
      } else {
        console.error('❌ onAccept is not a function');
      }
    } else {
      // Reset
      console.log('🔄 Resetting slider');
      x.set(0);
    }
  };

  // Handle drag start
  const handleDragStart = () => {
    console.log('🎯 Drag Started');
  };

  // Handle drag
  const handleDrag = (event, info) => {
    const currentProgress = progressValue.get();
    if (currentProgress >= 85 && !disabled) {
      console.log('✅ Reached 85%, accepting!');
      if (onAccept && typeof onAccept === 'function') {
        onAccept();
      }
    }
  };

  // Calculate thumb position
  const thumbPosition = useTransform(x, (latest) => {
    const thumbWidth = 40;
    const maxDrag = sliderWidth - thumbWidth;
    return Math.min(maxDrag, Math.max(0, latest));
  });

  // Calculate fill width
  const fillWidth = useTransform(x, (latest) => {
    const thumbWidth = 40;
    const maxDrag = sliderWidth - thumbWidth;
    const percent = Math.min(100, Math.max(0, (latest / maxDrag) * 100));
    return `${percent}%`;
  });

  return (
    <div className="relative w-full">
      <p className="text-center text-xs font-semibold mb-2" style={{ color: '#718096' }}>
        {getTranslatedText("Slide to Accept")}
      </p>
      <div
        ref={sliderRef}
        className="w-full h-12 rounded-full relative"
        style={{
          backgroundColor: 'rgba(100, 148, 110, 0.1)',
          overflow: 'hidden'
        }}
      >
        {/* Progress Fill */}
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            backgroundColor: progress >= 85 ? '#10b981' : '#64946e',
            width: fillWidth
          }}
        />

        {/* Slider Thumb */}
        <motion.div
          ref={thumbRef}
          className="absolute top-1/2 -translate-y-1/2 w-10 h-10 rounded-full shadow-lg flex items-center justify-center"
          drag="x"
          dragConstraints={{
            left: 0,
            right: sliderWidth > 40 ? sliderWidth - 40 : 300
          }}
          dragElastic={0}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
          style={{
            backgroundColor: '#ffffff',
            x: thumbPosition,
            left: 0,
            cursor: 'grab',
            zIndex: 10,
            touchAction: 'pan-x',
            WebkitUserSelect: 'none',
            userSelect: 'none'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#64946e' }}>
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>

        {/* Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs font-semibold" style={{ color: progress >= 85 ? '#ffffff' : '#64946e' }}>
            {progress >= 85 ? getTranslatedText('Accepted!') : getTranslatedText('→ Slide Right')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SwipeSlider;

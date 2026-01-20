import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { FaCamera, FaPaperPlane, FaTruck } from 'react-icons/fa';
import { HiArrowRight } from 'react-icons/hi';

const MicroDemo = () => {
  const scrollRef = useRef(null);

  const steps = [
    { 
      icon: FaCamera, 
      title: 'Upload Photo', 
      desc: 'Take a picture of your scrap',
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    { 
      icon: FaPaperPlane, 
      title: 'Request Sent', 
      desc: 'We find nearby scrappers',
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    { 
      icon: FaTruck, 
      title: 'Pickup Arrives', 
      desc: 'Verified scrapper collects',
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
  ];

  // Duplicate steps for seamless infinite scroll
  const duplicatedSteps = [...steps, ...steps, ...steps];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId;
    let scrollPosition = 0;
    const scrollSpeed = 0.8; // pixels per frame
    let isPaused = false;

    const animate = () => {
      if (!isPaused) {
        scrollPosition += scrollSpeed;
        
        // Reset position when scrolled past one set of cards
        const cardWidth = scrollContainer.scrollWidth / 3; // 3 sets of cards
        if (scrollPosition >= cardWidth) {
          scrollPosition = 0;
        }
        
        scrollContainer.scrollLeft = scrollPosition;
      }
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    // Pause on hover
    const handleMouseEnter = () => { isPaused = true; };
    const handleMouseLeave = () => { isPaused = false; };
    
    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
      scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.9 }}
      className="mb-8 md:mb-12 lg:mb-16"
    >
      <motion.h3 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 md:mb-12 text-center text-gray-900"
      >
        How It Works
      </motion.h3>
      
      {/* Horizontal Scrolling Container */}
      <div className="relative overflow-hidden">
        <div 
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10 items-stretch px-4 overflow-x-auto scrollbar-hide"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {duplicatedSteps.map((step, index) => {
            const IconComponent = step.icon;
            const originalIndex = index % steps.length;
            return (
              <motion.div
                key={`${originalIndex}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.1 + (originalIndex * 0.1) }}
                whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
                className="flex-shrink-0 w-48 sm:w-56 md:w-64 lg:w-72"
              >
                {/* Beautiful Card */}
                <div className={`relative ${step.bgColor} rounded-xl md:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 h-full`}>
                  {/* Gradient Top Border */}
                  <div className={`h-1 bg-gradient-to-r ${step.gradient}`}></div>
                  
                  <div className="p-3 sm:p-4 md:p-5 lg:p-6">
                    {/* Icon Container */}
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-xl md:rounded-2xl bg-white flex items-center justify-center mb-3 sm:mb-4 md:mb-5 mx-auto shadow-sm"
                    >
                      <IconComponent className={`text-lg sm:text-xl md:text-2xl lg:text-3xl ${step.iconColor}`} />
                    </motion.div>

                    {/* Content */}
                    <div className="text-center">
                      <h4 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-2">
                        {step.title}
                      </h4>
                      <p className="text-gray-600 text-xs sm:text-sm md:text-sm leading-relaxed">
                        {step.desc}
                      </p>
                    </div>

                    {/* Step Number */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4">
                      <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-r ${step.gradient} flex items-center justify-center text-white font-bold text-xs sm:text-xs md:text-sm shadow-md`}>
                        {originalIndex + 1}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Arrow Connector */}
                <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-10 flex items-center justify-center">
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="bg-white rounded-full p-2 shadow-lg border border-gray-200"
                  >
                    <HiArrowRight className="text-2xl text-green-600" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default MicroDemo;


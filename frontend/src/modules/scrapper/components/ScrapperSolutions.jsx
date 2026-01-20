import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import {
  FaClipboardCheck,
  FaChartLine,
  FaRupeeSign,
  FaShieldAlt,
  FaUsers
} from 'react-icons/fa';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const ScrapperSolutions = () => {
  const staticTexts = [
    "Why Choose Scrapto?",
    "Guaranteed Daily Orders",
    "Get consistent daily pickup requests. No more waiting for orders, steady income guaranteed.",
    "Transparent Rates",
    "See real-time market rates before accepting orders. Know exactly what you'll earn upfront.",
    "Higher Income",
    "Earn more with competitive rates and bonus incentives. Maximize your daily earnings potential.",
    "Safe Handling Supply",
    "Work with verified customers and safe pickup locations. Your safety is our priority.",
    "Wider Customer Access",
    "Access to a large customer base across your area. More pickups, more opportunities to earn."
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });

  const solutions = [
    {
      icon: FaClipboardCheck,
      title: getTranslatedText('Guaranteed Daily Orders'),
      description: getTranslatedText('Get consistent daily pickup requests. No more waiting for orders, steady income guaranteed.'),
      color: '#64946e'
    },
    {
      icon: FaChartLine,
      title: getTranslatedText('Transparent Rates'),
      description: getTranslatedText("See real-time market rates before accepting orders. Know exactly what you'll earn upfront."),
      color: '#64946e'
    },
    {
      icon: FaRupeeSign,
      title: getTranslatedText('Higher Income'),
      description: getTranslatedText('Earn more with competitive rates and bonus incentives. Maximize your daily earnings potential.'),
      color: '#64946e'
    },
    {
      icon: FaShieldAlt,
      title: getTranslatedText('Safe Handling Supply'),
      description: getTranslatedText('Work with verified customers and safe pickup locations. Your safety is our priority.'),
      color: '#64946e'
    },
    {
      icon: FaUsers,
      title: getTranslatedText('Wider Customer Access'),
      description: getTranslatedText('Access to a large customer base across your area. More pickups, more opportunities to earn.'),
      color: '#64946e'
    }
  ];

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8 md:mb-12 lg:mb-16"
    >
      <motion.h3
        initial={{ opacity: 0, y: 16 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-10 text-center"
        style={{ color: '#2d3748' }}
      >
        {getTranslatedText("Why Choose Scrapto?")}
      </motion.h3>

      <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5">
        {solutions.map((solution, index) => {
          const IconComponent = solution.icon;

          return (
            <motion.div
              key={solution.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.12, ease: 'easeOut' }}
            >
              <div
                className="rounded-xl md:rounded-2xl p-4 md:p-5 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid rgba(100, 148, 110, 0.15)'
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: 'rgba(100, 148, 110, 0.1)',
                      color: solution.color
                    }}
                  >
                    <IconComponent size={18} className="md:w-6 md:h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-bold text-sm md:text-lg mb-1 md:mb-2"
                      style={{ color: '#2d3748' }}
                    >
                      {solution.title}
                    </h4>
                    <p
                      className="text-xs md:text-sm leading-tight md:leading-relaxed"
                      style={{ color: '#718096' }}
                    >
                      {solution.description}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ScrapperSolutions;


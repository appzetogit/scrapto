import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import {
  FaTruck,
  FaRupeeSign,
  FaMobileAlt,
  FaEye,
  FaWeight,
  FaBolt,
} from "react-icons/fa";

const CustomerSolutions = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const solutions = [
    {
      icon: FaTruck,
      title: "Free Pickup",
      description:
        "No charges for pickup service. We come to your doorstep at no extra cost.",
      color: "#64946e",
    },
    {
      icon: FaRupeeSign,
      title: "Best Rates",
      description:
        "Get the highest market rates for your scrap. Real-time pricing ensures fair deals.",
      color: "#64946e",
    },
    {
      icon: FaMobileAlt,
      title: "Instant UPI Payments",
      description:
        "Receive payment instantly via UPI. No cash handling, secure and quick transactions.",
      color: "#64946e",
    },
    {
      icon: FaEye,
      title: "Price Transparency",
      description:
        "See live market prices before booking. No hidden charges, complete transparency.",
      color: "#64946e",
    },
    {
      icon: FaWeight,
      title: "Proper Weight",
      description:
        "Accurate weight measurement with certified scales. Fair pricing based on actual weight.",
      color: "#64946e",
    },
    {
      icon: FaBolt,
      title: "Fast Service",
      description:
        "Quick pickup and processing. Same-day service available for urgent requests.",
      color: "#64946e",
    },
  ];

  const staticTexts = [
    "Why Choose Scrapto?",
    ...solutions.map((s) => s.title),
    ...solutions.map((s) => s.description),
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8 md:mb-12 lg:mb-16">
      <motion.h3
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 md:mb-10 text-center"
        style={{ color: "#2d3748" }}>
        {getTranslatedText("Why Choose Scrapto?")}
      </motion.h3>

      {/* Solutions Container - Single container, no cards */}
      <div className="space-y-0 px-2 relative">
        {solutions.map((solution, index) => {
          const IconComponent = solution.icon;
          const isLast = index === solutions.length - 1;

          return (
            <div key={solution.title} className="relative">
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={
                  isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
                }
                transition={{
                  duration: 0.5,
                  delay: 0.3 + index * 0.1,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="flex flex-row items-center gap-4 md:gap-6 p-4 md:p-5 rounded-xl transition-all duration-300 hover:bg-gray-50 relative z-10">
                {/* Icon - Left Side */}
                <div className="relative flex-shrink-0">
                  <div
                    className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110 relative z-10"
                    style={{
                      backgroundColor: "rgba(100, 148, 110, 0.1)",
                      color: solution.color,
                    }}>
                    <IconComponent size={20} className="md:w-6 md:h-6" />
                  </div>

                  {/* Connecting Line - Vertical line from icon to next icon */}
                  {!isLast && (
                    <motion.div
                      initial={{ scaleY: 0 }}
                      animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.5 + index * 0.1,
                        ease: [0.25, 0.46, 0.45, 0.94],
                      }}
                      className="absolute top-full left-1/2 transform -translate-x-1/2 w-0.5 origin-top"
                      style={{
                        height: "calc(100% + 1rem)",
                        backgroundColor: "#64946e",
                        zIndex: 1,
                      }}
                    />
                  )}
                </div>

                {/* Content - Right Side */}
                <div className="flex-1 text-left">
                  <h4
                    className="text-base md:text-lg font-bold mb-1 md:mb-2"
                    style={{ color: "#2d3748" }}>
                    {getTranslatedText(solution.title)}
                  </h4>
                  <p
                    className="text-xs md:text-sm leading-relaxed"
                    style={{ color: "#718096" }}>
                    {getTranslatedText(solution.description)}
                  </p>
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default CustomerSolutions;

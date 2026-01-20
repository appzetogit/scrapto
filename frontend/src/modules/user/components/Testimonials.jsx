import { motion } from "framer-motion";
import { FaStar } from "react-icons/fa";
import { usePageTranslation } from "../../../hooks/usePageTranslation";

const Testimonials = () => {
  const testimonials = [
    {
      name: "R.K.",
      rating: 5,
      text: "Great service! Got best price for my scrap metal.",
      initials: "RK",
      gradient: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      name: "S.P.",
      rating: 5,
      text: "Quick pickup and fair pricing. Highly recommended!",
      initials: "SP",
      gradient: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      name: "A.M.",
      rating: 5,
      text: "Easy to use app and verified collectors.",
      initials: "AM",
      gradient: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
    },
    {
      name: "P.S.",
      rating: 5,
      text: "Best platform for selling scrap. Very satisfied!",
      initials: "PS",
      gradient: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      name: "M.K.",
      rating: 5,
      text: "Fast and reliable service. Will use again!",
      initials: "MK",
      gradient: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
    },
  ];

  const staticTexts = [
    "What Our Users Say",
    "50,000+ Pickups Completed",
    "Join thousands of satisfied users",
    ...testimonials.map((t) => t.text),
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 1.3 }}
      className="mb-12 md:mb-16">
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.4 }}
        className="text-2xl md:text-3xl font-bold mb-8 md:mb-10 text-center text-gray-900">
        {getTranslatedText("What Our Users Say")}
      </motion.h3>

      {/* Horizontal Scrolling Container */}
      <div className="relative overflow-hidden mb-8">
        <div
          className="flex gap-4 md:gap-6 items-stretch px-4 overflow-x-auto scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}>
          {testimonials.map((testimonial, index) => {
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 1.5 + index * 0.1 }}
                whileHover={{
                  y: -5,
                  scale: 1.05,
                  transition: { duration: 0.2 },
                }}
                className="flex-shrink-0 w-32 md:w-56">
                {/* Circular Card */}
                <div
                  className="relative rounded-full overflow-hidden transition-all duration-300 group flex items-center justify-center"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "2px solid rgba(100, 148, 110, 0.2)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                    width: "8rem",
                    height: "8rem",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#64946e";
                    e.currentTarget.style.boxShadow =
                      "0 8px 24px rgba(100, 148, 110, 0.3)";
                    e.currentTarget.style.transform =
                      "translateY(-4px) scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor =
                      "rgba(100, 148, 110, 0.2)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0, 0, 0, 0.08)";
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                  }}>
                  <div className="p-3 md:p-5 relative text-center flex flex-col items-center justify-center h-full">
                    {/* Name */}
                    <p
                      className="font-bold mb-1 text-xs md:text-sm"
                      style={{ color: "#2d3748" }}>
                      {testimonial.name}
                    </p>

                    {/* Star Rating */}
                    <div className="flex gap-0.5 mb-1 md:mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            delay: 1.6 + index * 0.1 + i * 0.05,
                            type: "spring",
                          }}>
                          <svg
                            width="10"
                            height="10"
                            className="md:w-3 md:h-3"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            style={{ color: "#fbbf24" }}>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </motion.div>
                      ))}
                    </div>

                    {/* Testimonial Text */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.7 + index * 0.1 }}
                      className="text-xs leading-tight relative z-10 line-clamp-2 md:line-clamp-3"
                      style={{ color: "#4a5568" }}>
                      "{getTranslatedText(testimonial.text)}"
                    </motion.p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.8 }}
        className="text-center">
        <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {getTranslatedText("50,000+ Pickups Completed")}
        </p>
        <p className="text-gray-600 text-sm md:text-base">
          {getTranslatedText("Join thousands of satisfied users")}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default Testimonials;

import { motion } from "framer-motion";
import { usePageTranslation } from "../../../hooks/usePageTranslation";

const TrustSignals = () => {
  const signals = [
    {
      text: "KYC Verified Scrappers",
      icon: (
        <svg
          className="w-full h-full"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <path
            d="M9 12l2 2 4-4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
          <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
          <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3" />
          <path d="M12 21c0-1 1-3 3-3s3 2 3 3-1 3-3 3-3-2-3-3" />
        </svg>
      ),
    },
    {
      text: "Secure Payments",
      icon: (
        <svg
          className="w-full h-full"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
    {
      text: "4.8 Avg Rating",
      icon: (
        <svg className="w-full h-full" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
    },
    {
      text: "24/7 Support",
      icon: (
        <svg
          className="w-full h-full"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
  ];

  const { getTranslatedText } = usePageTranslation(signals.map((s) => s.text));

  return (
    <motion.div
      initial={{ y: 10 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, delay: 1 }}
      className="mb-8 md:mb-12">
      <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 sm:gap-3 md:gap-4 justify-center max-w-2xl mx-auto md:max-w-none">
        {signals.map((signal, index) => (
          <motion.div
            key={index}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 1.1 + index * 0.1 }}
            className="group flex items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 lg:px-6 lg:py-4 rounded-lg md:rounded-xl transition-all duration-300 cursor-default"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid rgba(100, 148, 110, 0.2)",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#64946e";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(100, 148, 110, 0.15)";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(100, 148, 110, 0.2)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.05)";
              e.currentTarget.style.transform = "translateY(0)";
            }}>
            {/* Icon Container */}
            <div
              className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-md md:rounded-lg transition-all duration-300 flex-shrink-0"
              style={{
                backgroundColor: "rgba(100, 148, 110, 0.1)",
                color: "#64946e",
              }}>
              <div className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5">
                {signal.icon}
              </div>
            </div>

            {/* Text */}
            <span
              className="text-xs sm:text-sm md:text-base font-semibold whitespace-nowrap truncate"
              style={{ color: "#2d3748" }}>
              {getTranslatedText(signal.text)}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default TrustSignals;

import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { FaCamera, FaPaperPlane, FaTruck } from "react-icons/fa";
import { usePageTranslation } from "../../../hooks/usePageTranslation";

const MicroDemo = () => {
  const scrollRef = useRef(null);

  const staticTexts = [
    "SELECT CATEGORY",
    "Choose your scrap type from categories like Metal, Plastic, Electronics, or Paper. Select one or multiple categories for your pickup request.",
    "UPLOAD IMAGES",
    "Take clear photos of your scrap materials. Upload multiple images to help scrappers understand what you have. Add weight and notes for better pricing.",
    "GET PICKED UP",
    "Verified scrappers accept your request and arrive at your location. Get real-time updates and cash payment on pickup. Track your scrapper in real-time.",
    "How It Works",
  ];

  const { getTranslatedText } = usePageTranslation(staticTexts);

  const steps = [
    {
      icon: FaCamera,
      title: getTranslatedText("SELECT CATEGORY"),
      desc: getTranslatedText(
        "Choose your scrap type from categories like Metal, Plastic, Electronics, or Paper. Select one or multiple categories for your pickup request."
      ),
    },
    {
      icon: FaPaperPlane,
      title: getTranslatedText("UPLOAD IMAGES"),
      desc: getTranslatedText(
        "Take clear photos of your scrap materials. Upload multiple images to help scrappers understand what you have. Add weight and notes for better pricing."
      ),
    },
    {
      icon: FaTruck,
      title: getTranslatedText("GET PICKED UP"),
      desc: getTranslatedText(
        "Verified scrappers accept your request and arrive at your location. Get real-time updates and cash payment on pickup. Track your scrapper in real-time."
      ),
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
    const handleMouseEnter = () => {
      isPaused = true;
    };
    const handleMouseLeave = () => {
      isPaused = false;
    };

    scrollContainer.addEventListener("mouseenter", handleMouseEnter);
    scrollContainer.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      scrollContainer.removeEventListener("mouseenter", handleMouseEnter);
      scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.9 }}
      className="mb-8 md:mb-12 lg:mb-16">
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
        className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 md:mb-12 text-center"
        style={{ color: "#2d3748" }}>
        {getTranslatedText("How It Works")}
      </motion.h3>

      {/* Horizontal Scrolling Container */}
      <div className="relative overflow-hidden">
        <div
          ref={scrollRef}
          className="flex gap-4 sm:gap-5 md:gap-6 lg:gap-8 xl:gap-10 items-stretch px-4 overflow-x-auto scrollbar-hide"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}>
          {duplicatedSteps.map((step, index) => {
            const IconComponent = step.icon;
            const stepNumber = (index % steps.length) + 1;
            return (
              <motion.div
                key={`${step.title}-${index}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  duration: 0.5,
                  delay: 1.1 + (index % steps.length) * 0.1,
                }}
                whileHover={{
                  y: -8,
                  scale: 1.02,
                  transition: { duration: 0.3 },
                }}
                className="shrink-0 w-36 sm:w-40 md:w-48 lg:w-56 relative group">
                {/* Modern Card Design */}
                <div
                  className="overflow-hidden h-full flex flex-col rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{
                    backgroundColor: "#ffffff",
                    border: "1px solid rgba(100, 148, 110, 0.2)",
                  }}>
                  {/* Top Section with Gradient Background */}
                  <div
                    className="p-3 md:p-4 flex-1 flex flex-col relative overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(100, 148, 110, 0.1) 0%, rgba(100, 148, 110, 0.05) 100%)",
                    }}>
                    {/* Step Number Badge - Top Right */}
                    <div
                      className="absolute top-2 right-2 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-[10px] md:text-xs shadow-md"
                      style={{
                        backgroundColor: "#64946e",
                        color: "#ffffff",
                      }}>
                      {String(stepNumber).padStart(2, "0")}
                    </div>

                    {/* Icon - Centered */}
                    <div className="flex justify-center mb-2 md:mb-3 mt-1">
                      <div
                        className="w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                        style={{
                          backgroundColor: "#64946e",
                          color: "#ffffff",
                          boxShadow: "0 4px 12px rgba(100, 148, 110, 0.3)",
                        }}>
                        <IconComponent
                          size={16}
                          className="md:w-6 md:h-6"
                          style={{ color: "#ffffff" }}
                        />
                      </div>
                    </div>

                    {/* Title */}
                    <h3
                      className="text-center font-bold text-[10px] md:text-sm lg:text-base"
                      style={{ color: "#2d3748" }}>
                      {step.title}
                    </h3>
                  </div>

                  {/* Bottom Accent Line */}
                  <div
                    className="h-1.5 md:h-2"
                    style={{
                      background:
                        "linear-gradient(90deg, #64946e 0%, rgba(100, 148, 110, 0.6) 100%)",
                    }}
                  />
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

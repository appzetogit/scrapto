import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { IoLanguageOutline, IoChevronDownOutline } from "react-icons/io5";
import LanguageSelector from "../../shared/components/LanguageSelector";
import siteLogo from "../../../assets/scraptologo-removebg-preview.png";

const Header = () => {
  const [hasNotifications, setHasNotifications] = useState(true);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { language, languages, changeLanguage } = useLanguage();

  const staticTexts = [
    "Hi, User!",
    "Welcome back to Scrapto",
    "Language",
    "English",
    "Hindi",
    "Marathi",
    "Gujarati",
    "Bengali",
    "Tamil",
    "Telugu",
    "Kannada",
    "Malayalam",
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  return (
    <motion.header
      initial={{ y: -10 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="px-4 md:px-6 lg:px-8 py-2 md:py-3">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img
            src={siteLogo}
            alt="Scrapto Logo"
            className="h-14 md:h-16 w-56 md:w-72 object-contain object-left -ml-3"
          />
        </div>

        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <LanguageSelector />

          <div className="relative">
            <button
              onClick={() => setHasNotifications(false)}
              className="relative p-2 rounded-full transition-colors"
              style={{
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) =>
                (e.target.style.backgroundColor = "rgba(100, 148, 110, 0.1)")
              }
              onMouseLeave={(e) =>
                (e.target.style.backgroundColor = "transparent")
              }>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                style={{ color: "#64946e" }}>
                <path
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.73 21a2 2 0 0 1-3.46 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {hasNotifications && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;

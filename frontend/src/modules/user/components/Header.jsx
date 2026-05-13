import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { useAuth } from "../../shared/context/AuthContext";
import { IoLanguageOutline, IoChevronDownOutline, IoNotificationsOutline } from "react-icons/io5";
import LanguageSelector from "../../shared/components/LanguageSelector";
import siteLogo from "../../../assets/scraptox-removebg-preview.png";
// import notificationService from "../../../services/notificationService";

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // unreadCount removed
  const { language } = useLanguage();

  const staticTexts = [
    "Hi, User!",
    "Welcome back to Scraptox",
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  // Notification fetching removed

  return (
    <motion.header
      initial={{ y: -10 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      // md:hidden ensures it only shows on mobile, preventing double header
      className="px-4 md:px-6 lg:px-8 py-0 md:py-1 md:hidden"
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <img
            src={siteLogo}
            alt="Scraptox Logo"
            className="h-20 w-80 object-contain object-left -ml-4"
          />
        </div>

        <div className="flex items-center gap-4">
          <LanguageSelector />

          {/* Notification bell removed */}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;

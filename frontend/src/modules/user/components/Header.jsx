import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../contexts/LanguageContext";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { useAuth } from "../../shared/context/AuthContext";
import { IoLanguageOutline, IoChevronDownOutline, IoNotificationsOutline } from "react-icons/io5";
import LanguageSelector from "../../shared/components/LanguageSelector";
import siteLogo from "../../../assets/scraptologo-removebg-preview.png";
import notificationService from "../../../services/notificationService";

const Header = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const { language } = useLanguage();

  const staticTexts = [
    "Hi, User!",
    "Welcome back to Scrapto",
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    const updateCount = async () => {
      if (user) {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count);
      }
    };

    updateCount();
    // Poll for notifications every 30 seconds to reduce load
    const interval = setInterval(updateCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

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
            alt="Scrapto Logo"
            className="h-14 w-56 object-contain object-left -ml-3"
          />
        </div>

        <div className="flex items-center gap-4">
          <LanguageSelector />

          <div className="relative z-50">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/notifications');
              }}
              className="relative p-2 rounded-full transition-colors cursor-pointer active:scale-95 touch-manipulation"
              style={{
                backgroundColor: "transparent",
                WebkitTapHighlightColor: "transparent"
              }}
              aria-label="Notifications"
            >
              <IoNotificationsOutline className="text-2xl text-white pointer-events-none" />

              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold pointer-events-none"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;

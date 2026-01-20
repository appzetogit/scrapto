import { useAuth } from "../shared/context/AuthContext";
import { Routes, Route, Navigate } from "react-router-dom";
import { usePageTranslation } from "../../hooks/usePageTranslation";
import Hero from "./components/Hero";
import LoginSignup from "./components/LoginSignup";
import CategorySelectionPage from "../../components/AddScrapFlow/pages/CategorySelectionPage";
import ImageUploadPage from "../../components/AddScrapFlow/pages/ImageUploadPage";
import WeightInputPage from "../../components/AddScrapFlow/pages/WeightInputPage";
import AddressInputPage from "../../components/AddScrapFlow/pages/AddressInputPage";
import MyProfilePage from "./components/MyProfilePage";
import SavedAddressesPage from "./components/SavedAddressesPage";
import MyRequestsPage from "./components/MyRequestsPage";
import HelpSupport from "./components/HelpSupport";
import PriceConfirmationPage from "../../components/AddScrapFlow/pages/PriceConfirmationPage";
import RequestStatusPage from "../../components/AddScrapFlow/pages/RequestStatusPage";
import ChatPage from "./components/ChatPage";
import ChatListPage from "./components/ChatListPage";
import AllCategoriesPage from "./components/AllCategoriesPage";
import ReviewOrderPage from "./components/ReviewOrderPage";
import ReviewListPage from "./components/ReviewListPage";
import ServiceDetailsPage from "./components/ServiceBookingFlow/ServiceDetailsPage";
import ServiceAddressPage from "./components/ServiceBookingFlow/ServiceAddressPage";
import ServiceSchedulePage from "./components/ServiceBookingFlow/ServiceSchedulePage";
import ServiceConfirmationPage from "./components/ServiceBookingFlow/ServiceConfirmationPage";
import WalletPage from "./components/WalletPage";
import TrackOrderPage from "./components/TrackOrderPage";

import { FaHome, FaList, FaRegComments, FaUser } from "react-icons/fa";
import WebViewHeader from "../shared/components/WebViewHeader";

const UserModule = () => {
  const { isAuthenticated } = useAuth();

  const staticTexts = ["Home", "My Requests", "Chats", "Profile"];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  const navItems = [
    { label: getTranslatedText("Sell"), path: "/", icon: FaHome },
    {
      label: getTranslatedText("My Requests"),
      path: "/my-requests",
      icon: FaList,
    },
    { label: getTranslatedText("Chats"), path: "/chats", icon: FaRegComments },
    { label: getTranslatedText("Profile"), path: "/my-profile", icon: FaUser },
  ];

  if (!isAuthenticated) {
    return <LoginSignup />;
  }

  return (
    <div className="min-h-screen bg-[#f4ebe2]">
      <WebViewHeader navItems={navItems} userRole="user" />

      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/categories" element={<AllCategoriesPage />} />
        <Route path="/add-scrap/category" element={<CategorySelectionPage />} />
        <Route path="/add-scrap/upload" element={<ImageUploadPage />} />
        <Route path="/add-scrap/weight" element={<WeightInputPage />} />
        <Route path="/add-scrap/address" element={<AddressInputPage />} />
        <Route path="/add-scrap/confirm" element={<PriceConfirmationPage />} />

        {/* Service Booking Flow */}
        <Route path="/book-service/details" element={<ServiceDetailsPage />} />
        <Route path="/book-service/address" element={<ServiceAddressPage />} />
        <Route
          path="/book-service/schedule"
          element={<ServiceSchedulePage />}
        />
        <Route
          path="/book-service/confirm"
          element={<ServiceConfirmationPage />}
        />
        <Route path="/request-status" element={<RequestStatusPage />} />
        <Route path="/chats" element={<ChatListPage />} />
        <Route path="/chat/:chatId" element={<ChatPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/user/wallet" element={<WalletPage />} />
        <Route path="/my-profile" element={<MyProfilePage />} />
        <Route path="/saved-addresses" element={<SavedAddressesPage />} />
        <Route path="/my-requests" element={<MyRequestsPage />} />
        <Route path="/review-order/:orderId" element={<ReviewOrderPage />} />
        <Route path="/my-reviews" element={<ReviewListPage />} />
        <Route path="/track-order/:orderId" element={<TrackOrderPage />} />
        <Route path="/help" element={<HelpSupport />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default UserModule;

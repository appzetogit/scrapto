import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../shared/context/AuthContext";
import { orderAPI } from "../../../shared/utils/api";
import {
  FaCheckCircle,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaArrowLeft,
} from "react-icons/fa";
import { usePageTranslation } from "../../../../hooks/usePageTranslation";

const ServiceConfirmationPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const staticTexts = [
    "Please login to continue.",
    "/auth/login",
    "Booking failed:",
    "Failed to book service. Please try again.",
    "Confirm Booking",
    "Booking Summary",
    "Service",
    "Location",
    "Date & Time",
    "Service Fee to Pay",
    "Processing...",
    "By confirming, you agree to pay the service fee to the scrapper.",
    "/categories",
    "/request-status",
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  // Data
  const [serviceDetails, setServiceDetails] = useState(null);
  const [addressData, setAddressData] = useState(null);
  const [pickupSlot, setPickupSlot] = useState(null);

  useEffect(() => {
    const storedDetails = sessionStorage.getItem("serviceDetails");
    const storedAddress = sessionStorage.getItem("addressData");
    const storedSlot = sessionStorage.getItem("pickupSlot");

    if (!storedDetails || !storedAddress || !storedSlot) {
      navigate(getTranslatedText("/categories"));
      return;
    }

    setServiceDetails(JSON.parse(storedDetails));
    setAddressData(JSON.parse(storedAddress));
    setPickupSlot(JSON.parse(storedSlot));
  }, [navigate, getTranslatedText]);

  const handleConfirm = async () => {
    if (!user) {
      alert(getTranslatedText("Please login to continue."));
      navigate(getTranslatedText("/auth/login"));
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        orderType: "cleaning_service", // Ensure this matches backend constant value
        serviceDetails: {
          serviceType: serviceDetails.serviceType,
          description: serviceDetails.description,
        },
        serviceFee: serviceDetails.fee,
        scrapItems: [], // Empty for service
        totalWeight: 0,
        totalAmount: 0, // Fee is separate
        pickupAddress: {
          street: addressData.address,
          coordinates: addressData.coordinates,
        },
        pickupSlot: {
          date: pickupSlot.date,
          dayName: pickupSlot.dayName,
          slot: pickupSlot.slot,
          timestamp: pickupSlot.timestamp,
        },
        images: serviceDetails.images || [],
        notes: "",
      };

      const response = await orderAPI.create(payload);

      // Clear session
      sessionStorage.removeItem("serviceDetails");
      sessionStorage.removeItem("addressData");
      sessionStorage.removeItem("pickupSlot");
      sessionStorage.removeItem("selectedService");

      navigate(getTranslatedText("/request-status"), {
        state: { requestData: response.data?.order || payload },
        replace: true,
      });
    } catch (error) {
      console.error(getTranslatedText("Booking failed:"), error);
      alert(getTranslatedText("Failed to book service. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!serviceDetails || !addressData || !pickupSlot) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen w-full flex flex-col bg-[#f4ebe2]">
      <div className="flex items-center gap-4 p-4 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100">
          <FaArrowLeft />
        </button>
        <h1 className="text-lg font-bold text-gray-800">
          {getTranslatedText("Confirm Booking")}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
            {getTranslatedText("Booking Summary")}
          </h2>

          <div className="mb-4">
            <p className="text-sm text-gray-500">
              {getTranslatedText("Service")}
            </p>
            <p className="font-bold text-lg text-gray-800">
              {serviceDetails.serviceType}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {serviceDetails.description}
            </p>
          </div>

          <div className="mb-4 flex items-start gap-3">
            <FaMapMarkerAlt className="mt-1 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">
                {getTranslatedText("Location")}
              </p>
              <p className="font-semibold text-gray-800">
                {addressData.address}
              </p>
            </div>
          </div>

          <div className="mb-4 flex items-start gap-3">
            <FaCalendarAlt className="mt-1 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">
                {getTranslatedText("Date & Time")}
              </p>
              <p className="font-semibold text-gray-800">
                {pickupSlot.date} ({pickupSlot.dayName})
              </p>
              <p className="font-semibold text-green-600">{pickupSlot.slot}</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-xl flex justify-between items-center">
            <span className="font-bold text-gray-700">
              {getTranslatedText("Service Fee to Pay")}
            </span>
            <span className="font-bold text-2xl text-green-700">
              ₹{serviceDetails.fee}
            </span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl font-bold text-white shadow-lg text-lg flex items-center justify-center gap-2"
          style={{ backgroundColor: "#22c55e" }}>
          {isSubmitting ? (
            getTranslatedText("Processing...")
          ) : (
            <>
              {getTranslatedText("Confirm Booking")} <FaCheckCircle />
            </>
          )}
        </button>
        <p className="text-xs text-center text-gray-500 mt-2">
          {getTranslatedText(
            "By confirming, you agree to pay the service fee to the scrapper."
          )}
        </p>
      </div>
    </motion.div>
  );
};

export default ServiceConfirmationPage;

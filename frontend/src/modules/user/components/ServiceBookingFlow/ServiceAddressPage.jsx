import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaLocationArrow, FaArrowLeft } from "react-icons/fa";
import { usePageTranslation } from "../../../../hooks/usePageTranslation";

const ServiceAddressPage = () => {
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const staticTexts = [
    "/categories",
    "Geolocation is not supported",
    "Unable to retrieve location",
    "Please provide a valid address and location.",
    "Pickup Address",
    "Locating...",
    "Get Current Location",
    "Address *",
    "House No, Street, Landmark, City...",
    "Continue",
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    // Guard
    const serviceDetails = sessionStorage.getItem("serviceDetails");
    if (!serviceDetails) {
      navigate(getTranslatedText("/categories"));
      return;
    }

    const storedAddress = sessionStorage.getItem("addressData");
    if (storedAddress) {
      const data = JSON.parse(storedAddress);
      setAddress(data.address || "");
      setCoordinates(data.coordinates || null);
    }
  }, [navigate]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(getTranslatedText("Geolocation is not supported"));
      return;
    }

    setIsGettingLocation(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCoordinates(coords);
        setIsGettingLocation(false);
        setAddress(
          `Lat: ${coords.lat.toFixed(6)}, Lng: ${coords.lng.toFixed(6)}`
        ); // Placeholder reverse geocode
      },
      (error) => {
        setIsGettingLocation(false);
        setLocationError(getTranslatedText("Unable to retrieve location"));
      },
      { enableHighAccuracy: true }
    );
  };

  const handleContinue = () => {
    if (!address.trim() || !coordinates) {
      alert(getTranslatedText("Please provide a valid address and location."));
      return;
    }

    const addressData = {
      address: address.trim(),
      coordinates: coordinates,
      timestamp: new Date().toISOString(),
    };
    sessionStorage.setItem("addressData", JSON.stringify(addressData));
    navigate(getTranslatedText("/book-service/schedule"));
  };

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
          {getTranslatedText("Pickup Address")}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <button
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            className="w-full py-3 rounded-xl font-semibold text-white shadow-md flex items-center justify-center gap-2 mb-4"
            style={{ backgroundColor: "#64946e" }}>
            {isGettingLocation ? (
              getTranslatedText("Locating...")
            ) : (
              <>
                <FaLocationArrow /> {getTranslatedText("Get Current Location")}
              </>
            )}
          </button>

          {locationError && (
            <p className="text-red-500 text-sm mb-2">{locationError}</p>
          )}

          <label className="block text-gray-700 font-semibold mb-2">
            {getTranslatedText("Address *")}
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={getTranslatedText(
              "House No, Street, Landmark, City..."
            )}
            rows={4}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          onClick={handleContinue}
          disabled={!address || !coordinates}
          className="w-full py-3 rounded-xl font-bold text-white shadow-lg disabled:opacity-50"
          style={{ backgroundColor: "#22c55e" }}>
          {getTranslatedText("Continue")}
        </button>
      </div>
    </motion.div>
  );
};

export default ServiceAddressPage;

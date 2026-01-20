import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCalendarAlt, FaClock } from "react-icons/fa";
import Calendar from "react-calendar";
import TimePicker from "react-time-picker";
import "react-calendar/dist/Calendar.css";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import { usePageTranslation } from "../../../../hooks/usePageTranslation";

const ServiceSchedulePage = () => {
  const navigate = useNavigate();
  // Initialize with today's date
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Initialize with current time or specific slot
  const [selectedTime, setSelectedTime] = useState("10:00");

  const staticTexts = [
    "Please select a date and time.",
    "Schedule Service",
    "Select Date",
    "Select Time",
    "Continue to Summary",
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "categories",
    "/book-service/confirm",
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    // Guard
    if (
      !sessionStorage.getItem("serviceDetails") ||
      !sessionStorage.getItem("addressData")
    ) {
      navigate(getTranslatedText("categories"));
    }
  }, [navigate, getTranslatedText]);

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) {
      alert(getTranslatedText("Please select a date and time."));
      return;
    }

    // Format Date: YYYY-MM-DD
    // Adjust for timezone to ensure we get the selected calendar date
    const offset = selectedDate.getTimezoneOffset();
    const dateObj = new Date(selectedDate.getTime() - (offset * 60 * 1000));
    const isoDate = dateObj.toISOString().split('T')[0];

    // Get Day Name
    const dayNames = [
      getTranslatedText("Sunday"),
      getTranslatedText("Monday"),
      getTranslatedText("Tuesday"),
      getTranslatedText("Wednesday"),
      getTranslatedText("Thursday"),
      getTranslatedText("Friday"),
      getTranslatedText("Saturday"),
    ];
    const dayName = dayNames[selectedDate.getDay()];

    // Format Time: 14:00 -> 2:00 PM
    const [hours, minutes] = selectedTime.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    const formattedTime = `${formattedHour}:${minutes} ${ampm}`;

    const pickupSlot = {
      date: isoDate,
      dayName: dayName,
      slot: formattedTime, // Using specific time as the slot
      timestamp: Date.now(),
    };

    sessionStorage.setItem("pickupSlot", JSON.stringify(pickupSlot));
    navigate(getTranslatedText("/book-service/confirm"));
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
          {getTranslatedText("Schedule Service")}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <h2 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
            <FaCalendarAlt className="text-green-600" />{" "}
            {getTranslatedText("Select Date")}
          </h2>
          <div className="mb-6 flex justify-center">
            <Calendar
              onChange={setSelectedDate}
              value={selectedDate}
              minDate={new Date()}
              maxDate={new Date(new Date().setDate(new Date().getDate() + 30))} // Allow scheduling up to 30 days
              className="w-full border-none shadow-sm rounded-lg"
            />
          </div>

          <h2 className="text-gray-800 font-bold mb-4 flex items-center gap-2">
            <FaClock className="text-green-600" />{" "}
            {getTranslatedText("Select Time")}
          </h2>
          <div className="flex flex-col gap-4">
            <div className="w-full">
              <TimePicker
                onChange={setSelectedTime}
                value={selectedTime}
                className="w-full"
                clearIcon={null}
                clockIcon={<FaClock className="text-green-600" />}
                disableClock={false} // Enable clock for "watch" feel
                format="h:mm a"
              />
            </div>
            <p className="text-sm text-gray-500 text-center">
              Selected: {selectedTime ? (() => {
                const [h, m] = selectedTime.split(':');
                const hour = parseInt(h);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                return `${hour % 12 || 12}:${m} ${ampm}`;
              })() : '--:--'}
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <button
          onClick={handleContinue}
          disabled={!selectedDate || !selectedTime}
          className="w-full py-3 rounded-xl font-bold text-white shadow-lg disabled:opacity-50"
          style={{ backgroundColor: "#22c55e" }}>
          {getTranslatedText("Continue to Summary")}
        </button>
      </div>
    </motion.div>
  );
};

export default ServiceSchedulePage;

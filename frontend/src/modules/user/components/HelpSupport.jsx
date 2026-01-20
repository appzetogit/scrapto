import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../shared/context/AuthContext";
import { createTicket, TICKET_ROLE } from "../../shared/utils/helpSupportUtils";
import { usePageTranslation } from "../../../hooks/usePageTranslation";

const UserHelpSupport = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const staticTexts = [
    "Your ticket has been submitted. Redirecting you to home...",
    "Submitting your ticket...",
    "Help & Support",
    "Tell us what you need help with. Our admin team will review your request and reach out if needed.",
    "Category",
    "Select an issue",
    "Pickup issue",
    "Payment / payout issue",
    "App not working",
    "Scrapper behaviour",
    "Other",
    "Describe your issue",
    "Please share as much detail as possible...",
    "Submitting...",
    "Submit Request",
  ];

  const { getTranslatedText } = usePageTranslation(staticTexts);

  // After successful submit, show black status box and then redirect home
  useEffect(() => {
    if (success) {
      setStatusMessage(
        getTranslatedText(
          "Your ticket has been submitted. Redirecting you to home..."
        )
      );
      const timer = setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !message.trim()) return;
    if (submitting) return;

    setSubmitting(true);
    setStatusMessage(getTranslatedText("Submitting your ticket..."));
    try {
      createTicket({
        role: TICKET_ROLE.USER,
        userId: user?.id || user?.phone,
        name: user?.name || "User",
        phone: user?.phone || "",
        category,
        message: message.trim(),
      });
      setSuccess(true);
      setMessage("");
      setCategory("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full flex flex-col"
      style={{ backgroundColor: "#f4ebe2" }}>
      {/* Content */}
      <div className="w-full p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Header - Now inside scrollable flow */}
        <div
          className="flex items-center justify-between pb-3 md:pb-6 border-b"
          style={{ borderColor: "rgba(100, 148, 110, 0.2)" }}>
          <h2
            className="text-lg md:text-2xl font-bold"
            style={{ color: "#2d3748" }}>
            {getTranslatedText("Help & Support")}
          </h2>
          <div className="w-10" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 md:p-6 shadow-lg"
          style={{ backgroundColor: "#ffffff" }}>
          <p className="text-xs md:text-sm mb-4" style={{ color: "#718096" }}>
            {getTranslatedText(
              "Tell us what you need help with. Our admin team will review your request and reach out if needed."
            )}
          </p>

          {(submitting || success) && statusMessage && (
            <div
              className="mb-4 text-xs md:text-sm rounded-xl p-3 md:p-4"
              style={{ backgroundColor: "#000000", color: "#e5e7eb" }}>
              {statusMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            <div>
              <label className="block text-xs md:text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                {getTranslatedText("Category")}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base"
                style={{
                  borderColor: category ? '#64946e' : 'rgba(100, 148, 110, 0.3)',
                  color: '#2d3748',
                  backgroundColor: '#f9f9f9'
                }}
              >
                <option value="">{getTranslatedText("Select an issue")}</option>
                <option value="pickup_issue">{getTranslatedText("Pickup issue")}</option>
                <option value="payment_issue">{getTranslatedText("Payment / payout issue")}</option>
                <option value="app_bug">{getTranslatedText("App not working")}</option>
                <option value="scrapper_behavior">{getTranslatedText("Scrapper behaviour")}</option>
                <option value="other">{getTranslatedText("Other")}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs md:text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                {getTranslatedText("Describe your issue")}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder={getTranslatedText("Please share as much detail as possible...")}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base resize-none"
                style={{
                  borderColor: message.trim()
                    ? "#64946e"
                    : "rgba(100, 148, 110, 0.3)",
                  color: "#2d3748",
                  backgroundColor: "#f9f9f9",
                }}
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={submitting || !category || !message.trim()}
              className="w-full py-3 md:py-4 rounded-full text-white font-semibold text-sm md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#64946e" }}>
              {submitting ? getTranslatedText('Submitting...') : getTranslatedText('Submit Request')}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserHelpSupport;

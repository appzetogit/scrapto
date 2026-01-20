import { motion } from "framer-motion";
import { useState } from "react";
import ReferralLeaderboard from "../../shared/components/ReferralLeaderboard";
import { FaTrophy, FaUsers, FaChartLine } from "react-icons/fa";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { useDynamicTranslation } from "../../../hooks/useDynamicTranslation";

const LeaderboardPage = () => {
  const [period, setPeriod] = useState("all"); // all, monthly

  const staticTexts = [
    "Referral Leaderboard",
    "Top referrers in the community",
    "All Time",
    "This Month",
    "Top Users",
  ];

  const { getTranslatedText } = usePageTranslation(staticTexts);
  const { translateText: translateDynamic } = useDynamicTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(100, 148, 110, 0.1)" }}>
            <FaTrophy className="text-3xl" style={{ color: "#64946e" }} />
          </div>
          <div>
            <h1
              className="text-2xl md:text-3xl font-bold mb-1"
              style={{ color: "#2d3748" }}>
              {getTranslatedText("Referral Leaderboard")}
            </h1>
            <p className="text-sm md:text-base" style={{ color: "#718096" }}>
              {getTranslatedText("Top referrers in the community")}
            </p>
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod("all")}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              period === "all" ? "shadow-md" : ""
            }`}
            style={{
              backgroundColor: period === "all" ? "#64946e" : "#f7fafc",
              color: period === "all" ? "#ffffff" : "#2d3748",
            }}>
            {getTranslatedText("All Time")}
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
              period === "monthly" ? "shadow-md" : ""
            }`}
            style={{
              backgroundColor: period === "monthly" ? "#64946e" : "#f7fafc",
              color: period === "monthly" ? "#ffffff" : "#2d3748",
            }}>
            {getTranslatedText("This Month")}
          </button>
        </div>
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <FaUsers className="text-xl" style={{ color: "#64946e" }} />
          <h2
            className="text-lg md:text-xl font-bold"
            style={{ color: "#2d3748" }}>
            {getTranslatedText("Top Users")}
          </h2>
        </div>
        <ReferralLeaderboard userType="user" period={period} />
      </motion.div>
    </div>
  );
};

export default LeaderboardPage;

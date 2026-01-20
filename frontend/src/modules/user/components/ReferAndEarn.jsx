import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useAuth } from "../../shared/context/AuthContext";
import {
  getOrGenerateReferralCode,
  getUserReferralStats,
  getReferralSettings,
  getUserTier,
  processMonthlyTierBonus,
} from "../../shared/utils/referralUtils";
import QRCodeGenerator from "../../shared/components/QRCodeGenerator";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { useDynamicTranslation } from "../../../hooks/useDynamicTranslation";
import {
  FaGift,
  FaCopy,
  FaShareAlt,
  FaWhatsapp,
  FaEnvelope,
  FaQrcode,
  FaUsers,
  FaRupeeSign,
  FaCheckCircle,
  FaClock,
  FaTrophy,
  FaFacebook,
  FaTwitter,
  FaInstagram,
} from "react-icons/fa";

const ReferAndEarn = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    referrals: [],
  });
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [tierInfo, setTierInfo] = useState(null);

  const staticTexts = [
    "Refer & Earn",
    "Invite friends and earn rewards",
    "Your Referral Code",
    "Referral Code",
    "Copied!",
    "Copy",
    "Share Link",
    "Hide",
    "Show",
    "QR Code",
    "WhatsApp",
    "SMS",
    "Email",
    "Facebook",
    "Twitter",
    "Instagram",
    "Message copied! Paste it in your Instagram story or post.",
    "Monthly Tier Bonus",
    "Claim Bonus",
    "Unable to process monthly bonus",
    "Total Referrals",
    "Total Earnings",
    "How It Works",
    "Share Your Code",
    "Share your referral code or link with friends",
    "They Sign Up",
    "Your friend signs up using your code",
    "You Both Earn",
    "Your Referrals",
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const { translateText: translateDynamic } = useDynamicTranslation();

  useEffect(() => {
    if (user) {
      const code = getOrGenerateReferralCode(user.phone || user.id, "user");
      setReferralCode(code);
      setShareLink(`${window.location.origin}?ref=${code}`);

      const referralStats = getUserReferralStats(user.phone || user.id, "user");
      setStats(referralStats);

      const tier = getUserTier(user.phone || user.id, "user");
      setTierInfo(tier);
    }
  }, [user]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (method) => {
    const message = `Join ScrapConnect and get ₹100 welcome bonus! Use my referral code: ${referralCode}\n${shareLink}`;

    switch (method) {
      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank"
        );
        break;
      case "sms":
        window.open(`sms:?body=${encodeURIComponent(message)}`, "_blank");
        break;
      case "email":
        window.open(
          `mailto:?subject=Join ScrapConnect&body=${encodeURIComponent(
            message
          )}`,
          "_blank"
        );
        break;
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            shareLink
          )}`,
          "_blank"
        );
        break;
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            message
          )}&url=${encodeURIComponent(shareLink)}`,
          "_blank"
        );
        break;
      case "instagram":
        // Instagram doesn't support direct sharing, show message
        navigator.clipboard.writeText(
          `${message}\n\nCopy this message and share on Instagram!`
        );
        alert(
          getTranslatedText(
            "Message copied! Paste it in your Instagram story or post."
          )
        );
        break;
      default:
        break;
    }
  };

  const settings = getReferralSettings();

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
            <FaGift className="text-3xl" style={{ color: "#64946e" }} />
          </div>
          <div className="flex-1">
            <h1
              className="text-2xl md:text-3xl font-bold mb-1"
              style={{ color: "#2d3748" }}>
              {getTranslatedText("Refer & Earn")}
            </h1>
            <p className="text-sm md:text-base" style={{ color: "#718096" }}>
              {getTranslatedText("Invite friends and earn rewards")}
            </p>
          </div>
          {tierInfo && (
            <div
              className="px-4 py-2 rounded-xl flex items-center gap-2"
              style={{
                backgroundColor: `${tierInfo.color}20`,
                border: `2px solid ${tierInfo.color}`,
              }}>
              <FaTrophy style={{ color: tierInfo.color }} />
              <span
                className="font-bold text-sm"
                style={{ color: tierInfo.color }}>
                {tierInfo.name}
              </span>
            </div>
          )}
        </div>

        {/* Tier Progress */}
        {tierInfo && tierInfo.nextTier && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span style={{ color: "#718096" }}>
                {tierInfo.nextTier.referralsNeeded} more referrals to reach{" "}
                {tierInfo.nextTier.name}
              </span>
              <span className="font-semibold" style={{ color: "#2d3748" }}>
                {tierInfo.totalReferrals}/{tierInfo.nextTier.minReferrals}
              </span>
            </div>
            <div
              className="h-2 rounded-full"
              style={{ backgroundColor: "rgba(100, 148, 110, 0.1)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(tierInfo.totalReferrals / tierInfo.nextTier.minReferrals) *
                    100
                    }%`,
                }}
                className="h-full rounded-full"
                style={{ backgroundColor: tierInfo.color }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Referral Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
        <h2
          className="text-lg md:text-xl font-bold mb-4"
          style={{ color: "#2d3748" }}>
          {getTranslatedText("Your Referral Code")}
        </h2>

        {/* Code Display */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between p-4 rounded-xl border-2"
            style={{
              backgroundColor: "rgba(100, 148, 110, 0.05)",
              borderColor: "#64946e",
            }}>
            <div className="flex-1">
              <p className="text-xs mb-1" style={{ color: "#718096" }}>
                {getTranslatedText("Referral Code")}
              </p>
              <p
                className="text-2xl md:text-3xl font-bold"
                style={{ color: "#64946e" }}>
                {referralCode}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyCode}
              className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
              style={{ backgroundColor: "#64946e", color: "#ffffff" }}>
              {copied ? (
                <>
                  <FaCheckCircle />
                  {getTranslatedText("Copied!")}
                </>
              ) : (
                <>
                  <FaCopy />
                  {getTranslatedText("Copy")}
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Share Link */}
        <div className="mb-4">
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: "#2d3748" }}>
            {getTranslatedText("Share Link")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 px-4 py-2 rounded-xl border-2 text-sm"
              style={{
                borderColor: "#e2e8f0",
                backgroundColor: "#f7fafc",
                color: "#2d3748",
              }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              style={{ backgroundColor: "#f7fafc", color: "#2d3748" }}>
              <FaCopy />
            </motion.button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="mb-4">
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full px-4 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mb-3"
            style={{ backgroundColor: "#f7fafc", color: "#2d3748" }}>
            <FaQrcode />
            {showQR
              ? getTranslatedText("Hide")
              : getTranslatedText("Show")}{" "}
            {getTranslatedText("QR Code")}
          </button>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-center">
              <QRCodeGenerator value={shareLink} size={200} />
            </motion.div>
          )}
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare("whatsapp")}
            className="p-3 rounded-xl font-semibold text-sm flex flex-col items-center gap-2 transition-all"
            style={{ backgroundColor: "#25D366", color: "#ffffff" }}>
            <FaWhatsapp className="text-xl" />
            <span className="text-xs">{getTranslatedText("WhatsApp")}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare("sms")}
            className="p-3 rounded-xl font-semibold text-sm flex flex-col items-center gap-2 transition-all"
            style={{ backgroundColor: "#f7fafc", color: "#2d3748" }}>
            <FaShareAlt className="text-xl" />
            <span className="text-xs">{getTranslatedText("SMS")}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare("email")}
            className="p-3 rounded-xl font-semibold text-sm flex flex-col items-center gap-2 transition-all"
            style={{ backgroundColor: "#f7fafc", color: "#2d3748" }}>
            <FaEnvelope className="text-xl" />
            <span className="text-xs">{getTranslatedText("Email")}</span>
          </motion.button>
        </div>

        {/* Social Media Share */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare("facebook")}
            className="p-3 rounded-xl font-semibold text-sm flex flex-col items-center gap-2 transition-all"
            style={{ backgroundColor: "#1877F2", color: "#ffffff" }}>
            <FaFacebook className="text-xl" />
            <span className="text-xs">{getTranslatedText("Facebook")}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare("twitter")}
            className="p-3 rounded-xl font-semibold text-sm flex flex-col items-center gap-2 transition-all"
            style={{ backgroundColor: "#1DA1F2", color: "#ffffff" }}>
            <FaTwitter className="text-xl" />
            <span className="text-xs">{getTranslatedText("Twitter")}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare("instagram")}
            className="p-3 rounded-xl font-semibold text-sm flex flex-col items-center gap-2 transition-all"
            style={{ backgroundColor: "#E4405F", color: "#ffffff" }}>
            <FaInstagram className="text-xl" />
            <span className="text-xs">{getTranslatedText("Instagram")}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Monthly Tier Bonus */}
      {tierInfo && tierInfo.monthlyBonus > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3
                className="text-base md:text-lg font-bold mb-1"
                style={{ color: "#2d3748" }}>
                {getTranslatedText("Monthly Tier Bonus")}
              </h3>
              <p className="text-sm" style={{ color: "#718096" }}>
                You're eligible for ₹{tierInfo.monthlyBonus} monthly bonus as{" "}
                {tierInfo.name} tier member
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const result = processMonthlyTierBonus(
                  user.phone || user.id,
                  "user"
                );
                if (result.success) {
                  alert(`Monthly tier bonus of ₹${result.amount} credited!`);
                  // Reload stats
                  const referralStats = getUserReferralStats(
                    user.phone || user.id,
                    "user"
                  );
                  setStats(referralStats);
                } else {
                  alert(
                    result.error ||
                    getTranslatedText("Unable to process monthly bonus")
                  );
                }
              }}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              style={{ backgroundColor: "#64946e", color: "#ffffff" }}>
              {getTranslatedText("Claim Bonus")}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(100, 148, 110, 0.1)" }}>
              <FaUsers className="text-xl" style={{ color: "#64946e" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#718096" }}>
                {getTranslatedText("Total Referrals")}
              </p>
              <p className="text-2xl font-bold" style={{ color: "#2d3748" }}>
                {stats.totalReferrals}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(100, 148, 110, 0.1)" }}>
              <FaRupeeSign className="text-xl" style={{ color: "#64946e" }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: "#718096" }}>
                {getTranslatedText("Total Earnings")}
              </p>
              <p className="text-2xl font-bold" style={{ color: "#2d3748" }}>
                ₹{stats.totalEarnings}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tier Benefits */}
      {tierInfo && tierInfo.bonusPercent > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaTrophy className="text-2xl" style={{ color: tierInfo.color }} />
            <h2
              className="text-lg md:text-xl font-bold"
              style={{ color: "#2d3748" }}>
              {tierInfo.name} Tier Benefits
            </h2>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FaCheckCircle style={{ color: "#10b981" }} />
              <span className="text-sm" style={{ color: "#2d3748" }}>
                {tierInfo.bonusPercent}% bonus on all referral rewards
              </span>
            </div>
            {tierInfo.monthlyBonus > 0 && (
              <div className="flex items-center gap-2">
                <FaCheckCircle style={{ color: "#10b981" }} />
                <span className="text-sm" style={{ color: "#2d3748" }}>
                  ₹{tierInfo.monthlyBonus} monthly tier bonus
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
        <h2
          className="text-lg md:text-xl font-bold mb-4"
          style={{ color: "#2d3748" }}>
          {getTranslatedText("How It Works")}
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(100, 148, 110, 0.1)" }}>
              <span className="font-bold" style={{ color: "#64946e" }}>
                1
              </span>
            </div>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: "#2d3748" }}>
                {getTranslatedText("Share Your Code")}
              </h3>
              <p className="text-sm" style={{ color: "#718096" }}>
                {getTranslatedText(
                  "Share your referral code or link with friends"
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(100, 148, 110, 0.1)" }}>
              <span className="font-bold" style={{ color: "#64946e" }}>
                2
              </span>
            </div>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: "#2d3748" }}>
                {getTranslatedText("They Sign Up")}
              </h3>
              <p className="text-sm" style={{ color: "#718096" }}>
                {getTranslatedText("Your friend signs up using your code")}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "rgba(100, 148, 110, 0.1)" }}>
              <span className="font-bold" style={{ color: "#64946e" }}>
                3
              </span>
            </div>
            <div>
              <h3 className="font-semibold mb-1" style={{ color: "#2d3748" }}>
                {getTranslatedText("You Both Earn")}
              </h3>
              <p className="text-sm" style={{ color: "#718096" }}>
                You get ₹{settings.userRewards.signupBonus} and they get ₹
                {settings.userRewards.refereeWelcomeBonus} welcome bonus
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Referrals List with Milestones */}
      {stats.referrals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
          <h2
            className="text-lg md:text-xl font-bold mb-4"
            style={{ color: "#2d3748" }}>
            {getTranslatedText("Your Referrals")}
          </h2>
          <div className="space-y-4">
            {stats.referrals.map((referral, index) => {
              const milestones = referral.milestones || {};
              const rewards = referral.rewards?.referrerRewards || [];
              const totalEarned = rewards.reduce(
                (sum, r) => sum + (r.amount || 0),
                0
              );

              return (
                <div
                  key={referral.id || index}
                  className="p-4 rounded-xl border"
                  style={{
                    backgroundColor: "#f7fafc",
                    borderColor: "#e2e8f0",
                  }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(100, 148, 110, 0.1)" }}>
                        <FaUsers style={{ color: "#64946e" }} />
                      </div>
                      <div>
                        <p
                          className="font-semibold text-sm"
                          style={{ color: "#2d3748" }}>
                          Referred User
                        </p>
                        <p className="text-xs" style={{ color: "#718096" }}>
                          {new Date(referral.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ color: "#64946e" }}>
                        ₹{totalEarned}
                      </p>
                      <p className="text-xs" style={{ color: "#718096" }}>
                        {referral.status === "active" ? (
                          <span className="flex items-center gap-1">
                            <FaCheckCircle />
                            Active
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FaClock />
                            Pending
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Milestone Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: "#718096" }}>Milestones:</span>
                      <span
                        className="font-semibold"
                        style={{ color: "#2d3748" }}>
                        {Object.values(milestones).filter(Boolean).length}/3
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${milestones.refereeRegistered
                              ? "bg-green-500"
                              : "bg-gray-300"
                            }`}
                        />
                        <span className="text-xs" style={{ color: "#718096" }}>
                          Registered {milestones.refereeRegistered ? "✓" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${milestones.refereeFirstRequest
                              ? "bg-green-500"
                              : "bg-gray-300"
                            }`}
                        />
                        <span className="text-xs" style={{ color: "#718096" }}>
                          First Request{" "}
                          {milestones.refereeFirstRequest ? "✓" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${milestones.refereeFirstCompletion
                              ? "bg-green-500"
                              : "bg-gray-300"
                            }`}
                        />
                        <span className="text-xs" style={{ color: "#718096" }}>
                          First Completion{" "}
                          {milestones.refereeFirstCompletion ? "✓" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ReferAndEarn;

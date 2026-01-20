import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import {
  getOrGenerateReferralCode,
  getUserReferralStats,
  getReferralSettings,
  getUserTier,
  processMonthlyTierBonus
} from '../../shared/utils/referralUtils';
import QRCodeGenerator from '../../shared/components/QRCodeGenerator';
import usePageTranslation from '../../../hooks/usePageTranslation';
// Trigger rebuild for ReferenceError: usePageTranslation
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
  FaInstagram
} from 'react-icons/fa';

const ReferAndEarn = () => {
  const staticTexts = [
    "Refer & Earn",
    "Invite other scrappers and earn rewards",
    "{count} more referrals to reach {tierName}",
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
    "Monthly Tier Bonus",
    "You're eligible for ₹{amount} monthly bonus as {tierName} tier member",
    "Claim Bonus",
    "Total Referrals",
    "Total Earnings",
    "{tierName} Tier Benefits",
    "{percent}% bonus on all referral rewards",
    "₹{amount} monthly tier bonus",
    "How It Works",
    "Share Your Code",
    "Share your referral code or link with other scrappers",
    "They Join & Complete KYC",
    "Your referral signs up and completes KYC verification",
    "You Both Earn",
    "You get ₹{signupBonus} when they sign up, ₹{kycBonus} when KYC verified, and more when they subscribe!",
    "Your Referrals",
    "Referred Scrapper",
    "Active",
    "Pending",
    "Milestones:",
    "Registered",
    "KYC Verified",
    "Subscribed",
    "First Pickup",
    "Message copied! Paste it in your Instagram story or post.",
    "Join ScrapConnect as a Scrapper and earn money! Use my referral code: {code}\n{link}",
    "Monthly tier bonus of ₹{amount} credited!",
    "Unable to process monthly bonus"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    referrals: []
  });
  const [copied, setCopied] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [showQR, setShowQR] = useState(false);
  const [tierInfo, setTierInfo] = useState(null);

  useEffect(() => {
    const scrapperUser = JSON.parse(localStorage.getItem('scrapperUser') || '{}');
    if (scrapperUser.phone || scrapperUser.id) {
      const code = getOrGenerateReferralCode(scrapperUser.phone || scrapperUser.id, 'scrapper');
      setReferralCode(code);
      setShareLink(`${window.location.origin}/scrapper/login?ref=${code}`);

      const referralStats = getUserReferralStats(scrapperUser.phone || scrapperUser.id, 'scrapper');
      setStats(referralStats);

      const tier = getUserTier(scrapperUser.phone || scrapperUser.id, 'scrapper');
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
    const message = getTranslatedText('Join ScrapConnect as a Scrapper and earn money! Use my referral code: {code}\n{link}', { code: referralCode, link: shareLink });

    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'sms':
        window.open(`sms:?body=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'email':
        window.open(`mailto:?subject=Join ScrapConnect as Scrapper&body=${encodeURIComponent(message)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(shareLink)}`, '_blank');
        break;
      case 'instagram':
        navigator.clipboard.writeText(`${message}\n\nCopy this message and share on Instagram!`);
        alert(getTranslatedText('Message copied! Paste it in your Instagram story or post.'));
        break;
      default:
        break;
    }
  };

  const settings = getReferralSettings();

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center bg-emerald-500/10"
          >
            <FaGift className="text-3xl text-emerald-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold mb-1 text-slate-800">
              {getTranslatedText("Refer & Earn")}
            </h1>
            <p className="text-sm md:text-base text-slate-500">
              {getTranslatedText("Invite other scrappers and earn rewards")}
            </p>
          </div>
          {tierInfo && (
            <div
              className="px-4 py-2 rounded-xl flex items-center gap-2"
              style={{ backgroundColor: `${tierInfo.color}20`, border: `2px solid ${tierInfo.color}` }}
            >
              <FaTrophy style={{ color: tierInfo.color }} />
              <span className="font-bold text-sm" style={{ color: tierInfo.color }}>
                {tierInfo.name}
              </span>
            </div>
          )}
        </div>

        {/* Tier Progress */}
        {tierInfo && tierInfo.nextTier && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-500">
                {getTranslatedText("{count} more referrals to reach {tierName}", { count: tierInfo.nextTier.referralsNeeded, tierName: tierInfo.nextTier.name })}
              </span>
              <span className="font-semibold text-slate-800">
                {tierInfo.totalReferrals}/{tierInfo.nextTier.minReferrals}
              </span>
            </div>
            <div className="h-2 rounded-full bg-emerald-500/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(tierInfo.totalReferrals / tierInfo.nextTier.minReferrals) * 100}%` }}
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
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
      >
        <h2 className="text-lg md:text-xl font-bold mb-4 text-slate-800">
          {getTranslatedText("Your Referral Code")}
        </h2>

        {/* Code Display */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between p-4 rounded-xl border-2 bg-emerald-500/5 border-emerald-500"
          >
            <div className="flex-1">
              <p className="text-xs mb-1 text-slate-500">{getTranslatedText("Referral Code")}</p>
              <p className="text-2xl md:text-3xl font-bold text-emerald-600">
                {referralCode}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyCode}
              className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all bg-emerald-600 text-white"
            >
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
          <label className="block text-sm font-semibold mb-2 text-slate-800">
            {getTranslatedText("Share Link")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 px-4 py-2 rounded-xl border-2 text-sm border-slate-200 bg-slate-50 text-slate-800"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-all bg-slate-50 text-slate-800"
            >
              <FaCopy />
            </motion.button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="mb-4">
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full px-4 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all mb-3 bg-slate-50 text-slate-800"
          >
            <FaQrcode />
            {showQR ? getTranslatedText('Hide') : getTranslatedText('Show')} {getTranslatedText('QR Code')}
          </button>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex justify-center"
            >
              <QRCodeGenerator value={shareLink} size={200} />
            </motion.div>
          )}
        </div>

        {/* Share Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare('whatsapp')}
            className="p-3 rounded-xl font-semibold text-sm flex flex-col items-center gap-2 transition-all"
            style={{ backgroundColor: '#25D366', color: '#ffffff' }}
          >
            <FaWhatsapp className="text-xl" />
            <span className="text-xs">{getTranslatedText("WhatsApp")}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare('sms')}
            className="p-3 rounded-xl font-semibold text-sm flex flex-col items-center gap-2 transition-all bg-slate-50 text-slate-800"
          >
            <FaShareAlt className="text-xl" />
            <span className="text-xs">{getTranslatedText("SMS")}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare('email')}
            className="p-3 rounded-xl font-semibold text-sm flex flex-col items-center gap-2 transition-all bg-slate-50 text-slate-800"
          >
            <FaEnvelope className="text-xl" />
            <span className="text-xs">{getTranslatedText("Email")}</span>
          </motion.button>
        </div>

        {/* Social Media Share */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare('facebook')}
            className="p-3 rounded-xl font-semibold text-sm flex flex-col items-center gap-2 transition-all"
            style={{ backgroundColor: '#1877F2', color: '#ffffff' }}
          >
            <FaFacebook className="text-xl" />
            <span className="text-xs">{getTranslatedText("Facebook")}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare('twitter')}
            className="p-3 rounded-xl font-semibold text-sm flex flex-col items-center gap-2 transition-all"
            style={{ backgroundColor: '#1DA1F2', color: '#ffffff' }}
          >
            <FaTwitter className="text-xl" />
            <span className="text-xs">{getTranslatedText("Twitter")}</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleShare('instagram')}
            className="p-3 rounded-xl font-semibold text-sm flex flex-col items-center gap-2 transition-all"
            style={{ backgroundColor: '#E4405F', color: '#ffffff' }}
          >
            <FaInstagram className="text-xl" />
            <span className="text-xs">{getTranslatedText("Instagram")}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Monthly Tier Bonus */}
      {
        tierInfo && tierInfo.monthlyBonus > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base md:text-lg font-bold mb-1 text-slate-800">
                  {getTranslatedText("Monthly Tier Bonus")}
                </h3>
                <p className="text-sm text-slate-500">
                  {getTranslatedText("You're eligible for ₹{amount} monthly bonus as {tierName} tier member", { amount: tierInfo.monthlyBonus, tierName: tierInfo.name })}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const scrapperUser = JSON.parse(localStorage.getItem('scrapperUser') || '{}');
                  const userId = scrapperUser.phone || scrapperUser.id;
                  const result = processMonthlyTierBonus(userId, 'scrapper');
                  if (result.success) {
                    alert(getTranslatedText("Monthly tier bonus of ₹{amount} credited!", { amount: result.amount }));
                    // Reload stats
                    const referralStats = getUserReferralStats(userId, 'scrapper');
                    setStats(referralStats);
                    const tier = getUserTier(userId, 'scrapper');
                    setTierInfo(tier);
                  } else {
                    alert(result.error || getTranslatedText('Unable to process monthly bonus'));
                  }
                }}
                className="px-4 py-2 rounded-xl font-semibold text-sm transition-all bg-emerald-600 text-white"
              >
                {getTranslatedText("Claim Bonus")}
              </motion.button>
            </div>
          </motion.div>
        )
      }

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10"
            >
              <FaUsers className="text-xl text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{getTranslatedText("Total Referrals")}</p>
              <p className="text-2xl font-bold text-slate-800">
                {stats.totalReferrals}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10"
            >
              <FaRupeeSign className="text-xl text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{getTranslatedText("Total Earnings")}</p>
              <p className="text-2xl font-bold text-slate-800">
                ₹{stats.totalEarnings}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tier Benefits */}
      {
        tierInfo && tierInfo.bonusPercent > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <FaTrophy className="text-2xl" style={{ color: tierInfo.color }} />
              <h2 className="text-lg md:text-xl font-bold text-slate-800">
                {getTranslatedText("{tierName} Tier Benefits", { tierName: tierInfo.name })}
              </h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FaCheckCircle className="text-emerald-500" />
                <span className="text-sm text-slate-800">
                  {getTranslatedText("{percent}% bonus on all referral rewards", { percent: tierInfo.bonusPercent })}
                </span>
              </div>
              {tierInfo.monthlyBonus > 0 && (
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500" />
                  <span className="text-sm text-slate-800">
                    {getTranslatedText("₹{amount} monthly tier bonus", { amount: tierInfo.monthlyBonus })}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )
      }

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
      >
        <h2 className="text-lg md:text-xl font-bold mb-4 text-slate-800">
          {getTranslatedText("How It Works")}
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-500/10"
            >
              <span className="font-bold text-emerald-600">1</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-slate-800">
                {getTranslatedText("Share Your Code")}
              </h3>
              <p className="text-sm text-slate-500">
                {getTranslatedText("Share your referral code or link with other scrappers")}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-500/10"
            >
              <span className="font-bold text-emerald-600">2</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-slate-800">
                {getTranslatedText("They Join & Complete KYC")}
              </h3>
              <p className="text-sm text-slate-500">
                {getTranslatedText("Your referral signs up and completes KYC verification")}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-500/10"
            >
              <span className="font-bold text-emerald-600">3</span>
            </div>
            <div>
              <h3 className="font-semibold mb-1 text-slate-800">
                {getTranslatedText("You Both Earn")}
              </h3>
              <p className="text-sm text-slate-500">
                {getTranslatedText("You get ₹{signupBonus} when they sign up, ₹{kycBonus} when KYC verified, and more when they subscribe!", { signupBonus: settings.scrapperRewards.signupBonus, kycBonus: settings.scrapperRewards.refereeWelcomeBonus })}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Referrals List with Milestones */}
      {
        stats.referrals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
          >
            <h2 className="text-lg md:text-xl font-bold mb-4 text-slate-800">
              {getTranslatedText("Your Referrals")}
            </h2>
            <div className="space-y-4">
              {stats.referrals.map((referral, index) => {
                const milestones = referral.milestones || {};
                const rewards = referral.rewards?.referrerRewards || [];
                const totalEarned = rewards.reduce((sum, r) => sum + (r.amount || 0), 0);

                return (
                  <div
                    key={referral.id || index}
                    className="p-4 rounded-xl border bg-slate-50 border-slate-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-500/10"
                        >
                          <FaUsers className="text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-800">
                            {getTranslatedText("Referred Scrapper")}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold mb-1 text-emerald-600">
                          ₹{totalEarned}
                        </p>
                        <p className="text-xs text-slate-500">
                          {referral.status === 'active' ? (
                            <span className="flex items-center gap-1">
                              <FaCheckCircle />
                              {getTranslatedText("Active")}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <FaClock />
                              {getTranslatedText("Pending")}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Milestone Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{getTranslatedText("Milestones:")}</span>
                        <span className="font-semibold text-slate-800">
                          {Object.values(milestones).filter(Boolean).length}/4
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${milestones.refereeRegistered ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-xs text-slate-500">
                            {getTranslatedText("Registered")} {milestones.refereeRegistered ? '✓' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${milestones.refereeKYCVerified ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-xs text-slate-500">
                            {getTranslatedText("KYC Verified")} {milestones.refereeKYCVerified ? '✓' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${milestones.refereeSubscribed ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-xs text-slate-500">
                            {getTranslatedText("Subscribed")} {milestones.refereeSubscribed ? '✓' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${milestones.refereeFirstPickup ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-xs text-slate-500">
                            {getTranslatedText("First Pickup")} {milestones.refereeFirstPickup ? '✓' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )
      }
    </div >
  );
};

export default ReferAndEarn;


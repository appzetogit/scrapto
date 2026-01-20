import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { referralAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import {
  FaGift,
  FaSave,
  FaToggleOn,
  FaToggleOff,
  FaRupeeSign,
  FaUsers,
  FaTruck,
  FaSpinner
} from 'react-icons/fa';

const ReferralSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const staticTexts = [
    "Failed to load referral settings",
    "Failed to save settings",
    "Error saving settings",
    "Failed to load settings",
    "Referral Settings",
    "Configure referral system and reward amounts",
    "Referral System Status",
    "Enable or disable the referral system globally",
    "Referral system is active",
    "Referral system is disabled",
    "Cross-Referral System",
    "Allow users to refer scrappers and vice versa",
    "Cross-referrals are enabled",
    "Cross-referrals are disabled",
    "User Referral Rewards",
    "Signup Bonus (Referrer)",
    "Amount credited to referrer when referee signs up",
    "Welcome Bonus (Referee)",
    "Amount credited to new user when they sign up with referral code",
    "Scrapper Referral Rewards",
    "Amount credited to new scrapper when they sign up with referral code",
    "Cross-Referral Rewards",
    "User → Scrapper Referrals",
    "Referrer Bonus (User gets)",
    "Welcome Bonus (Scrapper gets)",
    "Scrapper → User Referrals",
    "Referrer Bonus (Scrapper gets)",
    "Welcome Bonus (User gets)",
    "Saving...",
    "Saved!",
    "Save Settings",
    "✓ Referral system is active",
    "✗ Referral system is disabled",
    "✓ Cross-referrals are enabled",
    "✗ Cross-referrals are disabled"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await referralAPI.getSettings();
      if (response.success && response.data?.settings) {
        setSettings(response.data.settings);
      } else {
        // Fallback default structure if API returns empty
        setSettings({
          enabled: true,
          allowCrossReferrals: true,
          userRewards: { signupBonus: 50, refereeWelcomeBonus: 25 },
          scrapperRewards: { signupBonus: 100, refereeWelcomeBonus: 50 },
          crossReferralRewards: {
            userToScrapper: { referrerBonus: 75, refereeWelcomeBonus: 100 },
            scrapperToUser: { referrerBonus: 75, refereeWelcomeBonus: 50 }
          }
        });
      }
    } catch (err) {
      console.error('Failed to load settings', err);
      setError(getTranslatedText('Failed to load referral settings'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await referralAPI.updateSettings(settings);
      if (response.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(getTranslatedText('Failed to save settings'));
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      alert(getTranslatedText('Error saving settings'));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = () => {
    setSettings(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const handleChange = (path, value) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const keys = path.split('.');
      let current = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = parseFloat(value) || 0;
      return newSettings;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-green-600" />
      </div>
    );
  }

  if (!settings) return <div className="p-4 text-center text-red-500">{getTranslatedText("Failed to load settings")}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}
            >
              <FaGift className="text-3xl" style={{ color: '#64946e' }} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#2d3748' }}>
                {getTranslatedText("Referral Settings")}
              </h1>
              <p className="text-sm md:text-base" style={{ color: '#718096' }}>
                {getTranslatedText("Configure referral system and reward amounts")}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enable/Disable Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold mb-1" style={{ color: '#2d3748' }}>
              {getTranslatedText("Referral System Status")}
            </h2>
            <p className="text-sm" style={{ color: '#718096' }}>
              {getTranslatedText("Enable or disable the referral system globally")}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleToggle}
            className="flex items-center gap-2"
          >
            {settings.enabled ? (
              <FaToggleOn className="text-4xl" style={{ color: '#10b981' }} />
            ) : (
              <FaToggleOff className="text-4xl" style={{ color: '#cbd5e0' }} />
            )}
          </motion.button>
        </div>
        <div
          className={`p-3 rounded-lg ${settings.enabled ? 'bg-green-50' : 'bg-gray-50'
            }`}
        >
          <p className="text-sm font-medium" style={{ color: settings.enabled ? '#10b981' : '#718096' }}>
            {settings.enabled ? getTranslatedText('✓ Referral system is active') : getTranslatedText('✗ Referral system is disabled')}
          </p>
        </div>
      </motion.div>

      {/* Cross-Referral Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold mb-1" style={{ color: '#2d3748' }}>
              {getTranslatedText("Cross-Referral System")}
            </h2>
            <p className="text-sm" style={{ color: '#718096' }}>
              {getTranslatedText("Allow users to refer scrappers and vice versa")}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSettings(prev => ({
                ...prev,
                allowCrossReferrals: !prev.allowCrossReferrals
              }));
            }}
            className="flex items-center gap-2"
          >
            {settings.allowCrossReferrals ? (
              <FaToggleOn className="text-4xl" style={{ color: '#10b981' }} />
            ) : (
              <FaToggleOff className="text-4xl" style={{ color: '#cbd5e0' }} />
            )}
          </motion.button>
        </div>
        <div
          className={`p-3 rounded-lg ${settings.allowCrossReferrals ? 'bg-green-50' : 'bg-gray-50'
            }`}
        >
          <p className="text-sm font-medium" style={{ color: settings.allowCrossReferrals ? '#10b981' : '#718096' }}>
            {settings.allowCrossReferrals ? getTranslatedText('✓ Cross-referrals are enabled') : getTranslatedText('✗ Cross-referrals are disabled')}
          </p>
        </div>
      </motion.div>

      {/* User Rewards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <FaUsers className="text-2xl" style={{ color: '#64946e' }} />
          <h2 className="text-lg md:text-xl font-bold" style={{ color: '#2d3748' }}>
            {getTranslatedText("User Referral Rewards")}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("Signup Bonus (Referrer)")}
            </label>
            <p className="text-xs mb-2" style={{ color: '#718096' }}>
              {getTranslatedText("Amount credited to referrer when referee signs up")}
            </p>
            <div className="relative">
              <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#64946e' }} />
              <input
                type="number"
                value={settings.userRewards?.signupBonus || 0}
                onChange={(e) => handleChange('userRewards.signupBonus', e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
                style={{
                  borderColor: '#e2e8f0',
                  backgroundColor: '#f7fafc',
                  color: '#2d3748'
                }}
                min="0"
                step="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("Welcome Bonus (Referee)")}
            </label>
            <p className="text-xs mb-2" style={{ color: '#718096' }}>
              {getTranslatedText("Amount credited to new user when they sign up with referral code")}
            </p>
            <div className="relative">
              <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#64946e' }} />
              <input
                type="number"
                value={settings.userRewards?.refereeWelcomeBonus || 0}
                onChange={(e) => handleChange('userRewards.refereeWelcomeBonus', e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
                style={{
                  borderColor: '#e2e8f0',
                  backgroundColor: '#f7fafc',
                  color: '#2d3748'
                }}
                min="0"
                step="1"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scrapper Rewards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <FaTruck className="text-2xl" style={{ color: '#64946e' }} />
          <h2 className="text-lg md:text-xl font-bold" style={{ color: '#2d3748' }}>
            {getTranslatedText("Scrapper Referral Rewards")}
          </h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("Signup Bonus (Referrer)")}
            </label>
            <p className="text-xs mb-2" style={{ color: '#718096' }}>
              {getTranslatedText("Amount credited to referrer when referee signs up")}
            </p>
            <div className="relative">
              <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#64946e' }} />
              <input
                type="number"
                value={settings.scrapperRewards?.signupBonus || 0}
                onChange={(e) => handleChange('scrapperRewards.signupBonus', e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
                style={{
                  borderColor: '#e2e8f0',
                  backgroundColor: '#f7fafc',
                  color: '#2d3748'
                }}
                min="0"
                step="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("Welcome Bonus (Referee)")}
            </label>
            <p className="text-xs mb-2" style={{ color: '#718096' }}>
              {getTranslatedText("Amount credited to new scrapper when they sign up with referral code")}
            </p>
            <div className="relative">
              <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#64946e' }} />
              <input
                type="number"
                value={settings.scrapperRewards?.refereeWelcomeBonus || 0}
                onChange={(e) => handleChange('scrapperRewards.refereeWelcomeBonus', e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
                style={{
                  borderColor: '#e2e8f0',
                  backgroundColor: '#f7fafc',
                  color: '#2d3748'
                }}
                min="0"
                step="1"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cross-Referral Rewards */}
      {settings.allowCrossReferrals && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <FaGift className="text-2xl" style={{ color: '#3b82f6' }} />
            <h2 className="text-lg md:text-xl font-bold" style={{ color: '#2d3748' }}>
              {getTranslatedText("Cross-Referral Rewards")}
            </h2>
          </div>

          <div className="space-y-6">
            {/* User to Scrapper */}
            <div>
              <h3 className="text-base font-semibold mb-3" style={{ color: '#2d3748' }}>
                {getTranslatedText("User → Scrapper Referrals")}
              </h3>
              <div className="space-y-4 pl-4 border-l-2" style={{ borderColor: '#e2e8f0' }}>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Referrer Bonus (User gets)")}
                  </label>
                  <div className="relative">
                    <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#64946e' }} />
                    <input
                      type="number"
                      value={settings.crossReferralRewards?.userToScrapper?.referrerBonus || 0}
                      onChange={(e) => handleChange('crossReferralRewards.userToScrapper.referrerBonus', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Welcome Bonus (Scrapper gets)")}
                  </label>
                  <div className="relative">
                    <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#64946e' }} />
                    <input
                      type="number"
                      value={settings.crossReferralRewards?.userToScrapper?.refereeWelcomeBonus || 0}
                      onChange={(e) => handleChange('crossReferralRewards.userToScrapper.refereeWelcomeBonus', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Scrapper to User */}
            <div>
              <h3 className="text-base font-semibold mb-3" style={{ color: '#2d3748' }}>
                {getTranslatedText("Scrapper → User Referrals")}
              </h3>
              <div className="space-y-4 pl-4 border-l-2" style={{ borderColor: '#e2e8f0' }}>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Referrer Bonus (Scrapper gets)")}
                  </label>
                  <div className="relative">
                    <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#64946e' }} />
                    <input
                      type="number"
                      value={settings.crossReferralRewards?.scrapperToUser?.referrerBonus || 0}
                      onChange={(e) => handleChange('crossReferralRewards.scrapperToUser.referrerBonus', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Welcome Bonus (User gets)")}
                  </label>
                  <div className="relative">
                    <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#64946e' }} />
                    <input
                      type="number"
                      value={settings.crossReferralRewards?.scrapperToUser?.refereeWelcomeBonus || 0}
                      onChange={(e) => handleChange('crossReferralRewards.scrapperToUser.refereeWelcomeBonus', e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl font-semibold text-base flex items-center gap-2 transition-all"
          style={{
            backgroundColor: saved ? '#10b981' : '#64946e',
            color: '#ffffff'
          }}
        >
          {saving ? (
            <>
              <FaSpinner className="animate-spin" />
              {getTranslatedText("Saving...")}
            </>
          ) : saved ? (
            <>
              <FaSave />
              {getTranslatedText("Saved!")}
            </>
          ) : (
            <>
              <FaSave />
              {getTranslatedText("Save Settings")}
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default ReferralSettings;

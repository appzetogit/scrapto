import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { referralAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import {
  FaTrophy,
  FaSave,
  FaRupeeSign,
  FaPercent,
  FaPlus,
  FaTrash,
  FaSpinner
} from 'react-icons/fa';

const DEFAULT_TIERS = [
  { name: 'bronze', minReferrals: 0, bonusPercent: 5, monthlyBonus: 0, color: '#cd7f32' },
  { name: 'silver', minReferrals: 10, bonusPercent: 10, monthlyBonus: 500, color: '#c0c0c0' },
  { name: 'gold', minReferrals: 50, bonusPercent: 15, monthlyBonus: 2000, color: '#ffd700' },
  { name: 'platinum', minReferrals: 100, bonusPercent: 20, monthlyBonus: 5000, color: '#e5e4e2' }
];

const TierManagement = () => {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const staticTexts = [
    "Error saving tiers",
    "Delete {name} tier?",
    "Failed to delete tier",
    "Tier Management",
    "Configure referral tier thresholds and bonuses",
    "Add Tier",
    "Tier",
    "Minimum {count} referrals required",
    "Tier Name",
    "Color (Hex)",
    "Min Referrals",
    "Bonus %",
    "Monthly Bonus (₹)",
    "Saving...",
    "Saved!",
    "Save All Changes",
    "bronze",
    "silver",
    "gold",
    "platinum",
    "New Tier"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    setLoading(true);
    try {
      const response = await referralAPI.getAllTiers();
      if (response.success && response.data?.tiers && response.data.tiers.length > 0) {
        setTiers(response.data.tiers);
      } else {
        // If no tiers exist in DB, start with defaults (but not saved yet)
        setTiers(DEFAULT_TIERS);
      }
    } catch (err) {
      console.error('Failed to load tiers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const promises = tiers.map(tier => {
        if (tier._id) {
          return referralAPI.updateTier(tier._id, tier);
        } else {
          return referralAPI.createTier(tier);
        }
      });

      await Promise.all(promises);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadTiers(); // Reload to get IDs
    } catch (err) {
      console.error('Error saving tiers:', err);
      alert(getTranslatedText('Error saving tiers'));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (index, field, value) => {
    const newTiers = [...tiers];
    if (field === 'name' || field === 'color') {
      newTiers[index][field] = value;
    } else {
      newTiers[index][field] = parseFloat(value) || 0;
    }
    setTiers(newTiers);
  };

  const handleAddTier = () => {
    setTiers([
      ...tiers,
      { name: getTranslatedText('New Tier'), minReferrals: 0, bonusPercent: 0, monthlyBonus: 0, color: '#3b82f6' }
    ]);
  };

  const handleDeleteTier = async (index) => {
    const tier = tiers[index];
    if (tier._id) {
      if (!window.confirm(getTranslatedText('Delete {name} tier?', { name: tier.name }))) return;
      try {
        await referralAPI.deleteTier(tier._id);
        const newTiers = tiers.filter((_, i) => i !== index);
        setTiers(newTiers);
      } catch (err) {
        alert(getTranslatedText('Failed to delete tier'));
      }
    } else {
      // Just remove from local state if not saved
      const newTiers = tiers.filter((_, i) => i !== index);
      setTiers(newTiers);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-green-600" />
      </div>
    );
  }

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
              <FaTrophy className="text-3xl" style={{ color: '#64946e' }} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#2d3748' }}>
                {getTranslatedText("Tier Management")}
              </h1>
              <p className="text-sm md:text-base" style={{ color: '#718096' }}>
                {getTranslatedText("Configure referral tier thresholds and bonuses")}
              </p>
            </div>
          </div>
          <button
            onClick={handleAddTier}
            className="px-4 py-2 bg-blue-500 text-white rounded-xl flex items-center gap-2 font-semibold hover:bg-blue-600 transition-colors"
          >
            <FaPlus /> {getTranslatedText("Add Tier")}
          </button>
        </div>
      </motion.div>

      {/* Tiers List */}
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {tiers.map((tier, index) => (
            <motion.div
              key={tier._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-4 md:p-6 relative group"
            >
              <button
                onClick={() => handleDeleteTier(index)}
                className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title={getTranslatedText("Delete Tier")}
              >
                <FaTrash />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                  style={{ backgroundColor: `${tier.color}20`, border: `2px solid ${tier.color}` }}
                >
                  <FaTrophy style={{ color: tier.color }} />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold capitalize" style={{ color: '#2d3748' }}>
                    {getTranslatedText(tier.name)} {getTranslatedText("Tier")}
                  </h2>
                  <p className="text-xs" style={{ color: '#718096' }}>
                    {getTranslatedText("Minimum {count} referrals required", { count: tier.minReferrals })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-1">
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Tier Name")}
                  </label>
                  <input
                    type="text"
                    value={getTranslatedText(tier.name)}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                    style={{
                      borderColor: '#e2e8f0',
                      backgroundColor: '#f7fafc',
                      color: '#2d3748'
                    }}
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Color (Hex)")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={tier.color}
                      onChange={(e) => handleChange(index, 'color', e.target.value)}
                      className="h-10 w-12 rounded border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={tier.color}
                      onChange={(e) => handleChange(index, 'color', e.target.value)}
                      className="w-full px-2 py-2 rounded-xl border-2 text-sm"
                    />
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Min Referrals")}
                  </label>
                  <input
                    type="number"
                    value={tier.minReferrals}
                    onChange={(e) => handleChange(index, 'minReferrals', e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                    style={{
                      borderColor: '#e2e8f0',
                      backgroundColor: '#f7fafc',
                      color: '#2d3748'
                    }}
                    min="0"
                  />
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Bonus %")}
                  </label>
                  <div className="relative">
                    <FaPercent className="absolute right-3 top-1/2 transform -translate-y-1/2" style={{ color: '#64946e' }} />
                    <input
                      type="number"
                      value={tier.bonusPercent}
                      onChange={(e) => handleChange(index, 'bonusPercent', e.target.value)}
                      className="w-full px-4 py-2 pr-8 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
                <div className="lg:col-span-1">
                  <label className="block text-xs font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Monthly Bonus (₹)")}
                  </label>
                  <div className="relative">
                    <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#64946e' }} />
                    <input
                      type="number"
                      value={tier.monthlyBonus}
                      onChange={(e) => handleChange(index, 'monthlyBonus', e.target.value)}
                      className="w-full pl-8 pr-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex justify-end pb-8"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 rounded-xl font-bold text-lg flex items-center gap-3 transition-all shadow-lg hover:shadow-xl"
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
              {getTranslatedText("Save All Changes")}
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
};

export default TierManagement;

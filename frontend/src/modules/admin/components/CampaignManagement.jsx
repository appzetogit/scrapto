import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { referralAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import {
  FaGift,
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaCalendarAlt,
  FaUsers,
  FaRupeeSign,
  FaSave,
  FaTimes,
  FaSpinner
} from 'react-icons/fa';

const CampaignManagement = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    startDate: '',
    endDate: '',
    targetAudience: 'both', // user, scrapper, both
    customRewards: {
      signupBonus: 0,
      refereeWelcomeBonus: 0
    },
    status: 'active'
  });
  const staticTexts = [
    "Campaign created successfully",
    "Failed to create campaign",
    "Campaign updated successfully",
    "Failed to update campaign",
    "Are you sure you want to delete this campaign?",
    "Failed to delete campaign",
    "Active",
    "Inactive",
    "Campaign Management",
    "Create and manage referral campaigns",
    "Create Campaign",
    "No Campaigns Yet",
    "Create your first referral campaign to boost growth",
    "{bonus} bonus",
    "Edit",
    "Delete",
    "Edit Campaign",
    "Campaign Name",
    "e.g., Summer Referral Boost",
    "Campaign Code (Optional)",
    "e.g., SUMMER2024 (Auto-generated if empty)",
    "Description",
    "Campaign description...",
    "Start Date",
    "End Date",
    "Target Audience",
    "Both Users & Scrappers",
    "Users Only",
    "Scrappers Only",
    "Signup Bonus (₹)",
    "Welcome Bonus (₹)",
    "Update"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const response = await referralAPI.getAllCampaigns();
      if (response.success && response.data?.campaigns) {
        setCampaigns(response.data.campaigns);
      } else {
        setCampaigns([]);
      }
    } catch (err) {
      console.error('Failed to load campaigns', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setFormLoading(true);
    try {
      if (!formData.code) {
        // Auto-generate code if missing
        formData.code = formData.name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 1000);
      }
      const response = await referralAPI.createCampaign(formData);
      if (response.success) {
        loadCampaigns();
        setShowCreateModal(false);
        resetForm();
        alert(getTranslatedText('Campaign created successfully'));
      } else {
        alert(response.message || getTranslatedText('Failed to create campaign'));
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      alert(getTranslatedText('Failed to create campaign'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async () => {
    setFormLoading(true);
    try {
      const response = await referralAPI.updateCampaign(editingCampaign._id, formData);
      if (response.success) {
        loadCampaigns();
        setEditingCampaign(null);
        setShowCreateModal(false);
        resetForm();
        alert(getTranslatedText('Campaign updated successfully'));
      } else {
        alert(response.message || getTranslatedText('Failed to update campaign'));
      }
    } catch (err) {
      console.error('Error updating campaign:', err);
      alert(getTranslatedText('Failed to update campaign'));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (campaignId) => {
    if (window.confirm(getTranslatedText('Are you sure you want to delete this campaign?'))) {
      try {
        const response = await referralAPI.deleteCampaign(campaignId);
        if (response.success) {
          loadCampaigns();
        } else {
          alert(getTranslatedText('Failed to delete campaign'));
        }
      } catch (err) {
        console.error('Error deleting campaign:', err);
      }
    }
  };

  const handleToggleStatus = async (campaignId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const response = await referralAPI.updateCampaign(campaignId, { status: newStatus });
      if (response.success) {
        // Optimistic update or reload
        loadCampaigns();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      startDate: '',
      endDate: '',
      targetAudience: 'both',
      customRewards: {
        signupBonus: 0,
        refereeWelcomeBonus: 0
      },
      status: 'active'
    });
  };

  const openEditModal = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name || '',
      code: campaign.code || '',
      description: campaign.description || '',
      startDate: campaign.startDate ? new Date(campaign.startDate).toISOString().split('T')[0] : '',
      endDate: campaign.endDate ? new Date(campaign.endDate).toISOString().split('T')[0] : '',
      targetAudience: campaign.targetAudience || 'both',
      customRewards: campaign.customRewards || {
        signupBonus: 0,
        refereeWelcomeBonus: 0
      },
      status: campaign.status || 'active'
    });
    setShowCreateModal(true);
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span
          className="px-3 py-1 rounded-full text-xs font-semibold"
          style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}
        >
          {getTranslatedText("Active")}
        </span>
      );
    }
    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' }}
      >
        {getTranslatedText("Inactive")}
      </span>
    );
  };

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
                {getTranslatedText("Campaign Management")}
              </h1>
              <p className="text-sm md:text-base" style={{ color: '#718096' }}>
                {getTranslatedText("Create and manage referral campaigns")}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetForm();
              setEditingCampaign(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
            style={{ backgroundColor: '#64946e', color: '#ffffff' }}
          >
            <FaPlus />
            {getTranslatedText("Create Campaign")}
          </motion.button>
        </div>
      </motion.div>

      {/* Campaigns List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden min-h-[400px]"
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <FaSpinner className="animate-spin text-4xl text-green-600" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center">
            <FaGift className="text-5xl mx-auto mb-4" style={{ color: '#cbd5e0' }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("No Campaigns Yet")}
            </h3>
            <p className="text-sm mb-4" style={{ color: '#718096' }}>
              {getTranslatedText("Create your first referral campaign to boost growth")}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetForm();
                setEditingCampaign(null);
                setShowCreateModal(true);
              }}
              className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
              style={{ backgroundColor: '#64946e', color: '#ffffff' }}
            >
              <FaPlus className="inline mr-2" />
              {getTranslatedText("Create Campaign")}
            </motion.button>
          </div>
        ) : (
          campaigns.map((campaign, index) => (
            <motion.div
              key={campaign._id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 md:p-6 hover:bg-gray-50 transition-all ${index !== campaigns.length - 1 ? 'border-b' : ''
                }`}
              style={{ borderColor: '#e2e8f0' }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base md:text-xl font-bold" style={{ color: '#2d3748' }}>
                      {campaign.name}
                    </h3>
                    {campaign.code && (
                      <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono">
                        {campaign.code}
                      </span>
                    )}
                    {getStatusBadge(campaign.status)}
                  </div>
                  <p className="text-sm mb-2" style={{ color: '#718096' }}>
                    {campaign.description}
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs md:text-sm" style={{ color: '#718096' }}>
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt />
                      <span>
                        {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaUsers />
                      <span className="capitalize">{getTranslatedText(campaign.targetAudience)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaRupeeSign />
                      <span>{getTranslatedText("{bonus} bonus", { bonus: campaign.customRewards?.signupBonus || 0 })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggleStatus(campaign._id, campaign.status)}
                    className="p-2 rounded-lg transition-all"
                    style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}
                  >
                    {campaign.status === 'active' ? (
                      <FaToggleOn className="text-2xl" style={{ color: '#10b981' }} />
                    ) : (
                      <FaToggleOff className="text-2xl" style={{ color: '#cbd5e0' }} />
                    )}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => openEditModal(campaign)}
                    className="px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all"
                    style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                  >
                    <FaEdit />
                    {getTranslatedText("Edit")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(campaign._id)}
                    className="px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all"
                    style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}
                  >
                    <FaTrash />
                    {getTranslatedText("Delete")}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowCreateModal(false);
              setEditingCampaign(null);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold" style={{ color: '#2d3748' }}>
                    {editingCampaign ? getTranslatedText('Edit Campaign') : getTranslatedText('Create Campaign')}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingCampaign(null);
                      resetForm();
                    }}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <FaTimes style={{ color: '#718096' }} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                      {getTranslatedText("Campaign Name")}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                      placeholder={getTranslatedText("e.g., Summer Referral Boost")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                      {getTranslatedText("Campaign Code (Optional)")}
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm uppercase"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                      placeholder={getTranslatedText("e.g., SUMMER2024 (Auto-generated if empty)")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                      {getTranslatedText("Description")}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                      rows="3"
                      placeholder={getTranslatedText("Campaign description...")}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                        {getTranslatedText("Start Date")}
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                        style={{
                          borderColor: '#e2e8f0',
                          backgroundColor: '#f7fafc',
                          color: '#2d3748'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                        {getTranslatedText("End Date")}
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                        style={{
                          borderColor: '#e2e8f0',
                          backgroundColor: '#f7fafc',
                          color: '#2d3748'
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                      {getTranslatedText("Target Audience")}
                    </label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                    >
                      <option value="both">{getTranslatedText("Both Users & Scrappers")}</option>
                      <option value="user">{getTranslatedText("Users Only")}</option>
                      <option value="scrapper">{getTranslatedText("Scrappers Only")}</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                        {getTranslatedText("Signup Bonus (₹)")}
                      </label>
                      <div className="relative">
                        <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#64946e' }} />
                        <input
                          type="number"
                          value={formData.customRewards.signupBonus}
                          onChange={(e) => setFormData({
                            ...formData,
                            customRewards: {
                              ...formData.customRewards,
                              signupBonus: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full pl-8 pr-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
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
                        {getTranslatedText("Welcome Bonus (₹)")}
                      </label>
                      <div className="relative">
                        <FaRupeeSign className="absolute left-3 top-1/2 transform -translate-y-1/2" style={{ color: '#64946e' }} />
                        <input
                          type="number"
                          value={formData.customRewards.refereeWelcomeBonus}
                          onChange={(e) => setFormData({
                            ...formData,
                            customRewards: {
                              ...formData.customRewards,
                              refereeWelcomeBonus: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-full pl-8 pr-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
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

                <div className="flex gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={editingCampaign ? handleUpdate : handleCreate}
                    disabled={formLoading}
                    className="flex-1 px-4 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                  >
                    {formLoading && <FaSpinner className="animate-spin" />}
                    <FaSave />
                    {editingCampaign ? getTranslatedText('Update') : getTranslatedText('Create')} {getTranslatedText('Campaign')}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingCampaign(null);
                      resetForm();
                    }}
                    className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                    style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}
                  >
                    {getTranslatedText("Cancel")}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CampaignManagement;

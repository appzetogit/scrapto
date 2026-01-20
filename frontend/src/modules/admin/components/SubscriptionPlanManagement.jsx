import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSave } from 'react-icons/fa';
import { adminAPI, subscriptionAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const SubscriptionPlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const staticTexts = [
    "Failed to load subscription plans",
    "Plan updated successfully!",
    "Plan created successfully!",
    "Failed to save plan",
    "Failed to save plan. Please try again.",
    "Are you sure you want to delete this plan? This action cannot be undone.",
    "Plan deleted successfully!",
    "Failed to delete plan",
    "Failed to delete plan. Please try again.",
    "1 month",
    "months",
    "1 year",
    "years",
    "days",
    "Subscription Plan Management",
    "Create and manage subscription plans for scrappers",
    "Create Plan",
    "Loading plans...",
    "Retry",
    "Popular",
    "+{count} more features",
    "Active",
    "Inactive",
    "Max {count} pickups",
    "Unlimited",
    "Edit",
    "Edit Plan",
    "Create New Plan",
    "Plan Name *",
    "e.g., Basic Plan",
    "Description",
    "Plan description...",
    "Price (₹) *",
    "Duration *",
    "Duration Type *",
    "Monthly",
    "Quarterly",
    "Yearly",
    "Max Pickups (leave empty for unlimited)",
    "Features",
    "Add a feature...",
    "Add",
    "Popular",
    "Save Plan",
    "Cancel"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'INR',
    duration: '',
    durationType: 'monthly',
    features: [],
    maxPickups: '',
    priority: 0,
    isActive: true,
    isPopular: false,
    sortOrder: 0,
    type: 'general'
  });
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getAllSubscriptionPlans();
      if (response.success && response.data?.plans) {
        setPlans(response.data.plans);
      } else {
        setError(getTranslatedText('Failed to load subscription plans'));
      }
    } catch (err) {
      console.error('Error loading plans:', err);
      setError(err.message || getTranslatedText('Failed to load subscription plans'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'INR',
      duration: '',
      durationType: 'monthly',
      features: [],
      maxPickups: '',
      priority: 0,
      isActive: true,
      isPopular: false,
      sortOrder: 0,
      type: 'general'
    });
    setEditingId(null);
    setShowCreateModal(true);
  };

  const handleEdit = (plan) => {
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price || '',
      currency: plan.currency || 'INR',
      duration: plan.duration || '',
      durationType: plan.durationType || 'monthly',
      features: plan.features || [],
      maxPickups: plan.maxPickups || '',
      priority: plan.priority || 0,
      isActive: plan.isActive !== undefined ? plan.isActive : true,
      isPopular: plan.isPopular || false,
      sortOrder: plan.sortOrder || 0,
      type: plan.type || 'general'
    });
    setEditingId(plan._id || plan.id);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    try {
      const planData = {
        ...formData,
        price: parseFloat(formData.price),
        duration: parseInt(formData.duration),
        maxPickups: formData.maxPickups ? parseInt(formData.maxPickups) : null,
        priority: parseInt(formData.priority) || 0,
        sortOrder: parseInt(formData.sortOrder) || 0
      };

      let response;
      if (editingId) {
        response = await adminAPI.updatePlan(editingId, planData);
      } else {
        response = await adminAPI.createPlan(planData);
      }

      if (response.success) {
        await loadPlans();
        setShowCreateModal(false);
        setEditingId(null);
        alert(editingId ? getTranslatedText('Plan updated successfully!') : getTranslatedText('Plan created successfully!'));
      } else {
        throw new Error(response.error || response.message || getTranslatedText('Failed to save plan'));
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      alert(error.message || getTranslatedText('Failed to save plan. Please try again.'));
    }
  };

  const handleDelete = async (plan) => {
    const planId = plan._id || plan.id;

    let confirmMessage = getTranslatedText('Are you sure you want to delete this plan? This action cannot be undone.');

    if (plan.type === 'market_price') {
      confirmMessage = getTranslatedText('Warning: This is a Market Price plan. Deleting it might affect users accessing market prices. Are you sure you want to delete this plan?');
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await adminAPI.deletePlan(planId);
      if (response.success) {
        await loadPlans();
        alert(getTranslatedText('Plan deleted successfully!'));
      } else {
        throw new Error(response.error || response.message || getTranslatedText('Failed to delete plan'));
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert(error.message || getTranslatedText('Failed to delete plan. Please try again.'));
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const formatDuration = (duration, durationType) => {
    if (durationType === 'monthly') {
      return duration === 1 ? getTranslatedText('1 month') : `${duration} ${getTranslatedText('months')}`;
    } else if (durationType === 'quarterly') {
      return `${duration} ${getTranslatedText('months')}`;
    } else if (durationType === 'yearly') {
      return duration === 12 ? getTranslatedText('1 year') : `${duration / 12} ${getTranslatedText('years')}`;
    }
    return `${duration} ${getTranslatedText('days')}`;
  };

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl md:rounded-2xl shadow-lg p-3 md:p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
          <div>
            <h1 className="text-lg md:text-2xl lg:text-3xl font-bold mb-1 md:mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("Subscription Plan Management")}
            </h1>
            <p className="text-xs md:text-sm lg:text-base" style={{ color: '#718096' }}>
              {getTranslatedText("Create and manage subscription plans for scrappers")}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            className="px-4 py-2 rounded-lg md:rounded-xl font-semibold text-sm md:text-base flex items-center gap-2 transition-all"
            style={{ backgroundColor: '#64946e', color: '#ffffff' }}
          >
            <FaPlus />
            <span>{getTranslatedText("Create Plan")}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Loading / Error State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center"
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#64946e' }} />
          <p className="text-sm md:text-base font-semibold" style={{ color: '#2d3748' }}>
            {getTranslatedText("Loading plans...")}
          </p>
        </motion.div>
      )}

      {error && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl shadow-lg p-8 md:p-12 text-center"
        >
          <p className="text-sm md:text-base mb-4" style={{ color: '#718096' }}>
            {error}
          </p>
          <button
            onClick={loadPlans}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: '#64946e' }}
          >
            {getTranslatedText("Retry")}
          </button>
        </motion.div>
      )}

      {/* Plans Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {plans.map((plan) => (
            <motion.div
              key={plan._id || plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl md:rounded-2xl shadow-lg p-4 md:p-6 relative"
            >
              {plan.isPopular && (
                <div className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#64946e' }}>
                  {getTranslatedText("Popular")}
                </div>
              )}
              <div className="mb-4">
                <h3 className="text-lg md:text-xl font-bold mb-2" style={{ color: '#2d3748' }}>
                  {plan.name}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${plan.type === 'market_price' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    {plan.type === 'market_price' ? 'Market Price' : 'General'}
                  </span>
                </h3>
                {plan.description && (
                  <p className="text-xs md:text-sm mb-3" style={{ color: '#718096' }}>
                    {plan.description}
                  </p>
                )}
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-2xl md:text-3xl font-bold" style={{ color: '#64946e' }}>
                    ₹{plan.price}
                  </span>
                  <span className="text-sm" style={{ color: '#718096' }}>
                    / {formatDuration(plan.duration, plan.durationType)}
                  </span>
                </div>
                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-2 mb-4">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="text-xs md:text-sm flex items-start gap-2" style={{ color: '#4b5563' }}>
                        <FaCheck className="text-green-600 mt-1 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-xs" style={{ color: '#718096' }}>
                        {getTranslatedText("+{count} more features", { count: plan.features.length - 3 })}
                      </li>
                    )}
                  </ul>
                )}
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {plan.isActive ? getTranslatedText('Active') : getTranslatedText('Inactive')}
                  </span>
                  {plan.maxPickups && (
                    <span className="text-xs" style={{ color: '#718096' }}>
                      {getTranslatedText("Max {count} pickups", { count: plan.maxPickups })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEdit(plan)}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#f7fafc', color: '#64946e' }}
                >
                  <FaEdit />
                  <span>{getTranslatedText("Edit")}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDelete(plan)}
                  className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                >
                  <FaTrash />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl md:text-2xl font-bold mb-4" style={{ color: '#2d3748' }}>
              {editingId ? getTranslatedText('Edit Plan') : getTranslatedText('Create New Plan')}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                  {getTranslatedText("Plan Name *")}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#e2e8f0', focusBorderColor: '#64946e' }}
                  placeholder={getTranslatedText("e.g., Basic Plan")}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                  {getTranslatedText("Description")}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                  style={{ borderColor: '#e2e8f0', focusBorderColor: '#64946e' }}
                  rows="3"
                  placeholder={getTranslatedText("Plan description...")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Price (₹) *")}
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e2e8f0', focusBorderColor: '#64946e' }}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Duration *")}
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e2e8f0', focusBorderColor: '#64946e' }}
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Plan Type *")}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e2e8f0', focusBorderColor: '#64946e' }}
                  >
                    <option value="general">{getTranslatedText("General Subscription")}</option>
                    <option value="market_price">{getTranslatedText("Market Price Subscription")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Duration Type *")}
                  </label>
                  <select
                    value={formData.durationType}
                    onChange={(e) => setFormData({ ...formData, durationType: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e2e8f0', focusBorderColor: '#64946e' }}
                  >
                    <option value="monthly">{getTranslatedText("Monthly")}</option>
                    <option value="quarterly">{getTranslatedText("Quarterly")}</option>
                    <option value="yearly">{getTranslatedText("Yearly")}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Max Pickups (leave empty for unlimited)")}
                  </label>
                  <input
                    type="number"
                    value={formData.maxPickups}
                    onChange={(e) => setFormData({ ...formData, maxPickups: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e2e8f0', focusBorderColor: '#64946e' }}
                    min="0"
                    placeholder={getTranslatedText("Unlimited")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Active")}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPopular"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isPopular" className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Popular")}
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#64946e' }}
                >
                  <FaSave />
                  <span>{getTranslatedText("Save Plan")}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingId(null);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl font-semibold transition-all"
                  style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}
                >
                  {getTranslatedText("Cancel")}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SubscriptionPlanManagement;

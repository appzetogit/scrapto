import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSave, FaCog, FaPercent, FaInfoCircle } from 'react-icons/fa';
import { adminAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const SystemSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const staticTexts = [
    "System Settings",
    "Manage global platform configurations",
    "Platform Fees",
    "Configure commission rates for different services",
    "Scrap Commission Percentage",
    "Percentage deducted from scrapper wallet on order completion",
    "Save Changes",
    "Saving...",
    "Settings updated successfully",
    "Failed to update settings",
    "Loading settings...",
    "Value"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: getTranslatedText("Failed to load settings") });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (key, value) => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const response = await adminAPI.updateSetting(key, value);
      
      if (response.success) {
        setMessage({ type: 'success', text: getTranslatedText("Settings updated successfully") });
        // Update local state
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      setMessage({ type: 'error', text: getTranslatedText("Failed to update settings") });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const scrapCommission = settings.find(s => s.key === 'scrap_commission_percentage') || { value: 1 };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaCog className="text-emerald-600" />
            {getTranslatedText("System Settings")}
          </h1>
          <p className="text-gray-500 text-sm">{getTranslatedText("Manage global platform configurations")}</p>
        </div>
      </div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg text-sm font-medium ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {/* Platform Fees Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <FaPercent />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{getTranslatedText("Platform Fees")}</h2>
              <p className="text-xs text-gray-500">{getTranslatedText("Configure commission rates for different services")}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 hover:border-emerald-200 transition-colors bg-white">
              <div className="flex-1">
                <h3 className="font-bold text-gray-700">{getTranslatedText("Scrap Commission Percentage")}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <FaInfoCircle className="text-emerald-500" />
                  {getTranslatedText("Percentage deducted from scrapper wallet on order completion")}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={scrapCommission.value}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      handleUpdateSetting('scrap_commission_percentage', val);
                    }}
                    className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-gray-700 text-center pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                </div>
                
                {saving && (
                   <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
                      <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      {getTranslatedText("Saving...")}
                   </div>
                )}
              </div>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
               <p className="text-xs text-orange-700 flex items-start gap-2">
                 <FaInfoCircle className="mt-0.5" />
                 <span>
                    <strong>Note:</strong> Changes to the commission rate will apply to all <strong>Scrap Service</strong> orders completed after the update. Existing orders already completed will not be affected. 
                 </span>
               </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SystemSettings;

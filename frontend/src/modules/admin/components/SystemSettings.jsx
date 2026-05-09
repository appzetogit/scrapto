import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaSave, FaCog, FaPercent, FaInfoCircle, FaVideo, FaUpload, FaPlayCircle, FaTrash } from 'react-icons/fa';
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
    "Value",
    "App Tutorial Video (Scrappers)",
    "Video showing how to use the scrapper app",
    "Tutorial Video URL",
    "Upload Video",
    "Uploading video...",
    "Video uploaded successfully",
    "Failed to upload video",
    "Remove Video",
    "Are you sure you want to remove this video?"
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
        // Update local state - handling new keys correctly
        setSettings(prev => {
          const exists = prev.find(s => s.key === key);
          if (exists) {
            return prev.map(s => s.key === key ? { ...s, value } : s);
          } else {
            return [...prev, { key, value }];
          }
        });
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      setMessage({ type: 'error', text: getTranslatedText("Failed to update settings") });
    } finally {
      setSaving(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const formData = new FormData();
      formData.append('media', file);
      
      const response = await adminAPI.uploadSystemMedia(formData);
      
      if (response.success) {
        const videoUrl = response.url;
        await handleUpdateSetting('scrapper_tutorial_video', videoUrl);
        setMessage({ type: 'success', text: getTranslatedText("Video uploaded successfully") });
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      setMessage({ type: 'error', text: getTranslatedText("Failed to upload video") });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!window.confirm(getTranslatedText("Are you sure you want to remove this video?"))) return;
    await handleUpdateSetting('scrapper_tutorial_video', '');
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

        {/* Tutorial Video Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FaVideo />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{getTranslatedText("App Tutorial Video (Scrappers)")}</h2>
              <p className="text-xs text-gray-500">{getTranslatedText("Video showing how to use the scrapper app")}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-col gap-4 p-4 rounded-xl border border-gray-100 bg-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-700">{getTranslatedText("Tutorial Video URL")}</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {settings.find(s => s.key === 'scrapper_tutorial_video')?.value || 'No video uploaded'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {settings.find(s => s.key === 'scrapper_tutorial_video')?.value && (
                    <button
                      onClick={handleDeleteVideo}
                      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors text-sm border border-red-200"
                      disabled={saving}
                    >
                      <FaTrash />
                      {getTranslatedText("Remove Video")}
                    </button>
                  )}
                  <label className="relative flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 cursor-pointer transition-colors text-sm">
                    <FaUpload />
                    {getTranslatedText("Upload Video")}
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleVideoUpload}
                      className="hidden"
                      disabled={saving}
                    />
                  </label>
                </div>
              </div>

              {settings.find(s => s.key === 'scrapper_tutorial_video')?.value && (
                <div className="mt-4 aspect-video bg-black rounded-xl overflow-hidden relative group">
                  <video
                    src={settings.find(s => s.key === 'scrapper_tutorial_video')?.value}
                    className="w-full h-full object-contain"
                    controls
                  />
                </div>
              )}
            </div>

            {saving && (
              <div className="flex items-center justify-center gap-2 text-sm text-blue-600 font-medium">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                {getTranslatedText("Saving...")}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SystemSettings;

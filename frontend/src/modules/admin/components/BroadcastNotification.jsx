import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBroadcastTower, FaPaperPlane, FaUsers, FaUserSecret, FaInfoCircle, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { adminAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const BroadcastNotification = () => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    target: 'all' // all, users, scrappers
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const staticTexts = [
    "Broadcast Notification",
    "Send real-time alerts to all users or scrappers",
    "Target Audience",
    "Everyone",
    "Users Only",
    "Scrappers Only",
    "Notification Title",
    "Enter a catchy headline...",
    "Message Body",
    "Type your message here...",
    "Live Preview",
    "Send Broadcast",
    "Sending...",
    "Broadcast sent successfully!",
    "Failed to send broadcast. Please try again.",
    "Please fill in all fields."
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.body) {
      setStatus({ type: 'error', message: getTranslatedText("Please fill in all fields.") });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const response = await adminAPI.broadcastNotification(formData);
      if (response.success) {
        setStatus({ type: 'success', message: getTranslatedText("Broadcast sent successfully!") });
        setFormData({ title: '', body: '', target: 'all' });
      } else {
        throw new Error(response.message || getTranslatedText("Failed to send broadcast. Please try again."));
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || getTranslatedText("Failed to send broadcast. Please try again.") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
      >
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <FaBroadcastTower className="text-3xl" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-gray-800">{getTranslatedText("Broadcast Notification")}</h1>
            <p className="text-gray-500 font-medium">{getTranslatedText("Send real-time alerts to all users or scrappers")}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composer */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Target Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">{getTranslatedText("Target Audience")}</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'all', label: 'Everyone', icon: FaUsers, color: 'bg-indigo-50 text-indigo-600' },
                  { id: 'users', label: 'Users Only', icon: FaUsers, color: 'bg-green-50 text-green-600' },
                  { id: 'scrappers', label: 'Scrappers Only', icon: FaUserSecret, color: 'bg-orange-50 text-orange-600' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, target: item.id })}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                      formData.target === item.id 
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-md transform scale-105' 
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                  >
                    <item.icon className={`text-xl mb-2 ${formData.target === item.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${formData.target === item.id ? 'text-indigo-600' : 'text-gray-500'}`}>
                      {getTranslatedText(item.label)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{getTranslatedText("Notification Title")}</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={getTranslatedText("Enter a catchy headline...")}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 transition-all outline-none text-gray-800 font-semibold shadow-inner"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">{getTranslatedText("Message Body")}</label>
              <textarea
                rows="4"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder={getTranslatedText("Type your message here...")}
                className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:bg-white focus:border-indigo-500 transition-all outline-none text-gray-800 font-medium shadow-inner resize-none"
              ></textarea>
            </div>

            {/* Status Message */}
            <AnimatePresence>
              {status.message && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`flex items-center gap-3 p-4 rounded-2xl ${
                    status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {status.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                  <span className="text-sm font-bold">{status.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              type="submit"
              className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 text-white font-black text-lg shadow-lg transition-all ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-blue-500 hover:shadow-indigo-200'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {getTranslatedText("Sending...")}
                </>
              ) : (
                <>
                  <FaPaperPlane className="text-sm" />
                  {getTranslatedText("Send Broadcast")}
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gray-900 rounded-[3rem] shadow-2xl p-4 border-[8px] border-gray-800 h-[600px] relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-10" />
          
          <div className="h-full w-full bg-[#1a1a1a] rounded-[2rem] overflow-hidden relative">
            {/* Wallpaper-like background */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-purple-900/40" />
            
            <div className="relative p-6 space-y-6">
              <div className="flex justify-between items-center text-white/70 text-xs font-bold">
                <span>9:41</span>
                <div className="flex gap-1.5">
                  <div className="w-4 h-2.5 bg-white/20 rounded-sm" />
                  <div className="w-4 h-2.5 bg-white/20 rounded-sm" />
                  <div className="w-6 h-2.5 bg-white/40 rounded-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">{getTranslatedText("Live Preview")}</p>
                <div className="h-0.5 w-8 bg-indigo-500 rounded-full" />
              </div>

              {/* Notification UI */}
              <AnimatePresence>
                {(formData.title || formData.body) && (
                  <motion.div
                    initial={{ opacity: 0, y: -50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-3xl shadow-2xl"
                  >
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                        <FaBroadcastTower />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tight">Scrapto</span>
                          <span className="text-[10px] text-white/40 font-medium">now</span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate">{formData.title || 'Notification Title'}</h4>
                        <p className="text-xs text-white/70 leading-relaxed line-clamp-3 mt-1">
                          {formData.body || 'Your message will appear here...'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!formData.title && !formData.body && (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-white/10">
                    <FaInfoCircle className="text-3xl" />
                  </div>
                  <p className="text-white/20 text-sm font-medium">Composer focus will show<br/>the live notification here</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BroadcastNotification;

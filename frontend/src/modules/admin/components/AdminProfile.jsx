import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../shared/context/AdminAuthContext';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaKey,
  FaSave,
  FaEdit,
  FaTimes,
  FaLock,
  FaCalendarAlt,
  FaShieldAlt,
  FaBell,
  FaGlobe,
  FaCamera
} from 'react-icons/fa';

const AdminProfile = () => {
  const { admin, login } = useAdminAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    bio: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true
  });
  const [language, setLanguage] = useState('en');
  const staticTexts = [
    "Profile updated successfully!",
    "New passwords do not match!",
    "Password must be at least 6 characters long!",
    "Password changed successfully!",
    "Loading...",
    "My Profile",
    "Manage your account settings and preferences",
    "Edit Profile",
    "Full Name",
    "Email",
    "Phone",
    "Role",
    "Department",
    "Member Since",
    "Bio",
    "Save Changes",
    "Cancel",
    "Change Password",
    "Change",
    "Current Password",
    "New Password",
    "Confirm New Password",
    "Update Password",
    "Notifications",
    "Email Notifications",
    "Sms Notifications",
    "Push Notifications",
    "Preferences",
    "Language",
    "English",
    "Hindi",
    "Marathi",
    "Account Statistics",
    "Total Actions",
    "Last Login"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  useEffect(() => {
    if (admin) {
      setFormData({
        name: admin.name || 'Admin User',
        email: admin.email || 'admin@scrapconnect.com',
        phone: admin.phone || '+91 98765 43210',
        role: admin.role || 'Administrator',
        department: admin.department || 'Operations',
        bio: admin.bio || 'Administrator managing the ScrapConnect platform.'
      });
    }
  }, [admin]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    // Update admin data in localStorage and context
    const updatedAdmin = {
      ...admin,
      ...formData
    };
    login(updatedAdmin);
    setIsEditing(false);
    alert(getTranslatedText('Profile updated successfully!'));
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert(getTranslatedText('New passwords do not match!'));
      return;
    }
    if (passwordData.newPassword.length < 6) {
      alert(getTranslatedText('Password must be at least 6 characters long!'));
      return;
    }
    // In real app, this would call API
    alert(getTranslatedText('Password changed successfully!'));
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(false);
  };

  const handleNotificationToggle = (type) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!admin) {
    return <div>{getTranslatedText("Loading...")}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("My Profile")}
            </h1>
            <p className="text-sm md:text-base" style={{ color: '#718096' }}>
              {getTranslatedText("Manage your account settings and preferences")}
            </p>
          </div>
          {!isEditing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
              style={{ backgroundColor: '#64946e', color: '#ffffff' }}
            >
              <FaEdit />
              {getTranslatedText("Edit Profile")}
            </motion.button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Avatar */}
              <div className="relative mx-auto md:mx-0">
                <div
                  className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: '#f7fafc' }}
                >
                  <span className="text-4xl md:text-5xl font-bold" style={{ color: '#64946e' }}>
                    {formData.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {isEditing && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="absolute bottom-0 right-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                  >
                    <FaCamera className="text-sm" />
                  </motion.button>
                )}
              </div>

              {/* Profile Form */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                      <FaUser className="inline mr-2" />
                      {getTranslatedText("Full Name")}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                        style={{
                          borderColor: '#e2e8f0',
                          focusBorderColor: '#64946e',
                          focusRingColor: '#64946e'
                        }}
                      />
                    ) : (
                      <p className="px-4 py-2 rounded-xl" style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}>
                        {formData.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                      <FaEnvelope className="inline mr-2" />
                      {getTranslatedText("Email")}
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                        style={{
                          borderColor: '#e2e8f0',
                          focusBorderColor: '#64946e',
                          focusRingColor: '#64946e'
                        }}
                      />
                    ) : (
                      <p className="px-4 py-2 rounded-xl" style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}>
                        {formData.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                      <FaPhone className="inline mr-2" />
                      {getTranslatedText("Phone")}
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                        style={{
                          borderColor: '#e2e8f0',
                          focusBorderColor: '#64946e',
                          focusRingColor: '#64946e'
                        }}
                      />
                    ) : (
                      <p className="px-4 py-2 rounded-xl" style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}>
                        {formData.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                      <FaShieldAlt className="inline mr-2" />
                      {getTranslatedText("Role")}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                        style={{
                          borderColor: '#e2e8f0',
                          focusBorderColor: '#64946e',
                          focusRingColor: '#64946e'
                        }}
                      />
                    ) : (
                      <p className="px-4 py-2 rounded-xl" style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}>
                        {formData.role}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                      {getTranslatedText("Department")}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                        style={{
                          borderColor: '#e2e8f0',
                          focusBorderColor: '#64946e',
                          focusRingColor: '#64946e'
                        }}
                      />
                    ) : (
                      <p className="px-4 py-2 rounded-xl" style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}>
                        {formData.department}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                      <FaCalendarAlt className="inline mr-2" />
                      {getTranslatedText("Member Since")}
                    </label>
                    <p className="px-4 py-2 rounded-xl" style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}>
                      {new Date(admin.createdAt || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Bio")}
                  </label>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                      style={{
                        borderColor: '#e2e8f0',
                        focusBorderColor: '#64946e',
                        focusRingColor: '#64946e'
                      }}
                    />
                  ) : (
                    <p className="px-4 py-2 rounded-xl" style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}>
                      {formData.bio}
                    </p>
                  )}
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveProfile}
                      className="px-6 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
                      style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                    >
                      <FaSave />
                      {getTranslatedText("Save Changes")}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form data
                        if (admin) {
                          setFormData({
                            name: admin.name || 'Admin User',
                            email: admin.email || 'admin@scrapconnect.com',
                            phone: admin.phone || '+91 98765 43210',
                            role: admin.role || 'Administrator',
                            department: admin.department || 'Operations',
                            bio: admin.bio || 'Administrator managing the ScrapConnect platform.'
                          });
                        }
                      }}
                      className="px-6 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
                      style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}
                    >
                      <FaTimes />
                      {getTranslatedText("Cancel")}
                    </motion.button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Change Password */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: '#2d3748' }}>
                <FaLock className="inline mr-2" />
                {getTranslatedText("Change Password")}
              </h2>
              {!isChangingPassword && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsChangingPassword(true)}
                  className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                  style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}
                >
                  {getTranslatedText("Change")}
                </motion.button>
              )}
            </div>

            {isChangingPassword && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Current Password")}
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: '#e2e8f0',
                      focusBorderColor: '#64946e',
                      focusRingColor: '#64946e'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("New Password")}
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: '#e2e8f0',
                      focusBorderColor: '#64946e',
                      focusRingColor: '#64946e'
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                    {getTranslatedText("Confirm New Password")}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: '#e2e8f0',
                      focusBorderColor: '#64946e',
                      focusRingColor: '#64946e'
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleChangePassword}
                    className="px-6 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
                    style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                  >
                    <FaKey />
                    {getTranslatedText("Update Password")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="px-6 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
                    style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}
                  >
                    <FaTimes />
                    {getTranslatedText("Cancel")}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column - Settings */}
        <div className="space-y-6">
          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: '#2d3748' }}>
              <FaBell className="inline mr-2" />
              {getTranslatedText("Notifications")}
            </h2>
            <div className="space-y-3">
              {Object.entries(notifications).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: '#2d3748' }}>
                    {getTranslatedText(key.charAt(0).toUpperCase() + key.slice(1) + " Notifications")}
                  </span>
                  <button
                    onClick={() => handleNotificationToggle(key)}
                    className={`w-12 h-6 rounded-full transition-all relative ${value ? '' : ''
                      }`}
                    style={{
                      backgroundColor: value ? '#64946e' : '#cbd5e0'
                    }}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-all ${value ? 'translate-x-6' : ''
                        }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: '#2d3748' }}>
              <FaGlobe className="inline mr-2" />
              {getTranslatedText("Preferences")}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                  {getTranslatedText("Language")}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: '#e2e8f0',
                    focusBorderColor: '#64946e',
                    focusRingColor: '#64946e'
                  }}
                >
                  <option value="en">{getTranslatedText("English")}</option>
                  <option value="hi">{getTranslatedText("Hindi")}</option>
                  <option value="mr">{getTranslatedText("Marathi")}</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Account Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: '#2d3748' }}>
              {getTranslatedText("Account Statistics")}
            </h2>
            <div className="space-y-3">
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#f7fafc' }}>
                <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Total Actions")}</p>
                <p className="text-2xl font-bold" style={{ color: '#2d3748' }}>1,234</p>
              </div>
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#f7fafc' }}>
                <p className="text-xs" style={{ color: '#718096' }}>{getTranslatedText("Last Login")}</p>
                <p className="text-sm font-semibold" style={{ color: '#2d3748' }}>
                  {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;


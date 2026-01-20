import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../shared/context/AdminAuthContext';
import { authAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAdminAuth();
  const staticTexts = [
    "Please enter a valid email address",
    "Access denied. Admin access only.",
    "Invalid email or password",
    "Invalid email or password. Please try again.",
    "Admin Portal",
    "Sign in to manage the platform",
    "Email",
    "Enter email address",
    "Password",
    "Enter password",
    "Signing in...",
    "Sign In",
    "Secure admin access only"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate email format
    if (!email || !email.includes('@')) {
      setError(getTranslatedText('Please enter a valid email address'));
      setLoading(false);
      return;
    }

    try {
      // Call backend API for admin login
      const response = await authAPI.login(email, password);

      if (response.success && response.data?.user) {
        const userData = response.data.user;
        const token = response.data.token;

        // Verify user is admin
        if (userData.role !== 'admin') {
          setError(getTranslatedText('Access denied. Admin access only.'));
          setLoading(false);
          return;
        }

        // Store token in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('adminToken', token);

        // Prepare admin data
        const adminData = {
          id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          role: 'admin',
          permissions: ['all']
        };

        login(adminData);
        navigate('/admin', { replace: true });
      } else {
        setError(getTranslatedText('Invalid email or password'));
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.message || getTranslatedText('Invalid email or password. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{ backgroundColor: '#f4ebe2' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: '#64946e' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="white" fillOpacity="0.2" />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="white" fillOpacity="0.2" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="white" fillOpacity="0.2" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#2d3748' }}>
            {getTranslatedText("Admin Portal")}
          </h1>
          <p className="text-sm md:text-base" style={{ color: '#718096' }}>
            {getTranslatedText("Sign in to manage the platform")}
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
        >
          <motion.form
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl text-sm font-semibold text-center"
                style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
              >
                {error}
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                {getTranslatedText("Email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={getTranslatedText("Enter email address")}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                style={{
                  borderColor: error ? '#dc2626' : '#e2e8f0',
                  focusBorderColor: '#64946e',
                  focusRingColor: '#64946e'
                }}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#2d3748' }}>
                {getTranslatedText("Password")}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={getTranslatedText("Enter password")}
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: error ? '#dc2626' : '#e2e8f0',
                    focusBorderColor: '#64946e',
                    focusRingColor: '#64946e'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl font-bold text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#64946e' }}
              disabled={!email || !password || loading}
            >
              {loading ? getTranslatedText('Signing in...') : getTranslatedText('Sign In')}
            </motion.button>
          </motion.form>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-6 text-sm"
          style={{ color: '#718096' }}
        >
          <p>{getTranslatedText("Secure admin access only")}</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;


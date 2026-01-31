import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { validateReferralCode, createReferral, processSignupBonus, getReferralSettings } from '../../shared/utils/referralUtils';
import { linkLeadToScrapper } from '../../shared/utils/leadUtils';
import { authAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const ScrapperLogin = () => {
  const staticTexts = [
    "Join Scrapto Scrapper Network",
    "Earn more from",
    "every scrap pickup.",
    "Get verified leads, transparent pricing, and on‑time payments. Designed for serious scrap collectors.",
    "Real‑time market price updates linked with your dashboard.",
    "Priority access to high‑value pickups near your area.",
    "Simple OTP login – no passwords, no complications.",
    "Login to continue pickups",
    "New to Scrapto? Register now",
    "Scrapper Login",
    "Create Scrapper Account",
    "Enter your phone number to receive a one‑time OTP.",
    "Quick signup – just your basic details and phone number.",
    "Login",
    "Register",
    "Full Name",
    "Enter your full name",
    "Email Address",
    "Enter your email address",
    "How did you hear about Scrapto?",
    "Select an option",
    "YouTube",
    "Instagram",
    "Facebook",
    "Google Search",
    "Friends / Family",
    "WhatsApp",
    "Other",
    "Please specify (e.g., association, poster)",
    "Vehicle Information",
    "e.g., Truck - MH-12-AB-1234",
    "Have a referral code?",
    "Hide",
    "Enter referral code (e.g., SCRAP-ABC123)",
    "This code is for users only. Please use a scrapper referral code.",
    "User Friend",
    "Scrapper Friend",
    "You were referred by ",
    "Phone Number",
    "Enter 10-digit phone number",
    "Remember me",
    "Processing...",
    "Send OTP",
    "Register & Send OTP",
    "Enter OTP",
    "We've sent a 6-digit OTP to ",
    "Sending...",
    "Resend OTP",
    "Verifying...",
    "Verify & Continue",
    "By continuing, you agree to our Terms of Service and Privacy Policy.",
    "Please enter a valid 10-digit phone number",
    "Your scrapper account has been blocked by admin. Please contact support.",
    "Please fill in all required fields",
    "Please enter a valid email address",
    "Failed to send OTP. Please try again.",
    "Failed to resend OTP. Please try again.",
    "Invalid OTP. Please try again.",
    "Verifying authentication...",
    "Terms of Service",
    "Privacy Policy",
    "✓ You were referred by {name}",
    "✓ You were referred by {name}",
    "By continuing, you agree to our Terms & Conditions",
    "Resend in {seconds}s"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleInfo, setVehicleInfo] = useState('');
  const [heardFrom, setHeardFrom] = useState('');
  const [heardFromOther, setHeardFromOther] = useState('');
  const [selectedServices, setSelectedServices] = useState(['scrap_pickup']);
  const [referralCode, setReferralCode] = useState('');
  const [referralCodeError, setReferralCodeError] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [showReferralCode, setShowReferralCode] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef([]);
  const { login, isAuthenticated, user } = useAuth();

  // Handle resend timer
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Note: Auth verification is handled by ScrapperModule
  // This component only handles login/signup flow

  // Validate referral code input
  // Validate referral code input
  const validateReferralCodeInput = (code) => {
    if (!code || code.trim() === '') {
      setReferralCodeError('');
      setReferrerName('');
      return;
    }

    // Basic format validation (e.g. USER-XXXXXX or SCRAP-XXXXXX)
    const pattern = /^(USER|SCRAP)-[A-Z0-9]{6}$/;
    if (!pattern.test(code.toUpperCase())) {
      setReferralCodeError(getTranslatedText('Invalid code format. Format: USER-XXXXXX'));
      return;
    }

    // Clear error - validation happens on backend onSubmit
    setReferralCodeError('');
    setReferrerName(getTranslatedText('Valid Code Format')); // Generic success message until API check
  };

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      setShowReferralCode(true);
      validateReferralCodeInput(refCode.toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Helper function to check KYC status
  const getKYCStatus = () => {
    const kycStatus = localStorage.getItem('scrapperKYCStatus');
    const kycData = localStorage.getItem('scrapperKYC');

    if (!kycData) return 'not_submitted';
    if (kycStatus === 'verified') return 'verified';
    if (kycStatus === 'pending') return 'pending';
    if (kycStatus === 'rejected') return 'rejected';
    return 'not_submitted';
  };

  // Redirect after authentication state updates
  useEffect(() => {
    const checkStatusAndRedirect = async () => {
      if (isAuthenticated && shouldRedirect) {
        setLoading(true); // Re-use loading state or add new one if needed
        try {
          // Fetch FRESH KYC status from backend immediately after login
          // We must dynamically import to avoid circular dependencies if any, 
          // or just assume api.js is safe. Here we use the existing authAPI/kycAPI imports.
          // Note: create a tiny helper or just use the API direct.
          // Since we are inside ScrapperLogin, we can use kycAPI if imported, or import it.
          // We need kycAPI import at top. Let's assume we add it.

          const { kycAPI } = await import('../../shared/utils/api');
          const response = await kycAPI.getMy();

          const kyc = response.data?.kyc;
          const kycStatus = kyc?.status || 'not_submitted';

          // Update local storage with fresh data
          localStorage.setItem('scrapperKYCStatus', kycStatus);
          if (kyc) {
            localStorage.setItem('scrapperKYC', JSON.stringify(kyc));
          }

          if (kycStatus === 'not_submitted') {
            navigate('/scrapper/kyc', { replace: true });
          } else if (kycStatus === 'pending') {
            // Check if documents are actually uploaded
            // If status is pending (default) but no documents, go to upload page
            if (!kyc?.aadhaarPhotoUrl) {
              navigate('/scrapper/kyc', { replace: true });
            } else {
              // FORCE redirect to status page if pending AND docs exist
              navigate('/scrapper/kyc-status', { replace: true });
            }
          } else if (kycStatus === 'rejected') {
            navigate('/scrapper/kyc', { replace: true });
          } else if (kycStatus === 'verified') {
            // Check subscription if verified
            const subscription = response.data?.subscription;
            const isActive = subscription?.status === 'active';

            // Also check expiration
            let isActuallyActive = false;
            if (isActive && subscription.expiryDate) {
              const expiry = new Date(subscription.expiryDate);
              if (expiry > new Date()) {
                isActuallyActive = true;
              }
            }

            if (isActuallyActive) {
              navigate('/scrapper', { replace: true });
            } else {
              navigate('/scrapper/subscription', { replace: true });
            }
          }
        } catch (error) {
          console.error('Failed to fetch initial status:', error);
          // Fallback to KYC page if error
          navigate('/scrapper/kyc', { replace: true });
        }
        setShouldRedirect(false);
        setLoading(false);
      }
    };

    checkStatusAndRedirect();
  }, [isAuthenticated, shouldRedirect, navigate]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (phone.length !== 10) {
      setError(getTranslatedText('Please enter a valid 10-digit phone number'));
      return;
    }

    // Check if scrapper is blocked
    const scrapperStatus = localStorage.getItem('scrapperStatus');
    if (scrapperStatus === 'blocked') {
      setError(getTranslatedText('Your scrapper account has been blocked by admin. Please contact support.'));
      return;
    }

    if (!isLogin && (!name.trim() || !email.trim() || !vehicleInfo.trim())) {
      setError(getTranslatedText('Please fill in all required fields'));
      return;
    }

    if (!isLogin && selectedServices.length === 0) {
      setError(getTranslatedText('Please select at least one service'));
      return;
    }

    if (!isLogin && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(getTranslatedText('Please enter a valid email address'));
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Send login OTP with scrapper role
        const response = await authAPI.sendLoginOTP(phone, 'scrapper');
        if (response.success) {
          setOtpSent(true);
          setResendTimer(60);
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 100);
        }
      } else {
        // Register scrapper and send OTP
        const password = 'temp123'; // Temporary password (can be changed later)

        const response = await authAPI.register({
          name,
          email: email.trim(),
          phone,
          password,
          role: 'scrapper',
          services: selectedServices,
          referralCode: referralCode // Send referral code to backend
        });

        if (response.success) {
          // OTP is sent automatically on registration
          setOtpSent(true);
          setResendTimer(60);
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 100);
        }
      }
    } catch (err) {
      setError(err.message || getTranslatedText('Failed to send OTP. Please try again.'));
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, 6);

    // Check if pasted content is numeric
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    // Focus on the next empty input or the last one
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();

    // Auto-submit if full code is pasted
    if (newOtp.every((digit) => digit !== '')) {
      setTimeout(() => {
        handleRegistration(newOtp);
      }, 300);
    }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all OTP digits are filled
    if (value && index === 5) {
      const updatedOtp = [...newOtp];
      if (updatedOtp.every((digit) => digit !== '')) {
        setTimeout(() => {
          handleRegistration(updatedOtp);
        }, 300);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await authAPI.resendOTP(phone);
      if (response.success) {
        setOtp(['', '', '', '', '', '']);
        setResendTimer(60);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (err) {
      setError(err.message || getTranslatedText('Failed to resend OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleReferralCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setReferralCode(value);
    validateReferralCodeInput(value);
  };

  const handleRegistration = async (otpArray) => {
    const otp = otpArray.join('');
    setError('');
    setLoading(true);

    try {
      // Verify OTP with scrapper role
      const purpose = isLogin ? 'login' : 'verification';
      const response = await authAPI.verifyOTP(phone, otp, purpose, 'scrapper');

      if (response.success) {
        const userData = response.data.user;
        const token = response.data.token;

        // Login user with token
        login(userData, token);

        // Set scrapper-specific authentication
        localStorage.setItem('scrapperAuthenticated', 'true');
        localStorage.setItem('scrapperUser', JSON.stringify(userData));

        // If this is a new registration, clear any old KYC/subscription data and link lead
        if (!isLogin) {
          // Clear old KYC and subscription data for fresh start
          localStorage.removeItem('scrapperKYCStatus');
          localStorage.removeItem('scrapperKYC');
          localStorage.removeItem('scrapperSubscriptionStatus');
          localStorage.removeItem('scrapperSubscription');

          try {
            linkLeadToScrapper(phone, userData._id || userData.id);
          } catch (error) {
            // Non-blocking
            console.error('Error linking scrapper lead:', error);
          }
        }

        // Process referral if code is provided and valid
        if (!isLogin && referralCode && referralCode.trim() !== '' && !referralCodeError) {
          try {
            const referralResult = createReferral(referralCode, phone, 'scrapper');
            if (referralResult.success) {
              // Process signup bonus
              processSignupBonus(referralResult.referral.id);
            }
          } catch (error) {
            console.error('Referral processing error:', error);
          }
        }

        setShouldRedirect(true);
      }
    } catch (err) {
      setError(err.message || getTranslatedText('Invalid OTP. Please try again.'));
      console.error('OTP verification error:', err);
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-stretch sm:items-center justify-center p-4 relative bg-gradient-to-br from-zinc-900 via-gray-900 to-black overflow-y-auto"
    >
      {/* Soft glow circles */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-emerald-900/40 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-4xl grid md:grid-cols-2 gap-0 bg-black/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/10 my-auto"
      >
        {/* Left panel - hero content */}
        <div className="hidden md:flex flex-col justify-between p-8 lg:p-10 bg-zinc-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-black/20 pointer-events-none" />
          <div className="relative z-10">
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              {getTranslatedText("Join Scrapto Scrapper Network")}
            </p>
            <h2 className="mt-4 text-3xl lg:text-4xl font-extrabold leading-tight">
              {getTranslatedText("Earn more from")}
              <br />
              {getTranslatedText("every scrap pickup.")}
            </h2>
            <p className="mt-3 text-sm lg:text-base text-gray-300">
              {getTranslatedText("Get verified leads, transparent pricing, and on‑time payments. Designed for serious scrap collectors.")}
            </p>
          </div>
          <div className="mt-6 space-y-3 text-sm relative z-10">
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
              </div>
              <p>{getTranslatedText("Real‑time market price updates linked with your dashboard.")}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
              </div>
              <p>{getTranslatedText("Priority access to high‑value pickups near your area.")}</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
              </div>
              <p>{getTranslatedText("Simple OTP login – no passwords, no complications.")}</p>
            </div>
          </div>
        </div>

        {/* Right panel - auth form */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="w-full bg-transparent px-5 py-6 sm:p-7 md:p-8 lg:p-9"
        >
          {/* Logo/Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-6 md:mb-8 text-center md:text-left"
          >
            <div className="inline-flex items-center gap-3 px-3 py-2 rounded-full bg-emerald-900/30 text-emerald-400 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {isLogin ? getTranslatedText('Login to continue pickups') : getTranslatedText('New to Scrapto? Register now')}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1 text-white">
              {isLogin ? getTranslatedText('Scrapper Login') : getTranslatedText('Create Scrapper Account')}
            </h1>
            <p className="text-xs md:text-sm text-gray-400">
              {isLogin
                ? getTranslatedText('Enter your phone number to receive a one‑time OTP.')
                : getTranslatedText('Quick signup – just your basic details and phone number.')}
            </p>
          </motion.div>

          {/* Toggle Login/Signup */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center md:justify-start gap-3 mb-6"
          >
            <button
              onClick={() => {
                setIsLogin(true);
                setOtpSent(false);
                setOtp(['', '', '', '', '', '']);
                setName('');
                setEmail('');
                setVehicleInfo('');
                setSelectedServices(['scrap_pickup']);
              }}
              className={`px-5 py-2.5 rounded-full font-semibold text-xs md:text-sm transition-all duration-300 ${isLogin
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                }`}
            >
              {getTranslatedText("Login")}
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setOtpSent(false);
                setOtp(['', '', '', '', '', '']);
                setName('');
                setEmail('');
                setVehicleInfo('');
                setSelectedServices(['scrap_pickup']);
              }}
              className={`px-5 py-2.5 rounded-full font-semibold text-xs md:text-sm transition-all duration-300 ${!isLogin
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                : 'bg-zinc-800 text-gray-400 hover:bg-zinc-700'
                }`}
            >
              {getTranslatedText("Register")}
            </button>
          </motion.div>

          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="rounded-2xl p-4 md:p-5 lg:p-6 bg-zinc-900 shadow-sm border border-white/10"
          >
            <AnimatePresence mode="wait">
              {!otpSent ? (
                <motion.form
                  key="phone-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handlePhoneSubmit}
                  className="space-y-4"
                >
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                    >
                      <label className="block text-sm font-semibold mb-2 text-white">
                        {getTranslatedText("Full Name")}
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={getTranslatedText("Enter your full name")}
                        className="w-full px-4 py-3 rounded-xl border-2 border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-900/20 focus:outline-none transition-all text-sm md:text-base bg-black text-white placeholder-gray-600"

                        required={!isLogin}
                      />
                    </motion.div>
                  )}

                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3, delay: 0.05 }}
                    >
                      <label className="block text-sm font-semibold mb-2 text-white">
                        {getTranslatedText("Email Address")}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={getTranslatedText("Enter your email address")}
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base bg-black text-white placeholder-gray-600 ${email ? 'border-emerald-500' : 'border-zinc-700'}`}
                        required={!isLogin}
                      />
                    </motion.div>
                  )}

                  {/* How did you hear about Scrapto? (Signup only) */}
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                    >
                      <label className="block text-sm font-semibold mb-2 text-white">
                        {getTranslatedText("How did you hear about Scrapto?")}
                      </label>
                      <select
                        value={heardFrom}
                        onChange={(e) => setHeardFrom(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base bg-black text-white ${heardFrom ? 'border-emerald-500' : 'border-zinc-700'}`}
                      >
                        <option value="">{getTranslatedText("Select an option")}</option>
                        <option value="youtube">{getTranslatedText("YouTube")}</option>
                        <option value="instagram">{getTranslatedText("Instagram")}</option>
                        <option value="facebook">{getTranslatedText("Facebook")}</option>
                        <option value="google_search">{getTranslatedText("Google Search")}</option>
                        <option value="friend_family">{getTranslatedText("Friends / Family")}</option>
                        <option value="whatsapp">{getTranslatedText("WhatsApp")}</option>
                        <option value="other">{getTranslatedText("Other")}</option>
                      </select>
                      {heardFrom === 'other' && (
                        <input
                          type="text"
                          value={heardFromOther}
                          onChange={(e) => setHeardFromOther(e.target.value)}
                          placeholder={getTranslatedText("Please specify (e.g., association, poster)")}
                          className={`mt-2 w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base bg-black text-white ${heardFromOther ? 'border-emerald-500' : 'border-zinc-700'}`}
                        />
                      )}
                    </motion.div>
                  )}

                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="mb-4"
                    >
                      <label className="block text-sm font-semibold mb-2 text-white">
                        {getTranslatedText("Select Services")}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedServices.includes('scrap_pickup')
                            ? 'border-emerald-500 bg-emerald-900/20'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedServices.includes('scrap_pickup')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedServices([...selectedServices, 'scrap_pickup']);
                              } else {
                                setSelectedServices(selectedServices.filter(s => s !== 'scrap_pickup'));
                              }
                            }}
                            className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-900 border-zinc-600"
                          />
                          <span className="text-sm text-white">Scrap Pickup</span>
                        </label>

                        <label
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedServices.includes('home_cleaning')
                            ? 'border-emerald-500 bg-emerald-900/20'
                            : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedServices.includes('home_cleaning')}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedServices([...selectedServices, 'home_cleaning']);
                              } else {
                                setSelectedServices(selectedServices.filter(s => s !== 'home_cleaning'));
                              }
                            }}
                            className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-zinc-900 border-zinc-600"
                          />
                          <span className="text-sm text-white">Home Cleaning</span>
                        </label>
                      </div>
                    </motion.div>
                  )}

                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                    >
                      <label className="block text-sm font-semibold mb-2 text-white">
                        {getTranslatedText("Vehicle Information")}
                      </label>
                      <input
                        type="text"
                        value={vehicleInfo}
                        onChange={(e) => setVehicleInfo(e.target.value)}
                        placeholder={getTranslatedText("e.g., Truck - MH-12-AB-1234")}
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base bg-black text-white placeholder-gray-600 ${vehicleInfo ? 'border-emerald-500' : 'border-zinc-700'}`}
                        required={!isLogin}
                      />
                    </motion.div>
                  )}

                  {/* Referral Code Input (Signup only) */}
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3, delay: 0.15 }}
                    >
                      <div className="mb-2">
                        <button
                          type="button"
                          onClick={() => setShowReferralCode(!showReferralCode)}
                          className="text-sm font-medium flex items-center gap-1"
                          style={{ color: '#64946e' }}
                        >
                          {showReferralCode ? getTranslatedText('Hide') : getTranslatedText('Have a referral code?')}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points={showReferralCode ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
                          </svg>
                        </button>
                      </div>
                      {showReferralCode && (
                        <div>
                          <input
                            type="text"
                            value={referralCode}
                            onChange={handleReferralCodeChange}
                            placeholder={getTranslatedText("Enter referral code (e.g., SCRAP-ABC123)")}
                            className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base uppercase bg-black text-white placeholder-gray-600 ${referralCodeError ? 'border-red-500' : referrerName ? 'border-emerald-500' : 'border-zinc-700'
                              }`}
                            maxLength={13}
                          />
                          {referralCodeError && (
                            <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                              {referralCodeError}
                            </p>
                          )}
                          {referrerName && !referralCodeError && (
                            <p className="text-xs mt-1" style={{ color: '#10b981' }}>
                              {getTranslatedText("✓ You were referred by {name}", { name: referrerName })}
                            </p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-white">
                      {getTranslatedText("Phone Number")}
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(value);
                      }}
                      placeholder={getTranslatedText("Enter 10-digit phone number")}
                      className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base bg-black text-white placeholder-gray-600 ${phone.length === 10 ? 'border-emerald-500' : 'border-zinc-700'}`}
                      maxLength={10}
                      required
                    />
                  </div>

                  {isLogin && (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="remember"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: '#64946e' }}
                      />
                      <label htmlFor="remember" className="text-xs md:text-sm text-gray-400">
                        {getTranslatedText("Remember me")}
                      </label>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-4 py-3 rounded-xl bg-red-900/20 border border-red-900/50"
                    >
                      <p className="text-sm text-red-500">{error}</p>
                    </motion.div>
                  )}

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || phone.length !== 10 || (!isLogin && (!name.trim() || !vehicleInfo.trim()))}
                    className="w-full py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  >
                    {loading ? getTranslatedText('Processing...') : (isLogin ? getTranslatedText('Send OTP') : getTranslatedText('Register & Send OTP'))}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.div
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2 text-white">
                      {getTranslatedText("Enter OTP")}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {getTranslatedText("We've sent a 6-digit OTP to ")}<span className="font-semibold text-white">+91 {phone}</span>
                    </p>
                  </div>

                  <div className="flex justify-center flex-nowrap gap-1 sm:gap-2 md:gap-3 px-1 w-full max-w-sm mx-auto">
                    {otp.map((digit, index) => (
                      <motion.input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className={`w-9 h-11 text-lg sm:w-10 sm:h-12 sm:text-xl md:w-14 md:h-14 md:text-2xl text-center font-bold rounded-lg md:rounded-xl border-2 focus:outline-none focus:ring-2 transition-all ${digit
                          ? 'border-emerald-500 bg-emerald-900/30 text-emerald-400'
                          : 'border-zinc-700 bg-black text-white'
                          }`}
                      />
                    ))}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="px-4 py-3 rounded-xl bg-red-900/20 border border-red-900/50"
                    >
                      <p className="text-sm text-red-500">{error}</p>
                    </motion.div>
                  )}

                  <div className="text-center">
                    <button
                      onClick={handleResendOtp}
                      disabled={loading || resendTimer > 0}
                      className="text-sm font-semibold transition-colors disabled:opacity-50 text-green-600 hover:text-green-700 hover:underline disabled:text-gray-500 disabled:no-underline"
                    >
                      {loading
                        ? getTranslatedText('Sending...')
                        : resendTimer > 0
                          ? getTranslatedText('Resend in {seconds}s', { seconds: resendTimer })
                          : getTranslatedText('Resend OTP')
                      }
                    </button>
                  </div>

                  <motion.button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (otp.every((digit) => digit !== '')) {
                        handleRegistration(otp);
                      }
                    }}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={loading || !otp.every((digit) => digit !== '')}
                    className="w-full py-3 md:py-4 rounded-xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  >
                    {loading ? getTranslatedText('Verifying...') : getTranslatedText('Verify & Continue')}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-4 text-xs md:text-sm text-gray-400"
          >
            {getTranslatedText("By continuing, you agree to our ")}
            <Link to="/scrapper/terms" className="underline hover:text-emerald-400 transition-colors">
              {getTranslatedText("Terms & Conditions")}
            </Link>
          </motion.div>
        </motion.div>
      </motion.div >
    </div >
  );
};

export default ScrapperLogin;


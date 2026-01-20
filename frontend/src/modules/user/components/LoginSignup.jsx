import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext";
import {
  validateReferralCode,
  createReferral,
  processSignupBonus,
  getReferralSettings,
} from "../../shared/utils/referralUtils";
import { authAPI } from "../../shared/utils/api";
import { useLanguage } from "../../../contexts/LanguageContext";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { IoLanguageOutline, IoChevronDownOutline } from "react-icons/io5";
import leafImage from "../../../assets/leaf.jpg";
import bgLeafImage from "../../../assets/earth-removebg-preview.png";

const LoginSignup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { language, languages, changeLanguage } = useLanguage();

  const staticTexts = [
    "Welcome to Scrapto",
    "Login to your account",
    "Create a new account",
    "Phone Number",
    "Enter 10 digit phone number",
    "Send OTP",
    "Login",
    "Sign Up",
    "Don't have an account?",
    "Already have an account?",
    "Register",
    "Name",
    "Email",
    "Enter your name",
    "Enter your email",
    "Cleaner city, smarter scrap",
    "Turn your scrap into instant value.",
    "Book doorstep pickups at live market prices. Trusted scrappers, fair weights, and quick payouts.",
    "No bargaining – transparent rates synced with admin price feed.",
    "Track your referrals & rewards directly from your profile.",
    "Login with OTP – no passwords, no hassle.",
    "Use your mobile number for a fast, secure OTP‑based login. No passwords required.",
    "Please enter a valid 10-digit phone number",
    "Please enter your name",
    "Please enter your email",
    "Please enter a valid email address",
    "Failed to send OTP. Please try again.",
    "This code is for scrappers only. Please use a user referral code.",
    "Scrapper Friend",
    "User Friend",
    "Invalid OTP. Please try again.",
    "Full Name",
    "Email Address",
    "How did you hear about Scrapto?",
    "Select an option",
    "YouTube",
    "Instagram",
    "Facebook",
    "Google Search",
    "Friends / Family",
    "WhatsApp",
    "Other",
    "Please specify (e.g., college event, poster)",
    "Have a referral code?",
    "Hide",
    "Enter referral code (e.g., USER-ABC123)",
    "✓ You were referred by {referrerName}",
    "Remember Me",
    "Resend OTP?",
    "Sending...",
    "Register & Send OTP",
    "Verify & Login",
    "Enter OTP",
    "Processing...",
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [heardFrom, setHeardFrom] = useState("");
  const [heardFromOther, setHeardFromOther] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralCodeError, setReferralCodeError] = useState("");
  const [referrerName, setReferrerName] = useState("");
  const [showReferralCode, setShowReferralCode] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);
  const { login, isAuthenticated } = useAuth();

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      setShowReferralCode(true);
      validateReferralCodeInput(refCode.toUpperCase());
    }
  }, [searchParams]);

  // Redirect after authentication state updates
  useEffect(() => {
    if (isAuthenticated && shouldRedirect) {
      navigate("/", { replace: true });
      setShouldRedirect(false);
    }
  }, [isAuthenticated, shouldRedirect, navigate]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (phone.length !== 10) {
      setError(getTranslatedText("Please enter a valid 10-digit phone number"));
      return;
    }

    if (!isLogin && !name.trim()) {
      setError(getTranslatedText("Please enter your name"));
      return;
    }

    if (!isLogin && !email.trim()) {
      setError(getTranslatedText("Please enter your email"));
      return;
    }

    if (!isLogin && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(getTranslatedText("Please enter a valid email address"));
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Send login OTP with user role
        const response = await authAPI.sendLoginOTP(phone, "user");
        if (response.success) {
          setOtpSent(true);
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 100);
        }
      } else {
        // Register user and send OTP
        const password = "temp123"; // Temporary password (can be changed later)

        const response = await authAPI.register({
          name,
          email: email.trim(),
          phone,
          password,
          role: "user",
        });

        if (response.success) {
          // OTP is sent automatically on registration
          setOtpSent(true);
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 100);
        }
      }
    } catch (err) {
      setError(
        err.message ||
        getTranslatedText("Failed to send OTP. Please try again.")
      );
      console.error("Error:", err);
    } finally {
      setLoading(false);
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
      if (updatedOtp.every((digit) => digit !== "")) {
        setTimeout(() => {
          handleRegistration(updatedOtp);
        }, 300);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Validate referral code input
  const validateReferralCodeInput = (code) => {
    if (!code || code.trim() === "") {
      setReferralCodeError("");
      setReferrerName("");
      return;
    }

    const validation = validateReferralCode(code.toUpperCase());
    if (!validation.valid) {
      setReferralCodeError(validation.error);
      setReferrerName("");
    } else {
      // Check if cross-referrals are allowed
      const settings = getReferralSettings();
      if (!settings.allowCrossReferrals && validation.referrerType !== "user") {
        setReferralCodeError(
          getTranslatedText(
            "This code is for scrappers only. Please use a user referral code."
          )
        );
        setReferrerName("");
      } else {
        setReferralCodeError("");
        if (validation.referrerType === "scrapper") {
          setReferrerName(getTranslatedText("Scrapper Friend")); // Cross-referral
        } else {
          setReferrerName(getTranslatedText("User Friend"));
        }
      }
    }
  };

  const handleReferralCodeChange = (e) => {
    const value = e.target.value.toUpperCase();
    setReferralCode(value);
    validateReferralCodeInput(value);
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (otp.every((digit) => digit !== "")) {
      handleRegistration(otp);
    }
  };

  const handleRegistration = async (otpArray) => {
    const otp = otpArray.join("");
    setError("");
    setLoading(true);

    try {
      // Verify OTP with user role
      const purpose = isLogin ? "login" : "verification";
      const response = await authAPI.verifyOTP(phone, otp, purpose, "user");

      if (response.success) {
        const userData = response.data.user;
        const token = response.data.token;

        // Login user with token
        login(userData, token);

        // Process referral if code is provided and valid (only for new registrations)
        if (
          !isLogin &&
          referralCode &&
          referralCode.trim() !== "" &&
          !referralCodeError
        ) {
          try {
            const computedHeardFrom =
              heardFrom === "other" && heardFromOther.trim()
                ? `other:${heardFromOther.trim()}`
                : heardFrom || null;

            const referralResult = createReferral(referralCode, phone, "user");
            if (referralResult.success) {
              // Process signup bonus
              processSignupBonus(referralResult.referral.id);
            }
          } catch (error) {
            console.error("Referral processing error:", error);
          }
        }

        setShouldRedirect(true);
      }
    } catch (err) {
      setError(
        err.message || getTranslatedText("Invalid OTP. Please try again.")
      );
      console.error("OTP verification error:", err);
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-6 md:px-6 md:py-10 lg:py-12 relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, #bbf7d0 0, transparent 50%), radial-gradient(circle at bottom right, #86efac 0, transparent 55%), linear-gradient(135deg, #022c22 0%, #064e3b 40%, #052e16 100%)",
      }}>
      {/* Language Selector */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setIsLangOpen(!isLangOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm hover:bg-white transition-all text-sm font-medium shadow-sm"
          style={{ color: "#4a5568" }}>
          <IoLanguageOutline className="text-lg" />
          <span>{languages[language]?.label.split(" ")[0]}</span>
          <IoChevronDownOutline
            className={`transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""
              }`}
          />
        </button>

        <AnimatePresence>
          {isLangOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsLangOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  {Object.entries(languages).map(([code, { label, flag }]) => (
                    <button
                      key={code}
                      onClick={() => {
                        changeLanguage(code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${language === code
                        ? "text-green-600 bg-green-50"
                        : "text-gray-700"
                        }`}>
                      <span className="text-lg">{flag}</span>
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      {/* Soft background orbs */}
      <div className="pointer-events-none absolute -top-32 -left-24 w-72 h-72 rounded-full bg-emerald-400/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 w-80 h-80 rounded-full bg-lime-300/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-5xl grid md:grid-cols-2 gap-0 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
        {/* Left panel – illustration & selling points */}
        <div className="hidden md:flex flex-col justify-between p-8 lg:p-10 bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800 text-white relative">
          <div>
            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              {getTranslatedText("Cleaner city, smarter scrap")}
            </p>
            <h2 className="mt-4 text-3xl lg:text-4xl font-extrabold leading-tight">
              {getTranslatedText("Turn your scrap into instant value.")}
            </h2>
            <p className="mt-3 text-sm lg:text-base text-emerald-100/90">
              {getTranslatedText(
                "Book doorstep pickups at live market prices. Trusted scrappers, fair weights, and quick payouts."
              )}
            </p>
          </div>

          <div className="mt-6 space-y-3 text-xs lg:text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
              </div>
              <p>
                {getTranslatedText(
                  "No bargaining – transparent rates synced with admin price feed."
                )}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
              </div>
              <p>
                {getTranslatedText(
                  "Track your referrals & rewards directly from your profile."
                )}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 w-5 h-5 rounded-full bg-white/15 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
              </div>
              <p>
                {getTranslatedText("Login with OTP – no passwords, no hassle.")}
              </p>
            </div>
          </div>

          {/* Floating leaf image */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -4 }}
            animate={{ opacity: 0.12, y: 0, rotate: 0 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="pointer-events-none absolute -right-10 bottom-4 w-56 h-56 rounded-full overflow-hidden border border-white/10">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${leafImage})` }}
            />
          </motion.div>
        </div>

        {/* Right panel – actual form */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative w-full bg-white px-6 py-7 sm:px-7 sm:py-8 lg:px-8 lg:py-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mb-6 md:mb-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {getTranslatedText("Welcome to Scrapto")}
            </div>
            <h1
              className="text-2xl md:text-3xl font-bold mb-1"
              style={{ color: "#1f2933" }}>
              {isLogin
                ? getTranslatedText("Login to your account")
                : getTranslatedText("Create a new account")}
            </h1>
            <p className="text-xs md:text-sm" style={{ color: "#6b7280" }}>
              {getTranslatedText(
                "Use your mobile number for a fast, secure OTP‑based login. No passwords required."
              )}
            </p>
          </motion.div>

          {/* Toggle Login/Signup */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.18 }}
            className="flex items-center justify-center md:justify-start gap-3 mb-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setOtpSent(false);
                setOtp(["", "", "", "", "", ""]);
              }}
              className={`px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 ${isLogin
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}>
              {getTranslatedText("Login")}
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setOtpSent(false);
                setOtp(["", "", "", "", "", ""]);
              }}
              className={`px-5 py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-300 ${!isLogin
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}>
              {getTranslatedText("Sign Up")}
            </button>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.22 }}
            onSubmit={
              otpSent && otp.every((d) => d !== "")
                ? handleOtpSubmit
                : handlePhoneSubmit
            }
            className="space-y-4 md:space-y-5">
            {/* Full Name Input (Signup only) */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="relative">
                <div
                  className="flex items-center px-4 py-3 md:py-3.5 rounded-xl border transition-all"
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e5ddd4",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#64946e";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px rgba(100, 148, 110, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5ddd4";
                    e.currentTarget.style.boxShadow = "none";
                  }}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mr-3"
                    style={{ color: "#64946e" }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={getTranslatedText("Full Name")}
                    className="flex-1 bg-transparent border-none outline-none text-base md:text-lg"
                    style={{ color: "#2d3748" }}
                  />
                </div>
              </motion.div>
            )}

            {/* Email Input (Signup only) */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="relative">
                <div
                  className="flex items-center px-4 py-3 md:py-3.5 rounded-xl border transition-all"
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e5ddd4",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#64946e";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px rgba(100, 148, 110, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5ddd4";
                    e.currentTarget.style.boxShadow = "none";
                  }}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mr-3"
                    style={{ color: "#64946e" }}>
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={getTranslatedText("Email Address")}
                    className="flex-1 bg-transparent border-none outline-none text-base md:text-lg"
                    style={{ color: "#2d3748" }}
                  />
                </div>
              </motion.div>
            )}

            {/* How did you hear about Scrapto? (Signup only) */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="relative">
                <label
                  className="block text-xs md:text-sm font-semibold mb-2"
                  style={{ color: "#2d3748" }}>
                  {getTranslatedText("How did you hear about Scrapto?")}
                </label>
                <div
                  className="flex items-center px-4 py-3 md:py-3.5 rounded-xl border transition-all mb-2"
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e5ddd4",
                  }}>
                  <select
                    value={heardFrom}
                    onChange={(e) => setHeardFrom(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm md:text-base"
                    style={{ color: "#2d3748" }}>
                    <option value="">{getTranslatedText("Select an option")}</option>
                    <option value="youtube">{getTranslatedText("YouTube")}</option>
                    <option value="instagram">{getTranslatedText("Instagram")}</option>
                    <option value="facebook">{getTranslatedText("Facebook")}</option>
                    <option value="google_search">{getTranslatedText("Google Search")}</option>
                    <option value="friend_family">{getTranslatedText("Friends / Family")}</option>
                    <option value="whatsapp">{getTranslatedText("WhatsApp")}</option>
                    <option value="other">{getTranslatedText("Other")}</option>
                  </select>
                </div>
                {heardFrom === "other" && (
                  <div
                    className="flex items-center px-4 py-3 md:py-3.5 rounded-xl border transition-all"
                    style={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e5ddd4",
                    }}>
                    <input
                      type="text"
                      value={heardFromOther}
                      onChange={(e) => setHeardFromOther(e.target.value)}
                      placeholder={getTranslatedText("Please specify (e.g., college event, poster)")}
                      className="flex-1 bg-transparent border-none outline-none text-sm md:text-base"
                      style={{ color: "#2d3748" }}
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* Referral Code Input (Signup only) */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="relative">
                <div className="mb-2">
                  <button
                    type="button"
                    onClick={() => setShowReferralCode(!showReferralCode)}
                    className="text-sm font-medium flex items-center gap-1"
                    style={{ color: "#64946e" }}>
                    {showReferralCode ? getTranslatedText("Hide") : getTranslatedText("Have a referral code?")}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2">
                      <polyline
                        points={
                          showReferralCode
                            ? "18 15 12 9 6 15"
                            : "6 9 12 15 18 9"
                        }
                      />
                    </svg>
                  </button>
                </div>
                {showReferralCode && (
                  <div
                    className={`flex items-center px-4 py-3 md:py-3.5 rounded-xl border transition-all ${referralCodeError
                      ? "border-red-400"
                      : referrerName
                        ? "border-green-400"
                        : ""
                      }`}
                    style={{
                      backgroundColor: "#ffffff",
                      borderColor: referralCodeError
                        ? "#ef4444"
                        : referrerName
                          ? "#10b981"
                          : "#e5ddd4",
                    }}
                    onFocus={(e) => {
                      if (!referralCodeError && !referrerName) {
                        e.currentTarget.style.borderColor = "#64946e";
                        e.currentTarget.style.boxShadow =
                          "0 0 0 2px rgba(100, 148, 110, 0.2)";
                      }
                    }}
                    onBlur={(e) => {
                      if (!referralCodeError && !referrerName) {
                        e.currentTarget.style.borderColor = "#e5ddd4";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mr-3"
                      style={{
                        color: referralCodeError
                          ? "#ef4444"
                          : referrerName
                            ? "#10b981"
                            : "#64946e",
                      }}>
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <path d="M20 8v6M23 11h-6" />
                    </svg>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={handleReferralCodeChange}
                      placeholder={getTranslatedText("Enter referral code (e.g., USER-ABC123)")}
                      className="flex-1 bg-transparent border-none outline-none text-base md:text-lg uppercase"
                      style={{ color: "#2d3748" }}
                      maxLength={13}
                    />
                    {referrerName && (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        className="ml-2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                )}
                {referralCodeError && (
                  <p className="text-xs mt-1 ml-1" style={{ color: "#ef4444" }}>
                    {referralCodeError}
                  </p>
                )}
                {referrerName && !referralCodeError && (
                  <p className="text-xs mt-1 ml-1" style={{ color: "#10b981" }}>
                    ✓ {getTranslatedText("You were referred by {referrerName}", { referrerName })}
                  </p>
                )}
              </motion.div>
            )}

            {/* Phone Number Input */}
            {!otpSent && (
              <div className="relative">
                <div
                  className="flex items-center px-4 py-3 md:py-3.5 rounded-xl border transition-all"
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e5ddd4",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#64946e";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 2px rgba(100, 148, 110, 0.2)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5ddd4";
                    e.currentTarget.style.boxShadow = "none";
                  }}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mr-3"
                    style={{ color: "#64946e" }}>
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    placeholder={getTranslatedText("Phone Number")}
                    className="flex-1 bg-transparent border-none outline-none text-base md:text-lg"
                    style={{ color: "#2d3748" }}
                    maxLength={10}
                  />
                </div>
              </div>
            )}

            {/* OTP Input (shown after phone submission) */}
            {otpSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="relative">
                <div
                  className="flex items-center px-4 py-3 md:py-3.5 rounded-xl border"
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e5ddd4",
                  }}>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="mr-3"
                    style={{ color: "#64946e" }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <div className="flex-1 flex flex-wrap justify-between gap-1.5 max-w-xs mx-auto">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-9 h-10 md:w-11 md:h-11 text-center text-lg md:text-2xl font-bold border-2 rounded-lg focus:outline-none transition-all bg-white"
                        style={{
                          borderColor: digit ? "#64946e" : "#e5ddd4",
                          color: "#2d3748",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#64946e";
                          e.target.style.boxShadow =
                            "0 0 0 2px rgba(100, 148, 110, 0.2)";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = digit
                            ? "#64946e"
                            : "#e5ddd4";
                          e.target.style.boxShadow = "none";
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Remember Me & Resend OTP */}
            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="hidden"
                />
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-2 transition-all ${rememberMe ? "border-green-600" : "border-gray-300"
                    }`}
                  style={{
                    backgroundColor: rememberMe ? "#64946e" : "transparent",
                  }}>
                  {rememberMe && (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                <span className="text-sm" style={{ color: "#718096" }}>
                  {getTranslatedText("Remember Me")}
                </span>
              </label>
              {otpSent && (
                <button
                  type="button"
                  onClick={async () => {
                    setError("");
                    setLoading(true);
                    try {
                      const response = await authAPI.resendOTP(phone);
                      if (response.success) {
                        setOtp(["", "", "", "", "", ""]);
                        setTimeout(() => {
                          inputRefs.current[0]?.focus();
                        }, 100);
                      }
                    } catch (err) {
                      setError(
                        err.message || "Failed to resend OTP. Please try again."
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  disabled={loading}
                  className="text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
                  style={{ color: "#64946e" }}>
                  {loading ? getTranslatedText("Sending...") : getTranslatedText("Resend OTP?")}
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={
                loading ||
                (!otpSent &&
                  (phone.length !== 10 ||
                    (!isLogin && (!name.trim() || !email.trim())))) ||
                (otpSent && otp.some((d) => d === ""))
              }
              className="w-full text-white font-bold py-4 md:py-4.5 rounded-xl disabled:cursor-not-allowed disabled:opacity-50 transition-all text-base md:text-lg shadow-lg"
              style={{
                backgroundColor:
                  (!otpSent &&
                    phone.length === 10 &&
                    (isLogin || (name.trim() && email.trim()))) ||
                    (otpSent && otp.every((d) => d !== ""))
                    ? "#64946e"
                    : "#cbd5e0",
              }}
              onMouseEnter={(e) => {
                if (
                  (!otpSent &&
                    phone.length === 10 &&
                    (isLogin || (name.trim() && email.trim()))) ||
                  (otpSent && otp.every((d) => d !== ""))
                ) {
                  e.target.style.backgroundColor = "#5a8263";
                }
              }}
              onMouseLeave={(e) => {
                if (
                  (!otpSent &&
                    phone.length === 10 &&
                    (isLogin || (name.trim() && email.trim()))) ||
                  (otpSent && otp.every((d) => d !== ""))
                ) {
                  e.target.style.backgroundColor = "#64946e";
                }
              }}>
              {loading
                ? getTranslatedText("Processing...")
                : otpSent
                  ? otp.every((d) => d !== "")
                    ? getTranslatedText("Verify & Login")
                    : getTranslatedText("Enter OTP")
                  : isLogin
                    ? getTranslatedText("Send OTP")
                    : getTranslatedText("Register & Send OTP")}
            </button>
          </motion.form>

          {/* Sign Up Link */}
          <div className="mt-6 md:mt-8 text-center">
            <p className="text-sm md:text-base" style={{ color: "#718096" }}>
              {isLogin ? getTranslatedText("Don't have an account?") : getTranslatedText("Already have an account?")}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setPhone("");
                  setName("");
                  setEmail("");
                  setOtp(["", "", "", "", "", ""]);
                  setOtpSent(false);
                }}
                className="font-semibold hover:opacity-80 transition-opacity"
                style={{ color: "#64946e" }}>
                {isLogin ? getTranslatedText("Sign Up") : getTranslatedText("Login")}
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginSignup;

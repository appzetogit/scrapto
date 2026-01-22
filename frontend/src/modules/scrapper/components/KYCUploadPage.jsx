import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import { kycAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const KYCUploadPage = () => {
  const staticTexts = [
    "Checking status...",
    "Please enter a valid 12-digit Aadhaar number",
    "Please upload Aadhaar photo",
    "Please upload selfie photo",
    "Failed to submit KYC. Please try again.",
    "KYC Verification",
    "Complete your KYC to start receiving pickup requests",
    "Step 1 of 1",
    "Aadhaar Number",
    "Enter 12-digit Aadhaar number",
    "Masked: {masked}",
    "Aadhaar Card Photo",
    "Click to upload",
    "Aadhaar photo",
    "PNG, JPG or JPEG (MAX. 5MB)",
    "Remove Photo",
    "Selfie Photo",
    "selfie photo",
    "Driving License (optional)",
    "license",
    "Remove License",
    "Important Information",
    "Your KYC documents will be verified by our admin team",
    "Verification usually takes 24-48 hours",
    "You can start receiving requests after verification",
    "All documents are securely stored and encrypted",
    "Submitting...",
    "Submit KYC",
    "KYC Submitted Successfully!",
    "Your KYC documents have been submitted for verification.",
    "Verification Time:",
    "Usually takes 24-48 hours. You'll be notified once verification is complete.",
    "File is too large (Max 5MB)"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarPhoto, setAadhaarPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);
  const [licenseFile, setLicenseFile] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [licensePreview, setLicensePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoadingCheck, setIsLoadingCheck] = useState(true);

  // Check current status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await kycAPI.getMy();
        const kyc = res.data?.kyc;
        const status = kyc?.status || 'not_submitted';

        if (status === 'pending') {
          // Only redirect if documents are present
          if (kyc?.aadhaarPhotoUrl) {
            navigate('/scrapper/kyc-status', { replace: true });
          }
        } else if (status === 'verified') {
          navigate('/scrapper', { replace: true });
        }
      } catch (error) {
        console.error('Failed to check status:', error);
      } finally {
        setIsLoadingCheck(false);
      }
    };
    checkStatus();
  }, [navigate]);

  if (isLoadingCheck) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-4 border-emerald-500" />
          <p className="text-sm font-semibold text-white">{getTranslatedText("Checking status...")}</p>
        </div>
      </div>
    );
  }

  const handleAadhaarPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(getTranslatedText('File is too large (Max 5MB)'));
        return;
      }
      setAadhaarPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAadhaarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelfiePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(getTranslatedText('File is too large (Max 5MB)'));
        return;
      }
      setSelfiePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLicensePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(getTranslatedText('File is too large (Max 5MB)'));
        return;
      }
      setLicenseFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLicensePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAadhaarNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
    setAadhaarNumber(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      alert(getTranslatedText('Please enter a valid 12-digit Aadhaar number'));
      return;
    }

    if (!aadhaarPhoto) {
      alert(getTranslatedText('Please upload Aadhaar photo'));
      return;
    }

    if (!selfiePhoto) {
      alert(getTranslatedText('Please upload selfie photo'));
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('aadhaarNumber', aadhaarNumber);
      formData.append('aadhaar', aadhaarPhoto);
      formData.append('selfie', selfiePhoto);
      if (licenseFile) {
        formData.append('license', licenseFile);
      }

      const res = await kycAPI.submit(formData);
      const kyc = res.data?.kyc;

      // Persist minimal KYC state locally for routing guard compatibility
      if (kyc) {
        localStorage.setItem('scrapperKYCStatus', kyc.status || 'pending');
        localStorage.setItem('scrapperKYC', JSON.stringify(kyc));
      } else {
        localStorage.setItem('scrapperKYCStatus', 'pending');
      }

      setIsSubmitting(false);
      setShowSuccess(true);

      setTimeout(() => {
        window.location.href = '/scrapper/kyc-status';
      }, 1200);
    } catch (error) {
      console.error('KYC submit failed:', error);
      alert(error.message || getTranslatedText('Failed to submit KYC. Please try again.'));
      setIsSubmitting(false);
    }
  };

  const maskedAadhaar = aadhaarNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-****-$3');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full p-4 md:p-6 bg-gradient-to-br from-zinc-900 via-gray-900 to-black"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <button
            onClick={() => navigate('/scrapper/login')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-800 transition-colors mb-4 bg-zinc-900"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 text-white">
            {getTranslatedText("KYC Verification")}
          </h1>
          <p className="text-sm md:text-base text-gray-400">
            {getTranslatedText("Complete your KYC to start receiving pickup requests")}
          </p>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-2 rounded-full bg-emerald-900/30">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="h-full rounded-full bg-emerald-500"
              />
            </div>
            <span className="text-xs md:text-sm text-gray-400">{getTranslatedText("Step 1 of 1")}</span>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 md:p-8 shadow-xl space-y-6 bg-zinc-900 border border-white/10"
        >
          {/* Aadhaar Number */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">
              {getTranslatedText("Aadhaar Number")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={aadhaarNumber}
              onChange={handleAadhaarNumberChange}
              placeholder={getTranslatedText("Enter 12-digit Aadhaar number")}
              maxLength={12}
              className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-sm md:text-base bg-black text-white placeholder-gray-600 ${aadhaarNumber.length === 12 ? 'border-emerald-500' : 'border-zinc-700'}`}
              required
            />
            {aadhaarNumber.length === 12 && (
              <p className="text-xs mt-1 text-gray-400">
                {getTranslatedText("Masked: {masked}", { masked: maskedAadhaar })}
              </p>
            )}
          </div>

          {/* Aadhaar Photo Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">
              {getTranslatedText("Aadhaar Card Photo")} <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-emerald-500 bg-black ${aadhaarPhoto ? 'border-emerald-500' : 'border-zinc-700'}`}
              >
                {aadhaarPreview ? (
                  <img src={aadhaarPreview} alt="Aadhaar preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">{getTranslatedText("Click to upload")}</span> {getTranslatedText("Aadhaar photo")}
                    </p>
                    <p className="text-xs text-gray-500">{getTranslatedText("PNG, JPG or JPEG (MAX. 5MB)")}</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAadhaarPhotoChange}
                  required
                />
              </label>
              {aadhaarPhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setAadhaarPhoto(null);
                    setAadhaarPreview(null);
                  }}
                  className="text-xs font-semibold"
                  style={{ color: '#ef4444' }}
                >
                  {getTranslatedText("Remove Photo")}
                </button>
              )}
            </div>
          </div>

          {/* Selfie Photo Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">
              {getTranslatedText("Selfie Photo")} <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-emerald-500 bg-black ${selfiePhoto ? 'border-emerald-500' : 'border-zinc-700'}`}
              >
                {selfiePreview ? (
                  <img src={selfiePreview} alt="Selfie preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">{getTranslatedText("Click to upload")}</span> {getTranslatedText("selfie photo")}
                    </p>
                    <p className="text-xs text-gray-500">{getTranslatedText("PNG, JPG or JPEG (MAX. 5MB)")}</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleSelfiePhotoChange}
                  required
                />
              </label>
              {selfiePhoto && (
                <button
                  type="button"
                  onClick={() => {
                    setSelfiePhoto(null);
                    setSelfiePreview(null);
                  }}
                  className="text-xs font-semibold"
                  style={{ color: '#ef4444' }}
                >
                  {getTranslatedText("Remove Photo")}
                </button>
              )}
            </div>
          </div>

          {/* License Upload (optional) */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-white">
              {getTranslatedText("Driving License (optional)")}
            </label>
            <div className="space-y-3">
              <label className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:border-emerald-500 bg-black ${licenseFile ? 'border-emerald-500' : 'border-zinc-700'}`}
              >
                {licensePreview ? (
                  <img src={licensePreview} alt="License preview" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-10 h-10 mb-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-400">
                      <span className="font-semibold">{getTranslatedText("Click to upload")}</span> {getTranslatedText("license")}
                    </p>
                    <p className="text-xs text-gray-500">{getTranslatedText("PNG, JPG or JPEG (MAX. 5MB)")}</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleLicensePhotoChange}
                />
              </label>
              {licenseFile && (
                <button
                  type="button"
                  onClick={() => {
                    setLicenseFile(null);
                    setLicensePreview(null);
                  }}
                  className="text-xs font-semibold"
                  style={{ color: '#ef4444' }}
                >
                  {getTranslatedText("Remove License")}
                </button>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-xl bg-zinc-800/50">
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-emerald-400 shrink-0 mt-0.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor" />
              </svg>
              <div>
                <p className="text-sm font-semibold mb-1 text-white">
                  {getTranslatedText("Important Information")}
                </p>
                <ul className="text-xs space-y-1 text-gray-400">
                  <li>• {getTranslatedText("Your KYC documents will be verified by our admin team")}</li>
                  <li>• {getTranslatedText("Verification usually takes 24-48 hours")}</li>
                  <li>• {getTranslatedText("You can start receiving requests after verification")}</li>
                  <li>• {getTranslatedText("All documents are securely stored and encrypted")}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={isSubmitting || !aadhaarNumber || aadhaarNumber.length !== 12 || !aadhaarPhoto || !selfiePhoto}
            className="w-full py-4 md:py-5 rounded-xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#64946e', color: '#ffffff' }}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                />
                <span>{getTranslatedText("Submitting...")}</span>
              </div>
            ) : (
              getTranslatedText('Submit KYC')
            )}
          </motion.button>
        </motion.form>

        {/* Success Toast */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4"
            >
              <div className="rounded-2xl p-6 shadow-2xl bg-zinc-900 border-2 border-emerald-500">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-900/30">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="2" fill="#10b981" fillOpacity="0.1" />
                      <path d="M9 12l2 2 4-4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1 text-white">
                      {getTranslatedText("KYC Submitted Successfully!")}
                    </h3>
                    <p className="text-sm mb-2 text-gray-400">
                      {getTranslatedText("Your KYC documents have been submitted for verification.")}
                    </p>
                    <div className="p-3 rounded-lg bg-emerald-900/20">
                      <p className="text-xs font-semibold mb-1 text-white">
                        ⏱️ {getTranslatedText("Verification Time:")}
                      </p>
                      <p className="text-xs text-emerald-400">
                        {getTranslatedText("Usually takes 24-48 hours. You'll be notified once verification is complete.")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default KYCUploadPage;


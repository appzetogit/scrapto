import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

const OTPModal = ({ onClose }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showOtp, setShowOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const inputRefs = useRef([]);

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (phone.length === 10) {
      setOtpSent(true);
      setTimeout(() => {
        setShowOtp(true);
      }, 1000);
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
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (otp.every((digit) => digit !== '')) {
      // Handle OTP verification here
      console.log('OTP Verified:', otp.join(''));
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="rounded-2xl p-6 md:p-8 max-w-md w-full"
          style={{ backgroundColor: '#ffffff' }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 
              className="text-2xl font-bold"
              style={{ color: '#2d3748' }}
            >
              {showOtp ? 'Enter OTP' : 'Get Started'}
            </h2>
            <button
              onClick={onClose}
              className="text-2xl hover:opacity-70 transition-opacity"
              style={{ color: '#718096' }}
            >
              ×
            </button>
          </div>

          {!showOtp ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: '#4a5568' }}
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit phone number"
                  className="w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ 
                    borderColor: '#e5ddd4',
                    color: '#2d3748',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#64946e';
                    e.target.style.boxShadow = '0 0 0 2px rgba(100, 148, 110, 0.2)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5ddd4';
                    e.target.style.boxShadow = 'none';
                  }}
                  maxLength={10}
                />
              </div>
              {otpSent && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm"
                  style={{ color: '#64946e' }}
                >
                  OTP sent to {phone}
                </motion.p>
              )}
              <button
                type="submit"
                disabled={phone.length !== 10}
                className="w-full text-white font-semibold py-3 rounded-lg disabled:cursor-not-allowed transition-all"
                style={{ 
                  backgroundColor: phone.length === 10 ? '#64946e' : '#cbd5e0',
                }}
                onMouseEnter={(e) => {
                  if (phone.length === 10) e.target.style.backgroundColor = '#5a8263';
                }}
                onMouseLeave={(e) => {
                  if (phone.length === 10) e.target.style.backgroundColor = '#64946e';
                }}
              >
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <p 
                  className="text-sm mb-4"
                  style={{ color: '#718096' }}
                >
                  Enter the 6-digit OTP sent to {phone}
                </p>
                <div className="flex gap-1.5 justify-between max-w-[260px] mx-auto">
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
                      className="w-8 h-9 text-center text-base font-bold border-2 rounded-lg focus:outline-none transition-all"
                      style={{ 
                        borderColor: '#e5ddd4',
                        color: '#2d3748',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#64946e';
                        e.target.style.boxShadow = '0 0 0 2px rgba(100, 148, 110, 0.2)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5ddd4';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={otp.some((digit) => digit === '')}
                className="w-full text-white font-semibold py-3 rounded-lg disabled:cursor-not-allowed transition-all"
                style={{ 
                  backgroundColor: otp.every((digit) => digit !== '') ? '#64946e' : '#cbd5e0',
                }}
                onMouseEnter={(e) => {
                  if (otp.every((digit) => digit !== '')) e.target.style.backgroundColor = '#5a8263';
                }}
                onMouseLeave={(e) => {
                  if (otp.every((digit) => digit !== '')) e.target.style.backgroundColor = '#64946e';
                }}
              >
                Verify OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOtp(false);
                  setOtp(['', '', '', '', '', '']);
                }}
                className="w-full font-medium py-2 hover:opacity-80 transition-opacity"
                style={{ color: '#64946e' }}
              >
                Change Phone Number
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OTPModal;


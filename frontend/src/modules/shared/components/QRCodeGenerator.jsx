import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FaQrcode, FaDownload } from 'react-icons/fa';

/**
 * Simple QR Code Generator using QR Server API
 * Alternative: Can use qrcode.react library if installed
 */
const QRCodeGenerator = ({ value, size = 200 }) => {
  const [qrUrl, setQrUrl] = useState('');
  const canvasRef = useRef(null);

  useEffect(() => {
    // Using QR Server API (free, no API key needed)
    const encodedValue = encodeURIComponent(value);
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}`;
    setQrUrl(url);
  }, [value, size]);

  const handleDownload = () => {
    if (qrUrl) {
      const link = document.createElement('a');
      link.href = qrUrl;
      link.download = `referral-qr-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!qrUrl) {
    return (
      <div className="flex items-center justify-center p-8" style={{ backgroundColor: '#f7fafc' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#64946e' }}></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="p-4 rounded-xl border-2 flex items-center justify-center"
        style={{
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0'
        }}
      >
        <img
          src={qrUrl}
          alt="Referral QR Code"
          className="w-full h-full"
          style={{ maxWidth: `${size}px`, maxHeight: `${size}px` }}
        />
      </div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleDownload}
        className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
        style={{ backgroundColor: '#64946e', color: '#ffffff' }}
      >
        <FaDownload />
        Download QR
      </motion.button>
    </div>
  );
};

export default QRCodeGenerator;


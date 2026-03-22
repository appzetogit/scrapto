import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { motion } from "framer-motion";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen w-full bg-[#f8fafc]"
    >
      <div className="w-full p-4 md:p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
          >
            <IoArrowBack size={24} />
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            Privacy Policy
          </h1>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="prose max-w-none text-gray-600 space-y-4">
            <p>Last Updated: October 2023</p>
            
            <h2 className="text-lg font-semibold text-gray-800 mt-6">1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create or modify your account, request services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, postal address, profile picture, payment method, and other information you choose to provide.</p>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve our services, such as to facilitate scrap collection, process payments, send receipts, provide products and services you request, and send related information, including confirmations and invoices.</p>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">3. Sharing of Information</h2>
            <p>We may share the information we collect about you as described in this policy or at the time of collection or sharing, including with scrappers to enable them to provide the services you request.</p>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">4. Data Security</h2>
            <p>We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.</p>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">5. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at Scraptoxwork@gmail.com.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicy;

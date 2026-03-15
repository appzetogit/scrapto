import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { motion } from "framer-motion";

const TermsAndConditions = () => {
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
            Terms & Conditions
          </h1>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="prose max-w-none text-gray-600 space-y-4">
            <p>Last Updated: October 2023</p>
            
            <h2 className="text-lg font-semibold text-gray-800 mt-6">1. Acceptance of Terms</h2>
            <p>By accessing or using the Scrapto platform, you agree to be bound by these Terms and Conditions and our Privacy Policy.</p>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">2. Platform Role</h2>
            <p>Scrapto acts as a facilitator connecting users who want to dispose of scrap with independent collectors. We are not responsible for the actual transaction, weighing, or payment process between the parties.</p>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">3. User Obligations</h2>
            <p>Users must provide accurate information regarding the type and quantity of scrap. Scrapto reserves the right to suspend accounts providing false information.</p>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">4. Pricing</h2>
            <p>Prices listed on the platform are indicative market rates. Final pricing is determined at the time of pickup based on actual weight and quality.</p>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">5. Limitation of Liability</h2>
            <p>Scrapto shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TermsAndConditions;

import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { motion } from "framer-motion";

const RefundPolicy = () => {
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
            Refund Policy
          </h1>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="prose max-w-none text-gray-600 space-y-4">
            <p>Last Updated: October 2023</p>
            
            <h2 className="text-lg font-semibold text-gray-800 mt-6">1. Cancellation of Pickup</h2>
            <p>Users can cancel their scrap pickup request anytime before the scrapper arrives at the location. Once the scrap is weighed and the transaction is initiated, no cancellation or refund of the scrap material is possible.</p>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">2. Payment Disputes</h2>
            <p>Scraptox is a platform connecting users and scrappers. Payments for scrap are handled directly between the user and the scrapper. Scraptox does not collect payments from users for scrap collection and therefore does not issue refunds for scrap value.</p>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">3. Subscription Refunds</h2>
            <p>For scrappers subscribing to our platform plans, refund requests must be made within 24 hours of purchase if the service has not been utilized. After 24 hours or once the service is used, no refunds will be provided.</p>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">4. Contact Support</h2>
            <p>For any refund-related queries, please email us at Scraptoxwork@gmail.com with your transaction details.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RefundPolicy;

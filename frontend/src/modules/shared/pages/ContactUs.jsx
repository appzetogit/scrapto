import { useNavigate } from "react-router-dom";
import { IoArrowBack, IoMailOutline, IoCallOutline, IoLocationOutline } from "react-icons/io5";
import { motion } from "framer-motion";

const ContactUs = () => {
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
            Contact Us
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Get in Touch</h2>
              <p className="text-gray-600">Have questions? We're here to help. Reach out to us through any of these channels.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 text-gray-600">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <IoMailOutline size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email us at</p>
                  <p className="font-medium text-[15px] sm:text-base selection:bg-emerald-100">Scraptowork@gmail.com</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-gray-600">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <IoCallOutline size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Call us at</p>
                  <p className="font-medium text-[15px] sm:text-base selection:bg-blue-100">+91 9971363160</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-gray-600">
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <IoLocationOutline size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Visit us at</p>
                  <p className="font-medium text-[15px] sm:text-base selection:bg-orange-100">312 ram Nagar ghaziabad</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Placeholder/Message */}
          <div className="bg-emerald-600 rounded-2xl p-6 md:p-8 shadow-lg text-white flex flex-col justify-center items-center text-center">
            <h2 className="text-2xl font-bold mb-4">Support Available 24/7</h2>
            <p className="opacity-90 mb-6">Our dedicated support team is always ready to assist you with your scrap collection needs.</p>
            <button 
                onClick={() => window.location.href = 'mailto:Scraptowork@gmail.com'}
                className="bg-white text-emerald-600 px-8 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-md"
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ContactUs;

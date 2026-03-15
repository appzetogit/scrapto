import { useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { motion } from "framer-motion";

const AboutUs = () => {
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
            About Us
          </h1>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
          <div className="prose max-w-none text-gray-600 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Who We Are</h2>
            <p>Scrapto is India's leading digital platform for scrap management. We aim to organize the unorganized scrap collection industry by connecting households and businesses with verified scrap collectors (Scrappers).</p>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">Our Mission</h2>
            <p>Our mission is to make recycling accessible, transparent, and rewarding for everyone. By providing a digital bridge, we ensure that scrap materials are collected efficiently and channeled back into the recycling ecosystem, contributing to a Greener Earth.</p>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">Why Choose Scrapto?</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Convenience:</strong> Book a pickup from your home with just a few clicks.</li>
              <li><strong>Fair Pricing:</strong> Get transparent market rates for your scrap.</li>
              <li><strong>Verified Scrappers:</strong> All our partners undergo a strict KYC process for your safety.</li>
              <li><strong>Digital Tracking:</strong> Track your pickup and maintain a history of your contributions to the environment.</li>
            </ul>

            <h2 className="text-lg font-semibold text-gray-800 mt-6">Our Vision</h2>
            <p>To be the driving force behind a circular economy in India, where no waste goes to landfills and every piece of scrap is valued and recycled.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AboutUs;

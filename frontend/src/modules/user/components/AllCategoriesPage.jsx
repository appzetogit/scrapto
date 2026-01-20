import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import plasticImage from "../assets/plastic.jpg";
import metalImage from "../assets/metal.jpg";
import scrapImage2 from "../assets/scrab.png";
import electronicImage from "../assets/electronicbg.png";

import { useState, useEffect } from "react";
import { publicAPI } from "../../shared/utils/api";
import {
  getEffectivePriceFeed,
  getEffectiveServiceFeed,
  PRICE_TYPES,
} from "../../shared/utils/priceFeedUtils";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { useDynamicTranslation } from "../../../hooks/useDynamicTranslation";

const AllCategoriesPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const staticTexts = [
    "All Categories",
    "Browse all available scrap categories",
    "Scrap Materials",
    "Cleaning Services (We Clean, You Pay)",
    "Fee",
    "Go back",
    "Sell your {category} scrap",
    "Book {category}",
  ];

  const { getTranslatedText } = usePageTranslation(staticTexts);
  const { translateBatch } = useDynamicTranslation();

  // Helper to get image based on category name
  const getCategoryImage = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("plastic")) return plasticImage;
    if (
      lowerName.includes("metal") ||
      lowerName.includes("iron") ||
      lowerName.includes("steel") ||
      lowerName.includes("copper") ||
      lowerName.includes("brass") ||
      lowerName.includes("aluminium")
    )
      return metalImage;
    if (
      lowerName.includes("paper") ||
      lowerName.includes("book") ||
      lowerName.includes("cardboard")
    )
      return scrapImage2;
    if (
      lowerName.includes("electron") ||
      lowerName.includes("device") ||
      lowerName.includes("computer") ||
      lowerName.includes("phone")
    )
      return electronicImage;
    return scrapImage2; // Default fallback
  };

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await publicAPI.getPrices();
        if (
          response.success &&
          response.data?.prices &&
          response.data.prices.length > 0
        ) {
          const allItems = response.data.prices;

          // Filter Materials
          const materialsRaw = allItems.filter(
            (p) => !p.type || p.type === PRICE_TYPES.MATERIAL
          );

          const mappedMaterials = materialsRaw.map((price) => ({
            name: price.category,
            image: price.image || getCategoryImage(price.category),
            // We don't translate here to avoid dependency loops
            type: PRICE_TYPES.MATERIAL,
          }));
          setCategories(mappedMaterials);

          // Filter Services
          const servicesRaw = allItems.filter(
            (p) => p.type === PRICE_TYPES.SERVICE
          );
          const mappedServices = servicesRaw.map((price) => ({
            name: price.category,
            price: price.price || 0,
            image: price.image || getCategoryImage(price.category),
            description: price.description, // Keep raw description if active
            type: PRICE_TYPES.SERVICE,
          }));
          setServices(mappedServices);
        } else {
          throw new Error("No prices from API");
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Fallback
        const defaultFeed = getEffectivePriceFeed();
        const mapped = defaultFeed.map((item) => ({
          name: item.category,
          image: getCategoryImage(item.category),
          type: PRICE_TYPES.MATERIAL,
        }));
        setCategories(mapped);

        const defaultServices = getEffectiveServiceFeed();
        const mappedServices = defaultServices.map((item) => ({
          name: item.category,
          price: item.price,
          image: getCategoryImage(item.category),
          description: item.description,
          type: PRICE_TYPES.SERVICE,
        }));
        setServices(mappedServices);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []); // Removed dependency to prevent re-fetching loop

  const handleCategoryClick = (item) => {
    if (item.type === PRICE_TYPES.SERVICE) {
      // Navigate to service booking flow
      navigate("/book-service/details", {
        state: { selectedService: item },
      });
    } else {
      // Navigate to scrap flow
      navigate("/add-scrap/category", {
        state: { preSelectedCategory: item.name },
      });
    }
  };

  return (
    <div
      className="min-h-screen w-full relative z-0 pb-20 md:pb-0 overflow-x-hidden"
      style={{ backgroundColor: "#f4ebe2" }}>
      {/* Sticky Header with Back Button */}
      <div
        className="sticky top-0 z-40 px-4 md:px-6 lg:px-8 py-4 md:py-6"
        style={{ backgroundColor: "#f4ebe2" }}>
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full hover:opacity-70 transition-opacity flex-shrink-0"
            style={{
              color: "#64946e",
              backgroundColor: "rgba(100, 148, 110, 0.1)",
            }}
            aria-label={getTranslatedText("Go back")}>
            <FaArrowLeft size={18} />
          </button>
          <div>
            <h1
              className="text-xl md:text-2xl font-bold"
              style={{ color: "#2d3748" }}>
              {getTranslatedText("All Categories")}
            </h1>
            <p
              className="text-sm md:text-base mt-0.5"
              style={{ color: "#718096" }}>
              {getTranslatedText("Browse all available scrap categories")}
            </p>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto pb-8">
        {/* Scrap Materials Section */}
        <div className="mb-8">
          <h2
            className="text-xl font-bold mb-4 ml-1"
            style={{ color: "#2d3748" }}>
            {getTranslatedText("Scrap Materials")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={`cat-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCategoryClick(category)}
                className="cursor-pointer">
                <div
                  className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
                  style={{ backgroundColor: "#ffffff" }}>
                  <div className="aspect-square relative overflow-hidden bg-gray-100">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      style={{ display: "block" }}
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <p
                      className="text-base md:text-lg font-semibold text-center mb-1"
                      style={{ color: "#2d3748" }}>
                      {category.name}
                    </p>
                    <p
                      className="text-xs md:text-sm text-center"
                      style={{ color: "#718096" }}>
                      {getTranslatedText("Sell your {category} scrap", {
                        category: category.name,
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Cleaning Services Section */}
        {services.length > 0 && (
          <div>
            <h2
              className="text-xl font-bold mb-4 ml-1"
              style={{ color: "#2d3748" }}>
              {getTranslatedText("Cleaning Services (We Clean, You Pay)")}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
              {services.map((service, index) => (
                <motion.div
                  key={`srv-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCategoryClick(service)}
                  className="cursor-pointer">
                  <div
                    className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border-2"
                    style={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                    }}>
                    <div className="aspect-square relative overflow-hidden bg-gray-100">
                      <div className="absolute inset-0 flex items-center justify-center bg-green-100">
                        {/* Use icon or fallback if no image */}
                        <span className="text-4xl">🧹</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p
                        className="text-base md:text-lg font-bold text-center mb-1"
                        style={{ color: "#2d3748" }}>
                        {service.name}
                      </p>
                      <p
                        className="text-sm font-bold text-center mb-1"
                        style={{ color: "#e53e3e" }}>
                        ₹{service.price} {getTranslatedText("Fee")}
                      </p>
                      <p
                        className="text-xs md:text-sm text-center truncate"
                        style={{ color: "#718096" }}>
                        {service.description
                          ? getTranslatedText(service.description)
                          : getTranslatedText("Book {category}", {
                            category: service.name,
                          })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllCategoriesPage;

import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { useState, useEffect } from "react";
import { publicAPI } from "../../shared/utils/api";
import {
    getEffectivePriceFeed,
    PRICE_TYPES,
} from "../../shared/utils/priceFeedUtils";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { useDynamicTranslation } from "../../../hooks/useDynamicTranslation";
import plasticImage from "../assets/plastic.jpg";
import metalImage from "../assets/metal.jpg";
import scrapImage2 from "../assets/scrab.png";
import electronicImage from "../assets/electronicbg.png";
import UserBottomNav from "./UserBottomNav";

const PriceListPage = () => {
    const navigate = useNavigate();
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const staticTexts = [
        "Scrap Prices",
        "Current market rates for scrap materials",
        "Search",
        "Go back",
        "Category",
        "Price",
        "Unit",
        "No prices found",
        "Try a different search term"
    ];

    const { getTranslatedText } = usePageTranslation(staticTexts);
    // We can use dynamic translation for category names if needed, 
    // but usually they come from backend possibly already localized or we translate them on the fly.
    const { translateBatch } = useDynamicTranslation();

    // Helper to get image
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
        return scrapImage2;
    };

    useEffect(() => {
        const fetchPrices = async () => {
            setLoading(true);
            try {
                const response = await publicAPI.getPrices();
                if (
                    response.success &&
                    response.data?.prices &&
                    response.data.prices.length > 0
                ) {
                    const allItems = response.data.prices;
                    // Filter Materials only
                    const materials = allItems.filter(
                        (p) => !p.type || p.type === PRICE_TYPES.MATERIAL
                    );

                    const mappedPrices = materials.map((price) => ({
                        id: price._id || price.id,
                        name: price.category,
                        price: price.pricePerKg || price.price || 0,
                        unit: price.unit || 'kg',
                        image: price.image || getCategoryImage(price.category),
                    }));
                    setPrices(mappedPrices);
                } else {
                    throw new Error("No prices from API");
                }
            } catch (error) {
                console.error("Failed to fetch prices:", error);
                // Fallback
                const defaultFeed = getEffectivePriceFeed();
                const mapped = defaultFeed.map((item, index) => ({
                    id: index,
                    name: item.category,
                    price: item.price,
                    unit: 'kg',
                    image: getCategoryImage(item.category),
                }));
                setPrices(mapped);
            } finally {
                setLoading(false);
            }
        };
        fetchPrices();
    }, []);

    const filteredPrices = prices.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div
            className="min-h-screen w-full relative z-0 pb-20 md:pb-0 overflow-x-hidden"
            style={{ background: "linear-gradient(to bottom, #72c688ff, #dcfce7)" }}>
            {/* Sticky Header */}
            <div
                className="sticky top-0 z-40 px-4 md:px-6 lg:px-8 py-4 md:py-6"
                style={{ backgroundColor: "transparent" }}>
                <div className="max-w-7xl mx-auto flex items-center gap-4 mb-4">

                    <div>
                        <h1
                            className="text-xl md:text-2xl font-bold"
                            style={{ color: "#ffffff" }}>
                            {getTranslatedText("Scrap Prices")}
                        </h1>
                        <p
                            className="text-sm md:text-base mt-0.5"
                            style={{ color: "#ecfdf5" }}>
                            {getTranslatedText("Current market rates for scrap materials")}
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="max-w-7xl mx-auto relative">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder={getTranslatedText("Search") + "..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                        style={{ backgroundColor: "white" }}
                    />
                </div>
            </div>

            {/* Price List */}
            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto pb-8">
                {loading ? (
                    <div className="text-center py-10 text-white font-medium">Loading...</div>
                ) : filteredPrices.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPrices.map((item, index) => (
                            <motion.div
                                key={item.id || index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="bg-white rounded-xl p-4 shadow-md flex items-center gap-4 border border-slate-100 hover:shadow-lg transition-shadow"
                            >
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg" style={{ color: "#1e293b" }}>{item.name}</h3>
                                    <p className="text-sm text-slate-500">Per {item.unit}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xl font-bold" style={{ color: "#059669" }}>₹{item.price}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 opacity-60">
                        <p className="text-lg font-bold">{getTranslatedText("No prices found")}</p>
                        <p className="text-sm">{getTranslatedText("Try a different search term")}</p>
                    </div>
                )}
            </div>
            <UserBottomNav />
        </div>
    );
};

export default PriceListPage;

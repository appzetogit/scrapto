import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import ReferAndEarn from "./ReferAndEarn";

const ReferAndEarnPage = () => {
    const navigate = useNavigate();
    const { getTranslatedText } = usePageTranslation(["Refer & Earn", "Go back"]);

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
                            {getTranslatedText("Refer & Earn")}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto pb-8">
                <ReferAndEarn />
            </div>
        </div>
    );
};

export default ReferAndEarnPage;

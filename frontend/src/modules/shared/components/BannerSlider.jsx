import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { bannerAPI } from '../utils/api';

const BannerSlider = ({ audience = 'both', autoPlayInterval = 5000 }) => {
    const [banners, setBanners] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBanners();
    }, [audience]);

    useEffect(() => {
        if (banners.length <= 1) return;

        const timer = setInterval(() => {
            handleNext();
        }, autoPlayInterval);

        return () => clearInterval(timer);
    }, [banners.length, currentIndex, autoPlayInterval]);

    const loadBanners = async () => {
        try {
            const response = await bannerAPI.getActive(audience);
            if (response.success) {
                setBanners(response.data.banners || []);
            }
        } catch (error) {
            console.error('Failed to load banners:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    if (loading || banners.length === 0) {
        return null; // Don't render anything if no banners or loading (avoids layout shift if placed carefully or can add skeleton)
    }

    return (
        <div className="relative w-full overflow-hidden rounded-xl shadow-md group aspect-[3/1] md:aspect-[4/1]">
            <AnimatePresence initial={false} mode='wait'>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 w-full h-full"
                >
                    {banners[currentIndex].link ? (
                        <a href={banners[currentIndex].link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                            <img
                                src={banners[currentIndex].imageUrl}
                                alt={banners[currentIndex].title}
                                className="w-full h-full object-cover"
                            />
                        </a>
                    ) : (
                        <img
                            src={banners[currentIndex].imageUrl}
                            alt={banners[currentIndex].title}
                            className="w-full h-full object-cover"
                        />
                    )}

                    {/* Optional: Add title overlay if needed, currently keeping clean image look */}

                    {/* Text Overlay */}
                    {(banners[currentIndex].title || banners[currentIndex].description) && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white">
                            {banners[currentIndex].title && (
                                <h3 className="font-bold text-lg">{banners[currentIndex].title}</h3>
                            )}
                            {banners[currentIndex].description && (
                                <p className="text-xs md:text-sm opacity-90 line-clamp-2">{banners[currentIndex].description}</p>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons - Show on hover */}
            {
                banners.length > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.preventDefault(); handlePrev(); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); handleNext(); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/30 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                        >
                            <FaChevronRight />
                        </button>

                        {/* Dots Indicator */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                            {banners.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/50'
                                        }`}
                                />
                            ))}
                        </div>
                    </>
                )
            }
        </div >
    );
};

export default BannerSlider;

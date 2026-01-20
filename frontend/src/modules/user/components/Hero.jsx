import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import Lenis from "lenis";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import PriceTicker from "./PriceTicker";
import TrustSignals from "./TrustSignals";
import Testimonials from "./Testimonials";
import OTPModal from "./OTPModal";
import CustomerSolutions from "./CustomerSolutions";
import Profile from "./Profile";
import { usePageTranslation } from "../../../hooks/usePageTranslation";
import { useDynamicTranslation } from "../../../hooks/useDynamicTranslation";
import scrapImage from "../assets/scrap3-Photoroom.png";
import scrapImage2 from "../assets/scrab.png";
import scrapImage3 from "../assets/scrap5.png";
import plasticImage from "../assets/plastic.jpg";
import metalImage from "../assets/metal.jpg";
import electronicImage from "../assets/electronicbg.png";

import BannerSlider from "../../shared/components/BannerSlider";
import { publicAPI } from "../../shared/utils/api";
import { getEffectivePriceFeed, PRICE_TYPES } from "../../shared/utils/priceFeedUtils";

const Hero = () => {
  const navigate = useNavigate();
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [isWebView, setIsWebView] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const [locationAddress, setLocationAddress] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const heroRef = useRef(null);
  const lenisRef = useRef(null);
  const bannerIntervalRef = useRef(null);
  const locationInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const { translateObject, translateBatch } = useDynamicTranslation();

  const originalBanners = useMemo(
    () => [
      {
        title: "REDUCE REUSE RECYCLE",
        description:
          "Learn tips to apply these 3 steps and earn money from your scrap.",
        image: scrapImage,
      },
      {
        title: "GET BEST PRICES",
        description:
          "Real-time market rates ensure you get the maximum value for your scrap materials.",
        image: scrapImage2,
      },
      {
        title: "VERIFIED COLLECTORS",
        description:
          "All our scrappers are KYC verified and background checked for your safety.",
        image: scrapImage3,
      },
    ],
    []
  );



  const [banners, setBanners] = useState(originalBanners);
  const [rawCategories, setRawCategories] = useState([]);
  const [activeCategories, setActiveCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

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
      setCategoriesLoading(true);
      try {
        const response = await publicAPI.getPrices();
        if (response.success && response.data?.prices?.length > 0) {
          // Filter out services, keep only materials
          const materials = response.data.prices.filter(p => !p.type || p.type === PRICE_TYPES.MATERIAL);

          // Map to display format and limit to 6 for the home screen
          const mapped = materials.slice(0, 6).map(p => ({
            name: p.category,
            originalName: p.category,
            image: p.image || getCategoryImage(p.category)
          }));

          setRawCategories(mapped);
          setActiveCategories(mapped);
        } else {
          throw new Error("No prices found");
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        // Fallback to default
        const feed = getEffectivePriceFeed();
        const mapped = feed.slice(0, 6).map(item => ({
          name: item.category,
          originalName: item.category,
          image: getCategoryImage(item.category)
        }));
        setRawCategories(mapped);
        setActiveCategories(mapped);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Effect to translate categories when language changes
  useEffect(() => {
    const translateCategories = async () => {
      if (rawCategories.length === 0) return;

      try {
        const names = rawCategories.map(c => c.originalName);
        const translatedNames = await translateBatch(names);

        const translatedCats = rawCategories.map((c, i) => ({
          ...c,
          name: translatedNames[i] || c.originalName
        }));
        setActiveCategories(translatedCats);
      } catch (error) {
        console.error("Error translating categories:", error);
      }
    };
    translateCategories();
  }, [rawCategories, translateBatch]);
  const { getTranslatedText } = usePageTranslation([
    "Current Location",
    "Enter location manually",
    "Loading...",
    "Sell Scrap",
    "Book a Pickup",
    "How it works",
    "Learn more",
    "Get started",
    "Sell Your Scrap",
    "We'll Pick It Up",
    "Real-time market prices. Verified scrappers. Cash on pickup.",
    "Learn how to get the best value for your scrap materials.",
    "Request Pickup Now",
    "Tap to set location",
    "Getting your location...",
    "Type to search location...",
    "Home Services",
    "Waste Collection",
    "Professional deep cleaning service including floor scrubbing, cobweb removal, and bathroom cleaning.",
    "Fixed Price: ₹1200",
    "Verified Pros",
    "New",
    "Scrap Categories",
    "See all",
    "Plastic",
    "Paper",
    "Glass",
    "Metal",
    "Electronics",
    "Textile",
    "Free Pickup",
    "No pickup charges. We reach your doorstep without any extra cost.",
    "Best Rates",
    "Highest market rates with real-time pricing so every deal stays fair.",
    "Verified & Safe",
    "KYC-verified partners with reliable pickups for a worry-free experience.",
    "Premium",
    "Experience a spotless home with our professional deep cleaning. Verified experts & eco-friendly products.",
    "Verified",
    "Iron",
    "Steel",
    "Copper",
    "Brass",
    "Aluminium",
    "Cardboard",
    "Books",
    "Newspaper",
    "Old Books",
    "Cartons",
    "E-Waste",
    "Batteries",
    "Cables",
    "Book Now"
  ]);

  useEffect(() => {
    const translateBanners = async () => {
      const translated = await Promise.all(
        originalBanners.map((banner) =>
          translateObject(banner, ["title", "description"])
        )
      );
      setBanners(translated);
    };
    translateBanners();
  }, [originalBanners, translateObject]);
  const getLiveLocation = () => {
    if (navigator.geolocation) {
      setIsLoadingLocation(true);
      setShowSuggestions(false);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });

          // Reverse geocode to get address
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
            );
            const data = await response.json();
            if (data && data.display_name) {
              // Extract a shorter address
              const address =
                data.display_name.split(",").slice(0, 3).join(", ") ||
                data.display_name;
              setLocationAddress(address);
              setSearchQuery(address);
            } else {
              const coords = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
              setLocationAddress(coords);
              setSearchQuery(coords);
            }
          } catch (error) {
            console.error("Error reverse geocoding:", error);
            const coords = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            setLocationAddress(coords);
            setSearchQuery(coords);
          }
          setIsLoadingLocation(false);
          setIsEditingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationAddress("Location not available");
          setIsLoadingLocation(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser");
      setIsLoadingLocation(false);
    }
  };

  // Fetch location suggestions
  const fetchLocationSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5&addressdetails=1&countrycodes=in`
      );
      const data = await response.json();
      if (data && Array.isArray(data)) {
        setLocationSuggestions(data);
        setShowSuggestions(true);
      } else {
        setLocationSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Debounced search for suggestions
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (isEditingLocation && searchQuery) {
      debounceTimerRef.current = setTimeout(() => {
        fetchLocationSuggestions(searchQuery);
      }, 300);
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, isEditingLocation]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Detect if running in webview
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isWebViewDetected =
      /wv/i.test(userAgent) || // Android WebView
      /WebView/i.test(userAgent) || // iOS WebView
      window.ReactNativeWebView !== undefined; // React Native WebView

    setIsWebView(isWebViewDetected);

    // Initialize Lenis for smooth scrolling with optimized settings
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false, // Disable smooth touch for better mobile performance
      touchMultiplier: 2,
      wheelMultiplier: 1.2,
      infinite: false,
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    lenisRef.current = lenis;

    // Connect Lenis to window scroll with proper RAF loop
    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Ensure smooth scrolling works properly
    const htmlElement = document.documentElement;
    const bodyElement = document.body;

    if (htmlElement) {
      htmlElement.style.scrollBehavior = "auto"; // Let Lenis handle it
      htmlElement.style.overflowX = "hidden";
    }
    if (bodyElement) {
      bodyElement.style.overflowX = "hidden";
    }

    // Handle resize events to recalculate scroll
    const handleResize = () => {
      if (lenisRef.current) {
        lenisRef.current.resize();
      }
    };
    window.addEventListener("resize", handleResize);

    // Handle content changes (for dynamic content)
    const resizeObserver = new ResizeObserver(() => {
      if (lenisRef.current) {
        lenisRef.current.resize();
      }
    });
    if (heroRef.current) {
      resizeObserver.observe(heroRef.current);
    }

    // Hero entrance animation (non-blocking)
    if (heroRef.current) {
      // Small delay to ensure Lenis is ready
      setTimeout(() => {
        gsap.from(heroRef.current, {
          y: 20,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => {
            // Ensure Lenis can scroll after animation
            if (lenisRef.current) {
              lenisRef.current.resize();
            }
          },
        });
      }, 100);
    }

    // Ensure Lenis recalculates after all content is loaded
    const handleLoad = () => {
      if (lenisRef.current) {
        lenisRef.current.resize();
      }
    };
    window.addEventListener("load", handleLoad);

    // Also recalculate after a short delay to catch any late-loading content
    const initTimeout = setTimeout(() => {
      if (lenisRef.current) {
        lenisRef.current.resize();
      }
    }, 500);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("load", handleLoad);
      clearTimeout(initTimeout);
      resizeObserver.disconnect();
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      if (htmlElement) {
        htmlElement.style.scrollBehavior = "";
        htmlElement.style.overflowX = "";
      }
      if (bodyElement) {
        bodyElement.style.overflowX = "";
      }
    };
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    bannerIntervalRef.current = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % 3);
    }, 4000); // Change banner every 4 seconds

    return () => {
      if (bannerIntervalRef.current) {
        clearInterval(bannerIntervalRef.current);
      }
    };
  }, []);

  const handleLocationClick = () => {
    setIsEditingLocation(true);
    setSearchQuery(locationAddress);
    setTimeout(() => {
      locationInputRef.current?.focus();
    }, 100);
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setLocationAddress(value);
  };

  const handleLocationBlur = () => {
    // Delay to allow suggestion click
    setTimeout(() => {
      if (locationAddress.trim()) {
        setIsEditingLocation(false);
        setShowSuggestions(false);
      }
    }, 200);
  };

  const handleLocationKeyPress = (e) => {
    if (e.key === "Enter") {
      if (locationSuggestions.length > 0) {
        handleSelectSuggestion(locationSuggestions[0]);
      } else {
        setIsEditingLocation(false);
        setShowSuggestions(false);
        locationInputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setIsEditingLocation(false);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    const address =
      suggestion.display_name.split(",").slice(0, 3).join(", ") ||
      suggestion.display_name;
    setLocationAddress(address);
    setSearchQuery(address);
    setUserLocation({
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    });
    setShowSuggestions(false);
    setIsEditingLocation(false);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showProfile ? (
          <Profile onClose={() => setShowProfile(false)} />
        ) : (
          <div
            ref={heroRef}
            className="min-h-screen relative z-0 pb-20 md:pb-0 overflow-x-hidden"
            style={{ background: "linear-gradient(to bottom, #72c688ff, #dcfce7)" }}>
            {/* Header */}
            <Header />

            {/* Location Bar */}
            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto mb-4 md:mb-6">
              <motion.div
                initial={{ y: 5 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative">
                <div
                  className={`flex items-center rounded-full px-4 py-3 md:py-4 border transition-all ${isEditingLocation ? "" : "cursor-pointer"
                    }`}
                  style={{
                    backgroundColor: "#ffffff",
                    borderColor: isEditingLocation ? "#64946e" : "#e5ddd4",
                  }}
                  onClick={
                    !isEditingLocation ? handleLocationClick : undefined
                  }>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mr-3 flex-shrink-0"
                    style={{ color: "#64946e" }}>
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                      fill="currentColor"
                    />
                  </svg>
                  <div className="flex-1 relative min-w-0">
                    {isLoadingLocation ? (
                      <div
                        className="flex items-center gap-2 text-sm md:text-base"
                        style={{ color: "#a0aec0" }}>
                        <span className="animate-pulse">
                          {getTranslatedText("Getting your location...")}
                        </span>
                      </div>
                    ) : (
                      <>
                        {isEditingLocation ? (
                          <input
                            ref={locationInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={handleLocationChange}
                            onBlur={handleLocationBlur}
                            onKeyDown={handleLocationKeyPress}
                            className="flex-1 bg-transparent border-none outline-none text-sm md:text-base w-full"
                            style={{ color: "#2d3748" }}
                            placeholder={getTranslatedText(
                              "Type to search location..."
                            )}
                            autoComplete="off"
                          />
                        ) : (
                          <div
                            className="text-sm md:text-base truncate"
                            style={{ color: "#2d3748" }}>
                            {locationAddress ||
                              getTranslatedText("Tap to set location")}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {!isLoadingLocation && (
                    <>
                      {isEditingLocation ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            getLiveLocation();
                          }}
                          className="ml-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-1.5 transition-all flex-shrink-0"
                          style={{
                            backgroundColor: "#64946e",
                            color: "#ffffff",
                          }}
                          title="Get current location">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none">
                            <path
                              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                              fill="currentColor"
                            />
                          </svg>
                          <span className="hidden sm:inline">Live</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            getLiveLocation();
                          }}
                          className="ml-2 p-1.5 rounded-lg transition-all flex-shrink-0"
                          style={{
                            backgroundColor: "transparent",
                            color: "#64946e",
                          }}
                          title="Get current location">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none">
                            <path
                              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                              fill="currentColor"
                            />
                          </svg>
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Location Suggestions Dropdown */}
                {showSuggestions && locationSuggestions.length > 0 && (
                  <motion.div
                    ref={suggestionsRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border z-50 max-h-64 overflow-y-auto"
                    style={{ borderColor: "#e5ddd4" }}>
                    {locationSuggestions.map((suggestion, index) => {
                      const address =
                        suggestion.display_name
                          .split(",")
                          .slice(0, 3)
                          .join(", ") || suggestion.display_name;
                      return (
                        <motion.div
                          key={suggestion.place_id || index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b last:border-b-0"
                          style={{ borderColor: "#e5ddd4" }}>
                          <div className="flex items-start gap-3">
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="mt-0.5 flex-shrink-0"
                              style={{ color: "#64946e" }}>
                              <path
                                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
                                fill="currentColor"
                              />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p
                                className="text-sm font-medium truncate"
                                style={{ color: "#2d3748" }}>
                                {address}
                              </p>
                              {suggestion.address && (
                                <p
                                  className="text-xs mt-0.5 truncate"
                                  style={{ color: "#718096" }}>
                                  {suggestion.address.city ||
                                    suggestion.address.town ||
                                    suggestion.address.village ||
                                    ""}
                                  {suggestion.address.state
                                    ? `, ${suggestion.address.state}`
                                    : ""}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* Main Hero Content */}
            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
              {/* Value Proposition Section with Image */}
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-3 md:mt-6 lg:mt-12 xl:mt-16">
                <div className="flex flex-row items-center md:items-start gap-3 md:gap-6 lg:gap-8">
                  {/* Left Side - Text and Button */}
                  <div className="flex-1 text-left">
                    <h1
                      className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-2 md:mb-4 lg:mb-6 leading-tight text-left"
                      style={{
                        color: "#2d3748",
                      }}>
                      {getTranslatedText("Sell Your Scrap")}
                      <br />
                      <span style={{ color: "#64946e" }}>
                        {getTranslatedText("We'll Pick It Up")}
                      </span>
                    </h1>
                    <p
                      className="hidden md:block text-base md:text-lg lg:text-xl xl:text-2xl mb-4 md:mb-6 lg:mb-8 max-w-2xl"
                      style={{ color: "#4a5568" }}>
                      {getTranslatedText(
                        "Real-time market prices. Verified scrappers. Cash on pickup."
                      )}
                      <br />
                      <span
                        className="text-sm md:text-base lg:text-lg mt-2 block"
                        style={{ color: "#718096" }}>
                        {getTranslatedText(
                          "Learn how to get the best value for your scrap materials."
                        )}
                      </span>
                    </p>

                    {/* Primary CTA */}
                    <motion.div
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                      className="flex mb-4 md:mb-8 lg:mb-12 justify-start">
                      <button
                        onClick={() => navigate("/add-scrap/category")}
                        className="relative inline-flex items-center justify-center text-white font-semibold py-2 px-6 md:py-4 md:px-8 lg:py-5 lg:px-12 xl:py-6 xl:px-16 rounded-full text-sm md:text-lg lg:text-xl xl:text-2xl border-2 transform hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4"
                        style={{
                          backgroundColor: "#000000",
                          borderColor: "#22c55e",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
                        }}>
                        {getTranslatedText("Request Pickup Now")}
                      </button>
                    </motion.div>
                  </div>

                  {/* Image - No Container Div with Circular Rotation */}
                  <motion.img
                    initial={{ opacity: 0, x: 20 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      rotate: 360,
                    }}
                    transition={{
                      opacity: { duration: 0.6, delay: 0.4 },
                      x: { duration: 0.6, delay: 0.4 },
                      rotate: {
                        duration: 20,
                        repeat: Infinity,
                        ease: "linear",
                      },
                    }}
                    src={scrapImage}
                    alt="Scrap collection"
                    className="flex-shrink-0 w-32 sm:w-40 md:w-48 lg:w-56 xl:w-64 h-auto object-cover"
                    style={{
                      background: "transparent",
                      transformOrigin: "center center",
                    }}
                  />
                </div>
              </motion.div>
            </div>

            {/* Scrap Categories */}
            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
              <motion.div
                initial={{ y: 10 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-2 md:mt-4 mb-6 md:mb-8">
                <div className="flex justify-between items-center mb-3 md:mb-4">
                  <h3
                    className="text-xl md:text-2xl font-bold"
                    style={{ color: "#2d3748" }}>
                    {getTranslatedText("Scrap Categories")}
                  </h3>
                  <button
                    onClick={() => navigate("/categories")}
                    className="text-sm md:text-base font-medium hover:opacity-80 transition-opacity"
                    style={{ color: "#64946e" }}>
                    {getTranslatedText("See all")}
                  </button>
                </div>
                <div className="overflow-x-auto pb-4 scrollbar-hide">
                  <div
                    className="flex flex-col gap-3 md:gap-4"
                    style={{ width: "max-content" }}>
                    {/* Display dynamic categories in rows of 3 */}
                    {Array.from({ length: Math.ceil(activeCategories.length / 3) }).map((_, rowIndex) => (
                      <div key={rowIndex} className="flex gap-3 md:gap-4">
                        {activeCategories.slice(rowIndex * 3, (rowIndex + 1) * 3).map((category, index) => (
                          <motion.div
                            key={category.name}
                            initial={{ x: -20 }}
                            animate={{ x: 0 }}
                            transition={{
                              duration: 0.5,
                              delay: 0.7 + (rowIndex * 3 + index) * 0.1,
                            }}
                            className="flex-shrink-0 w-24 md:w-28 lg:w-32 cursor-pointer"
                            onClick={() =>
                              navigate("/add-scrap/category", {
                                state: { preSelectedCategory: category.name },
                              })
                            }
                            whileTap={{ scale: 0.95 }}>
                            <div
                              className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
                              style={{ backgroundColor: "#ffffff" }}>
                              <div
                                className="aspect-square relative overflow-hidden bg-gray-100"
                                style={{ width: "100%" }}>
                                <img
                                  src={category.image}
                                  alt={category.name}
                                  className="w-full h-full object-cover"
                                  style={{ display: "block" }}
                                  loading="lazy"
                                />
                              </div>
                              <div className="p-2 md:p-2.5">
                                <p
                                  className="text-xs md:text-sm font-semibold text-center truncate"
                                  style={{ color: "#2d3748" }}>
                                  {category.name}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Cleaning Services Section */}
            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto mb-6 md:mb-8">
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <h3
                  className="text-xl md:text-2xl font-bold"
                  style={{ color: "#2d3748" }}>
                  {getTranslatedText("Home Services")}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                  {getTranslatedText("New")}
                </span>
              </div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-2xl shadow-lg cursor-pointer group"
                onClick={() => navigate("/book-service/details")}
                style={{
                  background:
                    "linear-gradient(135deg, #111827 0%, #000000 100%)", // Black Gradient
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}>

                {/* Abstract Patterns Overlay */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                <div className="relative z-10 p-4 md:p-6 flex items-center justify-between gap-4">
                  {/* Text Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-white/20 backdrop-blur-md text-[10px] md:text-xs font-bold text-white uppercase tracking-wider border border-white/10">
                        {getTranslatedText("Premium")}
                      </span>
                      <h4 className="text-lg md:text-2xl font-bold text-white">
                        {getTranslatedText("Waste Collection")}
                      </h4>
                    </div>

                    <p className="text-gray-300 text-xs md:text-sm mb-3 line-clamp-2 max-w-lg">
                      {getTranslatedText(
                        "Experience a spotless home with our professional deep cleaning. Verified experts & eco-friendly products."
                      )}
                    </p>

                    {/* Features Badges - Compact */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-white/90 text-xs md:text-sm font-medium">
                        <span className="bg-white/20 p-1 rounded-full">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                        <span>₹1200</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-white/90 text-xs md:text-sm font-medium">
                        <span className="bg-white/20 p-1 rounded-full">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                        </span>
                        <span>{getTranslatedText("Verified")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual / CTA Side - Compact */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl flex items-center justify-center shadow-md text-black transform group-hover:rotate-6 transition-transform">
                      <svg className="w-6 h-6 md:w-8 md:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Live Price Ticker */}
            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto mb-8">
              <PriceTicker />
            </div>

            {/* Promotional Banner Carousel (New Section) */}
            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto mb-8">
              <div className="relative">
                <BannerSlider audience="user" />
              </div>
            </div>

            {/* Customer Solutions */}
            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
              <CustomerSolutions />
            </div>

            {/* Trust Signals */}
            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
              <TrustSignals />
            </div>

            {/* Why Scrapto Section */}
            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
              <motion.div
                initial={{ y: 16, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="mt-8 md:mt-12 mb-8 md:mb-12">
                <h3
                  className="text-lg md:text-2xl font-bold mb-4 md:mb-8 text-center"
                  style={{ color: "#2d3748" }}>
                  Why Scrapto?
                </h3>
                <div className="flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-6">
                  {[
                    {
                      icon: (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2">
                          <polyline points="22 2 11 13 6 8"></polyline>
                        </svg>
                      ),
                      title: "Free Pickup",
                      desc: "No pickup charges. We reach your doorstep without any extra cost.",
                    },
                    {
                      icon: (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23"></line>
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                        </svg>
                      ),
                      title: "Best Rates",
                      desc: "Highest market rates with real-time pricing so every deal stays fair.",
                    },
                    {
                      icon: (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                      ),
                      title: "Verified & Safe",
                      desc: "KYC-verified partners with reliable pickups for a worry-free experience.",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ y: 12, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{
                        duration: 0.45,
                        delay: index * 0.12,
                        ease: "easeOut",
                      }}
                      className="w-full">
                      <div
                        className="rounded-xl md:rounded-2xl p-4 md:p-6 h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid rgba(100, 148, 110, 0.15)",
                        }}>
                        <div className="flex items-start gap-3">
                          {/* Icon Container */}
                          <div
                            className="w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: "rgba(100, 148, 110, 0.1)",
                              color: "#64946e",
                            }}>
                            {item.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4
                              className="font-bold text-sm md:text-xl mb-1 md:mb-2"
                              style={{ color: "#2d3748" }}>
                              {getTranslatedText(item.title)}
                            </h4>
                            <p
                              className="text-xs md:text-base leading-tight md:leading-relaxed"
                              style={{ color: "#718096" }}>
                              {getTranslatedText(item.desc)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Social Proof - Testimonials */}
            <div className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
              <Testimonials />
            </div>

            {/* OTP Modal */}
            {showOTPModal && (
              <OTPModal onClose={() => setShowOTPModal(false)} />
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation (Mobile Only - Fixed to Viewport) - Always visible */}
      {/* Bottom Navigation (Mobile Only - Fixed to Viewport) */}
      <div className="fixed md:hidden bottom-0 left-0 right-0 z-[9999]">
        {/* Glassmorphism Background Container */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"></div>

        <div className="relative flex justify-around items-end pb-2 pt-2 px-2">
          {/* Home Tab */}
          <div
            className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform duration-200 py-2"
            onClick={() => setShowProfile(false)}
          >
            <div className={`p-1.5 rounded-xl transition-colors duration-300 ${!showProfile ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:text-emerald-600'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>

              </svg>
            </div>
            <span className={`text-[10px] font-semibold tracking-wide ${!showProfile ? 'text-emerald-600' : 'text-gray-500'}`}>Home</span>
          </div>
          {/* Center Action Button (Floating) */}
          <div className="flex-1 flex flex-col items-center justify-end relative z-10 -top-5 group"
            onClick={() => navigate('/add-scrap/category')}>
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 transform group-active:scale-95 transition-all duration-300 border-4 border-[#f4ebe2]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white transform group-hover:rotate-180 transition-transform duration-500">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              </svg>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 mt-1 tracking-wide">Sell Scrap</span>
          </div>

          {/* Profile Tab */}
          <div
            className="flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform duration-200 py-2"
            onClick={() => setShowProfile(true)}
          >
            <div className={`p-1.5 rounded-xl transition-colors duration-300 ${showProfile ? 'bg-emerald-100 text-emerald-600' : 'text-gray-400 hover:text-emerald-600'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>

              </svg>
            </div>
            <span className={`text-[10px] font-semibold tracking-wide ${showProfile ? 'text-emerald-600' : 'text-gray-500'}`}>Profile</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Hero;

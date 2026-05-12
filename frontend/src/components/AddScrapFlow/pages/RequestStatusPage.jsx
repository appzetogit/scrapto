import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';
import { orderAPI, paymentAPI } from '../../../modules/shared/utils/api';
import { useAuth } from '../../../modules/shared/context/AuthContext';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import socketClient from '../../../modules/shared/utils/socketClient';
import useRazorpay from '../../../hooks/useRazorpay';

const defaultCenter = { lat: 19.076, lng: 72.8777 };
const mapContainerStyle = { width: '100%', height: '100%', borderRadius: '12px' };

function getScrapperTruckIcon(heading = 0) {
  return {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="24" cy="44" rx="12" ry="3" fill="rgba(0,0,0,0.2)"/>
        <g transform="rotate(${Number(heading).toFixed(1)} 24 24)">
          <path d="M8 20 L8 32 L32 32 L32 20 Z" fill="#64946e" stroke="#fff" stroke-width="2"/>
          <path d="M8 16 L8 20 L20 20 L20 16 Z" fill="#4a7356" stroke="#fff" stroke-width="2"/>
          <circle cx="14" cy="32" r="4" fill="#2d3748"/><circle cx="26" cy="32" r="4" fill="#2d3748"/>
          <text x="20" y="28" font-size="10" fill="white" font-weight="bold">♻</text>
        </g>
      </svg>
    `),
    scaledSize: new window.google.maps.Size(48, 48),
    anchor: new window.google.maps.Point(24, 44),
  };
}

const RequestStatusPage = () => {
  const staticTexts = [
    "Request Status",
    "Pending",
    "Waiting for scrapper to accept",
    "Accepted",
    "Scrapper has accepted your request",
    "On the Way",
    "Scrapper is coming to your location",
    "Arrived",
    "Scrapper has arrived at your location",
    "Completed",
    "Pickup completed successfully",
    "Progress",
    "Request ID:",
    "Payment",
    "Complete payment after scrapper confirms your request.",
    "Processing...",
    "Pay Now",
    "Status: Pending",
    "Status: Failed — please retry payment.",
    "Timeline",
    "Request Sent",
    "In progress...",
    "Assigned Scrapper",
    "ETA:",
    "Request Details",
    "Service Type:",
    "Categories:",
    "Weight:",
    "kg",
    "Images:",
    "photos",
    "Service Slot:",
    "Pickup Slot:",
    "Service Fee:",
    "Estimated Payout:",
    "Chat with Scrapper",
    "Back to Home",
    "Payment will be available once the request is confirmed by scrapper.",
    "Failed to initiate payment. Please try again.",
    "Payment verification failed. Please contact support.",
    "Plastic", "Metal", "Paper", "Electronics", "Glass", "Other",
    "Live location",
    "Waiting for scrapper location...",
    "Map could not be loaded"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { initializePayment } = useRazorpay();
  const [requestData, setRequestData] = useState(null);
  const [status, setStatus] = useState('pending'); // pending, accepted, on_way, completed
  const [scrapperInfo, setScrapperInfo] = useState(null);
  const [eta, setEta] = useState(null);
  const [isPaying, setIsPaying] = useState(false);
  const [showAcceptanceAlert, setShowAcceptanceAlert] = useState(false);

  // Map & live tracking state
  const [userLocation, setUserLocation] = useState(null);
  const [scrapperLocation, setScrapperLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [animatedPosition, setAnimatedPosition] = useState(null);
  const [scrapperHeading, setScrapperHeading] = useState(0);
  const mapRef = useRef(null);
  const animationRef = useRef(null);
  const lastPositionRef = useRef(null);

  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  // Refs for tracking status changes
  const prevStatusRef = useRef(null);
  const isFirstLoadRef = useRef(true);

  const mapStatus = (backendStatus) => {
    switch (backendStatus) {
      case 'pending':
        return 'pending';
      case 'confirmed':
        return 'accepted';
      case 'in_progress':
        return 'on_way';
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'completed';
      default:
        return 'pending';
    }
  };

  // Monitor status changes for Alert
  useEffect(() => {
    if (status) {
      // First load: just set the ref and skip
      if (isFirstLoadRef.current) {
        prevStatusRef.current = status;
        isFirstLoadRef.current = false;
        return;
      }

      // Subsequent updates: check for transition
      const prev = prevStatusRef.current;
      // If we moved from pending to accepted or on_way
      if (prev === 'pending' && ['accepted', 'on_way'].includes(status)) {
        setShowAcceptanceAlert(true);
      }

      prevStatusRef.current = status;
    }
  }, [status]);

  useEffect(() => {
    const initial = location.state?.requestData;
    if (!initial) {
      navigate('/my-requests');
      return;
    }

    setRequestData(initial);
    if (initial.status) {
      setStatus(mapStatus(initial.status));
    }
    if (initial.scrapper) {
      setScrapperInfo({
        name: initial.scrapper.name,
        phone: initial.scrapper.phone
      });
    }

    if (!initial._id) {
      return;
    }

    let isMounted = true;
    const fetchOrder = async () => {
      try {
        const res = await orderAPI.getById(initial._id);
        const order = res.data?.order;
        if (!order || !isMounted) return;
        setRequestData(order);
        setStatus(mapStatus(order.status));
        if (order.scrapper) {
          setScrapperInfo({
            name: order.scrapper.name,
            phone: order.scrapper.phone
          });
          // Scrapper live location from API (so it reflects as soon as accepted)
          if (order.scrapper.liveLocation?.coordinates && Array.isArray(order.scrapper.liveLocation.coordinates)) {
            const [lng, lat] = order.scrapper.liveLocation.coordinates;
            if (lat != null && lng != null) {
              setScrapperLocation({ lat, lng });
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch order status', err);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location.state, navigate]);

  // Set user location from requestData pickup address
  useEffect(() => {
    if (!requestData?.pickupAddress?.coordinates) return;
    const coords = requestData.pickupAddress.coordinates;
    const lat = typeof coords.lat === 'number' ? coords.lat : (Array.isArray(coords) ? coords[1] : null);
    const lng = typeof coords.lng === 'number' ? coords.lng : (Array.isArray(coords) ? coords[0] : null);
    if (lat != null && lng != null) {
      setUserLocation({ lat, lng });
    }
  }, [requestData?.pickupAddress?.coordinates]);

  // Socket: live scrapper location as soon as accepted/on_way
  useEffect(() => {
    const orderId = requestData?._id;
    if (!orderId || !['accepted', 'on_way'].includes(status)) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!socketClient.getConnectionStatus()) {
      socketClient.connect(token);
    }
    socketClient.joinTracking(orderId);
    socketClient.onLocationUpdate((data) => {
      if (data.orderId === orderId && data.location?.lat != null && data.location?.lng != null) {
        setScrapperLocation(data.location);
        if (data.heading != null) setScrapperHeading(data.heading);
      }
    });
    return () => {
      socketClient.leaveTracking(orderId);
      socketClient.offLocationUpdate();
    };
  }, [requestData?._id, status]);

  // Animated scrapper marker position + heading from movement
  useEffect(() => {
    if (!scrapperLocation) return;
    if (!lastPositionRef.current) {
      setAnimatedPosition(scrapperLocation);
      lastPositionRef.current = scrapperLocation;
      return;
    }
    const startPos = animatedPosition || lastPositionRef.current;
    const targetPos = scrapperLocation;
    const latDiff = targetPos.lat - startPos.lat;
    const lngDiff = targetPos.lng - startPos.lng;
    const headingDeg = Math.atan2(lngDiff, latDiff) * (180 / Math.PI);
    setScrapperHeading(headingDeg);
    const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    if (dist > 0.1) {
      setAnimatedPosition(targetPos);
      lastPositionRef.current = targetPos;
      return;
    }
    const startTime = performance.now();
    const duration = 1000;
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const newPos = {
        lat: startPos.lat + (targetPos.lat - startPos.lat) * ease,
        lng: startPos.lng + (targetPos.lng - startPos.lng) * ease
      };
      setAnimatedPosition(newPos);
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        lastPositionRef.current = targetPos;
      }
    };
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [scrapperLocation]);

  // Directions (route) and ETA when both locations available
  useEffect(() => {
    if (!isMapLoaded || !userLocation || !scrapperLocation || !window.google?.maps?.DirectionsService) return;
    const svc = new window.google.maps.DirectionsService();
    svc.route(
      {
        origin: scrapperLocation,
        destination: userLocation,
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result?.routes?.[0]?.legs?.[0]) {
          setDirections(result);
          const leg = result.routes[0].legs[0];
          setEta(leg.duration?.text ?? null);
        }
      }
    );
  }, [isMapLoaded, userLocation, scrapperLocation]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);
  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handlePay = async () => {
    if (!requestData?._id || isPaying) return;
    // Only allow when backend status is confirmed/in_progress
    const backendStatus = requestData.status;
    if (!['confirmed', 'in_progress'].includes(backendStatus)) {
      alert(getTranslatedText('Payment will be available once the request is confirmed by scrapper.'));
      return;
    }

    try {
      setIsPaying(true);

      const createRes = await paymentAPI.createPaymentOrder(requestData._id);
      const { orderId: razorpayOrderId, amount, currency, keyId } = createRes.data || {};

      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'Scraptox',
        description: 'Pickup payment',
        order_id: razorpayOrderId,
        prefill: {
          name: user?.name || 'User',
          email: user?.email || 'user@example.com',
          contact: user?.phone || ''
        },
        theme: {
          color: '#64946e'
        }
      };

      await initializePayment(
        options,
        async (response) => {
          try {
            await paymentAPI.verifyPayment({
              orderId: requestData._id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            // Refresh order status
            const refreshed = await orderAPI.getById(requestData._id);
            const order = refreshed.data?.order;
            if (order) {
              setRequestData(order);
              setStatus(mapStatus(order.status));
              if (order.scrapper) {
                setScrapperInfo({
                  name: order.scrapper.name,
                  phone: order.scrapper.phone
                });
              }
            }
          } catch (err) {
            console.error('Payment verify failed', err);
            alert(getTranslatedText(err.message || 'Payment verification failed. Please contact support.'));
          } finally {
            setIsPaying(false);
          }
        },
        (error) => {
          console.error('Payment error:', error);
          alert(getTranslatedText(error.description || 'Failed to initiate payment. Please try again.'));
          setIsPaying(false);
        }
      );
    } catch (error) {
      console.error('Payment order creation error:', error);
      alert(getTranslatedText(error.message || 'Failed to initiate payment. Please try again.'));
      setIsPaying(false);
    }
  };

  const getStatusColor = (stepStatus) => {
    const statusOrder = ['pending', 'accepted', 'on_way', 'completed'];
    const currentIdx = statusOrder.indexOf(status);
    const stepIdx = statusOrder.indexOf(stepStatus);

    if (stepIdx < currentIdx || status === 'completed') return '#22c55e'; // Green
    if (stepIdx === currentIdx) return '#3b82f6'; // Blue
    return '#cbd5e1'; // Gray
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Success Alert for Acceptance */}
      {showAcceptanceAlert && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-4 right-4 z-[9999] bg-green-500 text-white p-4 rounded-xl shadow-2xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold">{getTranslatedText("Accepted")}</p>
              <p className="text-sm opacity-90">{getTranslatedText("Scrapper has accepted your request")}</p>
            </div>
          </div>
          <button onClick={() => setShowAcceptanceAlert(false)} className="text-white text-xl p-2">&times;</button>
        </motion.div>
      )}

      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="ml-2 text-xl font-bold text-slate-800">{getTranslatedText("Request Status")}</h1>
      </div>

      <div className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-6 pb-24">
        {/* Map Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">📍</span>
              {getTranslatedText("Live location")}
            </h2>
            {eta && (
              <span className="px-3 py-1 bg-green-50 text-green-700 text-sm font-semibold rounded-full border border-green-100">
                {getTranslatedText("ETA:")} {eta}
              </span>
            )}
          </div>

          <div className="relative h-[300px] w-full rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
            {mapLoadError ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 bg-slate-100">
                {getTranslatedText("Map could not be loaded")}
              </div>
            ) : !isMapLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-2" />
                {getTranslatedText("Processing...")}
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={scrapperLocation || userLocation || defaultCenter}
                zoom={14}
                onLoad={onMapLoad}
                onUnmount={onMapUnmount}
                options={{
                  disableDefaultUI: true,
                  styles: [
                    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                    { featureType: 'transit', stylers: [{ visibility: 'off' }] }
                  ]
                }}
              >
                {userLocation && (
                  <Marker
                    position={userLocation}
                    title="Your Location"
                    icon={{
                      url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
                    }}
                  />
                )}
                {animatedPosition && (
                  <Marker
                    position={animatedPosition}
                    title="Scrapper"
                    icon={getScrapperTruckIcon(scrapperHeading)}
                  />
                )}
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      suppressMarkers: true,
                      polylineOptions: {
                        strokeColor: '#3b82f6',
                        strokeWeight: 4,
                        strokeOpacity: 0.7
                      }
                    }}
                  />
                )}
              </GoogleMap>
            )}

            {!scrapperLocation && status !== 'pending' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/90 backdrop-blur rounded-full shadow-lg text-xs font-medium text-slate-600 border border-slate-200">
                {getTranslatedText("Waiting for scrapper location...")}
              </div>
            )}
          </div>
        </div>

        {/* Status Steps */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">{getTranslatedText("Progress")}</h2>
          <div className="relative space-y-8">
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-slate-100" />

            {/* Step 1: Pending */}
            <div className="relative flex gap-4">
              <div className="z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm"
                style={{ backgroundColor: getStatusColor('pending') }}>
                <span className="text-white text-xs">1</span>
              </div>
              <div>
                <p className="font-bold text-slate-800">{getTranslatedText("Pending")}</p>
                <p className="text-sm text-slate-500">{getTranslatedText("Waiting for scrapper to accept")}</p>
              </div>
            </div>

            {/* Step 2: Accepted */}
            <div className="relative flex gap-4">
              <div className="z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm"
                style={{ backgroundColor: getStatusColor('accepted') }}>
                <span className="text-white text-xs">2</span>
              </div>
              <div>
                <p className="font-bold text-slate-800">{getTranslatedText("Accepted")}</p>
                <p className="text-sm text-slate-500">{getTranslatedText("Scrapper has accepted your request")}</p>
              </div>
            </div>

            {/* Step 3: On Way */}
            <div className="relative flex gap-4">
              <div className="z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm"
                style={{ backgroundColor: getStatusColor('on_way') }}>
                <span className="text-white text-xs">3</span>
              </div>
              <div>
                <p className="font-bold text-slate-800">{getTranslatedText("On the Way")}</p>
                <p className="text-sm text-slate-500">{getTranslatedText("Scrapper is coming to your location")}</p>
              </div>
            </div>

            {/* Step 4: Completed */}
            <div className="relative flex gap-4">
              <div className="z-10 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm"
                style={{ backgroundColor: getStatusColor('completed') }}>
                <span className="text-white text-xs">4</span>
              </div>
              <div>
                <p className="font-bold text-slate-800">{getTranslatedText("Completed")}</p>
                <p className="text-sm text-slate-500">{getTranslatedText("Pickup completed successfully")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Card - Only if applicable (Cleaning Service) */}
        {requestData?.orderType === 'cleaning_service' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 opacity-50" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-2 bg-green-50 text-green-600 rounded-lg">💳</span>
                <h2 className="text-lg font-bold text-slate-800">{getTranslatedText("Payment")}</h2>
              </div>

              {requestData.paymentStatus === 'paid' ? (
                <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3">
                  <span className="text-xl">✅</span>
                  <p className="text-green-700 font-bold">{getTranslatedText("Completed")}</p>
                </div>
              ) : (
                <>
                  <p className="text-slate-600 text-sm mb-6">
                    {getTranslatedText("Complete payment after scrapper confirms your request.")}
                  </p>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mb-6">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider">{getTranslatedText("Service Fee:")}</p>
                      <p className="text-2xl font-black text-slate-900">₹{requestData.serviceFee || 0}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${requestData.paymentStatus === 'failed' ? 'text-red-500' : 'text-blue-500'}`}>
                        {requestData.paymentStatus === 'failed'
                          ? getTranslatedText("Status: Failed — please retry payment.")
                          : getTranslatedText("Status: Pending")}
                      </p>
                    </div>
                  </div>

                  <button
                    disabled={isPaying || !['confirmed', 'in_progress'].includes(requestData.status)}
                    onClick={handlePay}
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform active:scale-95 shadow-lg ${isPaying || !['confirmed', 'in_progress'].includes(requestData.status)
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-green-600 text-white hover:bg-green-700 shadow-green-200'
                      }`}
                  >
                    {isPaying ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {getTranslatedText("Processing...")}
                      </div>
                    ) : (
                      getTranslatedText("Pay Now")
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Scrapper Info */}
        {scrapperInfo && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">{getTranslatedText("Assigned Scrapper")}</p>
                  <p className="text-lg font-bold text-slate-800">{scrapperInfo.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.location.href = `tel:${scrapperInfo.phone}`}
                  className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button
                  onClick={handleChat}
                  className="p-3 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Request Details Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6">{getTranslatedText("Request Details")}</h2>
          <div className="grid grid-cols-2 gap-y-6">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">{getTranslatedText("Service Type:")}</p>
              <p className="font-semibold text-slate-800">
                {requestData.orderType === 'cleaning_service' ? getTranslatedText('Cleaning Service') : getTranslatedText('Scrap')}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">{getTranslatedText("Request ID:")}</p>
              <p className="font-mono text-slate-800">#{(requestData._id || '').slice(-6).toUpperCase()}</p>
            </div>
            {requestData.scrapItems && (
              <div className="col-span-2">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">{getTranslatedText("Categories:")}</p>
                <div className="flex flex-wrap gap-2">
                  {requestData.scrapItems.map((item, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
                      {getTranslatedText(item.category)}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {requestData.totalWeight && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">{getTranslatedText("Weight:")}</p>
                <p className="font-semibold text-slate-800">{requestData.totalWeight} {getTranslatedText("kg")}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mb-1">
                {requestData.orderType === 'cleaning_service' ? getTranslatedText('Service Fee:') : getTranslatedText('Estimated Payout:')}
              </p>
              <p className="font-bold text-slate-900">₹{requestData.orderType === 'cleaning_service' ? (requestData.serviceFee || 0) : (requestData.totalAmount || 0)}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/my-requests')}
          className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors"
        >
          {getTranslatedText("Back to Home")}
        </button>
      </div>
    </div>
  );
};

export default RequestStatusPage;

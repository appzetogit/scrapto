import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import ScrapperMap from './GoogleMaps/ScrapperMap';
import {
  checkTimeConflict,
  getScrapperAssignedRequests,
  migrateOldActiveRequest
} from '../../shared/utils/scrapperRequestUtils';
import { scrapperOrdersAPI, orderAPI, scrapperProfileAPI } from '../../shared/utils/api';
import socketClient from '../../shared/utils/socketClient';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import ScrapperBottomNav from './ScrapperBottomNav';

const ActiveRequestsPage = () => {
  const staticTexts = [
    "Online",
    "Active",
    "New Request",
    "Pickup slot",
    "Time Conflict",
    "This request overlaps with an existing pickup. You can still accept it.",
    "You have {count} active request",
    "You have {count} active requests",
    "Accept Order",
    "Active Requests ({count})",
    "Accepted",
    "Picked Up",
    "Payment Pending",
    "Unknown User",
    "Scrap",
    "Time not specified",
    "Calculating...",
    "Order accepted successfully!",
    "⚠️ Time Conflict Detected!",
    "This request overlaps with one of your existing requests.",
    "Do you still want to accept this request?",
    "Failed to accept order",
    "Failed to accept request. Please try again.",
    "Pickup time not selected",
    "User",
    "New scrap request received.",
    "User Name: {name}.",
    "Product Category: {category}.",
    "Location: {location}.",
    "Pickup Time: {time}."
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [timeConflict, setTimeConflict] = useState(false);
  const [existingRequests, setExistingRequests] = useState([]);
  const [showActiveRequestsPanel, setShowActiveRequestsPanel] = useState(false);

  // Check authentication first and migrate old data
  useEffect(() => {
    const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
    const scrapperUser = localStorage.getItem('scrapperUser');
    if (scrapperAuth !== 'true' || !scrapperUser) {
      navigate('/scrapper/login', { replace: true });
      return;
    }

    // Migrate old activeRequest to new format (one-time)
    migrateOldActiveRequest();

    // Load existing requests from backend
    const fetchExistingRequests = async () => {
      try {
        const response = await scrapperOrdersAPI.getMyAssigned();
        const orders = response?.data?.orders || response?.orders || [];

        // Map backend orders to format expected by conflict checker
        const mappedRequests = orders
          .filter(o => o.status !== 'completed' && o.status !== 'cancelled')
          .map(order => ({
            id: order._id || order.id,
            requestId: `REQ - ${(order._id || order.id).toString().slice(-6).toUpperCase()}`,
            pickupSlot: order.pickupSlot,
            preferredTime: order.preferredTime,
            status: order.status,
            location: {
              lat: order.pickupAddress?.coordinates?.lat || 0,
              lng: order.pickupAddress?.coordinates?.lng || 0,
              address: order.pickupAddress?.street || 'Unknown'
            },
            userName: order.user?.name || getTranslatedText('User'),
            scrapType: Array.isArray(order.scrapItems) ? getTranslatedText(order.scrapItems[0]?.category) : getTranslatedText('Scrap'),
            estimatedEarnings: `₹${order.totalAmount || 0}`
          }));

        setExistingRequests(mappedRequests);
      } catch (err) {
        console.error('Failed to fetch existing requests:', err);
      }
    };

    fetchExistingRequests();
  }, [navigate]);

  // Initialize audio context on first user interaction to fix mobile auto-play issues
  useEffect(() => {
    const handleFirstInteraction = () => {
      // Create a dummy audio context to unlock audio on mobile
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0.01; // Nearly silent
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start(0);
        oscillator.stop(0.001);
      }

      // Also try to speak something silent to unlock speech synthesis
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(utterance);
      }

      console.log('Audio context unlocked');
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default location (Mumbai)
          setCurrentLocation({
            lat: 19.0760,
            lng: 72.8777
          });
        }
      );

      // Watch position for live updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error watching location:', error);
        }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    } else {
      // Default location if geolocation not supported
      setCurrentLocation({
        lat: 19.0760,
        lng: 72.8777
      });
    }
  }, []);

  // Poll for available orders from backend
  useEffect(() => {
    if (!isOnline) return;

    const loadAvailableOrders = async () => {
      try {
        const response = await scrapperOrdersAPI.getAvailable();
        if (response.success && response.data?.orders) {
          const orders = response.data.orders;


          // Get existing assigned requests from backend for conflict checking
          let currentAssigned = [];
          try {
            const assignedRes = await scrapperOrdersAPI.getMyAssigned();
            const rawAssigned = assignedRes?.data?.orders || assignedRes?.orders || [];
            currentAssigned = rawAssigned.map(order => ({
              id: order._id || order.id,
              pickupSlot: order.pickupSlot,
              preferredTime: order.preferredTime,
              status: order.status
            }));
            setExistingRequests(rawAssigned.filter(o => o.status !== 'completed' && o.status !== 'cancelled').map(order => ({
              id: order._id || order.id,
              requestId: `REQ - ${(order._id || order.id).toString().slice(-6).toUpperCase()}`,
              pickupSlot: order.pickupSlot,
              preferredTime: order.preferredTime,
              status: order.status,
              location: {
                lat: order.pickupAddress?.coordinates?.lat || 0,
                lng: order.pickupAddress?.coordinates?.lng || 0,
                address: order.pickupAddress?.street || 'Unknown'
              },
              userName: order.user?.name || getTranslatedText('User'),
              scrapType: Array.isArray(order.scrapItems) ? getTranslatedText(order.scrapItems[0]?.category) : getTranslatedText('Scrap'),
              estimatedEarnings: `₹${order.totalAmount || 0}`
            })));
          } catch (err) {
            console.error('Failed to update assigned requests during poll:', err);
            // Fallback to state? or keep previous
          }

          const conflictCheckList = currentAssigned.length > 0 ? currentAssigned : existingRequests;

          // If there are available orders, force show the first one (most recent usually)
          // We removed the !incomingRequest check to allow updates or instant show on socket trigger
          if (orders.length > 0) {
            const order = orders[0];

            // Avoid re-setting the same order to prevent re-renders or loops if already showing
            if (incomingRequest && (incomingRequest.id === order._id || incomingRequest.id === order.id)) {
              return;
            }

            console.log('✨ Displaying new available order:', order._id);

            // Map backend order to frontend request format
            const mappedRequest = {
              id: order._id || order.id,
              _id: order._id || order.id, // Keep backend ID
              requestId: `REQ - ${(order._id || order.id).toString().slice(-6).toUpperCase()}`,
              userName: order.user?.name || 'User',
              userPhone: order.user?.phone || '',
              userEmail: order.user?.email || '',
              scrapType: order.orderType === 'cleaning_service' ? 'Cleaning Service' : (order.scrapItems?.map(item => item.category).join(', ') || 'Scrap'),
              weight: order.totalWeight,
              pickupSlot: order.pickupSlot || null,
              preferredTime: order.preferredTime || null,
              images: order.images?.map(img => ({
                id: img.publicId || img.url,
                preview: img.url,
                url: img.url
              })) || [],
              location: {
                address: (() => {
                  const street = order.pickupAddress?.street;
                  // Check if street contains coordinates-like pattern
                  const isCoordinates = street && (
                    street.includes('Lat:') ||
                    street.includes('Lat :') ||
                    street.match(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/) // Matches "12.34, 56.78" pattern
                  );

                  const validParts = [
                    isCoordinates ? '' : street,
                    order.pickupAddress?.city,
                    order.pickupAddress?.state,
                    order.pickupAddress?.pincode
                  ].filter(Boolean);

                  return validParts.length > 0 ? validParts.join(', ') : (order.pickupAddress?.city || getTranslatedText('Location on Map'));
                })(),
                lat: order.pickupAddress?.coordinates?.lat || 19.0760,
                lng: order.pickupAddress?.coordinates?.lng || 72.8777
              },
              distance: getTranslatedText('Calculating...'), // Can calculate from current location
              estimatedEarnings: `₹${order.totalAmount || 0}`,
              // Backend fields
              status: order.status,
              assignmentStatus: order.assignmentStatus,
              notes: order.notes || ''
            };

            setIncomingRequest(mappedRequest);
            setIsSlideOpen(true);

            // Check for time conflicts
            const hasConflict = checkTimeConflict(mappedRequest, conflictCheckList);
            setTimeConflict(hasConflict);

            // Start playing sound
            setAudioPlaying(true);
          }
        }
      } catch (error) {
        console.error('Failed to load available orders:', error);
        // Silently fail - don't show error to user, just retry
      }
    };

    // Load immediately
    loadAvailableOrders();

    // Poll every 10 seconds for new orders
    // const pollInterval = setInterval(loadAvailableOrders, 10000); // Polling as backup

    // SOCKET INTEGRATION
    const setupSocket = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        socketClient.connect(token);

        // Listen for new order requests
        if (socketClient.socket) {
          socketClient.socket.on('new_order_request', (data) => {
            console.log('🔔 New Order Request via Socket:', data);
            // Limit full refresh to avoid spam, but trigger load
            loadAvailableOrders();
          });
        }
      }
    };
    setupSocket();

    // Set Online Status in Backend
    const setOnlineInBackend = async () => {
      try {
        await scrapperProfileAPI.updateMyProfile({ isOnline: true });
        console.log('✅ Scrapper status set to Online in Backend');
      } catch (err) {
        console.error('Failed to set online status:', err);
      }
    };
    setOnlineInBackend();

    // Still keep polling as a backup mechanism (every 15s)
    const pollInterval = setInterval(loadAvailableOrders, 15000);

    return () => {
      clearInterval(pollInterval);
      if (socketClient.socket) {
        socketClient.socket.off('new_order_request');
      }
    };
  }, [isOnline, incomingRequest]);

  // Handle sound playback - Voice alert + vibration instead of ringtone
  useEffect(() => {
    let voiceInterval;
    let vibrateInterval;

    const stopAll = () => {
      if (voiceInterval) {
        clearInterval(voiceInterval);
      }
      if (vibrateInterval) {
        clearInterval(vibrateInterval);
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
    };

    if (audioPlaying && incomingRequest) {
      // Build announcement text in Hindi: user name, category, location and pickup time
      const name = incomingRequest.userName || 'नाम उपलब्ध नहीं है';
      const scrapType = incomingRequest.scrapType || 'कैटेगरी उपलब्ध नहीं है';
      const address =
        incomingRequest.location?.address || 'लोकेशन उपलब्ध नहीं है';
      const slot =
        incomingRequest.pickupSlot?.slot ||
        incomingRequest.preferredTime ||
        getTranslatedText('Pickup time not selected');

      let text = getTranslatedText('New scrap request received.');
      text += ' ' + getTranslatedText('User Name: {name}.', { name });
      text += ' ' + getTranslatedText('Product Category: {category}.', { category: scrapType });
      text += ' ' + getTranslatedText('Location: {location}.', { location: address });
      text += ' ' + getTranslatedText('Pickup Time: {time}.', { time: slot });

      if (typeof window !== 'undefined' && window.speechSynthesis && window.SpeechSynthesisUtterance) {
        const speakOnce = () => {
          try {
            // Cancel any ongoing speech to avoid overlap
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'hi-IN';
            utterance.rate = 1;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
          } catch (err) {
            console.error('Speech synthesis error:', err);
          }
        };

        // Speak immediately, then repeat every 6 seconds while ringing
        speakOnce();
        voiceInterval = setInterval(() => {
          if (audioPlaying && incomingRequest) {
            speakOnce();
          }
        }, 6000);
      } else {
        console.warn('Speech synthesis not supported in this browser.');
      }

      // Vibrate pattern (optional, same as before)
      if (navigator.vibrate) {
        const vibratePattern = [200, 100, 200];
        vibrateInterval = setInterval(() => {
          if (audioPlaying && incomingRequest) {
            navigator.vibrate(vibratePattern);
          }
        }, 4000);
      }
    }

    return () => {
      stopAll();
    };
  }, [audioPlaying, incomingRequest]);

  // Handle going offline
  const handleGoOffline = async () => {
    setIsOnline(false);
    setAudioPlaying(false);

    // Update backend status
    try {
      await scrapperProfileAPI.updateMyProfile({ isOnline: false });
    } catch (err) {
      console.error('Failed to set offline status:', err);
    }

    navigate('/scrapper', { replace: true });
  };

  // Handle request accept
  const handleAcceptRequest = async () => {
    if (!incomingRequest) return;

    // Check for time conflict one more time before accepting
    const requests = getScrapperAssignedRequests();
    const hasConflict = checkTimeConflict(incomingRequest, requests);

    if (hasConflict) {
      // Show warning but allow user to proceed if they want
      const proceed = window.confirm(
        getTranslatedText('⚠️ Time Conflict Detected!') + '\n\n' +
        getTranslatedText('This request overlaps with one of your existing requests.') + '\n\n' +
        getTranslatedText('Do you still want to accept this request?')
      );

      if (!proceed) {
        return; // User cancelled
      }
    }

    // Stop sound & vibration immediately
    setAudioPlaying(false);

    try {
      // Accept order via backend API
      const orderId = incomingRequest._id || incomingRequest.id;
      const response = await scrapperOrdersAPI.accept(orderId);

      if (response.success) {
        console.log('✅ ' + getTranslatedText('Order accepted successfully!'), response.data);

        // Clear incoming request
        setIncomingRequest(null);
        setIsSlideOpen(false);

        // Navigate to my active requests list page
        navigate('/scrapper/my-active-requests', {
          replace: false
        });
      } else {
        throw new Error(getTranslatedText(response.message || 'Failed to accept order'));
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
      alert(getTranslatedText(error.message || 'Failed to accept request. Please try again.'));
      // Re-enable audio if error
      setAudioPlaying(true);
    }
  };

  // Handle request reject
  const handleRejectRequest = () => {
    // Stop sound & vibration immediately
    setAudioPlaying(false);

    setIsSlideOpen(false);
    setIncomingRequest(null);
    // Request will be removed, wait for next one
  };

  // Create custom icons


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full relative bg-gradient-to-br from-emerald-900 via-gray-900 to-black"
    >
      {/* Header with Back Button and Status */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-black/95 backdrop-blur-sm border-b border-white/10">


        <div className="flex items-center gap-3">
          {/* Active Requests Button */}
          {existingRequests.length > 0 && (
            <button
              onClick={() => setShowActiveRequestsPanel(!showActiveRequestsPanel)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {existingRequests.length} {getTranslatedText("Active")}
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full animate-pulse bg-emerald-500" />
            <span className="text-sm font-semibold text-white">{getTranslatedText("Online")}</span>
          </div>
        </div>
      </div>

      {/* Map Container - Full Screen */}
      <div className="w-full h-screen">
        <ScrapperMap
          stage="request"
          scrapperLocation={currentLocation}
          // If there's an incoming request, show user location. Otherwise just show Scrapper's location.
          userLocation={incomingRequest ? incomingRequest.location : null}
          userName={incomingRequest ? incomingRequest.userName : getTranslatedText('Active Request')}
        />
      </div>

      {/* Incoming Request Slide - Bottom */}
      {incomingRequest && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: isSlideOpen ? 0 : '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute bottom-0 left-0 right-0 z-30 rounded-t-2xl shadow-2xl flex flex-col bg-slate-900 border-t border-slate-800"
          style={{ maxHeight: '55vh', height: isMinimized ? 'auto' : '55vh' }}
        >
          {/* Slide Handle */}
          <div
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-full pt-4 pb-2 cursor-pointer flex justify-center hover:bg-slate-800/50 transition-colors rounded-t-2xl absolute top-0 z-10"
          >
            <div className={`w-12 h-1.5 rounded-full flex-shrink-0 transition-colors ${isMinimized ? 'bg-emerald-500' : 'bg-slate-700'}`} />
          </div>

          {/* Spacer for handle click area */}
          <div className="h-8 flex-shrink-0" />

          {/* Request Content - Compact - Scrollable */}
          {!isMinimized && (
            <div
              className="px-4 pb-2 overflow-y-auto flex-1 pb-24 md:pb-2"
              style={{ minHeight: 0, WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-slate-100">{incomingRequest.requestId}</h2>
                <button
                  onClick={handleRejectRequest}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: '#ef4444' }}>
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Request Details - Compact */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-500/20">
                    <span className="text-sm font-bold text-emerald-300">
                      {incomingRequest.userName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-slate-50">{incomingRequest.userName}</p>
                    <p className="text-xs truncate text-slate-400">{incomingRequest.scrapType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{incomingRequest.estimatedEarnings}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'rgba(31, 41, 55, 0.9)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: '#9ca3af', flexShrink: 0 }}>
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="currentColor" />
                  </svg>
                  <p className="text-xs flex-1 truncate" style={{ color: '#e5e7eb' }}>
                    {[
                      incomingRequest.location.address?.split(',')[0], // Street
                      incomingRequest.location.address?.split(',')[1], // City
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>

                {/* Pickup slot / preferred time info (always show if user sent any time) */}
                {(incomingRequest.pickupSlot || incomingRequest.preferredTime) && (
                  <div className="flex items-center gap-2 mt-2 p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-slate-400 flex-shrink-0">
                      <path d="M8 2v2M16 2v2M5 7h14M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">{getTranslatedText("Pickup slot")}</p>
                      <p className="text-xs font-semibold truncate text-slate-200">
                        {incomingRequest.pickupSlot
                          ? `${incomingRequest.pickupSlot.dayName}, ${incomingRequest.pickupSlot.date} • ${incomingRequest.pickupSlot.slot}`
                          : incomingRequest.preferredTime}
                      </p>
                    </div>
                  </div>
                )}

                {/* User Notes */}
                {incomingRequest.notes && (
                  <div className="mt-2 p-2 rounded-lg bg-slate-800/80 border border-slate-700/50">
                    <p className="text-xs text-slate-400 font-semibold mb-1">{getTranslatedText("Note")}:</p>
                    <p className="text-xs text-slate-200 italic">"{incomingRequest.notes}"</p>
                  </div>
                )}

                {/* Time Conflict Warning */}
                {timeConflict && (
                  <div className="mt-2 p-2 rounded-lg flex items-start gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }}>
                      <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs font-semibold" style={{ color: '#fca5a5' }}>{getTranslatedText("Time Conflict")}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: '#fecaca' }}>
                        {getTranslatedText("This request overlaps with an existing pickup. You can still accept it.")}
                      </p>
                    </div>
                  </div>
                )}

                {/* Active Requests Count */}
                {existingRequests.length > 0 && (
                  <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-400">
                      {existingRequests.length === 1
                        ? getTranslatedText("You have {count} active request", { count: existingRequests.length })
                        : getTranslatedText("You have {count} active requests", { count: existingRequests.length })}
                    </p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Accept Button - Fixed at Bottom (Always Visible) */}
          <div
            className="fixed md:relative bottom-0 left-0 right-0 px-4 pb-4 pt-2 border-t border-slate-700 flex-shrink-0 z-50 bg-slate-900"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAcceptRequest}
              className="w-full py-4 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 bg-emerald-500 text-slate-900 hover:bg-emerald-400 transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {getTranslatedText("Accept Order")}
            </motion.button>
          </div>
        </motion.div>
      )
      }

      {/* Active Requests Panel - Floating */}
      {
        existingRequests.length > 0 && (
          <motion.div
            initial={{ x: showActiveRequestsPanel ? 0 : '100%' }}
            animate={{ x: showActiveRequestsPanel ? 0 : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-20 right-4 z-30 w-80 max-w-[calc(100%-2rem)] rounded-2xl shadow-2xl bg-zinc-900 border border-white/10"
            style={{ maxHeight: 'calc(100vh - 6rem)' }}
          >
            <div className="p-4 border-b border-white/10" >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">
                  {getTranslatedText("Active Requests ({count})", { count: existingRequests.length })}
                </h3>
                <button
                  onClick={() => setShowActiveRequestsPanel(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color: '#ef4444' }}>
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 10rem)', overscrollBehaviorY: 'contain' }}>
              {existingRequests.map((request) => {
                const statusColors = {
                  accepted: { bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', label: getTranslatedText('Accepted') },
                  picked_up: { bg: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', label: getTranslatedText('Picked Up') },
                  payment_pending: { bg: 'rgba(249, 115, 22, 0.1)', color: '#f97316', label: getTranslatedText('Payment Pending') }
                };
                const statusConfig = statusColors[request.status] || statusColors.accepted;
                const pickupTime = request.pickupSlot
                  ? `${request.pickupSlot.dayName}, ${request.pickupSlot.date} • ${request.pickupSlot.slot}`
                  : request.preferredTime || getTranslatedText('Time not specified');

                return (
                  <motion.div
                    key={request.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowActiveRequestsPanel(false);
                      navigate(`/scrapper/active-request/${request.id}`, { state: { request } });
                    }}
                    className="p-3 mb-2 rounded-xl border cursor-pointer transition-all bg-black border-white/10 hover:border-emerald-500/30"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-900/30">
                          <span className="text-xs font-bold text-emerald-400">
                            {request.userName?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate text-white">
                            {request.requestId || request.userName || getTranslatedText('Unknown User')}
                          </p>
                          <p className="text-xs truncate text-gray-400">
                            {request.userName} • {getTranslatedText(request.scrapType) || getTranslatedText('Scrap')}
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                        style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="ml-10 space-y-1">
                      <p className="text-xs font-bold text-emerald-600">
                        {request.estimatedEarnings || '₹0'}
                      </p>
                      {request.location?.address && (
                        <p className="text-xs truncate text-gray-500">
                          📍 {request.location.address}
                        </p>
                      )}
                      <p className="text-xs truncate text-gray-500">
                        🕐 {pickupTime}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )
      }
      {/* Bottom Navigation - Only show when no incoming request overlay */}
      {
        !incomingRequest && (
          <div className="md:hidden">
            <ScrapperBottomNav />
          </div>
        )
      }
    </motion.div >
  );
};

export default ActiveRequestsPage;

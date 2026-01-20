import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../shared/context/AuthContext';
import {
  getScrapperRequestById,
} from '../../shared/utils/scrapperRequestUtils';
import { orderAPI, scrapperOrdersAPI } from '../../shared/utils/api';
import { walletService } from '../../shared/services/wallet.service';
import ScrapperMap from './GoogleMaps/ScrapperMap';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

// Load Razorpay Script
const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const ActiveRequestDetailsPage = () => {
  const staticTexts = [
    "Loading request details...",
    "Active Request",
    "Pickup Details",
    "Scrap Images",
    "Area Images",
    "Pickup Slot:",
    "Collect Payment",
    "Make Payment",
    "Estimated Amount",
    "Enter Amount Received",
    "Enter Amount Paid",
    "Amount (₹)",
    "Confirm Payment",
    "Payment Status",
    "Collected ✓",
    "Paid ✓",
    "Complete Order",
    "Order Completed!",
    "Redirecting to dashboard...",
    "Start Service",
    "Pickup Scrap",
    "Call Customer",
    "Message",
    "Chat",
    "Confirm Action",
    "Cancel",
    "Confirm",
    "Please enter a valid amount",
    "Order ID not found",
    "Failed to update order status",
    "Failed to update payment status",
    "Failed to complete order",
    "Failed to process. Please try again.",
    "Have you arrived and started the cleaning service?",
    "Have you picked up the scrap from the customer?",
    "Have you received ₹{amount} from the customer?",
    "Have you paid ₹{amount} to the customer?",
    "Are you sure you want to complete this order?",
    "You collected ₹{amount} from the customer",
    "You will pay ₹{amount} to the customer",
    "Payment of ₹{amount} collected successfully",
    "Payment of ₹{amount} made successfully to customer",
    "User",
    "Scrap",
    "Cleaning Service",
    "Address not available",
    "of",
    "Yes, Confirm",
    "Processing...",
    "Pay ₹{amount} to User?"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);
  const navigate = useNavigate();
  const location = useLocation();
  const { requestId } = useParams();
  const { user } = useAuth();
  const [requestData, setRequestData] = useState(null);
  const [scrapperLocation, setScrapperLocation] = useState(null);
  const [userLiveLocation, setUserLiveLocation] = useState(null);
  const [isPickedUp, setIsPickedUp] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, paid, completed
  const [finalAmount, setFinalAmount] = useState(null);
  const [paidAmount, setPaidAmount] = useState('');
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // 'pickup', 'payment', 'complete'
  const [confirmMessage, setConfirmMessage] = useState('');
  const [allActiveRequests, setAllActiveRequests] = useState([]);
  const [currentRequestIndex, setCurrentRequestIndex] = useState(-1);

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Check authentication first
  useEffect(() => {
    const scrapperAuth = localStorage.getItem('scrapperAuthenticated');
    const scrapperUser = localStorage.getItem('scrapperUser');
    if (scrapperAuth !== 'true' || !scrapperUser) {
      navigate('/scrapper/login', { replace: true });
      return;
    }
  }, [navigate]);

  // Fetch Wallet Balance
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await walletService.getWalletProfile();
        setWalletBalance(data.balance || 0);
      } catch (error) {
        console.error('Failed to fetch wallet:', error);
      }
    };
    fetchWallet();
  }, []);

  // Load order data from backend
  useEffect(() => {
    const loadOrderData = async () => {
      if (!requestId) {
        // Try navigation state first
        if (location.state?.request) {
          const request = location.state.request;
          setRequestData(request);
          setUserLiveLocation({
            lat: request.location?.lat || 19.0760,
            lng: request.location?.lng || 72.8777
          });
          return;
        }
        navigate('/scrapper/my-active-requests', { replace: true });
        return;
      }

      try {
        // Load order from backend
        const response = await orderAPI.getById(requestId);

        if (response.success && response.data?.order) {
          const order = response.data.order;

          // Map backend order to frontend format
          const mappedRequest = {
            id: order._id || order.id,
            _id: order._id || order.id,
            orderType: order.orderType || 'scrap_sell',
            serviceDetails: order.serviceDetails,
            userName: order.user?.name || 'User',
            userPhone: order.user?.phone || '',
            userEmail: order.user?.email || '',
            scrapType: order.orderType === 'cleaning_service'
              ? (getTranslatedText(order.serviceDetails?.serviceType || 'Cleaning Service'))
              : (order.scrapItems?.map(item => getTranslatedText(item.category)).join(', ') || getTranslatedText('Scrap')),
            weight: order.totalWeight,
            pickupSlot: order.pickupSlot || null,
            preferredTime: order.preferredTime || null,
            images: order.images?.map(img => ({
              id: img.publicId || img.url,
              preview: img.url,
              url: img.url
            })) || [],
            location: {
              address: order.pickupAddress?.street
                ? `${order.pickupAddress.street}, ${order.pickupAddress.city || ''}, ${order.pickupAddress.state || ''} ${order.pickupAddress.pincode || ''}`.trim()
                : 'Address not available',
              lat: order.pickupAddress?.coordinates?.lat || 19.0760,
              lng: order.pickupAddress?.coordinates?.lng || 72.8777
            },
            estimatedEarnings: order.orderType === 'cleaning_service'
              ? `₹${order.serviceFee || 0}`
              : `₹${order.totalAmount || 0}`,
            status: order.status,
            paymentStatus: order.paymentStatus,
            // Backend fields
            assignmentStatus: order.assignmentStatus,
            acceptedAt: order.acceptedAt
          };

          setRequestData(mappedRequest);
          setUserLiveLocation({
            lat: mappedRequest.location.lat,
            lng: mappedRequest.location.lng
          });

          // Check if already picked up (status is in_progress or completed)
          if (order.status === 'in_progress' || order.status === 'completed') {
            setIsPickedUp(true);
            setPaymentStatus(order.paymentStatus || 'pending');
            const amount = order.orderType === 'cleaning_service' ? (order.serviceFee || 0) : (order.totalAmount || 0);
            setFinalAmount(`₹${amount}`);
            setShowPaymentInput(order.paymentStatus === 'pending');
          }

          // Load all active requests for navigation
          const allActiveResponse = await scrapperOrdersAPI.getMyAssigned('status=IN_PROGRESS');
          if (allActiveResponse.success && allActiveResponse.data?.orders) {
            const allRequests = allActiveResponse.data.orders
              .map(o => ({
                id: o._id || o.id,
                status: o.status
              }))
              .filter(req => req.status !== 'completed');
            setAllActiveRequests(allRequests);
            const index = allRequests.findIndex(req => req.id === mappedRequest.id);
            setCurrentRequestIndex(index >= 0 ? index : 0);
          }
        } else {
          throw new Error(getTranslatedText('Order not found'));
        }
      } catch (error) {
        console.error('Failed to load order:', error);
        // Fallback to localStorage if backend fails
        const localRequest = getScrapperRequestById(requestId);
        if (localRequest) {
          setRequestData(localRequest);
          setUserLiveLocation({
            lat: localRequest.location?.lat || 19.0760,
            lng: localRequest.location?.lng || 72.8777
          });
        } else {
          navigate('/scrapper/my-active-requests', { replace: true });
        }
      }
    };

    loadOrderData();
  }, [requestId, location, navigate]);

  // Refresh request data from backend periodically
  useEffect(() => {
    if (!requestData?._id && !requestData?.id) return;

    const refreshRequest = async () => {
      const orderId = requestData._id || requestData.id;
      try {
        const response = await orderAPI.getById(orderId);
        if (response.success && response.data?.order) {
          const order = response.data.order;

          // Map backend order to frontend format
          const mappedRequest = {
            id: order._id || order.id,
            _id: order._id || order.id,
            orderType: order.orderType || 'scrap_sell',
            serviceDetails: order.serviceDetails,
            userName: order.user?.name || 'User',
            userPhone: order.user?.phone || '',
            userEmail: order.user?.email || '',
            scrapType: order.orderType === 'cleaning_service'
              ? (getTranslatedText(order.serviceDetails?.serviceType || 'Cleaning Service'))
              : (order.scrapItems?.map(item => getTranslatedText(item.category)).join(', ') || getTranslatedText('Scrap')),
            weight: order.totalWeight,
            pickupSlot: order.pickupSlot || null,
            preferredTime: order.preferredTime || null,
            images: order.images?.map(img => ({
              id: img.publicId || img.url,
              preview: img.url,
              url: img.url
            })) || [],
            location: {
              address: order.pickupAddress?.street
                ? `${order.pickupAddress.street}, ${order.pickupAddress.city || ''}, ${order.pickupAddress.state || ''} ${order.pickupAddress.pincode || ''}`.trim()
                : 'Address not available',
              lat: order.pickupAddress?.coordinates?.lat || 19.0760,
              lng: order.pickupAddress?.coordinates?.lng || 72.8777
            },
            estimatedEarnings: order.orderType === 'cleaning_service'
              ? `₹${order.serviceFee || 0}`
              : `₹${order.totalAmount || 0}`,
            status: order.status,
            paymentStatus: order.paymentStatus
          };

          setRequestData(mappedRequest);

          // Update state based on new order status
          if (order.status === 'in_progress' || order.status === 'completed') {
            setIsPickedUp(true);
            setPaymentStatus(order.paymentStatus || 'pending');
            const amount = order.orderType === 'cleaning_service' ? (order.serviceFee || 0) : (order.totalAmount || 0);
            setFinalAmount(`₹${amount}`);
            setShowPaymentInput(order.paymentStatus === 'pending');
          }
        }
      } catch (error) {
        console.error('Failed to refresh order:', error);
      }
    };

    // Refresh on focus/visibility
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshRequest();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refreshRequest);

    // Also refresh every 5 seconds
    const interval = setInterval(refreshRequest, 5000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refreshRequest);
      clearInterval(interval);
    };
  }, [requestData?._id, requestData?.id]);

  // Auto-redirect if order is completed
  useEffect(() => {
    if (requestData?.status === 'completed') {
      const timer = setTimeout(() => {
        navigate('/scrapper', { replace: true });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [requestData?.status, navigate]);

  // Get scrapper's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setScrapperLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default location (Mumbai)
          setScrapperLocation({
            lat: 19.0760,
            lng: 72.8777
          });
        }
      );

      // Watch position for live updates
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setScrapperLocation({
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
      setScrapperLocation({
        lat: 19.0760,
        lng: 72.8777
      });
    }
  }, []);

  const renderPickupSlot = () => {
    const slot = requestData.pickupSlot;
    if (!slot && !requestData.preferredTime) return null;

    const label = slot
      ? `${slot.dayName}, ${slot.date} • ${slot.slot}`
      : requestData.preferredTime;

    return (
      <div className="mb-4">
        <p className="text-xs md:text-sm mb-1" style={{ color: '#718096' }}>
          {getTranslatedText("Pickup Slot:")}
        </p>
        <p className="text-sm md:text-base font-semibold" style={{ color: '#2d3748' }}>
          {label}
        </p>
      </div>
    );
  };

  if (!requestData) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">{getTranslatedText("Loading request details...")}</p>
      </div>
    );
  }

  const handleCall = () => {
    window.location.href = `tel:${requestData.userPhone || '+919876543210'}`;
  };

  const handleMessage = () => {
    window.location.href = `sms:${requestData.userPhone || '+919876543210'}`;
  };

  const handleChat = () => {
    if (requestData?.id || requestData?._id) {
      navigate(`/scrapper/chat`, {
        state: { orderId: requestData.id || requestData._id }
      });
    }
  };

  const handleScrapPickedUp = () => {
    setConfirmAction('pickup');
    const isService = requestData.orderType === 'cleaning_service';
    setConfirmMessage(isService
      ? getTranslatedText('Have you arrived and started the cleaning service?')
      : getTranslatedText('Have you picked up the scrap from the customer?')
    );
    setShowConfirmModal(true);
  };

  const handlePaymentMade = () => {
    if (!paidAmount || parseFloat(paidAmount) <= 0) {
      alert(getTranslatedText('Please enter a valid amount'));
      return;
    }

    // Determine Logic based on Type
    const isCleaning = requestData.orderType === 'cleaning_service';

    // For Scrap Sell (Scrapper Pays)
    if (!isCleaning) {
      // Logic handled in handleRazorpayPayment or handleWalletPayment
      setConfirmAction('payment_scrap');
      setConfirmMessage(getTranslatedText("Pay ₹{amount} to User?", { amount: paidAmount }));
      setShowConfirmModal(true);
      return;
    }

    // For Cleaning Service (User Pays)
    setConfirmAction('payment_cleaning');
    setConfirmMessage(getTranslatedText("Have you collected ₹{amount} from the customer?", { amount: paidAmount }));
    setShowConfirmModal(true);
  };

  // Payment Logic for Scrap Sell (Scrapper Pays User)
  const processScrapPayment = async () => {
    const amount = Number(paidAmount);

    // 1. Check Wallet Balance
    if (useWallet && walletBalance >= amount) {
      // Pay via Wallet
      try {
        setIsProcessingPayment(true);
        await walletService.payOrderViaWallet((requestData._id || requestData.id), amount);
        completePaymentSuccess(amount);
      } catch (error) {
        alert(error.response?.data?.message || 'Wallet payment failed');
        setIsProcessingPayment(false);
      }
    } else {
      // 2. Pay via Razorpay
      try {
        setIsProcessingPayment(true);
        const res = await loadRazorpay();
        if (!res) {
          alert('Razorpay SDK failed to load');
          return;
        }

        // Create Order
        const orderData = await walletService.createRechargeOrder(amount); // Reusing logic for now

        const options = {
          key: orderData.data.keyId,
          amount: orderData.data.amount,
          currency: orderData.data.currency,
          name: "Scrapto",
          description: "Order Payment to User",
          order_id: orderData.data.orderId,
          handler: async function (response) {
            try {
              // Verify and Complete
              await walletService.verifyRecharge({
                ...response,
                amount: amount
              });
              completePaymentSuccess(amount);
            } catch (err) {
              alert('Payment Verification Failed');
              setIsProcessingPayment(false);
            }
          },
          prefill: {
            name: "Scrapper",
            contact: user?.phone
          },
          theme: {
            color: "#22c55e"
          }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.open();

      } catch (error) {
        console.error(error);
        setIsProcessingPayment(false);
      }
    }
  };

  const completePaymentSuccess = async (amount) => {
    const orderId = requestData._id || requestData.id;
    // Update order status
    try {
      await orderAPI.updateStatus(orderId, 'in_progress', 'completed', amount);
      setPaymentStatus('completed');
      setShowPaymentInput(false);
      setIsProcessingPayment(false);
      setRequestData({
        ...requestData,
        status: 'in_progress',
        paymentStatus: 'completed',
        paidAmount: amount
      });
    } catch (err) {
      console.error(err);
      alert('Failed to update order status');
      setIsProcessingPayment(false);
    }
  };

  const handleCompleteOrder = () => {
    setConfirmAction('complete');
    setConfirmMessage(getTranslatedText('Are you sure you want to complete this order?'));
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    const orderId = requestData._id || requestData.id;
    if (!orderId) {
      alert(getTranslatedText('Order ID not found'));
      return;
    }

    try {
      if (confirmAction === 'pickup') {
        const response = await orderAPI.updateStatus(orderId, 'in_progress');

        if (response.success) {
          setIsPickedUp(true);
          const isService = requestData.orderType === 'cleaning_service';
          const amount = isService ? (requestData.estimatedEarnings || '₹0') : (requestData.estimatedEarnings || '₹450');
          // Strip currency symbol for state
          setFinalAmount(amount);

          setPaymentStatus('pending');
          setShowPaymentInput(true);

          setRequestData({
            ...requestData,
            status: 'in_progress',
            paymentStatus: 'pending'
          });
        } else {
          throw new Error(getTranslatedText('Failed to update order status'));
        }
      } else if (confirmAction === 'payment_scrap') {
        setShowConfirmModal(false);
        processScrapPayment(); // Trigger the logic
        return;
      } else if (confirmAction === 'payment_cleaning') {
        // Update order status to in_progress (just in case) and paymentStatus to completed
        const response = await orderAPI.updateStatus(orderId, 'in_progress', 'completed', Number(paidAmount));

        if (response.success) {
          setPaymentStatus('completed');
          setShowPaymentInput(false);

          // Update local state
          setRequestData({
            ...requestData,
            status: 'in_progress',
            paymentStatus: 'completed',
            paidAmount: paidAmount
          });
        } else {
          throw new Error(getTranslatedText('Failed to update payment status'));
        }
      } else if (confirmAction === 'complete') {
        // Update order status to completed
        const response = await orderAPI.updateStatus(orderId, 'completed');

        if (response.success) {
          setPaymentStatus('completed');
          setTimeout(() => {
            navigate('/scrapper', { replace: true });
          }, 1500);
        } else {
          throw new Error(getTranslatedText('Failed to complete order'));
        }
      }

      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmMessage('');
    } catch (error) {
      console.error('Failed to confirm action:', error);
      alert(error.message || getTranslatedText('Failed to process. Please try again.'));
      setShowConfirmModal(false);
      setConfirmAction(null);
      setConfirmMessage('');
    }
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen w-full relative flex flex-col bg-gradient-to-br from-emerald-900 via-gray-900 to-black"
    >
      {/* Header with Back Button and Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between bg-black/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/scrapper/my-active-requests')}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-md bg-zinc-900 text-white hover:bg-zinc-800"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-current">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{getTranslatedText("Active Request")}</h1>
            {allActiveRequests.length > 1 && (
              <p className="text-xs text-gray-400">
                {currentRequestIndex + 1} {getTranslatedText("of")} {allActiveRequests.length}
              </p>
            )}
          </div>
        </div>

        {/* Navigation between requests */}
        {allActiveRequests.length > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentRequestIndex > 0) {
                  const prevRequest = allActiveRequests[currentRequestIndex - 1];
                  navigate(`/scrapper/active-request/${prevRequest.id}`, {
                    state: { request: prevRequest },
                    replace: true
                  });
                }
              }}
              disabled={currentRequestIndex <= 0}
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-opacity disabled:opacity-30 bg-zinc-900"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={() => {
                if (currentRequestIndex < allActiveRequests.length - 1) {
                  const nextRequest = allActiveRequests[currentRequestIndex + 1];
                  navigate(`/scrapper/active-request/${nextRequest.id}`, {
                    state: { request: nextRequest },
                    replace: true
                  });
                }
              }}
              disabled={currentRequestIndex >= allActiveRequests.length - 1}
              className="w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-opacity disabled:opacity-30 bg-zinc-900"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Map Container - Full Screen */}
      <div className="w-full h-screen">
        <ScrapperMap
          stage="pickup"
          orderId={requestData?.id || requestData?._id}
          scrapperLocation={scrapperLocation}
          userLocation={userLiveLocation}
          userName={requestData?.userName}
        />
      </div>

      {/* Payment Page - Full Screen (when payment pending) */}
      {
        isPickedUp && paymentStatus === 'pending' ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-40 flex flex-col"
            style={{ backgroundColor: '#020617' }}
          >
            {/* Header */}
            <div
              className="p-4 flex items-center gap-4 border-b"
              style={{ borderColor: 'rgba(31, 41, 55, 0.9)', backgroundColor: '#020617' }}
            >
              <button
                onClick={() => {
                  setShowPaymentInput(false);
                  setIsPickedUp(false);
                  setPaymentStatus('pending');
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#2d3748' }}>
                  <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <h1 className="text-xl font-bold" style={{ color: '#e5e7eb' }}>
                {requestData.orderType === 'cleaning_service' ? getTranslatedText('Collect Payment') : getTranslatedText('Make Payment')}
              </h1>
            </div>

            {/* Payment Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-md mx-auto">
                {/* Customer Info */}
                <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: '#0b1120' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                      <span className="text-lg font-bold" style={{ color: '#bbf7d0' }}>
                        {requestData.userName[0]}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-semibold" style={{ color: '#f9fafb' }}>{requestData.userName}</p>
                      <p className="text-sm" style={{ color: '#9ca3af' }}>{requestData.scrapType}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(31, 41, 55, 0.9)' }}>
                    <p className="text-xs mb-1" style={{ color: '#9ca3af' }}>{getTranslatedText("Estimated Amount")}</p>
                    <p className="text-xl font-bold" style={{ color: '#4ade80' }}>{finalAmount || requestData?.estimatedEarnings || '₹450'}</p>
                  </div>
                </div>

                {/* Payment Input */}
                <div className="mb-6 p-6 rounded-2xl shadow-lg" style={{ backgroundColor: '#020617' }}>
                  <h2 className="text-lg font-bold mb-4" style={{ color: '#e5e7eb' }}>
                    {requestData.orderType === 'cleaning_service' ? getTranslatedText('Enter Amount Received') : getTranslatedText('Enter Amount Paid')}
                  </h2>

                  {/* Payment Mode Selection for Scrap Pickup */}
                  {requestData.orderType !== 'cleaning_service' && (
                    <div className="mb-6 p-3 rounded-xl bg-gray-800 border border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">Wallet Balance</span>
                        <span className="text-white font-bold">₹{walletBalance}</span>
                      </div>

                      {paidAmount && Number(paidAmount) > walletBalance && (
                        <p className="text-red-400 text-xs mb-2">Insufficient Balance. Pay online.</p>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => setUseWallet(true)}
                          className={`flex-1 py-2 rounded-lg text-sm transition-all ${useWallet ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                        >
                          Wallet
                        </button>
                        <button
                          onClick={() => setUseWallet(false)}
                          className={`flex-1 py-2 rounded-lg text-sm transition-all ${!useWallet ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                        >
                          Online
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#d1d5db' }}>
                      {getTranslatedText("Amount (₹)")}
                    </label>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-4 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all text-2xl font-bold text-center bg-transparent"
                      style={{
                        borderColor: paidAmount ? '#22c55e' : 'rgba(148, 163, 184, 0.5)',
                        color: '#f9fafb'
                      }}
                      min="0"
                      step="0.01"
                      autoFocus
                    />
                    {paidAmount && (
                      <p className="text-sm mt-2 text-center" style={{ color: '#9ca3af' }}>
                        {requestData.orderType === 'cleaning_service'
                          ? getTranslatedText("You collected ₹{amount} from the customer", { amount: parseFloat(paidAmount) || 0 })
                          : getTranslatedText("You will pay ₹{amount} to the customer", { amount: parseFloat(paidAmount) || 0 })
                        }
                      </p>
                    )}
                  </div>

                  {/* Quick Amount Buttons */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[100, 200, 300, 400, 500, 1000].map((amount) => (
                      <motion.button
                        key={amount}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPaidAmount(amount.toString())}
                        className="py-2 rounded-lg font-semibold text-sm"
                        style={{
                          backgroundColor: paidAmount === amount.toString() ? '#22c55e' : 'rgba(31, 41, 55, 1)',
                          color: paidAmount === amount.toString() ? '#0f172a' : '#e5e7eb'
                        }}
                      >
                        ₹{amount}
                      </motion.button>
                    ))}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePaymentMade}
                    disabled={!paidAmount || parseFloat(paidAmount) <= 0 || isProcessingPayment}
                    className="w-full py-4 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#22c55e', color: '#0f172a' }}
                  >
                    {isProcessingPayment ? (
                      <span>{getTranslatedText("Processing...")}</span>
                    ) : (
                      <>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor" />
                        </svg>
                        {getTranslatedText("Confirm Payment")}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Request Details & Contact Info - Bottom Slide (when payment not pending) */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 z-30 rounded-t-2xl shadow-2xl flex flex-col bg-slate-900 border-t border-slate-800"
              style={{ maxHeight: '65vh', overflow: 'hidden' }}
            >
              {/* Slide Handle */}
              <div className="w-12 h-1.5 mx-auto mt-2 rounded-full flex-shrink-0 bg-slate-700" />

              {/* Request Content - Compact - Scrollable */}
              <div className="p-4 pb-2 overflow-y-auto flex-1" style={{ minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-slate-100">{getTranslatedText("Pickup Details")}</h2>
                </div>

                {/* Request Details - Compact */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-500/20">
                      <span className="text-sm font-bold text-emerald-300">
                        {requestData.userName[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-slate-50">{requestData.userName}</p>
                      <p className="text-xs truncate text-slate-400">{requestData.scrapType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-400">{requestData.estimatedEarnings}</p>
                    </div>
                  </div>

                  {renderPickupSlot()}

                  {/* Scrap Images */}
                  {requestData.images && requestData.images.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold mb-2" style={{ color: '#e5e7eb' }}>
                        {requestData.orderType === 'cleaning_service' ? getTranslatedText('Area Images') : getTranslatedText('Scrap Images')}
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {requestData.images.slice(0, 6).map((image, idx) => (
                          <motion.div
                            key={image.id || idx}
                            whileHover={{ scale: 1.05 }}
                            className="relative aspect-square rounded-lg overflow-hidden"
                            style={{ backgroundColor: 'rgba(15, 23, 42, 1)' }}
                          >
                            <img
                              src={image.preview || image}
                              alt={`Scrap ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to placeholder if image fails to load
                                e.target.src = 'https://via.placeholder.com/150?text=Scrap';
                              }}
                            />
                            {requestData.images.length > 6 && idx === 5 && (
                              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  +{requestData.images.length - 6}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Made Status */}
                {(paymentStatus === 'paid' || paymentStatus === 'completed') && requestData?.status !== 'completed' && (
                  <div className="mb-3 p-4 rounded-xl" style={{ backgroundColor: 'rgba(22, 163, 74, 0.15)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold" style={{ color: '#bbf7d0' }}>{getTranslatedText("Payment Status")}</span>
                      <span className="text-sm font-bold" style={{ color: '#4ade80' }}>
                        {requestData.orderType === 'cleaning_service' ? getTranslatedText('Collected ✓') : getTranslatedText('Paid ✓')}
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: '#e5e7eb' }}>
                      {requestData.orderType === 'cleaning_service'
                        ? getTranslatedText("Payment of ₹{amount} collected successfully", { amount: paidAmount || requestData?.paidAmount || '0' })
                        : getTranslatedText("Payment of ₹{amount} made successfully to customer", { amount: paidAmount || requestData?.paidAmount || '0' })
                      }
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCompleteOrder}
                      className="w-full py-3 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2"
                      style={{ backgroundColor: '#22c55e', color: '#0f172a' }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {getTranslatedText("Complete Order")}
                    </motion.button>
                  </div>
                )}

                {/* Order Completed Status */}
                {requestData?.status === 'completed' && (
                  <div className="mb-3 p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(22, 163, 74, 0.15)' }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2" style={{ color: '#4ade80' }}>
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-sm font-bold mb-1" style={{ color: '#bbf7d0' }}>{getTranslatedText("Order Completed!")}</p>
                    <p className="text-xs" style={{ color: '#e5e7eb' }}>{getTranslatedText("Redirecting to dashboard...")}</p>
                  </div>
                )}
              </div>

              {/* Contact Buttons - Fixed at Bottom */}
              <div
                className="px-4 pb-4 pt-2 border-t border-slate-800 flex-shrink-0 bg-slate-900"
              >
                {/* Scrap Picked Up Button - Primary Action */}
                {!isPickedUp ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleScrapPickedUp}
                    className="w-full mb-3 py-3 rounded-xl font-bold text-base shadow-lg flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ color: '#ffffff' }}>
                      <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {requestData.orderType === 'cleaning_service' ? getTranslatedText('Start Service') : getTranslatedText('Pickup Scrap')}
                  </motion.button>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCall}
                    className="py-3 rounded-xl font-semibold text-sm shadow-md flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'rgba(31, 41, 55, 1)', color: '#f9fafb' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: '#4ade80' }}>
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {getTranslatedText("Call")}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleChat}
                    className="py-3 rounded-xl font-semibold text-sm shadow-md flex items-center justify-center gap-2"
                    style={{ backgroundColor: 'rgba(31, 41, 55, 1)', color: '#f9fafb' }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ color: '#60a5fa' }}>
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {getTranslatedText("Chat")}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )
      }

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-2xl p-6"
              style={{ backgroundColor: '#1f2937' }}
            >
              <h3 className="text-xl font-bold mb-4" style={{ color: '#f9fafb' }}>
                {getTranslatedText("Confirm Action")}
              </h3>
              <p className="mb-6 text-base" style={{ color: '#d1d5db' }}>
                {confirmMessage}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl font-semibold bg-gray-700 text-white"
                >
                  {getTranslatedText("Cancel")}
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 rounded-xl font-bold bg-green-500 text-gray-900"
                >
                  {getTranslatedText("Yes, Confirm")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div >
  );
};

export default ActiveRequestDetailsPage;

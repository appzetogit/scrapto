import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaMapMarkerAlt, FaTag, FaBoxOpen, FaChevronLeft, 
  FaInfoCircle, FaHandHoldingUsd, FaComments, FaLock, FaPhone,
  FaCheckCircle, FaExclamationTriangle, FaChevronRight, FaUserAlt
} from 'react-icons/fa';
import { marketplaceAPI, chatAPI } from '../../../shared/utils/api';
import { useAuth } from '../../../shared/context/AuthContext';
import toast from 'react-hot-toast';

const MarketplaceRequestDetails = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidMessage, setBidMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasJustBid, setHasJustBid] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const response = await marketplaceAPI.getRequestById(requestId);
      if (response.success) {
        setRequest(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch request details:', error);
      toast.error('Failed to load request details');
      navigate('/scrapper/marketplace');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    if (e) e.preventDefault();
    if (!bidAmount || isNaN(bidAmount) || parseFloat(bidAmount) <= 0) {
      return toast.error('Please enter a valid bid amount');
    }

    const loadingToast = toast.loading('Sending your offer...');
    try {
      setIsSubmitting(true);
      const response = await marketplaceAPI.placeBid(requestId, {
        bidAmount: parseFloat(bidAmount),
        message: bidMessage
      });

      if (response.success) {
        toast.success('Bid placed successfully!', { id: loadingToast });
        setHasJustBid(true);
        fetchRequestDetails();
      } else {
        toast.error(response.message || 'Failed to place bid', { id: loadingToast });
      }
    } catch (error) {
      console.error('Failed to place bid:', error);
      toast.error(error.response?.data?.message || 'Failed to place bid', { id: loadingToast });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreBidChat = async () => {
    try {
      const response = await chatAPI.getOrCreateMarketplaceChat(requestId);
      if (response.success && response.data.chat) {
        navigate(`/scrapper/chat/${response.data.chat._id}`, {
          state: { 
            requestId: requestId,
            isMarketplace: true
          }
        });
      }
    } catch (error) {
      console.error('Failed to initiate chat:', error);
      toast.error('Failed to start chat session');
    }
  };

  const handleReport = async () => {
    try {
      const response = await marketplaceAPI.reportRequest(requestId);
      if (response.success) {
        toast.success('Reported successfully');
      }
    } catch (error) {
      console.error('Failed to report:', error);
      toast.error(error.response?.data?.message || 'Failed to report');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/scrapper/marketplace')}
        className="flex items-center text-emerald-700 font-medium mb-6 hover:text-emerald-900"
      >
        <FaChevronLeft className="mr-1" /> Back to Marketplace
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Details & Images */}
        <div className="space-y-6">
          {/* Images Section */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-emerald-50">
            {request.images && request.images.length > 0 ? (
              <div className="relative group">
                <img 
                  src={request.images[0].url} 
                  alt={request.title} 
                  className="w-full aspect-square object-cover"
                />
                <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                  {request.category.toUpperCase()}
                </div>
              </div>
            ) : (
              <div className="w-full aspect-square bg-emerald-50 flex flex-col items-center justify-center text-emerald-300">
                <FaBoxOpen size={80} />
                <p className="mt-4 font-medium">No Images Available</p>
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-emerald-50">
            <h1 className="text-2xl font-bold text-emerald-900 mb-2">{request.title}</h1>
            <div className="flex items-center text-emerald-600 mb-4">
              <FaMapMarkerAlt className="mr-2" />
              <span>{request.location.city}, {request.location.state}</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="bg-emerald-100 text-emerald-700 text-xs px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider">
                {request.category}
              </span>
              {request.item && (
                <div className="flex items-center text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/50">
                  <FaTag className="mr-1.5 text-[10px]" />
                  <span className="font-bold">{request.item}</span>
                </div>
              )}
              {request.unit && (
                <div className="flex items-center text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100/50">
                  <FaBoxOpen className="mr-1.5 text-[10px]" />
                  <span className="font-bold">{request.unit}</span>
                </div>
              )}
            </div>
            
            <h3 className="font-bold text-emerald-800 mb-2 flex items-center">
              <FaInfoCircle className="mr-2 text-emerald-500" /> Description
            </h3>
            <p className="text-emerald-700 text-sm leading-relaxed whitespace-pre-line mb-6">
              {request.description || "No description provided for this item."}
            </p>

            {/* Seller Contact Info / Pickup Details */}
            <div className="mt-6">
              <h3 className="font-bold text-emerald-800 mb-4 flex items-center">
                <FaUserAlt className="mr-2 text-emerald-500" /> Seller Contact Info
              </h3>
              
              <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Seller Name</span>
                  <p className="text-slate-900 font-bold">
                    {request.fullAddress ? (request.customerName || 'Customer') : `${(request.customerName || 'Customer').substring(0, 2)}***`}
                  </p>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Contact Number</span>
                  <p className="text-slate-900 font-bold">
                    {request.phoneNumber ? request.phoneNumber : '+91 981***'}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-400 uppercase">Pickup Address</span>
                  <p className="text-slate-900 font-medium">
                    {request.fullAddress ? request.fullAddress : `${request.location.city}, ${request.location.state}, ***`}
                  </p>
                </div>

                {request.phoneNumber && (
                  <div className="pt-2">
                    <a 
                      href={`tel:${request.phoneNumber}`}
                      className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-3 rounded-2xl hover:bg-emerald-700 transition-all shadow-md font-bold"
                    >
                      <FaPhone /> Call Seller
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Bidding Section */}
        <div className="space-y-6">
          {/* Privacy Note */}
          {!request.fullAddress && (
            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6">
              <div className="flex items-start">
                <FaLock className="text-amber-500 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-amber-900 mb-1">Privacy Protected</h3>
                  <p className="text-amber-800 text-xs leading-relaxed">
                    The user's full address and phone number are hidden. They will only be disclosed once the deal is finalized or via an active subscription.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bidding Form */}
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-emerald-100 sticky top-4">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mr-3">
                <FaHandHoldingUsd className="text-emerald-600 text-xl" />
              </div>
              <h3 className="text-xl font-bold text-emerald-900">Place Your Bid</h3>
            </div>

            {request.status === 'deal_closed' ? (
              <div className="text-center py-8">
                {request.winnerScrapper?.toString() === (user?.scrapperId || user?.id)?.toString() ? (
                  <div className="space-y-4">
                    <div className="bg-indigo-600 text-white p-4 rounded-2xl font-bold shadow-lg animate-bounce">
                      YOU WON THIS DEAL!
                    </div>
                    <p className="text-indigo-600 text-sm font-medium">
                      The user's contact and address details are now visible on the left.
                    </p>
                    <button 
                      onClick={handlePreBidChat}
                      className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 font-bold py-3 rounded-2xl border-2 border-indigo-100 hover:bg-indigo-100 transition-all"
                    >
                      <FaComments /> Chat
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-emerald-100 text-emerald-700 p-4 rounded-2xl font-bold mb-4">
                      DEAL CLOSED
                    </div>
                    <p className="text-emerald-600 text-sm">
                      This request has been fulfilled by another scrapper.
                    </p>
                  </>
                )}
              </div>
            ) : !request.fullAddress ? (
              /* Subscription Notice Section */
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <FaLock size={80} className="text-amber-900" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="bg-amber-100 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                      <FaExclamationTriangle className="text-amber-600 text-xl" />
                    </div>
                    
                    <h3 className="text-xl font-black text-amber-900 mb-2">Subscription Notice</h3>
                    <p className="text-amber-800 text-sm font-medium mb-6 leading-relaxed">
                      You currently have no active subscription. Please subscribe to a plan to unlock posts.
                    </p>
                    
                    <div className="space-y-3 mb-8">
                      <h4 className="text-[10px] font-black text-amber-900/50 uppercase tracking-widest">Premium Benefits:</h4>
                      {[
                        'View unlimited posts',
                        'Access higher value items',
                        'Priority support',
                        'Exclusive features'
                      ].map((benefit, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <FaCheckCircle className="text-emerald-500 flex-shrink-0" />
                          <span className="text-sm font-bold text-amber-900/80">{benefit}</span>
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => navigate('/scrapper/subscription?type=general')}
                      className="w-full bg-[#a35e31] hover:bg-[#8b4f29] text-white font-black py-4 rounded-2xl shadow-xl shadow-amber-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 group"
                    >
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <FaChevronRight className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                      VIEW PLANS & UPGRADE
                    </button>
                  </div>
                </div>
              </div>
            ) : (request.myBid || hasJustBid) ? (
              <div className="text-center py-10 animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-inner rotate-3">
                  <FaHandHoldingUsd className="text-emerald-600 text-4xl" />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 mb-2">Bid Placed!</h3>
                <p className="text-emerald-600 font-medium px-4">
                  Your offer of <span className="text-xl font-black text-emerald-900 ml-1">₹{request.myBid?.bidAmount || bidAmount}</span> has been submitted.
                </p>
                <div className="mt-8 p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100/50">
                  <div className="flex items-center justify-center gap-2 text-emerald-700 font-bold uppercase tracking-wider text-xs">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Status: Bidding Active
                  </div>
                </div>
                <p className="mt-4 text-[10px] text-emerald-400 max-w-[200px] mx-auto italic">
                  The user will be notified of your interest and can contact you via chat.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-emerald-800 mb-2">Your Offer Price (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">₹</span>
                    <input 
                      type="number" 
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Enter amount..."
                      className="w-full pl-10 pr-4 py-4 bg-emerald-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none text-xl font-bold text-emerald-900 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-emerald-800 mb-2">Message to User (Optional)</label>
                  <textarea 
                    value={bidMessage}
                    onChange={(e) => setBidMessage(e.target.value)}
                    placeholder="Tell the user why they should pick your offer..."
                    rows={4}
                    className="w-full p-4 bg-emerald-50 border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none text-emerald-900 text-sm transition-all resize-none"
                  />
                </div>

                <button 
                  type="button"
                  onClick={handlePlaceBid}
                  disabled={isSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FaHandHoldingUsd /> Place Bid
                    </>
                  )}
                </button>

                <p className="text-[10px] text-center text-emerald-500 mt-4 px-4">
                  By placing a bid, you agree to negotiate fairly. Once the deal is closed, you will be able to chat with the user and see their location.
                </p>
              </form>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handlePreBidChat}
              className="flex items-center justify-center gap-2 bg-white border-2 border-emerald-100 text-emerald-700 font-bold py-3 rounded-2xl hover:bg-emerald-50 transition-all"
            >
              <FaComments /> Chat
            </button>
            <button 
              onClick={handleReport}
              className="flex items-center justify-center gap-2 bg-white border-2 border-red-50 text-red-400 font-bold py-3 rounded-2xl hover:bg-red-50 transition-all"
            >
              <FaBoxOpen /> Report Spam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceRequestDetails;

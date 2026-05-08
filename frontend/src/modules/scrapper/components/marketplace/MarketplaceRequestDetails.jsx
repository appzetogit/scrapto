import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FaMapMarkerAlt, FaTag, FaBoxOpen, FaChevronLeft, 
  FaInfoCircle, FaHandHoldingUsd, FaComments, FaLock, FaPhone 
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
    e.preventDefault();
    if (!bidAmount || isNaN(bidAmount) || parseFloat(bidAmount) <= 0) {
      return toast.error('Please enter a valid bid amount');
    }

    try {
      setIsSubmitting(true);
      const response = await marketplaceAPI.placeBid(requestId, {
        bidAmount: parseFloat(bidAmount),
        message: bidMessage
      });

      if (response.success) {
        toast.success('Bid placed successfully!');
        // After bidding, we could redirect or show a success state
        // For now, let's refresh details
        fetchRequestDetails();
      }
    } catch (error) {
      console.error('Failed to place bid:', error);
      toast.error(error.response?.data?.message || 'Failed to place bid');
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
            
            <h3 className="font-bold text-emerald-800 mb-2 flex items-center">
              <FaInfoCircle className="mr-2 text-emerald-500" /> Description
            </h3>
            <p className="text-emerald-700 text-sm leading-relaxed whitespace-pre-line">
              {request.description || "No description provided for this item."}
            </p>

            {/* Winner sensitive info */}
            {request.fullAddress && (
              <div className="mt-6 p-6 bg-indigo-50 border-2 border-indigo-100 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <h3 className="font-bold text-indigo-900">Pickup Details</h3>
                    <p className="text-xs text-indigo-600">
                      {request.status === 'deal_closed' ? 'Disclosed to you as the winner' : 'Unlocked with your active subscription'}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Exact Address</span>
                    <p className="text-indigo-900 font-medium">{request.fullAddress}</p>
                  </div>
                  {request.phoneNumber && (
                    <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-indigo-100">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase">Contact Number</span>
                        <p className="text-indigo-900 font-bold">{request.phoneNumber}</p>
                      </div>
                      <a 
                        href={`tel:${request.phoneNumber}`}
                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md"
                      >
                        <FaPhone />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                      <FaComments /> Start Chat with User
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
                  type="submit"
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
              <FaComments /> Pre-Bid Chat
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

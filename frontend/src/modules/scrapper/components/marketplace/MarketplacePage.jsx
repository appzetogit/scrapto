import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaTag, FaBoxOpen, FaChevronRight, FaFilter, FaPhone } from 'react-icons/fa';
import { marketplaceAPI } from '../../../shared/utils/api';
import toast from 'react-hot-toast';

const MarketplacePage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubRequired, setIsSubRequired] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    category: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setIsSubRequired(false);
      const response = await marketplaceAPI.getRequests(filters);
      if (response.success) {
        setRequests(response.data);
      } else if (response.status === 403) {
        setIsSubRequired(true);
      }
    } catch (error) {
      if (error.status === 403 || error.response?.status === 403) {
        setIsSubRequired(true);
      } else {
        console.error('Failed to fetch marketplace requests:', error);
        toast.error('Failed to load marketplace');
      }
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Categories', value: '' },
    { id: 'metal', name: 'Metal', value: 'metal' },
    { id: 'plastic', name: 'Plastic', value: 'plastic' },
    { id: 'paper', name: 'Paper', value: 'paper' },
    { id: 'electronic', name: 'Electronic', value: 'electronic' }
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-emerald-900">Scrap Marketplace</h1>
        <p className="text-emerald-700">Browse and bid on scrap requests in your area</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-emerald-100">
        <div className="relative">
          <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" />
          <select
            className="w-full pl-10 pr-4 py-3 bg-emerald-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-900 appearance-none font-medium"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          >
            {categories.map(cat => (
              <option key={cat.id} value={cat.value}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : isSubRequired ? (
        <div className="bg-white rounded-3xl p-8 md:p-12 text-center border border-emerald-100 shadow-xl overflow-hidden relative">
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10">
            <div className="bg-emerald-100 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-inner">
              <FaBoxOpen className="text-emerald-600 text-5xl" />
            </div>
            <h3 className="text-2xl font-black text-emerald-900 mb-3 uppercase tracking-tight">Marketplace Locked</h3>
            <p className="text-emerald-600 mb-8 max-w-sm mx-auto font-medium">
              You need an active subscription to browse the marketplace and place bids on high-value scrap requests.
            </p>
            <button 
              onClick={() => navigate('/scrapper/subscription?type=general')}
              className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-3 mx-auto"
            >
              Get Subscription Now
              <FaChevronRight className="text-sm" />
            </button>
          </div>
        </div>
      ) : requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => (
            <div 
              key={request._id}
              onClick={() => navigate(`/scrapper/marketplace/${request._id}`)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-50 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex gap-4">
                {/* Image Placeholder or First Image */}
                <div className="w-24 h-24 bg-emerald-100 rounded-xl overflow-hidden flex-shrink-0">
                  {request.images && request.images.length > 0 ? (
                    <img 
                      src={request.images[0].url} 
                      alt={request.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FaBoxOpen className="text-emerald-300 text-3xl" />
                    </div>
                  )}
                </div>

                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-emerald-900 text-lg line-clamp-1">{request.title}</h3>
                    <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-semibold uppercase">
                      {request.category}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center text-emerald-600 text-sm">
                    <FaMapMarkerAlt className="mr-1 flex-shrink-0" />
                    <span className="truncate">{request.fullAddress || `${request.location.city}, ${request.location.state}`}</span>
                  </div>
                  {request.phoneNumber && (
                    <div className="mt-1 flex items-center text-emerald-500 text-xs font-bold">
                      <FaPhone className="mr-1 text-[10px]" />
                      <span>{request.phoneNumber}</span>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-end">
                    <button className="bg-emerald-600 text-white p-2 rounded-xl group-hover:bg-emerald-700 transition-colors">
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-emerald-100">
          <div className="bg-emerald-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaBoxOpen className="text-emerald-300 text-4xl" />
          </div>
          <h3 className="text-xl font-bold text-emerald-900">No requests found</h3>
          <p className="text-emerald-600 mt-2">Check back later for new scrap requests in your area.</p>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;

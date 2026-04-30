import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaEye, FaUpload, FaSearch, FaBox } from 'react-icons/fa';
import { marketplaceAPI } from '../../shared/utils/api';
import toast from 'react-hot-toast';

const MarketplaceManager = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState('');
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    name: '', // Added for auto-registration
    category: 'metal',
    basePrice: '',
    city: '',
    state: '',
    fullAddress: '',
    phoneNumber: '',
    images: []
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await marketplaceAPI.getRequests(filterStatus ? { status: filterStatus } : {});
      if (response.success) {
        setRequests(response.data);
      }
    } catch (error) {
      toast.error('Failed to load marketplace requests');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    try {
      const data = JSON.parse(bulkData);
      if (!Array.isArray(data)) {
        throw new Error('Data must be an array of objects');
      }
      
      const response = await marketplaceAPI.createRequests(data);
      if (response.success) {
        toast.success(`${response.data.length} requests created successfully!`);
        setShowBulkModal(false);
        setBulkData('');
        fetchRequests();
      }
    } catch (error) {
      toast.error(error.message || 'Invalid JSON format');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      let uploadedImages = [];
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach(img => formData.append('images', img));
        const uploadRes = await marketplaceAPI.uploadImages(formData);
        if (uploadRes.success) {
          uploadedImages = uploadRes.data;
        }
      }

      const data = {
        ...newRequest,
        images: uploadedImages,
        location: {
          city: newRequest.city,
          state: newRequest.state
        }
      };
      
      const response = await marketplaceAPI.createRequests(data);
      if (response.success) {
        toast.success('Request created successfully!');
        setShowAddModal(false);
        setNewRequest({
          title: '',
          description: '',
          name: '',
          category: 'metal',
          basePrice: '',
          city: '',
          state: '',
          fullAddress: '',
          phoneNumber: '',
          images: []
        });
        setSelectedImages([]);
        fetchRequests();
      }
    } catch (error) {
      toast.error('Failed to create request');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this marketplace request? All associated bids will also be deleted.')) {
      return;
    }

    try {
      const response = await marketplaceAPI.deleteRequest(id);
      if (response.success) {
        toast.success('Request deleted successfully');
        fetchRequests();
      }
    } catch (error) {
      toast.error('Failed to delete request');
    }
  };

  const openViewModal = (req) => {
    setSelectedRequest(req);
    setShowViewModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Marketplace Management</h1>
          <p className="text-gray-500">Manage bulk scrap requests for scrappers to bid on</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowBulkModal(true)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-900 transition-all"
          >
            <FaUpload /> Bulk Upload
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-all"
          >
            <FaPlus /> Add New Request
          </button>
        </div>
      </div>

      {/* Stats/Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 px-4 py-2 rounded-lg text-indigo-700 font-bold">
            Total Requests: {requests.length}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="bidding">Bidding</option>
            <option value="deal_closed">Deal Closed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search requests..." 
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-64"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-4 font-bold text-gray-700">Request Details</th>
              <th className="px-6 py-4 font-bold text-gray-700">Category</th>
              <th className="px-6 py-4 font-bold text-gray-700">Price (Base)</th>
              <th className="px-6 py-4 font-bold text-gray-700">Location</th>
              <th className="px-6 py-4 font-bold text-gray-700">Status</th>
              <th className="px-6 py-4 font-bold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-10">Loading...</td>
              </tr>
            ) : requests.length > 0 ? (
              requests.map((req) => (
                <tr key={req._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FaBox className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{req.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{req.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 capitalize">{req.category}</td>
                  <td className="px-6 py-4 font-bold">₹{req.basePrice}</td>
                  <td className="px-6 py-4 text-sm">{req.location.city}, {req.location.state}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                      req.status === 'open' ? 'bg-green-100 text-green-700' :
                      req.status === 'deal_closed' ? 'bg-indigo-100 text-indigo-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openViewModal(req)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <FaEye />
                      </button>
                      <button 
                        onClick={() => handleDeleteRequest(req._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-500">No marketplace requests found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal (Simplified) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold">Add Marketplace Request</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-6 overflow-y-auto flex-1 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-bold mb-1">Title</label>
                <input 
                  type="text" required
                  className="w-full p-2 border rounded-lg"
                  value={newRequest.title}
                  onChange={e => setNewRequest({...newRequest, title: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold mb-1">Description</label>
                <textarea 
                  className="w-full p-2 border rounded-lg"
                  value={newRequest.description}
                  onChange={e => setNewRequest({...newRequest, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 col-span-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Name</label>
                  <input
                    type="text"
                    value={newRequest.name}
                    onChange={(e) => setNewRequest({...newRequest, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter user name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newRequest.phoneNumber}
                    onChange={(e) => setNewRequest({...newRequest, phoneNumber: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Category</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  value={newRequest.category}
                  onChange={e => setNewRequest({...newRequest, category: e.target.value})}
                >
                  <option value="metal">Metal</option>
                  <option value="plastic">Plastic</option>
                  <option value="paper">Paper</option>
                  <option value="electronic">Electronic</option>
                  <option value="vehicles">Vehicles</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold mb-1">Images (Select up to 5)</label>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*"
                  onChange={e => setSelectedImages(Array.from(e.target.files))}
                  className="w-full p-2 border rounded-lg"
                />
                {selectedImages.length > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">{selectedImages.length} images selected</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Base Price (₹)</label>
                <input 
                  type="number" required
                  className="w-full p-2 border rounded-lg"
                  value={newRequest.basePrice}
                  onChange={e => setNewRequest({...newRequest, basePrice: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">City</label>
                <input 
                  type="text" required
                  className="w-full p-2 border rounded-lg"
                  value={newRequest.city}
                  onChange={e => setNewRequest({...newRequest, city: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">State</label>
                <input 
                  type="text" required
                  className="w-full p-2 border rounded-lg"
                  value={newRequest.state}
                  onChange={e => setNewRequest({...newRequest, state: e.target.value})}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-bold mb-1">Full Address (Internal)</label>
                <input 
                  type="text" required
                  className="w-full p-2 border rounded-lg"
                  value={newRequest.fullAddress}
                  onChange={e => setNewRequest({...newRequest, fullAddress: e.target.value})}
                />
              </div>
              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold">Create Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Bulk Import Requests</h2>
                <p className="text-xs text-gray-500">Paste an array of request objects (JSON format)</p>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <textarea 
                className="w-full h-64 p-4 border rounded-xl font-mono text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder='[
  {
    "title": "Old Iron Pipes",
    "description": "50kg of mixed iron pipes",
    "category": "metal",
    "basePrice": 1200,
    "city": "Indore",
    "state": "MP",
    "fullAddress": "Address here",
    "phoneNumber": "9876543210"
  }
]'
                value={bulkData}
                onChange={e => setBulkData(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button 
                  onClick={handleBulkUpload}
                  disabled={!bulkData}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  Import All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold">Request Details</h2>
              <button onClick={() => setShowViewModal(false)} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Title</h3>
                  <p className="font-bold text-gray-800">{selectedRequest.title}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Category</h3>
                  <p className="capitalize text-gray-800">{selectedRequest.category}</p>
                </div>
                <div className="col-span-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">{selectedRequest.description}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Base Price</h3>
                  <p className="font-bold text-indigo-600 text-xl">₹{selectedRequest.basePrice}</p>
                </div>
                <div className="col-span-2 md:col-span-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Status</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                    selectedRequest.status === 'open' ? 'bg-green-100 text-green-700' :
                    selectedRequest.status === 'deal_closed' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {selectedRequest.status}
                  </span>
                </div>
                <div className="col-span-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-4">Images</h3>
                  <div className="flex gap-2 flex-wrap">
                    {selectedRequest.images && selectedRequest.images.length > 0 ? (
                      selectedRequest.images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img.url} 
                          alt="request" 
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                      ))
                    ) : (
                      <p className="text-sm text-gray-400 italic">No images uploaded</p>
                    )}
                  </div>
                </div>
                <div className="col-span-2 bg-gray-50 p-4 rounded-xl space-y-3">
                  <h4 className="font-bold text-gray-800 border-b pb-2 mb-2">Internal Contact Info</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase">Phone Number</h3>
                      <p className="font-medium text-gray-800">{selectedRequest.phoneNumber}</p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase">Location</h3>
                      <p className="font-medium text-gray-800">{selectedRequest.location.city}, {selectedRequest.location.state}</p>
                    </div>
                    <div className="col-span-2">
                      <h3 className="text-[10px] font-bold text-gray-400 uppercase">Full Address</h3>
                      <p className="font-medium text-gray-800">{selectedRequest.fullAddress}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end flex-shrink-0">
              <button 
                onClick={() => setShowViewModal(false)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplaceManager;

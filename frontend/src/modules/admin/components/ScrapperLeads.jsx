import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { adminAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';
import {
  FaUserPlus,
  FaSearch,
  FaFilter,
  FaTruck,
  FaMapMarkerAlt,
  FaPhone,
  FaEdit,
  FaTrash,
  FaInbox,
  FaExclamationCircle
} from 'react-icons/fa';

// Debounce helper
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const ScrapperLeads = () => {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState('all'); // all | new | invited | converted | rejected
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const staticTexts = [
    "New",
    "Invited",
    "Converted",
    "Rejected",
    "Failed to load leads",
    "Please enter a valid phone number",
    "Lead updated successfully",
    "Lead created successfully",
    "Operation failed",
    "Failed to save lead",
    "Delete this lead? This cannot be undone.",
    "Lead deleted successfully",
    "Failed to delete lead",
    "Failed to update status",
    "Scrapper Leads",
    "Add and track potential scrappers before they join the platform",
    "Add Lead",
    "Search by name, phone, or area...",
    "All Status",
    "No Leads Found",
    "Try adjusting filters",
    "Create a new scrapper lead",
    "Admin",
    "Edit",
    "Delete",
    "Mark Invited",
    "Mark Converted",
    "Edit Scrapper Lead",
    "Add Scrapper Lead",
    "Name",
    "Scrapper name",
    "Phone Number *",
    "10-digit phone",
    "Area / Locality",
    "e.g., Andheri West",
    "Vehicle Info",
    "e.g., Truck",
    "Status",
    "Notes",
    "Any important details (availability, preferences, etc.)",
    "Save Changes",
    "Create Lead",
    "Cancel"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  const STATUS_LABELS = {
    new: getTranslatedText('New'),
    invited: getTranslatedText('Invited'),
    converted: getTranslatedText('Converted'),
    rejected: getTranslatedText('Rejected')
  };

  const STATUS_COLORS = {
    new: { bg: 'rgba(59, 130, 246, 0.08)', color: '#2563eb' },
    invited: { bg: 'rgba(234, 179, 8, 0.08)', color: '#ca8a04' },
    converted: { bg: 'rgba(16, 185, 129, 0.08)', color: '#10b981' },
    rejected: { bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }
  };

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    area: '',
    vehicleInfo: '',
    notes: '',
    status: 'new'
  });

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = '';
      if (statusFilter !== 'all') {
        query += `status=${statusFilter}&`;
      }
      if (debouncedSearch) {
        query += `search=${encodeURIComponent(debouncedSearch)}`;
      }

      const response = await adminAPI.getAllLeads(query);
      if (response.success && response.data?.leads) {
        setLeads(response.data.leads);
      } else {
        setLeads([]);
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
      setError(getTranslatedText('Failed to load leads'));
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch, getTranslatedText]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const handleOpenCreate = () => {
    setEditingLead(null);
    setFormData({
      name: '',
      phone: '',
      area: '',
      vehicleInfo: '',
      notes: '',
      status: 'new'
    });
    setShowForm(true);
  };

  const handleOpenEdit = (lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name || '',
      phone: lead.phone || '',
      area: lead.area || '',
      vehicleInfo: lead.vehicleInfo || '',
      notes: lead.notes || '',
      status: lead.status || 'new'
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      phone: formData.phone.trim()
    };

    if (!payload.phone || payload.phone.length < 10) {
      alert(getTranslatedText('Please enter a valid phone number'));
      return;
    }

    try {
      let response;
      if (editingLead) {
        response = await adminAPI.updateLead(editingLead._id || editingLead.id, payload);
      } else {
        response = await adminAPI.createLead(payload);
      }

      if (response.success) {
        setShowForm(false);
        setEditingLead(null);
        loadLeads(); // Reload list
        alert(editingLead ? getTranslatedText('Lead updated successfully') : getTranslatedText('Lead created successfully'));
      } else {
        throw new Error(response.message || getTranslatedText('Operation failed'));
      }
    } catch (err) {
      console.error('Error saving lead:', err);
      alert(err.message || getTranslatedText('Failed to save lead'));
    }
  };

  const handleDelete = async (leadId) => {
    if (!window.confirm(getTranslatedText('Delete this lead? This cannot be undone.'))) return;
    try {
      const response = await adminAPI.deleteLead(leadId);
      if (response.success) {
        setLeads((prev) => prev.filter((l) => (l._id || l.id) !== leadId));
        alert(getTranslatedText('Lead deleted successfully'));
      } else {
        throw new Error(response.message || getTranslatedText('Failed to delete lead'));
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
      alert(err.message || getTranslatedText('Failed to delete lead'));
    }
  };

  const handleQuickStatus = async (leadId, status) => {
    try {
      const response = await adminAPI.updateLead(leadId, { status });
      if (response.success) {
        // Optimistic update or reload
        setLeads((prev) => prev.map((l) => (l._id === leadId || l.id === leadId ? { ...l, status } : l)));
      } else {
        alert(getTranslatedText('Failed to update status'));
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(getTranslatedText('Failed to update status'));
    }
  };

  const getStatusBadge = (status) => {
    const cfg = STATUS_COLORS[status] || STATUS_COLORS.new;
    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-semibold"
        style={{ backgroundColor: cfg.bg, color: cfg.color }}
      >
        {STATUS_LABELS[status] || status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-4 md:p-6"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(100, 148, 110, 0.1)' }}
            >
              <FaUserPlus className="text-3xl" style={{ color: '#64946e' }} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-1" style={{ color: '#2d3748' }}>
                {getTranslatedText("Scrapper Leads")}
              </h1>
              <p className="text-sm md:text-base" style={{ color: '#718096' }}>
                {getTranslatedText("Add and track potential scrappers before they join the platform")}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all"
            style={{ backgroundColor: '#64946e', color: '#ffffff' }}
          >
            <FaUserPlus />
            {getTranslatedText("Add Lead")}
          </motion.button>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
              style={{ color: '#718096' }}
            />
            <input
              type="text"
              placeholder={getTranslatedText("Search by name, phone, or area...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
              style={{
                borderColor: '#e2e8f0',
                backgroundColor: '#f7fafc',
                color: '#2d3748'
              }}
            />
          </div>
          <div className="flex items-center gap-2 justify-start md:justify-end">
            <FaFilter style={{ color: '#718096' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
              style={{
                borderColor: '#e2e8f0',
                backgroundColor: '#f7fafc',
                color: '#2d3748'
              }}
            >
              <option value="all">{getTranslatedText("All Status")}</option>
              <option value="new">{getTranslatedText("New")}</option>
              <option value="invited">{getTranslatedText("Invited")}</option>
              <option value="converted">{getTranslatedText("Converted")}</option>
              <option value="rejected">{getTranslatedText("Rejected")}</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Leads List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden min-h-[300px]"
      >
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#64946e' }}></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 flex-col text-red-500">
            <FaExclamationCircle className="text-3xl mb-2" />
            <p>{error}</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="p-12 text-center">
            <FaInbox className="text-5xl mx-auto mb-4" style={{ color: '#cbd5e0' }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("No Leads Found")}
            </h3>
            <p className="text-sm mb-4" style={{ color: '#718096' }}>
              {debouncedSearch || statusFilter !== 'all' ? getTranslatedText('Try adjusting filters') : getTranslatedText('Create a new scrapper lead')}
            </p>
          </div>
        ) : (
          leads.map((lead, index) => (
            <div
              key={lead._id || lead.id}
              className={`p-3 md:p-6 hover:bg-gray-50 transition-all ${index !== leads.length - 1 ? 'border-b' : ''
                }`}
              style={{ borderColor: '#e2e8f0' }}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-base md:text-lg font-bold" style={{ color: '#2d3748' }}>
                      {lead.name}
                    </h3>
                    {getStatusBadge(lead.status)}
                    {lead.source && (
                      <span
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: 'rgba(148, 163, 184, 0.15)',
                          color: '#64748b'
                        }}
                      >
                        {lead.source === 'admin_manual' ? getTranslatedText('Admin') : lead.source}
                      </span>
                    )}
                  </div>
                  <div
                    className="flex flex-wrap gap-3 text-xs md:text-sm"
                    style={{ color: '#718096' }}
                  >
                    {lead.phone && (
                      <span className="flex items-center gap-1">
                        <FaPhone />
                        {lead.phone}
                      </span>
                    )}
                    {lead.area && (
                      <span className="flex items-center gap-1">
                        <FaMapMarkerAlt />
                        {lead.area}
                      </span>
                    )}
                    {lead.vehicleInfo && (
                      <span className="flex items-center gap-1">
                        <FaTruck />
                        {lead.vehicleInfo}
                      </span>
                    )}
                  </div>
                  {lead.notes && (
                    <p
                      className="mt-2 text-xs md:text-sm line-clamp-2"
                      style={{ color: '#4a5568' }}
                    >
                      {lead.notes}
                    </p>
                  )}
                  <p className="mt-2 text-xs" style={{ color: '#a0aec0' }}>
                    {getTranslatedText("Created {date}", { date: new Date(lead.createdAt).toLocaleDateString() })}{' '}
                    {lead.updatedAt && (
                      <>· {getTranslatedText("Updated {date}", { date: new Date(lead.updatedAt).toLocaleDateString() })}</>
                    )}
                  </p>
                </div>

                <div className="flex flex-col items-stretch gap-2 md:w-56">
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleOpenEdit(lead)}
                      className="flex-1 px-3 py-2 rounded-lg font-semibold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all"
                      style={{ backgroundColor: '#edf2f7', color: '#2d3748' }}
                    >
                      <FaEdit />
                      {getTranslatedText("Edit")}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(lead._id || lead.id)}
                      className="px-3 py-2 rounded-lg font-semibold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all"
                      style={{ backgroundColor: '#fee2e2', color: '#ef4444' }}
                    >
                      <FaTrash />
                      {getTranslatedText("Delete")}
                    </motion.button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lead.status !== 'invited' && (
                      <button
                        onClick={() => handleQuickStatus(lead._id || lead.id, 'invited')}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{
                          backgroundColor: 'rgba(234, 179, 8, 0.1)',
                          color: '#b45309'
                        }}
                      >
                        {getTranslatedText("Mark Invited")}
                      </button>
                    )}
                    {lead.status !== 'converted' && (
                      <button
                        onClick={() => handleQuickStatus(lead._id || lead.id, 'converted')}
                        className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                        style={{
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          color: '#047857'
                        }}
                      >
                        {getTranslatedText("Mark Converted")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </motion.div>

      {/* Create / Edit Lead Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowForm(false);
              setEditingLead(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#2d3748' }}>
                  {editingLead ? getTranslatedText('Edit Scrapper Lead') : getTranslatedText('Add Scrapper Lead')}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1"
                      style={{ color: '#2d3748' }}
                    >
                      {getTranslatedText("Name")}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                      placeholder={getTranslatedText("Scrapper name")}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1"
                      style={{ color: '#2d3748' }}
                    >
                      {getTranslatedText("Phone Number *")}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phone: e.target.value.replace(/\D/g, '').slice(0, 10)
                        })
                      }
                      className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                      placeholder={getTranslatedText("10-digit phone")}
                      maxLength={10}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block text-sm font-semibold mb-1"
                        style={{ color: '#2d3748' }}
                      >
                        {getTranslatedText("Area / Locality")}
                      </label>
                      <input
                        type="text"
                        value={formData.area}
                        onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                        style={{
                          borderColor: '#e2e8f0',
                          backgroundColor: '#f7fafc',
                          color: '#2d3748'
                        }}
                        placeholder={getTranslatedText("e.g., Andheri West")}
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm font-semibold mb-1"
                        style={{ color: '#2d3748' }}
                      >
                        {getTranslatedText("Vehicle Info")}
                      </label>
                      <input
                        type="text"
                        value={formData.vehicleInfo}
                        onChange={(e) =>
                          setFormData({ ...formData, vehicleInfo: e.target.value })
                        }
                        className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                        style={{
                          borderColor: '#e2e8f0',
                          backgroundColor: '#f7fafc',
                          color: '#2d3748'
                        }}
                        placeholder={getTranslatedText("e.g., Truck")}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1"
                      style={{ color: '#2d3748' }}
                    >
                      {getTranslatedText("Status")}
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                    >
                      <option value="new">{getTranslatedText("New")}</option>
                      <option value="invited">{getTranslatedText("Invited")}</option>
                      <option value="converted">{getTranslatedText("Converted")}</option>
                      <option value="rejected">{getTranslatedText("Rejected")}</option>
                    </select>
                  </div>
                  <div>
                    <label
                      className="block text-sm font-semibold mb-1"
                      style={{ color: '#2d3748' }}
                    >
                      {getTranslatedText("Notes")}
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 text-sm"
                      style={{
                        borderColor: '#e2e8f0',
                        backgroundColor: '#f7fafc',
                        color: '#2d3748'
                      }}
                      rows={3}
                      placeholder={getTranslatedText("Any important details (availability, preferences, etc.)")}
                    />
                  </div>
                  <div className="flex gap-3 mt-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      className="flex-1 px-4 py-2 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                      style={{ backgroundColor: '#64946e', color: '#ffffff' }}
                    >
                      {editingLead ? getTranslatedText('Save Changes') : getTranslatedText('Create Lead')}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingLead(null);
                      }}
                      className="px-4 py-2 rounded-xl font-semibold text-sm transition-all"
                      style={{ backgroundColor: '#f7fafc', color: '#2d3748' }}
                    >
                      {getTranslatedText("Cancel")}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ScrapperLeads;

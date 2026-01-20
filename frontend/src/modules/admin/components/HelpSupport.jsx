import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  FaTicketAlt, FaSearch, FaFilter, FaCheckCircle, FaExclamationCircle,
  FaSpinner, FaUser, FaClock, FaComment
} from 'react-icons/fa';
import { supportAPI } from '../../shared/utils/api';
import { usePageTranslation } from '../../../hooks/usePageTranslation';

const STATUS_CONFIG = {
  open: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Open' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Progress' },
  resolved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Resolved' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Closed' }
};

const PRIORITY_CONFIG = {
  low: { color: '#718096', icon: FaCheckCircle },
  medium: { color: '#3182ce', icon: FaExclamationCircle },
  high: { color: '#d69e2e', icon: FaExclamationCircle },
  urgent: { color: '#e53e3e', icon: FaExclamationCircle }
};

const HelpSupport = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    search: ''
  });

  const staticTexts = [
    "Failed to load tickets",
    "Failed to update status",
    "Help & Support",
    "Manage user inquiries and support tickets",
    "Search subject, name...",
    "All Status",
    "Open",
    "In Progress",
    "Resolved",
    "Closed",
    "All Priorities",
    "Low",
    "Medium",
    "High",
    "Urgent",
    "Tickets ({count})",
    "No tickets found",
    "Guest",
    "Mark {status}",
    "{priority} Priority",
    "responses",
    "Reply to this ticket... (Feature coming soon in backend)",
    "Send Reply",
    "Select a ticket to view details"
  ];
  const { getTranslatedText } = usePageTranslation(staticTexts);

  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    loadTickets();
  }, [filters.status, filters.priority]);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      loadTickets();
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const loadTickets = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = '';
      if (filters.status !== 'all') query += `&status=${filters.status}`;
      if (filters.priority !== 'all') query += `&priority=${filters.priority}`;
      if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;

      const response = await supportAPI.getAllAdmin(query);
      if (response.success) {
        setTickets(response.data.tickets || []);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
      // setError('Failed to load tickets');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      const response = await supportAPI.updateStatus(ticketId, newStatus);
      if (response.success) {
        setTickets(prev => prev.map(t =>
          (t._id === ticketId ? { ...t, status: newStatus } : t)
        ));
        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert(getTranslatedText('Failed to update status'));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#2d3748' }}>
              {getTranslatedText("Help & Support")}
            </h1>
            <p className="text-gray-600">
              {getTranslatedText("Manage user inquiries and support tickets")}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
            <FaTicketAlt className="text-2xl text-blue-500" />
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={getTranslatedText("Search subject, name...")}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 border-gray-200 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-400" />
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 border-gray-200 focus:border-blue-500"
            >
              <option value="all">{getTranslatedText("All Status")}</option>
              <option value="open">{getTranslatedText("Open")}</option>
              <option value="in_progress">{getTranslatedText("In Progress")}</option>
              <option value="resolved">{getTranslatedText("Resolved")}</option>
              <option value="closed">{getTranslatedText("Closed")}</option>
            </select>
          </div>
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full px-4 py-2 rounded-xl border-2 focus:outline-none focus:ring-2 border-gray-200 focus:border-blue-500"
          >
            <option value="all">{getTranslatedText("All Priorities")}</option>
            <option value="low">{getTranslatedText("Low")}</option>
            <option value="medium">{getTranslatedText("Medium")}</option>
            <option value="high">{getTranslatedText("High")}</option>
            <option value="urgent">{getTranslatedText("Urgent")}</option>
          </select>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col"
        >
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-700">{getTranslatedText("Tickets ({count})", { count: tickets.length })}</h2>
          </div>

          <div className="p-2 space-y-2">
            {loading ? (
              <div className="flex justify-center p-8">
                <FaSpinner className="animate-spin text-2xl text-blue-500" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                {getTranslatedText("No tickets found")}
              </div>
            ) : (
              tickets.map(ticket => (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedTicket?._id === ticket._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-transparent hover:bg-gray-50'
                    }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_CONFIG[ticket.status]?.bg || 'bg-gray-100'} ${STATUS_CONFIG[ticket.status]?.text || 'text-gray-600'}`}>
                      {getTranslatedText(STATUS_CONFIG[ticket.status]?.label || ticket.status)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm mb-1 truncate">{ticket.subject}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FaUser className="text-xs" />
                    <span className="truncate max-w-[100px]">{getTranslatedText(ticket.name || 'Guest')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Ticket Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col"
        >
          {selectedTicket ? (
            <>
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <FaUser /> {selectedTicket.name} ({selectedTicket.role})
                      </span>
                      <span className="flex items-center gap-1">
                        <FaClock /> {new Date(selectedTicket.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {['open', 'in_progress', 'resolved', 'closed'].map(status => (
                      status !== selectedTicket.status && (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(selectedTicket._id, status)}
                          className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg capitalize transition-colors"
                        >
                          {getTranslatedText("Mark {status}", { status: status.replace('_', ' ') })}
                        </button>
                      )
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_CONFIG[selectedTicket.status]?.bg} ${STATUS_CONFIG[selectedTicket.status]?.text}`}>
                    {getTranslatedText(STATUS_CONFIG[selectedTicket.status]?.label)}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 uppercase">
                    {getTranslatedText("{priority} Priority", { priority: selectedTicket.priority })}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 uppercase">
                    {selectedTicket.type}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-6 bg-gray-50">
                <div className="bg-white p-6 rounded-xl shadow-sm mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>

                {/* Responses would go here */}
                {selectedTicket.responses?.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h3 className="font-bold text-gray-700 mb-2"> {getTranslatedText("responses")}</h3>
                    {/* Map responses */}
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border-t border-gray-100">
                <textarea
                  placeholder={getTranslatedText("Reply to this ticket... (Feature coming soon in backend)")}
                  disabled
                  className="w-full p-3 rounded-lg border bg-gray-50 focus:outline-none text-sm resize-none h-24"
                />
                <div className="flex justify-end mt-2">
                  <button disabled className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed">
                    {getTranslatedText("Send Reply")}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-gray-400">
              <FaComment className="text-4xl mb-4" />
              <p>{getTranslatedText("Select a ticket to view details")}</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default HelpSupport;

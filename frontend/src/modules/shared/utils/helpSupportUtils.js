// Simple localStorage-backed Help & Support ticket utilities
// Tickets are shared between user, scrapper, and admin views.

const STORAGE_KEY = 'supportTickets';

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved'
};

export const TICKET_ROLE = {
  USER: 'user',
  SCRAPPER: 'scrapper'
};

export const loadTickets = () => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Error reading support tickets from localStorage', e);
    return [];
  }
};

export const saveTickets = (tickets) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  } catch (e) {
    console.error('Error saving support tickets to localStorage', e);
  }
};

export const createTicket = ({ role, userId, name, phone, category, message }) => {
  const tickets = loadTickets();
  const now = new Date().toISOString();
  const ticket = {
    id: `ticket_${Date.now()}`,
    role,
    userId,
    name,
    phone,
    category,
    message,
    status: TICKET_STATUS.OPEN,
    createdAt: now,
    updatedAt: now
  };
  tickets.push(ticket);
  saveTickets(tickets);
  return ticket;
};

export const updateTicketStatus = (ticketId, newStatus) => {
  const tickets = loadTickets();
  const updated = tickets.map((t) =>
    t.id === ticketId
      ? {
          ...t,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      : t
  );
  saveTickets(updated);
  return updated;
};



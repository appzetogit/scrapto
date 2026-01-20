/**
 * Scrapper Lead Management Utilities
 * LocalStorage-based helpers to manage scrapper leads from Admin panel.
 *
 * Storage key: "scrapperLeads"
 *
 * Schema:
 * {
 *   id: string,
 *   name: string,
 *   phone: string,
 *   area: string,
 *   vehicleInfo: string,
 *   source: 'admin_manual' | 'campaign' | 'referral' | 'other',
 *   status: 'new' | 'invited' | 'converted' | 'rejected',
 *   notes?: string,
 *   createdAt: string,
 *   updatedAt?: string,
 *   scrapperId?: string
 * }
 */

const LEADS_KEY = 'scrapperLeads';

/**
 * Get all scrapper leads
 */
export const getScrapperLeads = () => {
  try {
    return JSON.parse(localStorage.getItem(LEADS_KEY) || '[]');
  } catch (e) {
    console.error('Failed to parse scrapper leads from localStorage', e);
    return [];
  }
};

/**
 * Save all scrapper leads (internal helper)
 */
const saveScrapperLeads = (leads) => {
  localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
};

/**
 * Create a new scrapper lead
 */
export const createScrapperLead = (leadData) => {
  const leads = getScrapperLeads();

  const newLead = {
    id: `lead_${Date.now()}`,
    name: leadData.name?.trim() || 'Unnamed Scrapper',
    phone: (leadData.phone || '').trim(),
    area: leadData.area?.trim() || '',
    vehicleInfo: leadData.vehicleInfo?.trim() || '',
    source: leadData.source || 'admin_manual',
    status: leadData.status || 'new', // new | invited | converted | rejected
    notes: leadData.notes?.trim() || '',
    scrapperId: leadData.scrapperId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  leads.unshift(newLead);
  saveScrapperLeads(leads);
  return newLead;
};

/**
 * Update an existing scrapper lead
 */
export const updateScrapperLead = (id, updates) => {
  const leads = getScrapperLeads();
  const index = leads.findIndex((lead) => lead.id === id);

  if (index === -1) {
    return null;
  }

  const updatedLead = {
    ...leads[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  leads[index] = updatedLead;
  saveScrapperLeads(leads);
  return updatedLead;
};

/**
 * Delete a scrapper lead
 */
export const deleteScrapperLead = (id) => {
  const leads = getScrapperLeads();
  const filtered = leads.filter((lead) => lead.id !== id);
  saveScrapperLeads(filtered);
  return true;
};

/**
 * Get a single scrapper lead by ID
 */
export const getScrapperLeadById = (id) => {
  const leads = getScrapperLeads();
  return leads.find((lead) => lead.id === id) || null;
};

/**
 * Mark lead status helper
 */
export const updateScrapperLeadStatus = (id, status) => {
  return updateScrapperLead(id, { status });
};

/**
 * Get basic stats for scrapper leads (for header cards)
 */
export const getScrapperLeadStats = () => {
  const leads = getScrapperLeads();
  const total = leads.length;
  const byStatus = leads.reduce(
    (acc, lead) => {
      const key = lead.status || 'new';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    { new: 0, invited: 0, converted: 0, rejected: 0 }
  );

  return {
    total,
    ...byStatus
  };
};

/**
 * Link a lead to a real scrapper account by phone
 * Called after scrapper signup succeeds.
 */
export const linkLeadToScrapper = (phone, scrapperId) => {
  if (!phone) return null;

  const leads = getScrapperLeads();
  const index = leads.findIndex(
    (lead) => lead.phone && lead.phone.toString() === phone.toString()
  );

  if (index === -1) {
    return null;
  }

  const existing = leads[index];
  const updated = {
    ...existing,
    scrapperId,
    status: existing.status === 'rejected' ? existing.status : 'converted',
    updatedAt: new Date().toISOString()
  };

  leads[index] = updated;
  saveScrapperLeads(leads);
  return updated;
};


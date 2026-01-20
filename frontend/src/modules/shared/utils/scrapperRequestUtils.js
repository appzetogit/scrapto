/**
 * Scrapper Request Management Utilities
 * LocalStorage-based helpers to manage multiple active requests for scrappers.
 *
 * Storage key: "scrapperAssignedRequests"
 *
 * Schema for each request:
 * {
 *   id: string,
 *   requestId: string,
 *   userId: string,
 *   userName: string,
 *   userPhone: string,
 *   userEmail?: string,
 *   scrapType: string,
 *   weight?: number,
 *   pickupSlot?: {
 *     dayName: string,
 *     date: string,
 *     slot: string,
 *     timestamp?: number
 *   },
 *   preferredTime?: string,
 *   images: Array,
 *   location: {
 *     address: string,
 *     lat: number,
 *     lng: number
 *   },
 *   distance?: string,
 *   estimatedEarnings: string,
 *   status: 'accepted' | 'picked_up' | 'payment_pending' | 'completed',
 *   acceptedAt: string (ISO),
 *   pickedUpAt?: string (ISO),
 *   paymentStatus?: 'pending' | 'paid',
 *   finalAmount?: string,
 *   paidAmount?: string,
 *   completedAt?: string (ISO),
 *   scrapperId: string,
 *   scrapperName: string
 * }
 */

const REQUESTS_KEY = 'scrapperAssignedRequests';

/**
 * Get all assigned requests for the current scrapper
 */
export const getScrapperAssignedRequests = () => {
  try {
    const scrapperUser = JSON.parse(localStorage.getItem('scrapperUser') || 'null');
    if (!scrapperUser || !scrapperUser.id) {
      return [];
    }
    
    const allRequests = JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
    // Filter requests for current scrapper
    return allRequests.filter(req => req.scrapperId === scrapperUser.id);
  } catch (e) {
    console.error('Failed to parse scrapper assigned requests from localStorage', e);
    return [];
  }
};

/**
 * Get all assigned requests (for admin or cross-scrapper view)
 */
export const getAllAssignedRequests = () => {
  try {
    return JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
  } catch (e) {
    console.error('Failed to parse all assigned requests from localStorage', e);
    return [];
  }
};

/**
 * Save all assigned requests (internal helper)
 */
const saveAssignedRequests = (requests) => {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
};

/**
 * Add a new request to scrapper's assigned requests
 */
export const addScrapperRequest = (requestData) => {
  try {
    const scrapperUser = JSON.parse(localStorage.getItem('scrapperUser') || 'null');
    if (!scrapperUser || !scrapperUser.id) {
      throw new Error('Scrapper not authenticated');
    }

    const allRequests = getAllAssignedRequests();
    
    // Check if request already exists
    const existingIndex = allRequests.findIndex(req => req.id === requestData.id);
    
    const newRequest = {
      ...requestData,
      scrapperId: scrapperUser.id,
      scrapperName: scrapperUser.name || 'Scrapper',
      status: 'accepted',
      acceptedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing request
      allRequests[existingIndex] = { ...allRequests[existingIndex], ...newRequest };
    } else {
      // Add new request
      allRequests.push(newRequest);
    }

    saveAssignedRequests(allRequests);
    
    // Also update userRequests to mark as accepted
    updateUserRequestStatus(requestData.id, 'accepted', scrapperUser.id, scrapperUser.name);
    
    return newRequest;
  } catch (e) {
    console.error('Failed to add scrapper request', e);
    throw e;
  }
};

/**
 * Update a specific request
 */
export const updateScrapperRequest = (requestId, updates) => {
  try {
    const allRequests = getAllAssignedRequests();
    const index = allRequests.findIndex(req => req.id === requestId);
    
    if (index < 0) {
      throw new Error(`Request ${requestId} not found`);
    }

    allRequests[index] = {
      ...allRequests[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    saveAssignedRequests(allRequests);
    return allRequests[index];
  } catch (e) {
    console.error('Failed to update scrapper request', e);
    throw e;
  }
};

/**
 * Remove a request (when completed or cancelled)
 */
export const removeScrapperRequest = (requestId) => {
  try {
    const allRequests = getAllAssignedRequests();
    const filtered = allRequests.filter(req => req.id !== requestId);
    saveAssignedRequests(filtered);
    
    // Also update userRequests status
    updateUserRequestStatus(requestId, 'completed');
    
    return true;
  } catch (e) {
    console.error('Failed to remove scrapper request', e);
    throw e;
  }
};

/**
 * Get a specific request by ID
 */
export const getScrapperRequestById = (requestId) => {
  try {
    const allRequests = getAllAssignedRequests();
    return allRequests.find(req => req.id === requestId) || null;
  } catch (e) {
    console.error('Failed to get scrapper request by ID', e);
    return null;
  }
};

/**
 * Check if a new request conflicts with existing requests based on pickup time
 * Returns true if there's a conflict, false otherwise
 */
export const checkTimeConflict = (newRequest, existingRequests = null) => {
  try {
    const requests = existingRequests || getScrapperAssignedRequests();
    
    // If no pickup slot/time specified, allow it (no conflict)
    if (!newRequest.pickupSlot && !newRequest.preferredTime) {
      return false;
    }

    // Get new request's time window
    const newTimeSlot = newRequest.pickupSlot;
    if (!newTimeSlot) {
      return false; // No specific time, no conflict
    }

    // Parse the slot time (e.g., "9:00 AM - 12:00 PM")
    const parseSlotTime = (slotStr) => {
      const match = slotStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/g);
      if (!match || match.length < 2) return null;
      
      const parseTime = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        let hour24 = hours;
        if (period === 'PM' && hours !== 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;
        return hour24 * 60 + minutes; // Convert to minutes since midnight
      };

      return {
        start: parseTime(match[0]),
        end: parseTime(match[1])
      };
    };

    const newTimeWindow = parseSlotTime(newTimeSlot.slot);
    if (!newTimeWindow) {
      return false; // Can't parse, assume no conflict
    }

    // Check against existing requests
    for (const existingReq of requests) {
      // Skip if request is completed
      if (existingReq.status === 'completed') {
        continue;
      }

      // Check if same date
      if (existingReq.pickupSlot && existingReq.pickupSlot.date === newTimeSlot.date) {
        const existingTimeWindow = parseSlotTime(existingReq.pickupSlot.slot);
        if (existingTimeWindow) {
          // Check for overlap
          const overlaps = !(
            newTimeWindow.end <= existingTimeWindow.start ||
            newTimeWindow.start >= existingTimeWindow.end
          );
          
          if (overlaps) {
            return true; // Conflict found
          }
        }
      }
    }

    return false; // No conflict
  } catch (e) {
    console.error('Failed to check time conflict', e);
    // On error, allow the request (fail open)
    return false;
  }
};

/**
 * Update userRequests to reflect scrapper assignment/status
 */
const updateUserRequestStatus = (requestId, status, scrapperId = null, scrapperName = null) => {
  try {
    const userRequests = JSON.parse(localStorage.getItem('userRequests') || '[]');
    const index = userRequests.findIndex(req => req.id === requestId);
    
    if (index >= 0) {
      userRequests[index].assignmentStatus = status === 'accepted' ? 'assigned' : 
                                            status === 'completed' ? 'completed' : 
                                            userRequests[index].assignmentStatus;
      
      if (scrapperId) {
        userRequests[index].assignedScrapperId = scrapperId;
        userRequests[index].assignedScrapperName = scrapperName;
      }
      
      if (status === 'accepted') {
        userRequests[index].acceptedAt = new Date().toISOString();
      }
      
      if (status === 'completed') {
        userRequests[index].completedAt = new Date().toISOString();
      }

      localStorage.setItem('userRequests', JSON.stringify(userRequests));
    }
  } catch (e) {
    console.error('Failed to update user request status', e);
  }
};

/**
 * Get count of active requests for current scrapper
 */
export const getActiveRequestsCount = () => {
  const requests = getScrapperAssignedRequests();
  return requests.filter(req => req.status !== 'completed').length;
};

/**
 * Migrate old single activeRequest to new array format (one-time migration)
 */
export const migrateOldActiveRequest = () => {
  try {
    const oldRequest = localStorage.getItem('activeRequest');
    if (!oldRequest) {
      return; // Nothing to migrate
    }

    const request = JSON.parse(oldRequest);
    const scrapperUser = JSON.parse(localStorage.getItem('scrapperUser') || 'null');
    
    if (scrapperUser && scrapperUser.id) {
      // Check if already in new format
      const existing = getScrapperRequestById(request.id);
      if (!existing) {
        // Add to new format
        addScrapperRequest({
          ...request,
          scrapperId: scrapperUser.id,
          scrapperName: scrapperUser.name || 'Scrapper'
        });
      }
    }

    // Remove old format
    localStorage.removeItem('activeRequest');
  } catch (e) {
    console.error('Failed to migrate old active request', e);
  }
};


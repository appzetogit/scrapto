/**
 * Referral System Utility Functions
 * Handles referral code generation, validation, and localStorage management
 */

/**
 * Generate a unique referral code
 * Format: USER-XXXXXX or SCRAP-XXXXXX (6 alphanumeric characters)
 */
export const generateReferralCode = (userType = 'user') => {
  const prefix = userType === 'scrapper' ? 'SCRAP' : 'USER';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  // Generate 6 random alphanumeric characters
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return `${prefix}-${code}`;
};

/**
 * Validate referral code format
 */
export const isValidReferralCodeFormat = (code) => {
  if (!code || typeof code !== 'string') return false;
  const pattern = /^(USER|SCRAP)-[A-Z0-9]{6}$/;
  return pattern.test(code.toUpperCase());
};

/**
 * Get or generate referral code for a user/scrapper
 */
export const getOrGenerateReferralCode = (userId, userType = 'user') => {
  const storageKey = userType === 'scrapper' 
    ? 'scrapperReferralCode' 
    : 'userReferralCode';
  
  const codeMapKey = userType === 'scrapper'
    ? 'scrapperReferralCodes'
    : 'userReferralCodes';
  
  // Check if user already has a code
  const existingCode = localStorage.getItem(storageKey);
  if (existingCode) {
    return existingCode;
  }
  
  // Generate new code
  let code = generateReferralCode(userType);
  
  // Ensure uniqueness (check against existing codes)
  const existingCodes = JSON.parse(localStorage.getItem(codeMapKey) || '{}');
  let attempts = 0;
  while (existingCodes[code] && attempts < 10) {
    code = generateReferralCode(userType);
    attempts++;
  }
  
  // Store the code
  localStorage.setItem(storageKey, code);
  existingCodes[code] = {
    userId,
    userType,
    createdAt: new Date().toISOString(),
    totalReferrals: 0,
    totalEarnings: 0
  };
  localStorage.setItem(codeMapKey, JSON.stringify(existingCodes));
  
  return code;
};

/**
 * Validate referral code and get referrer info
 */
export const validateReferralCode = (code) => {
  if (!isValidReferralCodeFormat(code)) {
    return { valid: false, error: 'Invalid code format' };
  }
  
  const upperCode = code.toUpperCase();
  const codeType = upperCode.startsWith('USER') ? 'user' : 'scrapper';
  const codeMapKey = codeType === 'scrapper'
    ? 'scrapperReferralCodes'
    : 'userReferralCodes';
  
  const existingCodes = JSON.parse(localStorage.getItem(codeMapKey) || '{}');
  const codeData = existingCodes[upperCode];
  
  if (!codeData) {
    return { valid: false, error: 'Referral code not found' };
  }
  
  // Check if referrer is blocked (if user data exists)
  const userKey = codeType === 'scrapper' ? 'scrapperUser' : 'user';
  const userData = localStorage.getItem(userKey);
  if (userData) {
    const user = JSON.parse(userData);
    if (user.status === 'blocked') {
      return { valid: false, error: 'Referrer account is blocked' };
    }
  }
  
  return {
    valid: true,
    referrerId: codeData.userId,
    referrerType: codeType,
    code: upperCode
  };
};

/**
 * Create a referral relationship
 */
export const createReferral = (referrerCode, refereeId, refereeType) => {
  const validation = validateReferralCode(referrerCode);
  
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  
  // Prevent self-referral
  const refereeUserKey = refereeType === 'scrapper' ? 'scrapperUser' : 'user';
  const refereeUser = JSON.parse(localStorage.getItem(refereeUserKey) || '{}');
  if (refereeUser.phone === validation.referrerId) {
    return { success: false, error: 'Cannot refer yourself' };
  }
  
  // Check if this phone number was already referred
  const referralsKey = 'referrals';
  const allReferrals = JSON.parse(localStorage.getItem(referralsKey) || '[]');
  const existingReferral = allReferrals.find(
    ref => ref.refereeId === refereeId && ref.refereeType === refereeType
  );
  
  if (existingReferral) {
    return { success: false, error: 'This account was already referred' };
  }
  
  // Check for cross-referral (user referring scrapper or vice versa)
  const isCrossReferral = validation.referrerType !== refereeType;
  
  // Create referral record
  const referral = {
    id: `ref_${Date.now()}`,
    referrerCode: validation.code,
    referrerId: validation.referrerId,
    referrerType: validation.referrerType,
    refereeId,
    refereeType,
    isCrossReferral,
    status: 'active',
    createdAt: new Date().toISOString(),
    rewards: {
      referrerRewards: [],
      refereeRewards: []
    },
    milestones: {
      refereeRegistered: true,
      refereeFirstRequest: false,
      refereeFirstCompletion: false,
      refereeKYCVerified: false,
      refereeSubscribed: false,
      refereeFirstPickup: false
    },
    fraudFlags: [],
    deviceInfo: navigator.userAgent,
    ipAddress: null // Would be set by backend
  };
  
  allReferrals.push(referral);
  localStorage.setItem(referralsKey, JSON.stringify(allReferrals));
  
  // Update referrer's code stats
  const codeMapKey = validation.referrerType === 'scrapper'
    ? 'scrapperReferralCodes'
    : 'userReferralCodes';
  const codes = JSON.parse(localStorage.getItem(codeMapKey) || '{}');
  if (codes[validation.code]) {
    codes[validation.code].totalReferrals = (codes[validation.code].totalReferrals || 0) + 1;
    localStorage.setItem(codeMapKey, JSON.stringify(codes));
  }
  
  return { success: true, referral };
};

/**
 * Get referral settings (admin configurable)
 */
export const getReferralSettings = () => {
  const defaultSettings = {
    enabled: true,
    allowCrossReferrals: true,
    userRewards: {
      signupBonus: 50,      // Referrer gets ₹50 when referee signs up
      refereeWelcomeBonus: 100  // Referee gets ₹100 welcome bonus
    },
    scrapperRewards: {
      signupBonus: 100,     // Referrer gets ₹100 when referee signs up
      refereeWelcomeBonus: 200  // Referee gets ₹200 welcome bonus
    },
    crossReferralRewards: {
      userToScrapper: {
        referrerBonus: 150,  // User gets ₹150 when referred scrapper signs up
        refereeWelcomeBonus: 200  // Scrapper gets ₹200 welcome bonus
      },
      scrapperToUser: {
        referrerBonus: 75,   // Scrapper gets ₹75 when referred user signs up
        refereeWelcomeBonus: 100  // User gets ₹100 welcome bonus
      }
    }
  };
  
  const stored = localStorage.getItem('referralSettings');
  if (stored) {
    const parsed = JSON.parse(stored);
    // Merge with defaults to ensure all fields exist
    return {
      ...defaultSettings,
      ...parsed,
      crossReferralRewards: {
        ...defaultSettings.crossReferralRewards,
        ...(parsed.crossReferralRewards || {})
      }
    };
  }
  return defaultSettings;
};

/**
 * Update referral settings (admin only)
 */
export const updateReferralSettings = (settings) => {
  localStorage.setItem('referralSettings', JSON.stringify(settings));
};

/**
 * Process signup bonus rewards
 */
export const processSignupBonus = (referralId) => {
  const referralsKey = 'referrals';
  const allReferrals = JSON.parse(localStorage.getItem(referralsKey) || '[]');
  const referral = allReferrals.find(ref => ref.id === referralId);
  
  if (!referral) {
    return { success: false, error: 'Referral not found' };
  }
  
  const settings = getReferralSettings();
  
  if (!settings.enabled) {
    return { success: false, error: 'Referral system is disabled' };
  }
  
  // Get reward amounts based on referral type (cross-referral or same type)
  let rewards;
  if (referral.isCrossReferral) {
    if (referral.referrerType === 'user' && referral.refereeType === 'scrapper') {
      rewards = {
        signupBonus: settings.crossReferralRewards.userToScrapper.referrerBonus,
        refereeWelcomeBonus: settings.crossReferralRewards.userToScrapper.refereeWelcomeBonus
      };
    } else {
      rewards = {
        signupBonus: settings.crossReferralRewards.scrapperToUser.referrerBonus,
        refereeWelcomeBonus: settings.crossReferralRewards.scrapperToUser.refereeWelcomeBonus
      };
    }
  } else {
    rewards = referral.referrerType === 'scrapper'
      ? settings.scrapperRewards
      : settings.userRewards;
  }
  
  // Credit referrer reward
  const referrerReward = {
    type: 'signup_bonus',
    amount: rewards.signupBonus,
    status: 'credited',
    creditedAt: new Date().toISOString()
  };
  
  referral.rewards.referrerRewards.push(referrerReward);
  
  // Credit referee welcome bonus
  const refereeReward = {
    type: 'welcome_bonus',
    amount: rewards.refereeWelcomeBonus,
    status: 'credited',
    creditedAt: new Date().toISOString()
  };
  
  referral.rewards.refereeRewards.push(refereeReward);
  
  // Apply tier bonus if applicable
  const tierBonus = applyTierBonus(rewards.signupBonus, referral.referrerId, referral.referrerType);
  const finalAmount = tierBonus.totalAmount;
  
  // Update wallet/earnings with tier bonus
  if (referral.referrerType === 'user') {
    // Credit to user wallet
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.walletBalance = (user.walletBalance || 0) + finalAmount;
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    // Credit to scrapper earnings
    const earnings = JSON.parse(localStorage.getItem('scrapperEarnings') || '{"total": 0}');
    earnings.total = (earnings.total || 0) + finalAmount;
    localStorage.setItem('scrapperEarnings', JSON.stringify(earnings));
  }
  
  // Update reward amount to include tier bonus
  referrerReward.amount = finalAmount;
  referrerReward.tierBonus = tierBonus.bonusAmount;
  referrerReward.tier = tierBonus.tier;
  
  // Credit referee welcome bonus
  if (referral.refereeType === 'user') {
    const refereeUser = JSON.parse(localStorage.getItem('user') || '{}');
    refereeUser.walletBalance = (refereeUser.walletBalance || 0) + rewards.refereeWelcomeBonus;
    localStorage.setItem('user', JSON.stringify(refereeUser));
  } else {
    const refereeEarnings = JSON.parse(localStorage.getItem('scrapperEarnings') || '{"total": 0}');
    refereeEarnings.total = (refereeEarnings.total || 0) + rewards.refereeWelcomeBonus;
    localStorage.setItem('scrapperEarnings', JSON.stringify(refereeEarnings));
  }
  
  // Save updated referral
  const index = allReferrals.findIndex(ref => ref.id === referralId);
  allReferrals[index] = referral;
  localStorage.setItem(referralsKey, JSON.stringify(allReferrals));
  
  // Update referrer code earnings
  const codeMapKey = referral.referrerType === 'scrapper'
    ? 'scrapperReferralCodes'
    : 'userReferralCodes';
  const codes = JSON.parse(localStorage.getItem(codeMapKey) || '{}');
  if (codes[referral.referrerCode]) {
    codes[referral.referrerCode].totalEarnings = 
      (codes[referral.referrerCode].totalEarnings || 0) + finalAmount;
    
    // Update tier
    const stats = getUserReferralStats(referral.referrerId, referral.referrerType);
    codes[referral.referrerCode].tier = calculateTier(stats.totalReferrals);
    
    localStorage.setItem(codeMapKey, JSON.stringify(codes));
    
    // Check for tier upgrade
    checkTierUpgrade(referral.referrerId, referral.referrerType);
  }
  
  return { success: true, referral };
};

/**
 * Get user's referral statistics
 */
export const getUserReferralStats = (userId, userType = 'user') => {
  const referralsKey = 'referrals';
  const allReferrals = JSON.parse(localStorage.getItem(referralsKey) || '[]');
  
  const userReferrals = allReferrals.filter(
    ref => ref.referrerId === userId && ref.referrerType === userType
  );
  
  const totalReferrals = userReferrals.length;
  const totalEarnings = userReferrals.reduce((sum, ref) => {
    const referrerRewards = ref.rewards?.referrerRewards || [];
    return sum + referrerRewards.reduce((s, r) => s + (r.amount || 0), 0);
  }, 0);
  
  const code = userType === 'scrapper'
    ? localStorage.getItem('scrapperReferralCode')
    : localStorage.getItem('userReferralCode');
  
  return {
    code: code || getOrGenerateReferralCode(userId, userType),
    totalReferrals,
    totalEarnings,
    referrals: userReferrals
  };
};

/**
 * Get all referrals (for admin)
 */
export const getAllReferrals = () => {
  const referralsKey = 'referrals';
  return JSON.parse(localStorage.getItem(referralsKey) || '[]');
};

/**
 * Filter referrals by time period
 * period: 'all' | 'today' | 'week' | 'month'
 */
const filterReferralsByPeriod = (referrals, period = 'all') => {
  if (period === 'all') return referrals;

  const now = new Date();
  return referrals.filter((ref) => {
    if (!ref.createdAt) return false;
    const created = new Date(ref.createdAt);

    if (period === 'today') {
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
      );
    }

    if (period === 'week') {
      const diffMs = now.getTime() - created.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }

    if (period === 'month') {
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth()
      );
    }

    return true;
  });
};

/**
 * Get high-level referral analytics for admin dashboard
 * period: 'all' | 'today' | 'week' | 'month'
 */
export const getReferralAnalytics = (period = 'all') => {
  const allReferrals = getAllReferrals();
  const scoped = filterReferralsByPeriod(allReferrals, period);

  const totalReferrals = scoped.length;
  const activeReferrals = scoped.filter((r) => r.status === 'active').length;

  let totalRewardsPaid = 0;
  scoped.forEach((ref) => {
    const referrerRewards = ref.rewards?.referrerRewards || [];
    const refereeRewards = ref.rewards?.refereeRewards || [];
    totalRewardsPaid += referrerRewards.reduce((s, r) => s + (r.amount || 0), 0);
    totalRewardsPaid += refereeRewards.reduce((s, r) => s + (r.amount || 0), 0);
  });

  const userReferrals = scoped.filter((r) => r.referrerType === 'user').length;
  const scrapperReferrals = scoped.filter((r) => r.referrerType === 'scrapper').length;
  const crossReferrals = scoped.filter((r) => r.isCrossReferral).length;

  // Treat referrals that have at least one credited reward as "converted"
  const convertedCount = scoped.filter((ref) => {
    const referrerRewards = ref.rewards?.referrerRewards || [];
    const refereeRewards = ref.rewards?.refereeRewards || [];
    const allRewards = [...referrerRewards, ...refereeRewards];
    return allRewards.some((r) => r.status === 'credited');
  }).length;

  const conversionRate =
    totalReferrals > 0 ? Number(((convertedCount / totalReferrals) * 100).toFixed(1)) : 0;

  return {
    totalReferrals,
    activeReferrals,
    totalRewardsPaid,
    conversionRate,
    userReferrals,
    scrapperReferrals,
    crossReferrals
  };
};

/**
 * Get top referrers (users or scrappers) by total referrals and earnings
 * type: 'user' | 'scrapper'
 * period: 'all' | 'today' | 'week' | 'month'
 */
export const getTopReferrers = (limit = 10, type = 'user', period = 'all') => {
  const allReferrals = getAllReferrals();
  const scoped = filterReferralsByPeriod(
    allReferrals.filter((r) => r.referrerType === type),
    period
  );

  const map = {};

  scoped.forEach((ref) => {
    const id = ref.referrerId;
    if (!map[id]) {
      map[id] = {
        referrerId: id,
        referrerType: ref.referrerType,
        totalReferrals: 0,
        totalEarnings: 0
      };
    }

    map[id].totalReferrals += 1;

    const referrerRewards = ref.rewards?.referrerRewards || [];
    map[id].totalEarnings += referrerRewards.reduce((s, r) => s + (r.amount || 0), 0);
  });

  return Object.values(map)
    .sort((a, b) => {
      if (b.totalReferrals !== a.totalReferrals) {
        return b.totalReferrals - a.totalReferrals;
      }
      return b.totalEarnings - a.totalEarnings;
    })
    .slice(0, limit);
};

/**
 * Get all referrals that have fraud flags (for admin fraud detection view)
 */
export const getFlaggedReferrals = () => {
  const allReferrals = getAllReferrals();
  return allReferrals.filter(
    (ref) => Array.isArray(ref.fraudFlags) && ref.fraudFlags.length > 0
  );
};

/**
 * Get referral by ID
 */
export const getReferralById = (referralId) => {
  const allReferrals = getAllReferrals();
  return allReferrals.find(ref => ref.id === referralId);
};

/**
 * Approve a flagged referral (admin)
 * - Sets status back to 'active'
 * - Optionally clears fraud flags (we keep them for audit but mark resolved)
 */
export const approveFlaggedReferral = (referralId) => {
  const referralsKey = 'referrals';
  const allReferrals = JSON.parse(localStorage.getItem(referralsKey) || '[]');
  const idx = allReferrals.findIndex((ref) => ref.id === referralId);

  if (idx === -1) {
    return { success: false, error: 'Referral not found' };
  }

  const referral = allReferrals[idx];
  referral.status = 'active';

  if (Array.isArray(referral.fraudFlags) && referral.fraudFlags.length > 0) {
    referral.fraudFlags = referral.fraudFlags.map((flag) => ({
      ...flag,
      resolved: true,
      resolvedAt: new Date().toISOString()
    }));
  }

  allReferrals[idx] = referral;
  localStorage.setItem(referralsKey, JSON.stringify(allReferrals));
  return { success: true, referral };
};

/**
 * Reject / block a flagged referral (admin)
 * - Marks status as 'rejected'
 * - Adds a manual fraud flag with provided reason
 */
export const rejectFlaggedReferral = (referralId, reason) => {
  const referralsKey = 'referrals';
  const allReferrals = JSON.parse(localStorage.getItem(referralsKey) || '[]');
  const idx = allReferrals.findIndex((ref) => ref.id === referralId);

  if (idx === -1) {
    return { success: false, error: 'Referral not found' };
  }

  const referral = allReferrals[idx];
  referral.status = 'rejected';

  if (!Array.isArray(referral.fraudFlags)) {
    referral.fraudFlags = [];
  }

  referral.fraudFlags.push({
    type: 'manual_rejection',
    severity: 'high',
    message: reason || 'Manually rejected by admin',
    createdAt: new Date().toISOString()
  });

  allReferrals[idx] = referral;
  localStorage.setItem(referralsKey, JSON.stringify(allReferrals));
  return { success: true, referral };
};

/**
 * Get milestone reward settings (admin configurable)
 */
export const getMilestoneRewards = () => {
  const defaultMilestones = {
    user: {
      firstRequest: { referrer: 100, referee: 50, enabled: true },
      firstCompletion: { referrer: 150, referee: 0, enabled: true }
    },
    scrapper: {
      kycVerified: { referrer: 200, referee: 100, enabled: true },
      subscription: { referrer: 300, referee: 0, enabled: true }, // 20% discount for referee
      firstPickup: { referrer: 200, referee: 0, enabled: true }
    }
  };
  
  const stored = localStorage.getItem('milestoneRewards');
  return stored ? JSON.parse(stored) : defaultMilestones;
};

/**
 * Update milestone reward settings (admin only)
 */
export const updateMilestoneRewards = (milestones) => {
  localStorage.setItem('milestoneRewards', JSON.stringify(milestones));
};

/**
 * Process milestone reward
 */
export const processMilestoneReward = (referralId, milestoneType) => {
  const referralsKey = 'referrals';
  const allReferrals = JSON.parse(localStorage.getItem(referralsKey) || '[]');
  const referral = allReferrals.find(ref => ref.id === referralId);
  
  if (!referral) {
    return { success: false, error: 'Referral not found' };
  }
  
  const settings = getReferralSettings();
  if (!settings.enabled) {
    return { success: false, error: 'Referral system is disabled' };
  }
  
  const milestones = getMilestoneRewards();
  const refereeType = referral.refereeType;
  const milestoneConfig = milestones[refereeType]?.[milestoneType];
  
  if (!milestoneConfig || !milestoneConfig.enabled) {
    return { success: false, error: 'Milestone not configured or disabled' };
  }
  
  // Check if milestone already processed
  const existingReward = referral.rewards?.referrerRewards?.find(
    r => r.type === milestoneType && r.status === 'credited'
  );
  
  if (existingReward) {
    return { success: false, error: 'Milestone already processed' };
  }
  
  // Update milestone status
  if (!referral.milestones) {
    referral.milestones = {};
  }
  referral.milestones[milestoneType] = true;
  
  // Credit referrer reward
  if (milestoneConfig.referrer > 0) {
    const referrerReward = {
      type: milestoneType,
      amount: milestoneConfig.referrer,
      status: 'credited',
      creditedAt: new Date().toISOString()
    };
    
    if (!referral.rewards) {
      referral.rewards = { referrerRewards: [], refereeRewards: [] };
    }
    if (!referral.rewards.referrerRewards) {
      referral.rewards.referrerRewards = [];
    }
    // Apply tier bonus if applicable
    const tierBonus = applyTierBonus(milestoneConfig.referrer, referral.referrerId, referral.referrerType);
    const finalAmount = tierBonus.totalAmount;
    
    // Update reward amount to include tier bonus
    referrerReward.amount = finalAmount;
    referrerReward.tierBonus = tierBonus.bonusAmount;
    referrerReward.tier = tierBonus.tier;
    
    referral.rewards.referrerRewards.push(referrerReward);
    
    // Update wallet/earnings with tier bonus included
    if (referral.referrerType === 'user') {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.walletBalance = (user.walletBalance || 0) + finalAmount;
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      const earnings = JSON.parse(localStorage.getItem('scrapperEarnings') || '{"total": 0}');
      earnings.total = (earnings.total || 0) + finalAmount;
      localStorage.setItem('scrapperEarnings', JSON.stringify(earnings));
    }
    
    // Update referrer code earnings
    const codeMapKey = referral.referrerType === 'scrapper'
      ? 'scrapperReferralCodes'
      : 'userReferralCodes';
    const codes = JSON.parse(localStorage.getItem(codeMapKey) || '{}');
    if (codes[referral.referrerCode]) {
      codes[referral.referrerCode].totalEarnings = 
        (codes[referral.referrerCode].totalEarnings || 0) + finalAmount;
      
      // Update tier
      const stats = getUserReferralStats(referral.referrerId, referral.referrerType);
      codes[referral.referrerCode].tier = calculateTier(stats.totalReferrals);
      
      localStorage.setItem(codeMapKey, JSON.stringify(codes));
      
      // Check for tier upgrade
      checkTierUpgrade(referral.referrerId, referral.referrerType);
    }
  }
  
  // Credit referee reward
  if (milestoneConfig.referee > 0) {
    const refereeReward = {
      type: `${milestoneType}_bonus`,
      amount: milestoneConfig.referee,
      status: 'credited',
      creditedAt: new Date().toISOString()
    };
    
    if (!referral.rewards.refereeRewards) {
      referral.rewards.refereeRewards = [];
    }
    referral.rewards.refereeRewards.push(refereeReward);
    
    // Update referee wallet/earnings
    if (referral.refereeType === 'user') {
      const refereeUser = JSON.parse(localStorage.getItem('user') || '{}');
      refereeUser.walletBalance = (refereeUser.walletBalance || 0) + milestoneConfig.referee;
      localStorage.setItem('user', JSON.stringify(refereeUser));
    } else {
      const refereeEarnings = JSON.parse(localStorage.getItem('scrapperEarnings') || '{"total": 0}');
      refereeEarnings.total = (refereeEarnings.total || 0) + milestoneConfig.referee;
      localStorage.setItem('scrapperEarnings', JSON.stringify(refereeEarnings));
    }
  }
  
  // Save updated referral
  const index = allReferrals.findIndex(ref => ref.id === referralId);
  allReferrals[index] = referral;
  localStorage.setItem(referralsKey, JSON.stringify(allReferrals));
  
  // Create notification
  createNotification(referral.referrerId, referral.referrerType, {
    type: 'milestone_reward',
    milestone: milestoneType,
    amount: milestoneConfig.referrer,
    referralId: referral.id
  });
  
  return { success: true, referral };
};

/**
 * Check and process milestone for a user/scrapper
 */
export const checkAndProcessMilestone = (userId, userType, milestoneType) => {
  const referralsKey = 'referrals';
  const allReferrals = JSON.parse(localStorage.getItem(referralsKey) || '[]');
  
  // Find referral where this user is the referee
  const referral = allReferrals.find(
    ref => ref.refereeId === userId && ref.refereeType === userType && ref.status === 'active'
  );
  
  if (!referral) {
    return { success: false, error: 'No active referral found' };
  }
  
  // Check if milestone already completed
  if (referral.milestones?.[milestoneType]) {
    return { success: false, error: 'Milestone already completed' };
  }
  
  return processMilestoneReward(referral.id, milestoneType);
};

/**
 * Create notification
 */
export const createNotification = (userId, userType, notificationData) => {
  const notificationsKey = userType === 'scrapper' 
    ? 'scrapperNotifications' 
    : 'userNotifications';
  
  const notifications = JSON.parse(localStorage.getItem(notificationsKey) || '[]');
  
  const notification = {
    id: `notif_${Date.now()}`,
    userId,
    userType,
    type: notificationData.type,
    title: getNotificationTitle(notificationData.type, notificationData),
    message: getNotificationMessage(notificationData.type, notificationData),
    data: notificationData,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  notifications.unshift(notification);
  // Keep only last 50 notifications
  if (notifications.length > 50) {
    notifications.splice(50);
  }
  
  localStorage.setItem(notificationsKey, JSON.stringify(notifications));
  return notification;
};

/**
 * Get notification title
 */
const getNotificationTitle = (type, data) => {
  const titles = {
    milestone_reward: '🎉 Milestone Reward Earned!',
    signup_bonus: '💰 Referral Bonus Received',
    welcome_bonus: '🎁 Welcome Bonus!',
    tier_upgrade: '🏆 Tier Upgraded!',
    tier_bonus: '💎 Monthly Tier Bonus!'
  };
  return titles[type] || 'New Notification';
};

/**
 * Get notification message
 */
const getNotificationMessage = (type, data) => {
  if (type === 'milestone_reward') {
    const milestoneNames = {
      firstRequest: 'First Request',
      firstCompletion: 'First Completion',
      kycVerified: 'KYC Verified',
      subscription: 'Subscription',
      firstPickup: 'First Pickup'
    };
    return `You earned ₹${data.amount} for ${milestoneNames[data.milestone] || data.milestone} milestone!`;
  }
  if (type === 'signup_bonus') {
    return `You earned ₹${data.amount} referral bonus!`;
  }
  if (type === 'welcome_bonus') {
    return `Welcome bonus of ₹${data.amount} credited to your account!`;
  }
  if (type === 'tier_upgrade') {
    return `Congratulations! You've been upgraded to ${data.tierName} tier!`;
  }
  if (type === 'tier_bonus') {
    return `Monthly tier bonus of ₹${data.amount} credited!`;
  }
  return 'You have a new notification';
};

/**
 * Get notifications for user/scrapper
 */
export const getNotifications = (userId, userType) => {
  const notificationsKey = userType === 'scrapper' 
    ? 'scrapperNotifications' 
    : 'userNotifications';
  
  const notifications = JSON.parse(localStorage.getItem(notificationsKey) || '[]');
  return notifications.filter(n => n.userId === userId);
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = (notificationId, userType) => {
  const notificationsKey = userType === 'scrapper' 
    ? 'scrapperNotifications' 
    : 'userNotifications';
  
  const notifications = JSON.parse(localStorage.getItem(notificationsKey) || '[]');
  const notification = notifications.find(n => n.id === notificationId);
  if (notification) {
    notification.read = true;
    localStorage.setItem(notificationsKey, JSON.stringify(notifications));
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = (userId, userType) => {
  const notifications = getNotifications(userId, userType);
  return notifications.filter(n => !n.read).length;
};

/**
 * Get tier configuration (admin configurable)
 */
export const getTierConfig = () => {
  const defaultTiers = {
    bronze: { minReferrals: 0, bonusPercent: 0, monthlyBonus: 0, name: 'Bronze', color: '#cd7f32' },
    silver: { minReferrals: 5, bonusPercent: 5, monthlyBonus: 100, name: 'Silver', color: '#c0c0c0' },
    gold: { minReferrals: 15, bonusPercent: 10, monthlyBonus: 300, name: 'Gold', color: '#ffd700' },
    platinum: { minReferrals: 30, bonusPercent: 15, monthlyBonus: 500, name: 'Platinum', color: '#e5e4e2' }
  };
  
  const stored = localStorage.getItem('tierConfig');
  return stored ? JSON.parse(stored) : defaultTiers;
};

/**
 * Update tier configuration (admin only)
 */
export const updateTierConfig = (tiers) => {
  localStorage.setItem('tierConfig', JSON.stringify(tiers));
};

/**
 * Calculate user's tier based on total referrals
 */
export const calculateTier = (totalReferrals) => {
  const tiers = getTierConfig();
  
  if (totalReferrals >= tiers.platinum.minReferrals) {
    return 'platinum';
  } else if (totalReferrals >= tiers.gold.minReferrals) {
    return 'gold';
  } else if (totalReferrals >= tiers.silver.minReferrals) {
    return 'silver';
  } else {
    return 'bronze';
  }
};

/**
 * Get tier info for a user/scrapper
 */
export const getUserTier = (userId, userType = 'user') => {
  const stats = getUserReferralStats(userId, userType);
  const tier = calculateTier(stats.totalReferrals);
  const tiers = getTierConfig();
  const tierInfo = tiers[tier];
  
  // Calculate progress to next tier
  let nextTier = null;
  let referralsNeeded = 0;
  
  if (tier === 'bronze') {
    nextTier = tiers.silver;
    referralsNeeded = tiers.silver.minReferrals - stats.totalReferrals;
  } else if (tier === 'silver') {
    nextTier = tiers.gold;
    referralsNeeded = tiers.gold.minReferrals - stats.totalReferrals;
  } else if (tier === 'gold') {
    nextTier = tiers.platinum;
    referralsNeeded = tiers.platinum.minReferrals - stats.totalReferrals;
  }
  
  return {
    current: tier,
    name: tierInfo.name,
    color: tierInfo.color,
    bonusPercent: tierInfo.bonusPercent,
    monthlyBonus: tierInfo.monthlyBonus,
    totalReferrals: stats.totalReferrals,
    nextTier: nextTier ? {
      name: nextTier.name,
      minReferrals: nextTier.minReferrals,
      referralsNeeded
    } : null
  };
};

/**
 * Apply tier bonus to a reward amount
 */
export const applyTierBonus = (baseAmount, userId, userType) => {
  const tierInfo = getUserTier(userId, userType);
  const bonusAmount = (baseAmount * tierInfo.bonusPercent) / 100;
  return {
    baseAmount,
    bonusAmount,
    totalAmount: baseAmount + bonusAmount,
    tier: tierInfo.current,
    bonusPercent: tierInfo.bonusPercent
  };
};

/**
 * Process monthly tier bonus
 */
export const processMonthlyTierBonus = (userId, userType) => {
  const tierInfo = getUserTier(userId, userType);
  
  if (tierInfo.monthlyBonus <= 0) {
    return { success: false, error: 'No monthly bonus for current tier' };
  }
  
  // Check if already processed this month
  const lastBonusKey = userType === 'scrapper' 
    ? 'scrapperLastTierBonus'
    : 'userLastTierBonus';
  const lastBonus = localStorage.getItem(lastBonusKey);
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${now.getMonth()}`;
  
  if (lastBonus === currentMonth) {
    return { success: false, error: 'Monthly bonus already processed this month' };
  }
  
  // Credit monthly bonus
  if (userType === 'user') {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.walletBalance = (user.walletBalance || 0) + tierInfo.monthlyBonus;
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    const earnings = JSON.parse(localStorage.getItem('scrapperEarnings') || '{"total": 0}');
    earnings.total = (earnings.total || 0) + tierInfo.monthlyBonus;
    localStorage.setItem('scrapperEarnings', JSON.stringify(earnings));
  }
  
  localStorage.setItem(lastBonusKey, currentMonth);
  
  // Create notification
  createNotification(userId, userType, {
    type: 'tier_bonus',
    tier: tierInfo.current,
    amount: tierInfo.monthlyBonus
  });
  
  return { success: true, amount: tierInfo.monthlyBonus, tier: tierInfo.current };
};

/**
 * Check and process tier upgrade
 */
export const checkTierUpgrade = (userId, userType) => {
  const tierInfo = getUserTier(userId, userType);
  const codeMapKey = userType === 'scrapper'
    ? 'scrapperReferralCodes'
    : 'userReferralCodes';
  const codes = JSON.parse(localStorage.getItem(codeMapKey) || '{}');
  const userCode = userType === 'scrapper'
    ? localStorage.getItem('scrapperReferralCode')
    : localStorage.getItem('userReferralCode');
  
  if (userCode && codes[userCode]) {
    const oldTier = codes[userCode].tier || 'bronze';
    codes[userCode].tier = tierInfo.current;
    localStorage.setItem(codeMapKey, JSON.stringify(codes));
    
    // If tier upgraded, create notification
    const tierOrder = { bronze: 0, silver: 1, gold: 2, platinum: 3 };
    if (tierOrder[tierInfo.current] > tierOrder[oldTier]) {
      createNotification(userId, userType, {
        type: 'tier_upgrade',
        oldTier,
        newTier: tierInfo.current,
        tierName: tierInfo.name
      });
      
      return { upgraded: true, oldTier, newTier: tierInfo.current };
    }
  }
  
  return { upgraded: false };
};

/**
 * Check fraud patterns (stub for future use)
 * For now, this function simply returns current flagged referrals.
 * In a real backend, this would run heuristics / risk engine.
 */
export const checkFraudPatterns = () => {
  return getFlaggedReferrals();
};

/**
 * Referral Campaign Management
 * LocalStorage-based, admin-configurable campaigns that can adjust rewards
 */

const CAMPAIGNS_KEY = 'referralCampaigns';

export const getCampaigns = () => {
  try {
    return JSON.parse(localStorage.getItem(CAMPAIGNS_KEY) || '[]');
  } catch (e) {
    console.error('Failed to parse referral campaigns from localStorage', e);
    return [];
  }
};

export const createCampaign = (campaignData) => {
  const campaigns = getCampaigns();

  const campaign = {
    id: `campaign_${Date.now()}`,
    name: campaignData.name?.trim() || 'Untitled Campaign',
    description: campaignData.description?.trim() || '',
    startDate: campaignData.startDate || new Date().toISOString(),
    endDate: campaignData.endDate || null,
    targetAudience: campaignData.targetAudience || 'both', // user | scrapper | both
    customRewards: {
      signupBonus: campaignData.customRewards?.signupBonus || 0,
      refereeWelcomeBonus: campaignData.customRewards?.refereeWelcomeBonus || 0
    },
    status: campaignData.status || 'active',
    totalReferrals: 0,
    totalRewardsPaid: 0,
    createdAt: new Date().toISOString()
  };

  campaigns.push(campaign);
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));

  return { success: true, campaign };
};

export const updateCampaign = (campaignId, updates) => {
  const campaigns = getCampaigns();
  const index = campaigns.findIndex((c) => c.id === campaignId);

  if (index === -1) {
    return { success: false, error: 'Campaign not found' };
  }

  const updated = {
    ...campaigns[index],
    ...updates,
    // do not allow id overwrite
    id: campaigns[index].id
  };

  campaigns[index] = updated;
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));

  return { success: true, campaign: updated };
};

export const deleteCampaign = (campaignId) => {
  const campaigns = getCampaigns();
  const filtered = campaigns.filter((c) => c.id !== campaignId);
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(filtered));
  return { success: true };
};


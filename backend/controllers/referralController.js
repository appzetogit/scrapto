import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import ReferralSetting from '../models/ReferralSetting.js';
import ReferralTier from '../models/ReferralTier.js';
import ReferralMilestone from '../models/ReferralMilestone.js';
import ReferralCampaign from '../models/ReferralCampaign.js';
import Referral from '../models/Referral.js';
import logger from '../utils/logger.js';

// ==========================================
// SETTINGS
// ==========================================

export const getSettings = asyncHandler(async (req, res) => {
    try {
        let settings = await ReferralSetting.findOne();
        if (!settings) {
            settings = await ReferralSetting.create({}); // Create default if missing
        }
        sendSuccess(res, 'Referral settings retrieved', { settings });
    } catch (error) {
        logger.error('Error fetching referral settings:', error);
        sendError(res, 'Failed to fetch settings', 500);
    }
});

export const updateSettings = asyncHandler(async (req, res) => {
    try {
        let settings = await ReferralSetting.findOne();
        if (!settings) {
            settings = new ReferralSetting(req.body);
        } else {
            Object.assign(settings, req.body);
        }
        await settings.save();
        sendSuccess(res, 'Referral settings updated', { settings });
    } catch (error) {
        logger.error('Error updating referral settings:', error);
        sendError(res, 'Failed to update settings', 500);
    }
});

// ==========================================
// TIERS
// ==========================================

export const getAllTiers = asyncHandler(async (req, res) => {
    try {
        const tiers = await ReferralTier.find().sort({ minReferrals: 1 });
        sendSuccess(res, 'Referral tiers retrieved', { tiers });
    } catch (error) {
        sendError(res, 'Failed to fetch tiers', 500);
    }
});

export const createTier = asyncHandler(async (req, res) => {
    try {
        const tier = await ReferralTier.create(req.body);
        sendSuccess(res, 'Referral tier created', { tier });
    } catch (error) {
        sendError(res, 'Failed to create tier', 500);
    }
});

export const updateTier = asyncHandler(async (req, res) => {
    try {
        const tier = await ReferralTier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        sendSuccess(res, 'Referral tier updated', { tier });
    } catch (error) {
        sendError(res, 'Failed to update tier', 500);
    }
});

export const deleteTier = asyncHandler(async (req, res) => {
    try {
        await ReferralTier.findByIdAndDelete(req.params.id);
        sendSuccess(res, 'Referral tier deleted', {});
    } catch (error) {
        sendError(res, 'Failed to delete tier', 500);
    }
});

// ==========================================
// MILESTONES
// ==========================================

export const getAllMilestones = asyncHandler(async (req, res) => {
    try {
        const milestones = await ReferralMilestone.find().sort({ referralCount: 1 });
        sendSuccess(res, 'Milestones retrieved', { milestones });
    } catch (error) {
        sendError(res, 'Failed to fetch milestones', 500);
    }
});

export const createMilestone = asyncHandler(async (req, res) => {
    try {
        const milestone = await ReferralMilestone.create(req.body);
        sendSuccess(res, 'Milestone created', { milestone });
    } catch (error) {
        sendError(res, 'Failed to create milestone', 500);
    }
});

export const deleteMilestone = asyncHandler(async (req, res) => {
    try {
        await ReferralMilestone.findByIdAndDelete(req.params.id);
        sendSuccess(res, 'Milestone deleted', {});
    } catch (error) {
        sendError(res, 'Failed to delete milestone', 500);
    }
});

// ==========================================
// CAMPAIGNS
// ==========================================

export const getAllCampaigns = asyncHandler(async (req, res) => {
    try {
        const campaigns = await ReferralCampaign.find().sort({ createdAt: -1 });
        sendSuccess(res, 'Campaigns retrieved', { campaigns });
    } catch (error) {
        sendError(res, 'Failed to fetch campaigns', 500);
    }
});

export const createCampaign = asyncHandler(async (req, res) => {
    try {
        const campaign = await ReferralCampaign.create(req.body);
        sendSuccess(res, 'Campaign created', { campaign });
    } catch (error) {
        sendError(res, 'Failed to create campaign', 500);
    }
});

export const updateCampaign = asyncHandler(async (req, res) => {
    try {
        const campaign = await ReferralCampaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
        sendSuccess(res, 'Campaign updated', { campaign });
    } catch (error) {
        sendError(res, 'Failed to update campaign', 500);
    }
});

export const deleteCampaign = asyncHandler(async (req, res) => {
    try {
        await ReferralCampaign.findByIdAndDelete(req.params.id);
        sendSuccess(res, 'Campaign deleted', {});
    } catch (error) {
        sendError(res, 'Failed to delete campaign', 500);
    }
});

// ==========================================
// REFERRALS (LIST & REVIEW)
// ==========================================

export const getAllReferrals = asyncHandler(async (req, res) => {
    try {
        const referrals = await Referral.find()
            .populate('referrer', 'name email phone role')
            .populate('referee', 'name email phone role')
            .populate('campaign', 'name code')
            .sort({ createdAt: -1 })
            .limit(100);

        sendSuccess(res, 'Referrals retrieved', { referrals });
    } catch (error) {
        sendError(res, 'Failed to fetch referrals', 500);
    }
});

export const updateReferral = asyncHandler(async (req, res) => {
    try {
        const referral = await Referral.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('referrer', 'name email')
            .populate('referee', 'name email');

        if (!referral) {
            return sendError(res, 'Referral not found', 404);
        }
        sendSuccess(res, 'Referral updated', { referral });
    } catch (error) {
        sendError(res, 'Failed to update referral', 500);
    }
});

import express from 'express';
import { protect, isAdmin } from '../middleware/auth.js';
import {
    getSettings,
    updateSettings,
    getAllTiers,
    createTier,
    updateTier,
    deleteTier,
    getAllMilestones,
    createMilestone,
    deleteMilestone,
    getAllCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getAllReferrals,
    updateReferral
} from '../controllers/referralController.js';

const router = express.Router();

// Admin routes for configuration
router.use(protect);
router.use(isAdmin);

// Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Tiers
router.get('/tiers', getAllTiers);
router.post('/tiers', createTier);
router.put('/tiers/:id', updateTier);
router.delete('/tiers/:id', deleteTier);

// Milestones
router.get('/milestones', getAllMilestones);
router.post('/milestones', createMilestone);
router.delete('/milestones/:id', deleteMilestone);

// Campaigns
router.get('/campaigns', getAllCampaigns);
router.post('/campaigns', createCampaign);
router.put('/campaigns/:id', updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);

// Referrals List
router.get('/all', getAllReferrals);
// Update specific referral status
router.patch('/referrals/:id', updateReferral);

export default router;

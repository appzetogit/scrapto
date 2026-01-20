import mongoose from 'mongoose';

const referralCampaignSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    code: {
        type: String, // Promo code like 'SUMMER2024'
        trim: true,
        uppercase: true
    },
    description: String,
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    targetAudience: {
        type: String,
        enum: ['user', 'scrapper', 'both'],
        default: 'both'
    },
    customRewards: {
        signupBonus: { type: Number, default: 0 },
        refereeWelcomeBonus: { type: Number, default: 0 }
    },
    maxReferrals: {
        type: Number,
        default: 1000
    },
    currentReferrals: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    status: { // active/inactive
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

const ReferralCampaign = mongoose.model('ReferralCampaign', referralCampaignSchema);

export default ReferralCampaign;

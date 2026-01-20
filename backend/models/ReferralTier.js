import mongoose from 'mongoose';

const referralTierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    minReferrals: {
        type: Number,
        required: true,
        default: 0
    },
    bonusPercent: {
        type: Number,
        required: true,
        default: 0
    },
    monthlyBonus: {
        type: Number,
        default: 0
    },
    color: {
        type: String,
        default: '#3b82f6'
    },
    benefits: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const ReferralTier = mongoose.model('ReferralTier', referralTierSchema);

export default ReferralTier;

import mongoose from 'mongoose';

const referralMilestoneSchema = new mongoose.Schema({
    referralCount: {
        type: Number,
        required: true,
        unique: true
    },
    rewardAmount: {
        type: Number,
        required: true
    },
    rewardType: {
        type: String,
        enum: ['cash', 'coupon', 'gift_card'],
        default: 'cash'
    },
    description: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const ReferralMilestone = mongoose.model('ReferralMilestone', referralMilestoneSchema);

export default ReferralMilestone;

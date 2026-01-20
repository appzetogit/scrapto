import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
    referrer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    referrerModel: { // Keep track if referrer is User or Scrapper if we support Polymorphic
        type: String,
        enum: ['User', 'Scrapper'],
        default: 'User'
    },
    referee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referencing User for now, could be Polymorphic
        default: null
    },
    refereeModel: {
        type: String,
        enum: ['User', 'Scrapper'],
        default: 'User'
    },
    refereeEmail: {
        type: String,
        lowercase: true,
        trim: true
    },
    refereePhone: {
        type: String,
        trim: true
    },
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ReferralCampaign',
        default: null
    },
    codeUsed: {
        type: String,
        uppercase: true
    },
    status: { // pending, registered, completed, verified, rejected, fraud
        type: String,
        enum: ['pending', 'registered', 'completed', 'verified', 'rejected', 'fraud'],
        default: 'pending'
    },
    rewardEarned: {
        type: Number,
        default: 0
    },
    rewardStatus: {
        type: String, // pending, paid, void
        enum: ['pending', 'paid', 'void'],
        default: 'pending'
    },
    fraudFlags: [{
        type: { type: String }, // same_ip, rapid_referral, etc
        severity: { type: String, enum: ['high', 'medium', 'low'] },
        message: String,
        detectedAt: { type: Date, default: Date.now }
    }],
    deviceInfo: String,
    ipAddress: String,
    notes: String
}, {
    timestamps: true
});

referralSchema.index({ referrer: 1 });
referralSchema.index({ referee: 1 });
referralSchema.index({ codeUsed: 1 });
referralSchema.index({ status: 1 });

const Referral = mongoose.model('Referral', referralSchema);

export default Referral;

import mongoose from 'mongoose';

const referralSettingSchema = new mongoose.Schema({
    enabled: {
        type: Boolean,
        default: true
    },
    allowCrossReferrals: {
        type: Boolean,
        default: true
    },
    userRewards: {
        signupBonus: { type: Number, default: 50 },
        refereeWelcomeBonus: { type: Number, default: 25 }
    },
    scrapperRewards: {
        signupBonus: { type: Number, default: 100 },
        refereeWelcomeBonus: { type: Number, default: 50 }
    },
    crossReferralRewards: {
        userToScrapper: {
            referrerBonus: { type: Number, default: 75 },
            refereeWelcomeBonus: { type: Number, default: 100 }
        },
        scrapperToUser: {
            referrerBonus: { type: Number, default: 75 },
            refereeWelcomeBonus: { type: Number, default: 50 }
        }
    },
    lifecycleRewards: {
        user: {
            firstRequest: {
                enabled: { type: Boolean, default: true },
                referrer: { type: Number, default: 20 },
                referee: { type: Number, default: 10 }
            },
            firstCompletion: {
                enabled: { type: Boolean, default: true },
                referrer: { type: Number, default: 30 },
                referee: { type: Number, default: 15 }
            }
        },
        scrapper: {
            kycVerified: {
                enabled: { type: Boolean, default: true },
                referrer: { type: Number, default: 50 },
                referee: { type: Number, default: 0 }
            },
            subscription: {
                enabled: { type: Boolean, default: true },
                referrer: { type: Number, default: 100 },
                referee: { type: Number, default: 0 }
            },
            firstPickup: {
                enabled: { type: Boolean, default: true },
                referrer: { type: Number, default: 50 },
                referee: { type: Number, default: 50 }
            }
        }
    },
    minOrderValue: {
        type: Number,
        default: 200
    },
    currency: {
        type: String,
        default: 'INR'
    },
    expiryDays: {
        type: Number,
        default: 30
    }
}, {
    timestamps: true,
    capped: { size: 1024, max: 1 } // Singleton
});

const ReferralSetting = mongoose.model('ReferralSetting', referralSettingSchema);

export default ReferralSetting;

import mongoose from 'mongoose';

const couponUsageSchema = new mongoose.Schema({
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    scrapperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scrapper',
        default: null
    },
    userType: {
        type: String,
        enum: ['User', 'Scrapper'],
        required: true
    },
    walletTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WalletTransaction',
        required: true
    },
    amount: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

// Indexes
couponUsageSchema.index({ couponId: 1, userId: 1 });
couponUsageSchema.index({ couponId: 1, scrapperId: 1 });
couponUsageSchema.index({ userId: 1 });
couponUsageSchema.index({ scrapperId: 1 });

const CouponUsage = mongoose.model('CouponUsage', couponUsageSchema);

export default CouponUsage;

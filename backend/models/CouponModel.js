import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    title: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    applicableRole: {
        type: String,
        enum: ['USER', 'SCRAPPER', 'ALL'],
        required: true
    },
    usageType: {
        type: String,
        enum: ['SINGLE_USE_PER_USER', 'LIMITED', 'UNLIMITED'],
        required: true
    },
    limit: {
        type: Number,
        default: 0
    },
    usedCount: {
        type: Number,
        default: 0
    },
    validFrom: {
        type: Date,
        required: true
    },
    validTo: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Indexes
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1 });

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;

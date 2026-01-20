import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    link: {
        type: String,
        default: ''
    },
    targetAudience: {
        type: String,
        enum: ['user', 'scrapper', 'both'],
        default: 'both',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    displayOrder: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries on active banners
bannerSchema.index({ isActive: 1, targetAudience: 1, displayOrder: 1 });

const Banner = mongoose.model('Banner', bannerSchema);

export default Banner;

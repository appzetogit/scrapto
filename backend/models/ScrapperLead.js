import mongoose from 'mongoose';

const scrapperLeadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Please add a phone number'],
        unique: true,
        trim: true
    },
    area: {
        type: String,
        trim: true
    },
    vehicleInfo: {
        type: String,
        trim: true
    },
    source: {
        type: String,
        enum: ['admin_manual', 'campaign', 'referral', 'other'],
        default: 'admin_manual'
    },
    status: {
        type: String,
        enum: ['new', 'invited', 'converted', 'rejected'],
        default: 'new'
    },
    notes: {
        type: String,
        trim: true
    },
    scrapper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scrapper',
        default: null
    }
}, {
    timestamps: true
});

// Index for faster queries
scrapperLeadSchema.index({ phone: 1 });
scrapperLeadSchema.index({ status: 1 });

const ScrapperLead = mongoose.model('ScrapperLead', scrapperLeadSchema);

export default ScrapperLead;

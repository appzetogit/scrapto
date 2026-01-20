import mongoose from 'mongoose';

const helpTicketSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    scrapper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Scrapper',
        default: null
    },
    role: {
        type: String,
        enum: ['user', 'scrapper', 'guest'],
        default: 'user'
    },
    name: {
        type: String, // For guests or quick reference
        trim: true
    },
    email: {
        type: String,
        trim: true
    },
    subject: {
        type: String,
        required: [true, 'Please add a subject'],
        trim: true
    },
    message: {
        type: String,
        required: [true, 'Please add a message']
    },
    type: {
        type: String,
        enum: ['issue', 'feedback', 'general', 'payment', 'account'],
        default: 'general'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved', 'closed'],
        default: 'open'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Admin user
        default: null
    },
    attachments: [{
        type: String // URLs
    }],
    responses: [{
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'responses.senderModel'
        },
        senderModel: {
            type: String,
            enum: ['User', 'Scrapper']
        },
        message: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Indexes
helpTicketSchema.index({ status: 1 });
helpTicketSchema.index({ user: 1 });
helpTicketSchema.index({ scrapper: 1 });
helpTicketSchema.index({ createdAt: -1 });

const HelpTicket = mongoose.model('HelpTicket', helpTicketSchema);

export default HelpTicket;

import mongoose from 'mongoose';

const withdrawalRequestSchema = new mongoose.Schema({
    request_id: {
        type: String,
        unique: true,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'userType',
        required: true
    },
    userType: {
        type: String,
        enum: ['User', 'Scrapper'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'],
        default: 'PENDING'
    },
    bankDetails: {
        accountHolderName: String,
        accountNumber: String,
        ifscCode: String,
        bankName: String,
        upiId: String,
        method: {
            type: String,
            enum: ['BANK_TRANSFER', 'UPI'],
            required: true
        }
    },
    adminNotes: {
        type: String
    },
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Admin user
    },
    processedAt: {
        type: Date
    },
    transactionId: {
        type: String
    }
}, {
    timestamps: true
});

const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
export default WithdrawalRequest;

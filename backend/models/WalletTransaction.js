import mongoose from 'mongoose';

const walletTransactionSchema = new mongoose.Schema({
    trxId: {
        type: String,
        unique: true,
        index: true,
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
        required: true
    }, // Positive for Credit, Negative for Debit
    type: {
        type: String,
        enum: ['CREDIT', 'DEBIT'],
        required: true
    },
    balanceBefore: {
        type: Number,
        required: true
    },
    balanceAfter: {
        type: Number,
        required: true
    },

    // Context of the transaction
    category: {
        type: String,
        enum: [
            'RECHARGE',           // Adding money to wallet
            'PAYMENT_SENT',       // Paying for service/goods
            'PAYMENT_RECEIVED',   // Receiving money for service/goods
            'COMMISSION',         // Admin Fee Deduction
            'WITHDRAWAL',         // Withdrawal to Bank
            'REFUND',             // Refund
            'REFERRAL_BONUS'      // Referral Earnings
        ],
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },

    // Payment Gateway Metadata (for Recharges & Hybrid Payments)
    gateway: {
        provider: {
            type: String,
            enum: ['RAZORPAY', 'WALLET', 'SYSTEM'],
            default: 'WALLET'
        },
        paymentId: { type: String, default: null }, // razorpay_payment_id
        orderId: { type: String, default: null },   // razorpay_order_id
        signature: { type: String, default: null }  // razorpay_signature
    },

    status: {
        type: String,
        enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },
    description: {
        type: String,
        default: ''
    },
    metadata: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

// Indexes for faster queries
walletTransactionSchema.index({ user: 1, createdAt: -1 }); // Get user history
walletTransactionSchema.index({ type: 1 });
walletTransactionSchema.index({ category: 1 });
walletTransactionSchema.index({ 'gateway.paymentId': 1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);

export default WalletTransaction;

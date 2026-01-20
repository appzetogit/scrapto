import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { getRazorpayClient } from '../services/paymentService.js';
import logger from '../utils/logger.js';

const getUserModel = (role) => {
    return role === 'scrapper' ? Scrapper : User;
};

// @desc    Get user wallet profile (balance & transactions)
// @route   GET /api/wallet/profile
// @access  Private
export const getWalletProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    const Model = getUserModel(role);
    const user = await Model.findById(userId).select('wallet name email phone');

    if (!user) {
        return sendError(res, 'User not found', 404);
    }

    // Fetch recent transactions
    const transactions = await WalletTransaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20);

    sendSuccess(res, 'Wallet profile fetched successfully', {
        balance: user.wallet?.balance || 0,
        currency: user.wallet?.currency || 'INR',
        status: user.wallet?.status || 'ACTIVE',
        transactions
    });
});

// @desc    Create Razorpay order for wallet recharge
// @route   POST /api/wallet/recharge/create
// @access  Private
export const createRechargeOrder = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || amount < 1) {
        return sendError(res, 'Invalid amount. Minimum recharge is ₹1', 400);
    }

    // Get Razorpay Instance
    let razorpay;
    try {
        razorpay = getRazorpayClient();
    } catch (error) {
        logger.error('[Wallet] Razorpay init failed', error);
        return sendError(res, 'Payment gateway error', 500);
    }

    const receiptId = `wallet_${userId.toString().slice(-10)}_${Date.now()}`;

    const options = {
        amount: Math.round(amount * 100), // paise
        currency: 'INR',
        receipt: receiptId,
        payment_capture: 1,
        notes: {
            userId: userId.toString(),
            type: 'WALLET_RECHARGE'
        }
    };

    try {
        const order = await razorpay.orders.create(options);

        sendSuccess(res, 'Recharge order created', {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        logger.error('[Wallet] Create Order Failed', error);
        sendError(res, 'Failed to create recharge order', 500);
    }
});

// @desc    Verify Razorpay payment and credit wallet
// @route   POST /api/wallet/recharge/verify
// @access  Private
export const verifyRecharge = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    // 1. Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

    if (expectedSignature !== razorpay_signature) {
        return sendError(res, 'Invalid payment signature', 400);
    }

    const Model = getUserModel(role);
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // 2. Check overlap (Idempotency)
        const existingTrx = await WalletTransaction.findOne({
            'gateway.paymentId': razorpay_payment_id
        }).session(session);

        if (existingTrx) {
            await session.abortTransaction();
            return sendSuccess(res, 'Recharge already processed', {
                transaction: existingTrx,
                balance: existingTrx.balanceAfter
            });
        }

        // 3. Fetch User and Update Balance
        const user = await Model.findById(userId).session(session);
        if (!user) throw new Error('User not found');

        // Initialize wallet if missing
        if (!user.wallet) {
            user.wallet = {
                balance: 0,
                currency: 'INR',
                status: 'ACTIVE'
            };
        }

        const previousBalance = user.wallet.balance;
        const creditAmount = Number(amount);

        // Safety Update
        user.wallet.balance += creditAmount;
        await user.save({ session });

        // 4. Create Transaction Record
        const trx = await WalletTransaction.create([{
            trxId: `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            user: userId,
            userType: role === 'scrapper' ? 'Scrapper' : 'User',
            amount: creditAmount,
            type: 'CREDIT',
            balanceBefore: previousBalance,
            balanceAfter: user.wallet.balance,
            category: 'RECHARGE',
            status: 'SUCCESS',
            description: 'Wallet Recharge via Razorpay',
            gateway: {
                provider: 'RAZORPAY',
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                signature: razorpay_signature
            }
        }], { session });

        await session.commitTransaction();

        sendSuccess(res, 'Wallet recharged successfully', {
            newBalance: user.wallet.balance,
            transactionId: trx[0].trxId
        });

    } catch (error) {
        await session.abortTransaction();
        logger.error('[Wallet] Recharge verification failed', error);
        sendError(res, 'Recharge Failed', 500);
    } finally {
        session.endSession();
    }
});

export const getWalletTransactions = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const transactions = await WalletTransaction.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

    const total = await WalletTransaction.countDocuments({ user: userId });

    sendSuccess(res, 'Transactions fetched', {
        transactions,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page)
    });
});

// @desc    Pay for order using wallet (Scrapper -> User)
// @route   POST /api/wallet/pay-order
// @access  Private (Scrappers)
export const payOrderViaWallet = asyncHandler(async (req, res) => {
    const { orderId, amount } = req.body;
    const scrapperId = req.user.id;

    if (!orderId || !amount) {
        return sendError(res, 'Order ID and amount are required', 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Fetch Order
        const order = await Order.findById(orderId).session(session);
        if (!order) {
            throw new Error('Order not found');
        }

        if (order.status === 'completed' || order.paymentStatus === 'completed') {
            throw new Error('Order already paid/completed');
        }

        // 2. Fetch Scrapper
        const scrapper = await Scrapper.findById(scrapperId).session(session);
        if (!scrapper) throw new Error('Scrapper query failed');

        if (!scrapper.wallet || scrapper.wallet.balance < Number(amount)) {
            throw new Error('Insufficient wallet balance');
        }

        // 3. Fetch User
        const user = await User.findById(order.user).session(session);
        if (!user) throw new Error('User not found');

        // Init user wallet if needed
        if (!user.wallet) {
            user.wallet = { balance: 0, currency: 'INR', status: 'ACTIVE' };
        }

        // 4. Perform Transfer
        const transferAmount = Number(amount);
        scrapper.wallet.balance -= transferAmount;
        user.wallet.balance += transferAmount;

        await scrapper.save({ session });
        await user.save({ session });

        // 5. Create Transaction Records
        // Scrapper Debit
        await WalletTransaction.create([{
            trxId: `TRX-PAY-${Date.now()}`,
            user: scrapperId,
            userType: 'Scrapper',
            amount: transferAmount,
            type: 'DEBIT',
            balanceBefore: scrapper.wallet.balance + transferAmount,
            balanceAfter: scrapper.wallet.balance,
            category: 'PAYMENT',
            status: 'SUCCESS',
            description: `Payment for Order #${orderId}`,
            metadata: { orderId }
        }], { session });

        // User Credit
        await WalletTransaction.create([{
            trxId: `TRX-RCV-${Date.now()}`,
            user: user._id,
            userType: 'User',
            amount: transferAmount,
            type: 'CREDIT',
            balanceBefore: user.wallet.balance - transferAmount,
            balanceAfter: user.wallet.balance,
            category: 'REFUND', // Or 'PAYMENT_RECEIVED'
            status: 'SUCCESS',
            description: `Payment received for Order #${orderId}`,
            metadata: { orderId }
        }], { session });

        // 6. Update Order Status
        order.status = 'completed';
        order.paymentStatus = 'completed';
        order.totalAmount = transferAmount;
        await order.save({ session });

        await session.commitTransaction();

        sendSuccess(res, 'Payment successful', {
            newBalance: scrapper.wallet.balance,
            orderId: order._id
        });

    } catch (error) {
        await session.abortTransaction();
        logger.error('[Wallet] Pay Order Failed', error);
        sendError(res, error.message || 'Payment failed', 500);
    } finally {
        session.endSession();
    }
});

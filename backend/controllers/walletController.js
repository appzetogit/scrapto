import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';
import Scrapper from '../models/Scrapper.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Order from '../models/Order.js';
import Coupon from '../models/CouponModel.js';
import CouponUsage from '../models/CouponUsageModel.js';
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

        // Initialize wallet if missing or partial
        if (!user.wallet) {
            user.wallet = {
                balance: 0,
                currency: 'INR',
                status: 'ACTIVE'
            };
        }

        // Ensure balance is a number
        if (typeof user.wallet.balance !== 'number') {
            user.wallet.balance = 0;
        }

        const previousBalance = user.wallet.balance;
        const creditAmount = Number(amount);

        if (isNaN(creditAmount) || creditAmount <= 0) {
            throw new Error('Invalid recharge amount received');
        }

        // Safety Update
        user.wallet.balance = previousBalance + creditAmount;
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
        logger.error('[Wallet] Recharge verification failed', {
            error: error.message,
            stack: error.stack,
            userId,
            role,
            amount,
            razorpay_payment_id,
            razorpay_order_id
        });
        sendError(res, error.message || 'Recharge Failed', 500);
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

// @desc    Pay for order using wallet (Handles both Scrap Sell and Cleaning Service)
// @route   POST /api/wallet/pay-order
// @access  Private (User or Scrapper)
export const payOrderViaWallet = asyncHandler(async (req, res) => {
    const { orderId, amount } = req.body;
    const currentUserId = req.user.id; // Could be User or Scrapper

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

        // 2. Identify Payer and Payee based on service type
        let PayerModel, PayeeModel;
        let payerId, payeeId;
        let payerRole, payeeRole; // 'User' or 'Scrapper'

        // Determine flow based on order type
        if (order.orderType === 'cleaning_service') {
            // Cleaning Service: User PAYS Scrapper
            PayerModel = User;
            PayeeModel = Scrapper;
            payerId = order.user;
            payeeId = order.scrapper;
            payerRole = 'User';
            payeeRole = 'Scrapper';
        } else {
            // Scrap Selling (Default): Scrapper PAYS User
            PayerModel = Scrapper;
            PayeeModel = User;
            payerId = order.scrapper;
            payeeId = order.user;
            payerRole = 'Scrapper';
            payeeRole = 'User';
        }

        // 3. Authorization Check
        // Ensure the logged-in user is the one supposed to pay
        if (currentUserId.toString() !== payerId.toString()) {
            throw new Error('Unauthorized: You are not the payer for this order');
        }

        // 4. Fetch Payer and Payee Entities
        const payer = await PayerModel.findById(payerId).session(session);
        const payee = await PayeeModel.findById(payeeId).session(session);

        if (!payer) throw new Error(`${payerRole} (Payer) not found`);
        if (!payee) throw new Error(`${payeeRole} (Payee) not found`);

        // 5. Initialize Wallets if missing
        if (!payer.wallet) payer.wallet = { balance: 0, currency: 'INR', status: 'ACTIVE' };
        if (!payee.wallet) payee.wallet = { balance: 0, currency: 'INR', status: 'ACTIVE' };

        // Ensure balances are numbers
        if (typeof payer.wallet.balance !== 'number') payer.wallet.balance = 0;
        if (typeof payee.wallet.balance !== 'number') payee.wallet.balance = 0;

        // 6. Check Balance
        const transferAmount = Number(amount);
        if (isNaN(transferAmount) || transferAmount <= 0) {
            throw new Error('Invalid transfer amount');
        }

        if (payer.wallet.balance < transferAmount) {
            throw new Error(`Insufficient wallet balance. Please recharge.`);
        }

        // 7. Perform Transfer
        payer.wallet.balance -= transferAmount;
        payee.wallet.balance += transferAmount;

        await payer.save({ session });
        await payee.save({ session });

        // 8. Create Transaction Records

        // Record for Payer (DEBIT)
        await WalletTransaction.create([{
            trxId: `TRX-PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            user: payer._id,
            userType: payerRole,
            amount: transferAmount,
            type: 'DEBIT',
            balanceBefore: payer.wallet.balance + transferAmount,
            balanceAfter: payer.wallet.balance,
            category: 'PAYMENT_SENT',
            status: 'SUCCESS',
            description: `Payment to ${payeeRole} for Order #${orderId}`,
            metadata: { orderId: order._id.toString() },
            orderId: order._id
        }], { session });

        // Record for Payee (CREDIT)
        await WalletTransaction.create([{
            trxId: `TRX-RCV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            user: payee._id,
            userType: payeeRole,
            amount: transferAmount,
            type: 'CREDIT',
            balanceBefore: payee.wallet.balance - transferAmount,
            balanceAfter: payee.wallet.balance,
            category: 'PAYMENT_RECEIVED',
            status: 'SUCCESS',
            description: `Payment received from ${payerRole} for Order #${orderId}`,
            metadata: { orderId: order._id.toString() },
            orderId: order._id
        }], { session });

        // 9. Update Order Status
        order.status = 'completed';
        order.paymentStatus = 'completed';
        order.totalAmount = transferAmount; // Set final amount
        order.completedDate = new Date(); // Timestamp

        // 9a. Handle Commission (Optional - Keeping logically similar to manual updateOrderStatus)
        // If needed, we could deduct commission here, but usually that's separate. 
        // For now, let's keep it simple transaction.

        await order.save({ session });

        await session.commitTransaction();

        sendSuccess(res, 'Payment successful', {
            newBalance: payer.wallet.balance,
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

// @desc    Request withdrawal
// @route   POST /api/wallet/withdraw
// @access  Private
export const requestWithdrawal = asyncHandler(async (req, res) => {
    const { amount, bankDetails } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    // 1. Basic Validation
    if (!amount || amount < 100) { // Minimum withdrawal limit usually exists
        return sendError(res, 'Minimum withdrawal amount is ₹100', 400);
    }

    if (!bankDetails || (!bankDetails.upiId && !bankDetails.accountNumber)) {
        return sendError(res, 'Valid bank details or UPI ID required', 400);
    }

    const Model = getUserModel(role);
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 2. Fetch User and Check Balance
        const user = await Model.findById(userId).session(session);
        if (!user) throw new Error('User not found');

        if (!user.wallet || user.wallet.balance < amount) {
            throw new Error('Insufficient wallet balance');
        }

        // 3. Deduct Balance
        const previousBalance = user.wallet.balance;
        user.wallet.balance -= Number(amount);
        await user.save({ session });

        // Generate ID
        const requestId = `WDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        // 4. Create Withdrawal Request (Dynamic Import to avoid circular dep if any, though model import is fine)
        const { default: WithdrawalRequest } = await import('../models/WithdrawalRequest.js');

        const withdrawal = await WithdrawalRequest.create([{
            request_id: requestId,
            user: userId,
            userType: role === 'scrapper' ? 'Scrapper' : 'User',
            amount: Number(amount),
            status: 'PENDING',
            bankDetails: bankDetails
        }], { session });

        // 5. Create Transaction Record
        await WalletTransaction.create([{
            trxId: requestId, // Use same ID for tracking
            user: userId,
            userType: role === 'scrapper' ? 'Scrapper' : 'User',
            amount: Number(amount),
            type: 'DEBIT',
            balanceBefore: previousBalance,
            balanceAfter: user.wallet.balance,
            category: 'WITHDRAWAL',
            status: 'PENDING', // Pending until Admin processes it
            description: 'Withdrawal Request',
            metadata: { withdrawalId: withdrawal[0]._id.toString() }
        }], { session });

        await session.commitTransaction();

        sendSuccess(res, 'Withdrawal request submitted successfully', {
            requestId: withdrawal[0].request_id,
            newBalance: user.wallet.balance
        });

    } catch (error) {
        await session.abortTransaction();
        logger.error('[Wallet] Withdrawal Request Failed', error);
        sendError(res, error.message || 'Withdrawal request failed', 500);
    } finally {
        session.endSession();
    }
});

// @desc    Apply coupon to add balance
// @route   POST /api/wallet/apply-coupon
// @access  Private (User or Scrapper)
export const applyCoupon = asyncHandler(async (req, res) => {
    const { code } = req.body;
    const userId = req.user.id;
    const role = req.user.role; // 'user' or 'scrapper' (lowercase from middleware)

    // Convert role to Match Enum standard (User/Scrapper) if needed
    // The middleware usually sets req.user.role as 'user' or 'scrapper' (lowercase)
    // Our DB enums use 'User' / 'Scrapper' (Title Case) or 'USER' / 'SCRAPPER' (UpperCase) depending on the model.
    // Coupon Model uses: 'USER', 'SCRAPPER', 'ALL'
    // Wallet Transaction uses: 'User', 'Scrapper'
    // Coupon Usage uses: 'User', 'Scrapper'

    if (!code) {
        return sendError(res, 'Coupon code is required', 400);
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Fetch Coupon
        const coupon = await Coupon.findOne({ code: code.toUpperCase() }).session(session);
        if (!coupon) {
            throw new Error('Invalid coupon code');
        }

        // 2. Validate Coupon Status
        if (!coupon.isActive) {
            throw new Error('Coupon is inactive');
        }

        if (new Date() > coupon.validTo) {
            throw new Error('Coupon has expired');
        }

        if (new Date() < coupon.validFrom) {
            throw new Error('Coupon is not yet valid');
        }

        // 3. Validate Role
        // coupon.applicableRole: 'USER', 'SCRAPPER', 'ALL'
        const userRoleUpper = role.toUpperCase(); // 'USER' or 'SCRAPPER'
        if (coupon.applicableRole !== 'ALL' && coupon.applicableRole !== userRoleUpper) {
            throw new Error('This coupon is not applicable for your role');
        }

        // 4. Validate Usage Limits (Global)
        if (coupon.usageType === 'LIMITED' && coupon.usedCount >= coupon.limit) {
            throw new Error('Coupon usage limit exceeded');
        }

        // 5. Validate Per-User Usage
        // Check if user has already used this coupon
        const usageQuery = { couponId: coupon._id };
        if (role === 'user') {
            usageQuery.userId = userId;
        } else {
            usageQuery.scrapperId = userId;
        }

        const existingUsage = await CouponUsage.findOne(usageQuery).session(session);
        if (existingUsage) {
            throw new Error('You have already redeemed this coupon');
        }

        // 6. Credit Wallet
        const Model = getUserModel(role);
        const user = await Model.findById(userId).session(session);
        if (!user) throw new Error('User not found');

        if (!user.wallet) {
            user.wallet = {
                balance: 0,
                currency: 'INR',
                status: 'ACTIVE'
            };
        }

        const previousBalance = user.wallet.balance;
        const creditAmount = coupon.amount;

        user.wallet.balance += creditAmount;
        await user.save({ session });

        // 7. Create Wallet Transaction
        const trx = await WalletTransaction.create([{
            trxId: `TRX-CPN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            user: userId,
            userType: role === 'scrapper' ? 'Scrapper' : 'User',
            amount: creditAmount,
            type: 'CREDIT',
            balanceBefore: previousBalance,
            balanceAfter: user.wallet.balance,
            category: 'COUPON_CREDIT',
            status: 'SUCCESS',
            description: `Coupon Applied: ${coupon.code}`,
            couponCode: coupon.code,
            gateway: {
                provider: 'SYSTEM'
            }
        }], { session });

        // 8. Record Usage
        await CouponUsage.create([{
            couponId: coupon._id,
            userId: role === 'user' ? userId : null,
            scrapperId: role === 'scrapper' ? userId : null,
            userType: role === 'scrapper' ? 'Scrapper' : 'User',
            walletTransactionId: trx[0]._id,
            amount: creditAmount
        }], { session });

        // 9. Update Coupon Stats
        coupon.usedCount += 1;
        await coupon.save({ session });

        await session.commitTransaction();

        sendSuccess(res, 'Coupon applied successfully', {
            newBalance: user.wallet.balance,
            amountCredited: creditAmount,
            message: `₹${creditAmount} added to your wallet!`
        });

    } catch (error) {
        await session.abortTransaction();
        logger.error('[Wallet] Apply Coupon Failed', error);
        sendError(res, error.message || 'Failed to apply coupon', 400);
    } finally {
        session.endSession();
    }
});

// @desc    Get active coupons available for the current user
// @route   GET /api/wallet/coupons
// @access  Private
export const getAvailableCoupons = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role; // 'user' or 'scrapper'
    const userRoleUpper = role.toUpperCase();

    const now = new Date();

    // 1. Find potential coupons
    const coupons = await Coupon.find({
        isActive: true,
        validFrom: { $lte: now },
        validTo: { $gte: now },
        applicableRole: { $in: ['ALL', userRoleUpper] }
    });

    // 2. Filter based on usage
    const availableCoupons = [];

    for (const coupon of coupons) {
        // Check global limit
        if (coupon.usageType === 'LIMITED' && coupon.usedCount >= coupon.limit) {
            continue;
        }

        // Check user specific usage
        const usageQuery = { couponId: coupon._id };
        if (role === 'user') {
            usageQuery.userId = userId;
        } else {
            usageQuery.scrapperId = userId;
        }

        const existingUsage = await CouponUsage.findOne(usageQuery);

        // If single use per user and already used, skip
        if (existingUsage && (coupon.usageType === 'SINGLE_USE_PER_USER' || coupon.usageType === 'LIMITED')) {
            continue;
        }

        availableCoupons.push({
            code: coupon.code,
            title: coupon.title,
            amount: coupon.amount,
            validTo: coupon.validTo,
            description: `Get ₹${coupon.amount} credit`
        });
    }

    sendSuccess(res, 'Available coupons fetched', availableCoupons);
});

import express from 'express';
import { protect, isScrapper } from '../middleware/auth.js';
import {
    getWalletProfile,
    getWalletTransactions,
    createRechargeOrder,
    verifyRecharge,
    payOrderViaWallet,
    requestWithdrawal
} from '../controllers/walletController.js';

const router = express.Router();

router.get('/profile', protect, getWalletProfile);
router.get('/transactions', protect, getWalletTransactions);

// Recharge
router.post('/recharge/create', protect, createRechargeOrder);
router.post('/recharge/verify', protect, verifyRecharge);

// Payments
router.post('/pay-order', protect, payOrderViaWallet);

// Withdrawals
router.post('/withdraw', protect, requestWithdrawal);

export default router;

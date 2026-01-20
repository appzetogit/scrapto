import express from 'express';
import {
    getWalletProfile,
    createRechargeOrder,
    verifyRecharge,
    getWalletTransactions,
    payOrderViaWallet
} from '../controllers/walletController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All wallet routes require login

router.get('/profile', getWalletProfile);
router.get('/transactions', getWalletTransactions);
router.post('/recharge/create', createRechargeOrder);
router.post('/recharge/verify', verifyRecharge);
router.post('/pay-order', payOrderViaWallet);

export default router;

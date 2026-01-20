import { walletAPI } from '../utils/api';

export const walletService = {
  // Get wallet balance and transactions
  getWalletProfile: async () => {
    return await walletAPI.getWalletProfile();
  },

  // Get transaction history with pagination
  getTransactions: async (page = 1, limit = 10) => {
    return await walletAPI.getTransactions(page, limit);
  },

  // Create order for checking out via Payment Gateway (Recharge)
  createRechargeOrder: async (amount) => {
    return await walletAPI.createRechargeOrder(amount);
  },

  // Verify payment signature and credit wallet
  verifyRecharge: async (paymentData) => {
    return await walletAPI.verifyRecharge(paymentData);
  },

  // Pay for an order using Wallet Balance
  payOrderViaWallet: async (orderId, amount) => {
    return await walletAPI.payOrderViaWallet(orderId, amount);
  }
};

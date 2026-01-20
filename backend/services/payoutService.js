import Razorpay from 'razorpay';
import logger from '../utils/logger.js';

/**
 * Get Razorpay X client instance (For Payouts)
 * Uses distinct keys if available
 */
export const getRazorpayXClient = () => {
    const key_id = process.env.RAZORPAY_X_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_X_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        throw new Error('Razorpay X keys are not set. Please set RAZORPAY_X_KEY_ID and RAZORPAY_X_KEY_SECRET in .env');
    }

    try {
        const razorpay = new Razorpay({
            key_id: key_id.trim(),
            key_secret: key_secret.trim()
        });

        return razorpay;
    } catch (initError) {
        logger.error('[Razorpay X] Client initialization error:', initError);
        throw new Error('Failed to initialize Razorpay X client.');
    }
};

/**
 * Create a Contact for Payouts
 * @param {string} name 
 * @param {string} email 
 * @param {string} phone 
 */
export const createContact = async (name, email, phone) => {
    try {
        const razorpay = getRazorpayXClient();

        // Check if contact already exists (Optional optimization, but API handles duplicates usually)
        // For now, simple creation

        const contact = await razorpay.contacts.create({
            name,
            email,
            contact: phone,
            type: 'employee', // or 'vendor', 'self' - 'employee' fits admin withdrawal context
            reference_id: `admin_${Date.now()}` // optional internal ref
        });

        logger.info('[Razorpay X] Contact created:', contact.id);
        return contact;
    } catch (error) {
        logger.error('[Razorpay X] Error creating contact:', error);
        throw new Error(`Failed to create contact: ${error.error?.description || error.message}`);
    }
};

/**
 * Create Fund Account (Link Bank Details to Contact)
 * @param {string} contactId 
 * @param {Object} accountDetails { accountNumber, ifsc, name }
 */
export const createFundAccount = async (contactId, accountDetails) => {
    try {
        const razorpay = getRazorpayXClient();

        const fundAccount = await razorpay.fundAccount.create({
            contact_id: contactId,
            account_type: 'bank_account',
            bank_account: {
                name: accountDetails.name,
                ifsc: accountDetails.ifsc,
                account_number: accountDetails.accountNumber
            }
        });

        logger.info('[Razorpay X] Fund Account created:', fundAccount.id);
        return fundAccount;
    } catch (error) {
        logger.error('[Razorpay X] Error creating fund account:', error);
        throw new Error(`Failed to create fund account: ${error.error?.description || error.message}`);
    }
};

/**
 * Initiate Payout (Withdrawal)
 * @param {string} fundAccountId 
 * @param {number} amount (in atomic currency, e.g. Paise for INR? No, API usually takes amount in standard unit or requires conversion. Razorpay Payouts create uses 'amount' in paise)
 * @param {string} mode (IMPS, NEFT, RTGS, UPI)
 * @param {string} purpose (refund, payout, etc.)
 */
export const initiatePayout = async (fundAccountId, amount, mode = 'IMPS', purpose = 'payout', referenceId) => {
    try {
        const razorpay = getRazorpayXClient();

        // Razorpay Payouts use 'account_number' (your business account) usually? 
        // Wait, the SDK method is razorpay.payouts.create(options)

        const payoutOptions = {
            account_number: process.env.RAZORPAY_X_ACCOUNT_NUMBER, // Your Business Account Number on Razorpay X
            fund_account_id: fundAccountId,
            amount: Math.round(amount * 100), // Convert to paise
            currency: 'INR',
            mode: mode,
            purpose: purpose,
            queue_if_low_balance: true,
            reference_id: referenceId,
            narration: 'Admin Withdrawal'
        };

        // If RAZORPAY_X_ACCOUNT_NUMBER is not set, API might default or error.
        // It is required for Payouts.
        if (!process.env.RAZORPAY_X_ACCOUNT_NUMBER) {
            logger.warn('RAZORPAY_X_ACCOUNT_NUMBER not set. Asking API to auto-select.');
            delete payoutOptions.account_number;
        }

        const payout = await razorpay.payouts.create(payoutOptions);

        logger.info('[Razorpay X] Payout initiated:', payout.id);
        return payout;
    } catch (error) {
        logger.error('[Razorpay X] Error initiating payout:', error);
        throw new Error(`Failed to initiate payout: ${error.error?.description || error.message}`);
    }
};

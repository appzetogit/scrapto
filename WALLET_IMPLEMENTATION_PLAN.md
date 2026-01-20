# Wallet Feature & Payment Infrastructure Implementation Plan (Professional Edition)

This document outlines the architecture for a robust, industry-grade Wallet and Payment system for Scrapto. It addresses financial security, concurrency loopholes, and integrates a seamless payment gateway flow during service fulfillment.

## 1. Executive Summary & Core Logic

**Objective:** Enable a closed-loop wallet system for Users and Scrappers with Real-Time Payment Settlement and automated Commission Deduction (1%).

**The "1% Rule" (Commission Logic):**
*   **Logic:** The platform deducts 1% from the *Receiver's* payout.
    *   **House Cleaning:** User Pays ₹X -> Scrapper Receives ₹X - 1% (Admin keeps 1%).
    *   **Scrap Pickup:** Scrapper Pays ₹X -> User Receives ₹X - 1% (Admin keeps 1%).
*   **Settlement Flow:** Money always moves via the **Platform's Central Ledger** (Escrow-like behavior) to ensure the commission is secured before the remaining balance reaches the target wallet.

---

## 2. Updated Database Schema (Audit-Ready)

To prevent loopholes (e.g., race conditions, double spending), we will use strict transactional models.

### 2.1 Update `User` & `Scrapper` Models
Add fields for financial state and security.
```javascript
// In User.js and Scrapper.js
wallet: {
  balance: { 
    type: Number, 
    default: 0, 
    min: [0, 'Insufficient funds'] 
  },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['ACTIVE', 'FROZEN'], default: 'ACTIVE' } // For fraud prevention
}
```

### 2.2 `WalletTransaction` Model (The Ledger)
This is the single source of truth for money.
```javascript
// models/WalletTransaction.js
const transactionSchema = new mongoose.Schema({
  trxId: { type: String, unique: true, index: true }, // generated UUID 'TRX-...'
  user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userType', required: true },
  userType: { type: String, enum: ['User', 'Scrapper'], required: true },
  amount: { type: Number, required: true }, // Positive for Credit, Negative for Debit
  type: { type: String, enum: ['CREDIT', 'DEBIT'], required: true },
  balanceBefore: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  
  // Context
  category: { 
    type: String, 
    enum: ['RECHARGE', 'PAYMENT_SENT', 'PAYMENT_RECEIVED', 'COMMISSION', 'WITHDRAWAL', 'REFUND'],
    required: true 
  },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  
  // Payment Gateway Meta
  gateway: {
    provider: { type: String, enum: ['RAZORPAY', 'WALLET'], default: 'WALLET' },
    paymentId: String, // razorpay_payment_id
    orderId: String    // razorpay_order_id
  },
  
  status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'PENDING' },
  description: String
}, { timestamps: true });
```

---

## 3. The "Loophole-Free" Payment Flows

### 3.1 Scenario: Scrap Pickup (Scrapper Buys Scrap)
**Challenge:** Scrapper might not have wallet balance.
**Solution:** A Hybrid Payment Screen (Wallet + Gateway).

**Detailed Step-by-Step Flow:**
1.  **Pickup & Weighing:** Scrapper arrives, weighs items.
2.  **Data Entry:** Scrapper enters weights in App. App calculates Total Payable: **₹1000**.
3.  **Payment Mode Selection (NEW STEP):**
    *   App shows "Amount to Pay: ₹1000".
    *   *Option A: Scrapto Wallet* (Available: ₹2500) -> "Pay ₹1000".
    *   *Option B: Online Payment* (Razorpay: UPI/Card) -> "Pay ₹1000".
4.  **Transaction Execution (Backend):**
    *   **If Wallet:** 
        1. Start Atomic Session.
        2. Check `Scrapper.wallet.balance >= 1000`. If no, throw error.
        3. Debit Scrapper Wallet ₹1000.
        4. Credit User Wallet ₹990 (₹1000 - 1%).
        5. Log "Commission" (₹10) for Admin.
        6. Commit Session.
    *   **If Online (Razorpay):**
        1. Scrapper pays ₹1000 to *Platform's Razorpay Account*.
        2. Webhook/Callback confirms success.
        3. System automatically calculates split.
        4. Credit User Wallet ₹990.
        5. Log "Commission" (₹10).
        6. (Scrapper's wallet is untouched, but order is marked Paid).
5.  **Completion:** Order status updates to `COMPLETED`. User gets notification "₹990 added to wallet".

### 3.2 Scenario: House Cleaning (User Pays Scrapper)
1.  **Service Done:** Scrapper marks complete.
2.  **User Payment:** User sees Bill: **₹500**.
3.  **Payment Mode:**
    *   *Option A: Wallet* -> Debit User ₹500 -> Credit Scrapper ₹495 (₹5 Commission).
    *   *Option B: Online* -> Payment Gateway -> Credit Scrapper ₹495.
    *   *Option C: Cash (Risky for Commission)*: 
        *   If Cash is allowed, we must Debit Scrapper's Wallet for the commission (₹5) immediately.
        *   If Scrapper wallet < ₹5, Block Cash option OR create "Negative Balance" debt.
        *   *Recommendation for V1:* Stick to Digital (Wallet/Online) to guarantee commission.

---

## 4. Frontend Integration Plan

### 4.1 Common Modules
*   **Wallet Dashboard (`/wallet`)**: 
    *   Current Balance (Big Card).
    *   "Add Money" (Triggers Razorpay).
    *   "Withdraw" (Request payout to Bank - Future Scope/Manual).
    *   Transaction History (Red for Debit, Green for Credit).

### 4.2 Scrapper App Flow Updates
*   **Active Request Page**:
    *   Existing: [Start] -> [Weighing Input] -> [Summary].
    *   **New**: [Summary] -> **[Payment Gateway Modal]** -> [Success Screen].
    *   *The Payment Modal must support:* 
        *   Toggle: "Use Wallet Balance (₹X)".
        *   Button: "Pay Balance via UPI/Card".

### 4.3 Admin Panel Upgrades
*   **Slider Widget**: "Total Earnings" (Sum of all Commission Trxs).
*   **Financial Board**:
    *   Total User Wallet Holdings (Liability).
    *   Total Scrapper Wallet Holdings (Liability).
    *   Net Revenue (Asset).

---

## 5. Security Protocols (Addressing Loopholes)

1.  **Atomic Transactions (ACID):**
    *   All money movements use `mongoose.startSession()`.
    *   Example: `Debit Sender` + `Credit Receiver` + `Log Trx` must happen together or fail together.
2.  **Idempotency:**
    *   Prevent double charging if the internet flakes. Use `razorpay_order_id` as a unique key to ensure a payment is processed once.
3.  **Server-Side Calculation:**
    *   NEVER trust the frontend for amounts.
    *   Frontend sends `orderId` and `weights`. Backend calculates `Total Amount` based on `PriceFeed`.
    *   Backend calculates `Commission` (1%).

## 6. Development Phases

1.  **Phase 1: Backend Foundation**
    *   Update Models (`User`, `Scrapper`, `WalletTransaction`).
    *   Create `WalletService` (Recharge, Transfer, Commission methods).
    *   Integrate Razorpay Webhooks.
2.  **Phase 2: Scrapper Payment Flow**
    *   Update `ActiveRequest` UI.
    *   Implement "Pay & Complete" logic.
3.  **Phase 3: User Wallet & Payment**
    *   Implement "My Wallet" page.
    *   Cleaning Service Payment flow.
4.  **Phase 4: Admin Dashboard**
    *   Earnings visualization.
    
This plan ensures "End-to-End" handling of funds with a centralized clearing mechanism, minimizing fraud and ensuring the admin always gets paid.

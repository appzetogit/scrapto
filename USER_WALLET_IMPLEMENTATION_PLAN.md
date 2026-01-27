# User Wallet Implementation Plan for Cleaning Services

## Objective
Implement a wallet system for standard Users to support "Cleaning Service" requests. The system must enforce a **minimum balance of ₹100** to place a request and **deduct ₹1 commission** from the User's wallet upon request completion.

---

## Phase 1: Backend - Core Logic Implementation

### 1.1 Minimum Balance Check (Order Creation)
**File:** `backend/controllers/orderController.js` -> `createOrder`

*   **Logic to Add:**
    *   Check if `orderType` is `'cleaning_service'`.
    *   If yes, fetch the logged-in `User`'s current wallet balance.
    *   **Validation:** If `balance < 100`, throw a 403 Error: *"Insufficient wallet balance. Minimum ₹100 required to book a cleaning service."*

### 1.2 Commission Deduction (Order Completion)
**File:** `backend/controllers/orderController.js` -> `updateOrderStatus`

*   **Logic to Add:**
    *   Inside the `status === ORDER_STATUS.COMPLETED` block.
    *   **Condition:** Check `order.orderType`.
    *   **Case A: Scrap Order (Existing)** -> Deduct ₹1 from **Scrapper**.
    *   **Case B: Cleaning Service (New)** -> Deduct ₹1 from **User**.
        *   Fetch the `User` associated with the order.
        *   Deduct `1` from `user.wallet.balance`.
        *   Save User.
        *   Create a `WalletTransaction` record:
            *   `userType`: 'User'
            *   `category`: 'COMMISSION'
            *   `type`: 'DEBIT'
            *   `amount`: 1
            *   `description`: "Service Fee for Cleaning Request #{Order ID}"

---

## Phase 2: Backend - API Verification & Routing

### 2.1 Verify Generic Wallet Controller
**File:** `backend/controllers/walletController.js`

*   The existing controller uses `getUserModel(role)`, which dynamically switches between `User` and `Scrapper`.
*   **Action:** Ensure the `role` middleware correctly passes `'user'` for standard users.
*   **Verify/Test:**
    *   `getWalletProfile`
    *   `createRechargeOrder` (Razorpay integration)
    *   `verifyRecharge`

### 2.2 Add User Wallet Routes
**File:** `backend/routes/walletRoutes.js` (or `userRoutes.js`)

*   Ensure specific routes exist for users to access wallet features (currently might be protected only for scrappers or generic).
*   **Action:** Verify routes like `/api/wallet/profile` and `/api/wallet/recharge` are accessible to `role: 'user'`.

---

## Phase 3: Frontend - User Wallet Interface

### 3.1 Create User Wallet Page
**File:** `frontend/src/modules/user/components/UserWallet.jsx` (New File)

*   **Design:**
    *   **Balance Card:** Large text showing current ₹ Balance.
    *   **Action:** "Add Money" button triggering the Razorpay modal.
    *   **History:** List of recent transactions (Recharges, Deductions).
*   **Reuse:** Utilize logic from `ScrapperWallet.jsx` but tailored for the User theme (Green/White vs Scrapper Dark mode if applicable).

### 3.2 Add Navigation
**File:** `frontend/src/modules/user/components/Sidebar.jsx` or `Header.jsx`

*   **Action:** Add a "Wallet" link/icon to the user's main navigation menu.

---

## Phase 4: Frontend - Service Booking Integration

### 4.1 Integration in Cleaning Service Form
**File:** `frontend/src/modules/user/components/Services/CleaningServiceForm.jsx` (or equivalent)

*   **On Mount:** Fetch User's Wallet Balance.
*   **UI Logic:**
    *   Display current balance near the "Submit" or "Book Now" button.
    *   **Condition:** If `balance < 100`:
        *   Disable the "Book Now" button.
        *   Show an alert/message: *"You need a minimum balance of ₹100 to book this service."*
        *   Show a "Recharge Now" button that redirects to `UserWallet` or opens a recharge modal.

---

## Phase 5: Testing & Validation

### 5.1 Test Scenarios
1.  **Low Balance User:**
    *   Attempt to book Cleaning Service with ₹0 balance.
    *   **Expectation:** Error message shown, booking blocked.
2.  **Recharge Flow:**
    *   User adds ₹100 via Razorpay (Test Mode).
    *   **Expectation:** Wallet balance updates to ₹100+.
3.  **Successful Booking:**
    *   Attempt booking with ₹100+ balance.
    *   **Expectation:** Order created successfully.
4.  **Order Completion:**
    *   Admin/Process marks order as `Completed`.
    *   **Expectation:** User balance decreases by ₹1.
    *   **Expectation:** Admin Analytics shows the ₹1 revenue.

---

## Summary of Impact
*   **No breaking changes** to existing Scrap flow.
*   **User Model** remains compatible (fields already exist).
*   **Admin** gains visibility into cleaning service revenues via the existing Transaction logs.

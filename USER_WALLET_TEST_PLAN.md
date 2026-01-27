# User Wallet & Cleaning Service Test Plan

## Objective
Verify the implementation of the User Wallet system for Cleaning Service requests, ensuring minimum balance enforcement and commission deduction.

## Prerequisites
- A registered User account.
- Backend and Frontend servers running.
- Access to MongoDB (optional, for direct DB verification).

## Test Scenarios

| ID | Test Case | Steps | Expected Result | Status |
|----|-----------|-------|-----------------|--------|
| **TS01** | **Access Wallet Page** | 1. Login as User.<br>2. Navigate to Profile > Wallet (or via direct link). | - User Wallet page is displayed.<br>- Balance shows ₹0 (or current balance).<br>- "Add Money" and "Withdraw" buttons are visible. | Use Browser |
| **TS02** | **Add Money to Wallet** | 1. Click "Add Money".<br>2. Enter amount (e.g., ₹200).<br>3. Complete dummy payment via Razorpay. | - Success message displayed.<br>- Balance updates to reflect new amount.<br>- Transaction appears in "Recent Transactions". | Use Browser |
| **TS03** | **Book Service - Insufficient Funds** | 1. Ensure Wallet Balance < ₹100.<br>2. Go to "Book Cleaning Service".<br>3. Fill details and proceed to Confirmation Page.<br>4. Observe UI.<br>5. Click "Confirm Booking". | - Wallet Balance displayed in Red.<br>- "Minimum ₹100 required" warning shown.<br>- Alert pops up prompts for recharge.<br>- Redirects to Wallet page. | Use Browser |
| **TS04** | **Book Service - Sufficient Funds** | 1. Ensure Wallet Balance >= ₹100 (from TS02).<br>2. Go to "Book Cleaning Service".<br>3. Fill details and proceed to Confirmation Page.<br>4. Click "Confirm Booking". | - Booking successful.<br>- Redirects to Request Status/Success page.<br>- backend: Order created with `orderType: cleaning_service`. | Use Browser |
| **TS05** | **Commission Deduction** | 1. Complete steps in TS04.<br>2. (Simulation) Login as Admin/Scrapper and mark order as `completed`.<br>3. Login as User and check Wallet. | - Wallet balance reduced by ₹1.<br>- Transaction history shows "Commission/Service Fee" deduction of ₹1. | Use Browser |
| **TS06** | **Withdraw Funds** | 1. Click "Withdraw".<br>2. Enter amount valid (e.g., ₹50).<br>3. Enter Bank Details.<br>4. Submit. | - Success message.<br>- Balance deducted.<br>- Transaction history shows "Withdrawal" (Pending). | Use Browser |

## Execution Notes
- Use the browser tool to navigate through the frontend flows for TS01-TS06.
- The browser subagent will record these sessions.

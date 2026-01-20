# Waste Cleaning Service Implementation Plan

## Overview
This feature introduces a "Service-Based" model where users can book Scrappers for cleaning tasks. Unlike the "Scrap" model (where Scrappers pay Users), here **Users pay Scrappers** for the service.

---

## Phase 1: Backend Core & Database Architecture

### 1.1 Update Constants & Config
- **File:** `backend/config/constants.js`
- **Action:**
    - Define `ORDER_TYPES`: `['SCRAP_SELL', 'CLEANING_SERVICE']`.
    - Define `SERVICE_CATEGORIES`: (e.g., 'Home Cleaning', 'Garage Cleaning', 'Debris Removal').
    - Update `ORDER_STATUS` if specific statuses are needed for services (e.g., 'service_started').

### 1.2 Database Schema Updates
- **File:** `backend/models/Order.js`
    - Add `orderType` field (Default: `SCRAP_SELL`).
    - Add `serviceDetails` object:
        - `serviceType`: String (from Price/Service list).
        - `description`: String (User's custom notes).
    - Add `serviceFee`: Number (The amount User pays).
    - **Optimization:** Ensure `totalAmount` logic handles negative flow or we add a `paymentDirection` field (`USER_TO_SCRAPPER` vs `SCRAPPER_TO_USER`).
- **File:** `backend/models/Price.js`
    - Add `type`: `['MATERIAL', 'SERVICE']`.
    - For Services: `price` is "Fixed Price" or "Hourly Rate" instead of "Per Kg".

### 1.3 Backend Controller Logic
- **File:** `backend/controllers/orderController.js`
    - **Create Order:** Add logic to handle `CLEANING_SERVICE` creation.
        - Skip weight validation.
        - Fetch fixed service price from DB.
        - Set payment direction to `USER_TO_SCRAPPER`.

---

## Phase 2: User Module Frontend (New Booking Flow)

### 2.1 Category Page update
- **File:** `frontend/src/modules/user/components/AllCategoriesPage.jsx`
- **Action:**
    - Add a divider/section header: "Cleaning Services".
    - Render Service Cards (managed by Admin) below Scrap Categories.
    - Click action triggers the new `ServiceBookingFlow`.

### 2.2 New Booking Flow Components (Wizard)
Create a new folder `frontend/src/components/ServiceBookingFlow/`:
1.  **`ServiceSelectionPage.jsx`**: Select specific cleaning type (Room, Outdoor, Debris).
2.  **`ServiceDetailsPage.jsx`**:
    - Text Area for "What needs cleaning?".
    - Option to upload photos of the mess (Reuse existing `ImageUploadPage`).
3.  **`ServiceSchedulePage.jsx`**: (Reuse existing logic, but update context).
4.  **`ServiceConfirmationPage.jsx`**:
    - **CRITICAL UI CHANGE:** Show "You Pay" (Red/Bold) instead of "Estimated Value" (Green).
    - Breakdown of Service Charges.

### 2.3 Order History Updates
- **File:** `frontend/src/modules/user/components/MyRequestsPage.jsx`
- **Action:**
    - Distinct UI for Service Requests (e.g., different border color or icon).
    - Status badges should reflect the service state.

---

## Phase 3: Admin Panel (Service Management)

### 3.1 Price/Service Editor
- **File:** `frontend/src/modules/admin/components/PriceFeedEditor.jsx`
- **Action:**
    - Add Toggle: "Material Price" vs "Service Price".
    - If "Service":
        - Hide "Region" (if services are universal) or keep it.
        - Change label "Price per Kg" to "Service Fee (₹)".
    - Allow Admin to CREATE, EDIT, DELETE service types dynamically.

---

## Phase 4: Scrapper Module (Execution Side)

### 4.1 Request Cards
- **File:** `frontend/src/modules/scrapper/components/ActiveRequestsPage.jsx`
- **Action:**
    -  Modify the Order Card.
    - **Conditional Rendering:**
        - If `orderType === 'CLEANING_SERVICE'`:
            - Show badge: "🧹 Cleaning Job".
            - Show **"Collect: ₹500"** (User pays you).
        - If `orderType === 'SCRAP_SELL'`:
            - Show standard "Pay: ₹200" (You pay user).
    - Audio Alert: Differentiate "New Cleaning Request" vs "New Scrap Request" (TTS Text update).

### 4.2 Job Handling (Details Page)
- **File:** `frontend/src/modules/scrapper/components/ActiveRequestDetailsPage.jsx`
- **Action:**
    - Remove "Digital Scale" & "Weight Input" for cleaning jobs.
    - Replace with **"Task Checklist"**:
        1. "Reach Location"
        2. "Inspect Work"
        3. "Complete Cleaning"
        4. "Collect Payment" -> Input amount collected (if cash) or Confirm Online Payment.

---

## Phase 5: Testing & Integration

### 5.1 End-to-End Flow Check
1.  **Admin:** Add "Garage Cleaning" service @ ₹500.
2.  **User:** See "Garage Cleaning", Book it, See "Pay ₹500" estimation.
3.  **Scrapper:** Receive Request "Collect ₹500", Accept, Navigate, Complete.
4.  **Database:** Verify Order is saved with `orderType: 'CLEANING_SERVICE'`.

---

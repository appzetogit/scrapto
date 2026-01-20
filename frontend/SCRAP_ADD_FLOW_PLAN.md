# Scrap Add Flow - Implementation Plan

## Overview
Multi-stage flow for users to add scrap items with category selection, image upload, weight detection, and price calculation.

---

## Flow Stages

### **Stage 1: Category Selection Page**
**Trigger:** Click on the middle button in bottom navigation (the white circular button with layered icon)

**Purpose:** User selects the scrap category

**UI Components:**
- Full-screen modal/page overlay
- Category cards (same design as home page categories)
- Categories: Plastic, Metal, Paper, Electronics, Copper, Aluminium, etc.
- Each card shows:
  - Category image
  - Category name
  - Current market price per kg (from PriceTicker data)
- Smooth animations (Framer Motion) - cards slide in from bottom
- Theme: Background #f4ebe2, Primary color #64946e

**User Action:** Tap on a category card to proceed

---

### **Stage 2: Image Upload Page**
**Trigger:** After category selection

**Purpose:** User uploads photo(s) of their scrap

**UI Components:**
- Full-screen page with back button
- Image upload area:
  - Large drop zone with camera icon
  - "Tap to upload" or "Take Photo" button
  - Preview of uploaded image(s)
  - Option to add multiple images
- Image preview with edit/delete options
- Progress indicator showing "Step 2 of 4"
- Continue button (disabled until image uploaded)

**Features:**
- Camera integration for mobile
- File picker for web
- Image compression/optimization
- Modern card-based UI matching home page style

**User Action:** Upload image(s) and click Continue

---

### **Stage 3: Weight Input Page**
**Trigger:** After image upload

**Purpose:** User confirms/enters scrap weight

**UI Components:**
- Full-screen page with back button
- Image preview (small, top section)
- Weight input section:
  - Auto-detected weight display (from image analysis)
  - Manual input field (number input with kg unit)
  - Toggle to switch between auto/manual
  - Weight suggestions (common weights: 5kg, 10kg, 20kg, etc.)
- Real-time price calculation preview:
  - Weight × Market Price = Estimated Payout
  - Large, prominent display
- Progress indicator "Step 3 of 4"
- Continue button

**Automation:**
- Image analysis API/service to estimate weight
- Show loading state while analyzing
- Display confidence level (if available)

**User Action:** Confirm/enter weight and click Continue

---

### **Stage 4: Price Confirmation & Apply Page**
**Trigger:** After weight confirmation

**Purpose:** Final review and submission

**UI Components:**
- Full-screen page with back button
- Summary card showing:
  - Selected category (with icon)
  - Uploaded image(s) thumbnail
  - Weight (kg)
  - Market price per kg
  - **Total estimated payout** (large, highlighted)
- Additional options:
  - Add notes/description (optional)
  - Preferred pickup time (optional)
- Progress indicator "Step 4 of 4"
- **Apply/Submit button** (large, green #64946e)

**User Action:** Review details and click "Apply" to submit request

---

## Technical Implementation Plan

### **Component Structure**

```
src/components/
├── AddScrapFlow/
│   ├── index.jsx (Main container with state management)
│   ├── CategorySelection.jsx (Stage 1)
│   ├── ImageUpload.jsx (Stage 2)
│   ├── WeightInput.jsx (Stage 3)
│   └── PriceConfirmation.jsx (Stage 4)
```

### **State Management**

**Main State (in Hero.jsx or AddScrapFlow/index.jsx):**
```javascript
const [showAddScrapFlow, setShowAddScrapFlow] = useState(false);
const [scrapData, setScrapData] = useState({
  category: null,
  images: [],
  weight: null,
  autoDetectedWeight: null,
  marketPrice: null,
  estimatedPayout: null,
  notes: '',
  preferredTime: null
});
const [currentStep, setCurrentStep] = useState(1);
```

### **Navigation Flow**

1. **Hero.jsx** - Middle button click → `setShowAddScrapFlow(true)`
2. **AddScrapFlow/index.jsx** - Manages step navigation
3. **Step transitions** - Use Framer Motion AnimatePresence with slide animations
4. **Back button** - Navigate to previous step or close flow

### **Integration Points**

1. **PriceTicker Component:**
   - Fetch current market prices for selected category
   - Display real-time price per kg

2. **Image Analysis Service:**
   - API endpoint for weight estimation
   - Image upload to backend
   - Return estimated weight + confidence

3. **Backend API:**
   - POST `/api/scrap/analyze-image` - Image analysis
   - GET `/api/scrap/market-prices` - Current prices
   - POST `/api/scrap/request` - Submit scrap request

---

## UI/UX Design Guidelines

### **Theme Consistency**
- **Background:** #f4ebe2 (beige/cream)
- **Primary Color:** #64946e (green)
- **Text Primary:** #2d3748 (dark gray)
- **Text Secondary:** #4a5568 (medium gray)
- **Cards:** White background with shadow

### **Animations**
- **Page Transitions:** Slide from right (forward), slide to left (back)
- **Card Entrances:** Fade in + slide up (staggered)
- **Button Hovers:** Scale up (1.05) + shadow increase
- **Loading States:** Skeleton loaders matching card shapes

### **Responsive Design**
- **Mobile-first:** Full-screen modals on mobile
- **Desktop:** Centered modal (max-width: 600px) with backdrop
- **Touch-friendly:** Large tap targets (min 44px)
- **Compact on mobile:** Optimize spacing for small screens

### **Visual Elements**
- **Icons:** SVG icons matching home page style
- **Images:** Rounded corners, proper aspect ratios
- **Buttons:** Rounded-full style, matching "Request Pickup Now" button
- **Progress Indicator:** Step dots or progress bar at top

---

## Data Flow

```
User clicks button
  ↓
Stage 1: Category Selection
  ↓ (category selected)
Stage 2: Image Upload
  ↓ (image uploaded → auto-analyze)
Stage 3: Weight Input
  ↓ (weight confirmed → calculate price)
Stage 4: Price Confirmation
  ↓ (user clicks Apply)
Submit to backend
  ↓
Show success message / Navigate to request tracking
```

---

## API Endpoints Needed

1. **GET /api/scrap/categories**
   - Returns list of available categories with current prices

2. **POST /api/scrap/analyze-image**
   - Upload image
   - Returns: { estimatedWeight, confidence, categorySuggestion }

3. **GET /api/scrap/market-price/:categoryId**
   - Returns current market price per kg for category

4. **POST /api/scrap/request**
   - Submit scrap request
   - Body: { category, images, weight, notes, preferredTime, location }
   - Returns: { requestId, status }

---

## Error Handling

- **Image upload fails:** Show error message, allow retry
- **Weight detection fails:** Fallback to manual input only
- **Price fetch fails:** Show cached price or default
- **Network errors:** Show retry button with offline message
- **Validation:** Ensure all required fields before proceeding

---

## Success Flow

After clicking "Apply":
1. Show loading state
2. Submit request to backend
3. On success:
   - Show success animation
   - Display request ID
   - Option to track request
   - Close flow and return to home
4. On error:
   - Show error message
   - Allow retry or go back to edit

---

## Next Steps (When Ready to Implement)

1. Create AddScrapFlow component structure
2. Implement Stage 1 (Category Selection)
3. Implement Stage 2 (Image Upload)
4. Integrate image analysis API
5. Implement Stage 3 (Weight Input)
6. Implement Stage 4 (Price Confirmation)
7. Connect to backend APIs
8. Add error handling and loading states
9. Test flow end-to-end
10. Polish animations and transitions

---

## Notes

- Maintain same design language as Hero page
- Use Framer Motion for all animations
- Ensure smooth transitions between steps
- Keep mobile-first approach
- Test on various screen sizes
- Consider offline capability for later


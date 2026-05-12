# Project Summary: Glowzy (Cosmetic E-Commerce)

## Project Overview
Glowzy is a full-stack beauty e-commerce platform with:
- Customer storefront (Next.js)
- Admin panel (within same Next.js app)
- Backend API (Node.js + Express + MongoDB)

Core focus:
- Premium UI/UX (Gen-Z + modern Korean-inspired aesthetic)
- Mystery Box as signature feature
- Admin-driven catalog and merchandising control

---

## Repositories / Paths
- Frontend: `/var/www/html/learning/cosmetic-ecomm`
- Backend: `/var/www/html/learning/cosmetic-ecomm-backend`

Frontend points to deployed backend via:
- `NEXT_PUBLIC_API_URL=https://cosmetic-ecomm-backend.vercel.app/api`

---

## Tech Stack

### Frontend
- Next.js (App Router, Client Components)
- React + Redux Toolkit
- Tailwind CSS
- Axios API client (`lib/api.js`)
- React Hot Toast

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Joi validation
- JWT auth
- Razorpay integration
- Cloudinary image handling

---

## Key Implemented Features

### Auth & Access
- JWT-based login/signup
- Refresh token flow
- Static admin email override via env
- Admin guards in frontend + backend

### Products & Shop
- Product listing, detail, search, sort, filters
- Category filter (dynamic from backend categories)
- Brand filter support (`?brand=...`)
- Featured / New Arrival / Best Seller flags

### Categories (Admin-configurable)
- Backend category model + CRUD API
- Admin UI to add/delete categories
- Shop and homepage consume categories dynamically

### Brands (Collection-backed)
- `brands` collection added
- Auto-seeded Indian + international brands (Foxtale, Plix, Nykaa, etc.)
- Homepage “Shop by Brand” reads from DB
- Brand card links filter shop

### Orders
- Robust admin order management:
  - Search, filter, pagination, status update
  - CSV export
  - Detail modal
- Reorder removed from user side (admin-centric management)

### Mystery Box (Signature Section)
- Homepage section redesigned for premium prominence
- Strong value props + social proof layout
- Dynamic “Unboxing Reels” support

### Reels (Admin-manageable)
- `reels` collection added
- CRUD API for reels
- Admin page: `/admin/reels`
- Homepage mystery section reads reels dynamically

### UI/Branding
- Brand renamed Glowzy across app
- Header logo visibility fixes
- Reduced pink-heavy UI; moved to indigo/cyan premium palette
- Mobile header styled to app-like look
- “Everything Glowzy” section made premium + mobile horizontal shelf
- Quiz UI revamped with Gen-Z styling

---

## Backend Data Models Added/Updated
- Added: `Category`
- Added: `Brand`
- Added: `Reel`
- Updated: `Product` (category no longer hard enum, new flags for merchandising)

---

## API Enhancements
- Categories API (`/api/categories`) with admin CRUD
- Brands API (`/api/brands`) with initial seeding
- Reels API (`/api/reels`) with admin CRUD + seeding
- Products API supports:
  - `featured`, `newArrival`, `bestSeller`, `brand`, category, search, sort, pagination

---

## Environment / Deployment Notes

### Frontend
- Requires correct `NEXT_PUBLIC_API_URL`
- Uses remote images from Cloudinary, Unsplash, Clearbit (updated Next image config)

### Backend CORS
- Hardened/adjusted CORS handling for:
  - localhost
  - vercel domains
  - configurable allowed origins
- New env toggles:
  - `ALLOW_ALL_ORIGINS`
  - `ALLOW_HTTPS_ORIGINS`
  - `ALLOW_VERCEL_PREVIEW`

### Critical
After backend code changes, redeploy backend so frontend sees latest API behavior.

---

## Known Business Priorities
1. Mystery Box should remain the hero/standout feature.
2. Admin must control merchandising (categories, featured/new/bestseller, reels).
3. Homepage should feel premium, conversion-oriented, and mobile-polished.

---

## Current Admin Areas
- `/admin/products`
- `/admin/orders`
- `/admin/users`
- `/admin/coupons`
- `/admin/mystery-boxes`
- `/admin/reels` (new)
- `/admin/payments`

---

## Suggested Next Improvements (Optional)
- Full admin CRUD for brands (currently DB-seeded + public listing)
- Prevent deleting categories still in use by products
- Reels upload support (Cloudinary) instead of URL-only
- End-to-end smoke tests for homepage/shop/auth/admin critical paths

---

## Prompt Usage Instruction
When working on this project:
- Preserve Glowzy branding and premium aesthetic
- Keep Mystery Box as high-priority section
- Prefer admin-configurable data over hardcoded UI lists
- Ensure new UI changes are mobile-first and production-ready
- Validate CORS/auth behavior for deployed frontend domains
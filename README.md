# Catering Manager - Full-Stack Monorepo

Welcome to the **Catering Manager** application! This is a robust, enterprise-grade, comprehensive monolithic repository combining a highly optimized **Node.js** backend, a lightning-fast **React (Vite)** Web Dashboard, and a deeply integrated **React Native (Expo)** cross-platform mobile app.

Together, these three environments seamlessly communicate to deliver a top-tier operational management system for Catering businesses, bringing total control over Client CRM, Master Menu provisioning, and intense multi-event Order pipelines directly to your browsers and mobile devices.

Live app and Website access is as below:
APK Download link: https://drive.google.com/file/d/1xVN8t3jcPmtgzaLLVR_M-MkZ7ZbKWBiE/view?usp=sharing
Live site link: https://cater-pro-drab.vercel.app/

---

## 🏗️ Architecture & Modules

This repository is structured as a **Monorepo**, meaning all necessary sub-systems actively reside right here.

### 1. `web-frontend/` (The Desktop Administration Center)
- **Tech Stack:** React 18, Vite, Tailwind CSS, Framer Motion, Lucide-React.
- **Purpose:** A beautifully designed, horizontal, desktop-oriented administrative suite spanning Client Creation, Visual Timelines, deep Master Menu setups, and dynamic event dispatching.
- **Start Command:** `npm run dev`

### 2. `mobile-app/` (The Field Operations Hub)
- **Tech Stack:** React Native, Expo, React Navigation.
- **Purpose:** An intensely native, segmented mobile application mapped beautifully to the backend API. Delivers floating action buttons, localized camera APIs for profile configurations, swipable segmented menus, and deep tabbed interfaces—perfect for on-the-go management.
- **Start Command:** `npx expo start`

### 3. `backend/` (The Central Nervous System)
- **Tech Stack:** Node.js, Express.js, MongoDB (Mongoose), Cloudinary integration, JSON Web Tokens.
- **Purpose:** An absolutely secure API processing concurrent hybrid traffic from exactly two places—the Web Application and Mobile app. Protects endpoints rigorously using authentication middleware grids, and manipulates Cloudinary buckets dynamically for CRM Avatars and Corporate logos.
- **Start Command:** `npm run dev` (or `node server.js`)

---

## 🚀 Quick Start Guide

To initialize development servers across the entire stack, follow these steps locally:

**Prerequisite Environment Loading:**
Be explicitly sure to populate `.env` locally in the `/backend` (for your Mongo URI, JWT secrets, and Cloudinary keys), and `/mobile-app` (to target the active API bindings).

### Running the Backend
```bash
cd backend
npm install
npm run dev
```
*Your REST API will successfully mount locally at `http://localhost:5000` (or `EXPO_PUBLIC_API_URL`).*

### Running the Web Dashboard
```bash
cd web-frontend
npm install
npm run dev
```

### Running the Mobile Application
```bash
cd mobile-app
npm install
npx expo start
```
*Depending on testing requirements, use `i` for the local iOS Simulator or grab a mobile device to scan the generated QR Expo Go code overlay!*

---

## 🍱 Key Features Implemented
- **Unified Authentication Pipeline:** Seamlessly log in natively on a Phone or through a Web Browser interacting with identically secured JWT verification layers.
- **Master Menu Caching:** Advanced, segregated configurations to isolate Vegetarian and Non-Vegetarian menus while routing via multi-nested `SubCategories`.
- **Hybrid Order Creation:** Granular logic mapping hundreds of individual "Sub Events" (e.g., Luncheon, Breakfast) under massive unified Corporate Orders.
- **Cross-Component Synchronization:** Modifying your master business logo on Mobile natively hydrates states safely updating it simultaneously backward to Web.
- **Complete CRM Filtration:** Type-to-find natively mapped useMemo filters seamlessly isolating Client profiles instantaneously across arrays containing massive sets.

---

## 🔒 Security
All API endpoints dynamically lock via an inline Bearer token authorization guard enforcing authentication checks against active User profiles mapped internally natively to MongoDB's unique IDs. 

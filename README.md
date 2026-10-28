# Campus Resource Exchange

> **Unlock Resources. Empower Innovation.**

---

## 📌 Problem Statement
*"Unlock Underused Equipment and Spaces"*

Universities host cutting-edge instruments, camera packages, high-performance computing clusters, and fabrication tools spread across disparate labs and departments. However, these valuable assets often sit idle due to lack of visibility, fragmented access procedures, and lack of trusted governance.

**Campus Resource Exchange** bridges this gap by enabling students, faculty, and cross-departmental researchers to discover, request, and share campus resources safely. The platform's core differentiator is **Trusted and Fair Resource Sharing**, not simply ad-hoc booking.

---

## 🚀 Phase 1: Frontend Foundation + Resource Discovery

Phase 1 delivers a clean, responsive, and decoupled frontend architecture built with:
- **React 18** + **Vite 6** + **TypeScript 5**
- **Tailwind CSS 3** with custom campus deep-navy & cyan accents
- **Lucide React** icon library

### What's Included in Phase 1:
1. **Interactive Resource Catalog**:
   - High-fidelity visual cards for equipment across 6 categories (Laboratory Equipment, Computers & Electronics, Cameras & Media, Engineering Tools, Presentation Equipment, Other).
   - Real-time combined filtering by Category, Availability Status, and Campus Building.
   - Real-time client-side search across equipment names, models, department custodians, and specifications.
   - Dynamic sorting by Name (A-Z, Z-A), Availability (Available First), and Category.
2. **Dynamic Summary Metrics**:
   - Total resources count, Available Now count, Active categories count, and Resources requiring specialized verification.
   - Dynamically calculated from the decoupled mock data layer.
3. **Comprehensive Resource Details Modal**:
   - Detailed specifications, included accessories, room locations, custodian contact info, and usage rules.
   - Prominent **Request Access** action with informative Phase 1 notice explaining that booking workflows will activate in Phase 2 & 4.
4. **Application Shell & Navigation**:
   - Responsive sidebar with desktop and mobile slide-over drawer.
   - Top contextual app header with search synchronization, notification tray, and student profile.
   - Clean placeholder views for upcoming modules (My Requests, My Bookings, Saved Resources, Lab Dashboard, Settings) indicating their scheduled phases.
   - Local bookmark/saved equipment persistence via browser `localStorage`.

---

## 📂 Project Structure

```
CampusResourceExchange/
├── index.html                     # HTML5 entry with Plus Jakarta Sans typography
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript compiler settings
├── vite.config.ts                 # Vite bundler configuration
├── tailwind.config.js             # Tailwind CSS theme with campus color palette
├── postcss.config.js              # PostCSS plugins
├── scripts/
│   ├── verify-phase1.js           # Verification check suite
│   ├── test-filtering.js          # Unit & integration tests for search/filter/sort
│   └── test-server.js             # Static production build verification server
├── src/
│   ├── main.tsx                   # React DOM root entry
│   ├── App.tsx                    # Shell layout and navigation state
│   ├── index.css                  # Tailwind styles and custom scrollbars
│   ├── types/
│   │   └── resource.ts            # Domain types matching future backend schema
│   ├── data/
│   │   └── mockResources.ts       # Decoupled mock dataset and accessor helpers
│   ├── hooks/
│   │   └── useResourceFilters.ts  # Filter, search, and sorting state machine
│   ├── components/
│   │   ├── common/
│   │   │   └── ImageWithFallback.tsx  # Graceful fallback handler for broken/slow media
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx     # Desktop navigation sidebar
│   │   │   ├── AppHeader.tsx      # Top bar with search and profile
│   │   │   └── MobileNavigation.tsx # Slide-over mobile drawer
│   │   ├── resources/
│   │   │   ├── ResourceCard.tsx   # Equipment display card with status badges
│   │   │   ├── ResourceGrid.tsx   # Responsive grid layout with empty state
│   │   │   ├── ResourceFilters.tsx# Category pills and dropdown controls
│   │   │   ├── ResourceSearch.tsx # Search input with instant clear
│   │   │   ├── ResourceSummaryCards.tsx # Dynamic inventory metric cards
│   │   │   └── ResourceDetailsModal.tsx # Full asset inspection modal
│   │   └── ui/
│   │       ├── Badge.tsx          # Status and category pill badges
│   │       ├── Button.tsx         # Accessible interactive button primitive
│   │       ├── EmptyState.tsx     # Filter empty state with reset trigger
│   │       └── Modal.tsx          # Accessible modal dialog with backdrop blur
│   └── pages/
│       ├── DiscoverResources.tsx  # Main Phase 1 catalog exploration view
│       └── PlaceholderPage.tsx    # Clean upcoming phase previews
```

---

## 🛠️ Running the Project

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended; v24 verified)
- npm (v9 or higher)

### Installation
```bash
npm install
```

### Development Server
Run the local Vite development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Type Check & Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Run Phase 1 Verification Suites
```bash
node scripts/verify-phase1.js
node scripts/test-filtering.js
```

---

## 🗺️ Roadmap & Future Phases

- **Phase 1 (Complete)**: Frontend Foundation + Resource Discovery (React, Vite, TS, Tailwind, Lucide).
- **Phase 2**: FastAPI Backend, PostgreSQL database, SQLAlchemy models, Alembic migrations, and persistent REST API integration.
- **Phase 3**: Authentication (University SSO / OAuth), user roles (Student, Faculty, Lab Custodian, Admin), and safety certification verification.
- **Phase 4**: Booking requests, custodian approval/rejection workflows, conflict-free scheduling engine, waitlists, and cancellation management.
- **Phase 5**: Digital check-in/check-out with QR/keycard handovers, condition reporting, damage incident logs, and automated notification alerts.
- **Phase 6**: FairShare allocation rules, department utilization analytics dashboards, audit reporting, and security hardening.

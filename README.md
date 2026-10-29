# Campus Resource Exchange

> **Unlock Resources. Empower Innovation.**

---

## 📌 Problem Statement
*"Unlock Underused Equipment and Spaces"*

Universities host cutting-edge instruments, camera packages, high-performance computing clusters, and fabrication tools spread across disparate labs and departments. However, these valuable assets often sit idle due to lack of visibility, fragmented access procedures, and lack of trusted governance.

**Campus Resource Exchange** bridges this gap by enabling students, faculty, and cross-departmental researchers to discover, request, and share campus resources safely. The platform's core differentiator is **Trusted and Fair Resource Sharing**, not simply ad-hoc booking.

---

## 🏗️ Technology Stack

### Frontend (React + Vite + TypeScript)
- **Framework:** React 18 + Vite 6 + TypeScript 5
- **Styling:** Tailwind CSS 3 (Deep Navy `#060a17`, Cyan `#06b6d4`, Emerald `#10b981`)
- **Icons:** Lucide React
- **Authentication & RBAC:** React Context (`AuthContext`), persistent JWT token handling in `apiClient`
- **Pages & Modules:**
  - Resource Discovery Catalog & Filter Controls
  - "My Clearances" Training & Safety Verification Dashboard
  - Custodian & Admin "Review Queue" for approving/rejecting clearances
  - Administrator User & Role Management Table
  - Bookmarked / Saved Resources View

### Backend (FastAPI + PostgreSQL + SQLAlchemy)
- **Framework:** FastAPI (Python 3.10+)
- **Server:** Uvicorn with ASGI hot reload
- **Database Engine:** PostgreSQL (with SQLite in-memory for automated tests)
- **ORM:** SQLAlchemy 2.x
- **Driver:** psycopg v3 (binary)
- **Security:** bcrypt password hashing + PyJWT Bearer token authentication
- **RBAC:** Reusable FastAPI dependencies (`get_current_user`, `require_roles`)
- **Migrations:** Alembic
- **Testing:** pytest (34 unit and integration test cases)

---

## 👥 Role-Based Access Control (RBAC)

The platform enforces four campus roles:
1. **Student (`Student`):** Public registration default. Can browse equipment, submit safety clearance documentation, and view active verified badges.
2. **Faculty Researcher (`Faculty Researcher`):** Cross-lab research privileges for specialized equipment.
3. **Lab Custodian (`Lab Custodian`):** Manages lab facilities; reviews student documentation, verifies training credentials, and approves clearances with audit notes.
4. **Administrator (`Admin`):** Full campus oversight; bootstrapped via environment configuration; manages user roles and permissions.

---

## 📂 Project Architecture

```
CampusResourceExchange/
├── backend/                       # FastAPI Backend
│   ├── app/
│   │   ├── main.py                # App entrypoint, CORS, exception handling
│   │   ├── seed.py                # Database seed script & admin bootstrap
│   │   ├── core/
│   │   │   ├── config.py          # Settings, JWT, Admin bootstrap config
│   │   │   ├── database.py        # SQLAlchemy engine, session maker, get_db
│   │   │   ├── security.py        # Password hashing & JWT operations
│   │   │   └── dependencies.py    # get_current_user, require_roles
│   │   ├── models/                # User, EligibilityVerification, Resource, etc.
│   │   ├── schemas/               # Pydantic validation & response models
│   │   ├── routers/               # auth.py, eligibility.py, resources.py
│   │   └── services/              # auth_service.py, eligibility_service.py, resource_service.py
│   ├── alembic/                   # Database migrations (001, 002)
│   ├── tests/                     # 34 pytest cases (test_auth, test_eligibility, test_resources)
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Backend environment template
│   └── README.md                  # Comprehensive backend documentation
├── src/                           # React Frontend
│   ├── components/
│   │   ├── auth/                  # AuthModal (Sign In / Student Register / Demo shortcuts)
│   │   ├── eligibility/           # VerificationRequestModal
│   │   ├── layout/                # AppSidebar, AppHeader, MobileNavigation
│   │   ├── resources/             # ResourceCard, ResourceGrid, ResourceFilters,
│   │   │                          # ResourceSearch, ResourceSummaryCards, ResourceDetailsModal
│   │   └── ui/                    # Badge, Button, EmptyState, Modal
│   ├── context/                   # AuthContext (user, token, role, quick login)
│   ├── pages/                     # DiscoverResources, EligibilityDashboard,
│   │                              # VerificationReviewQueue, AdminUsersPage, PlaceholderPage
│   ├── services/                  # api.ts, authService.ts, eligibilityService.ts, resourceService.ts
│   ├── types/                     # auth.ts, resource.ts
│   ├── App.tsx                    # App shell with AuthProvider & role-based routing
│   └── main.tsx                   # React root entry
└── package.json
```

---

## ⚡ Quickstart Guide

### 1. Backend Setup

```bash
# 1. Activate Python virtual environment
backend\.venv\Scripts\Activate.ps1

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Create .env from template
copy backend\.env.example backend\.env

# 4. Run database migrations
cd backend
alembic upgrade head

# 5. Seed data and bootstrap admin
python -m app.seed

# 6. Run FastAPI server from project root (Port 8000)
uvicorn app.main:app --app-dir backend --reload --port 8000
# OR:
uvicorn backend.app.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
# 1. Install dependencies
npm install

# 2. Run Vite development server (Port 3000)
npm run dev

# 3. Production build & TypeScript check
npm run build
```

---

## 🧪 Running Automated Tests

Run backend tests:
```bash
& "backend/.venv/Scripts/python.exe" -m pytest backend/tests -v
```
All 34 tests will pass against an isolated test database.

Run frontend TypeScript check:
```bash
npx tsc --noEmit
```

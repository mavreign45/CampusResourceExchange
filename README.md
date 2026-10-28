# Campus Resource Exchange

> **Unlock Resources. Empower Innovation.**

---

## 📌 Problem Statement
*"Unlock Underused Equipment and Spaces"*

Universities host cutting-edge instruments, camera packages, high-performance computing clusters, and fabrication tools spread across disparate labs and departments. However, these valuable assets often sit idle due to lack of visibility, fragmented access procedures, and lack of trusted governance.

**Campus Resource Exchange** bridges this gap by enabling students, faculty, and cross-departmental researchers to discover, request, and share campus resources safely. The platform's core differentiator is **Trusted and Fair Resource Sharing**, not simply ad-hoc booking.

---

## 🏗️ Technology Stack

### Frontend (Phase 1 & Phase 2 Integration)
- **Framework:** React 18 + Vite 6 + TypeScript 5
- **Styling:** Tailwind CSS 3 (Deep Navy `#060a17` / `#0a1128`, Cyan `#06b6d4`, Emerald `#10b981`)
- **Icons:** Lucide React
- **API Client:** Type-safe fetch client with timeout, error handling, and explicit fallback mode

### Backend (Phase 2)
- **Framework:** FastAPI (Python 3.10+)
- **Server:** Uvicorn with ASGI hot reload
- **Database Engine:** PostgreSQL
- **ORM:** SQLAlchemy 2.x
- **Driver:** psycopg v3 (binary)
- **Configuration:** Pydantic v2 + pydantic-settings
- **Migrations:** Alembic
- **Testing:** pytest + HTTPX

---

## 📂 Project Architecture

```
CampusResourceExchange/
├── backend/                       # Phase 2 FastAPI Backend
│   ├── app/
│   │   ├── main.py                # FastAPI entry, CORS, exception handling
│   │   ├── seed.py                # Idempotent database seed script
│   │   ├── core/
│   │   │   ├── config.py          # Environment settings (pydantic-settings)
│   │   │   └── database.py        # SQLAlchemy engine, session maker, get_db
│   │   ├── models/                # Relational ORM models
│   │   │   ├── category.py        # Category entity
│   │   │   ├── location.py        # Location entity
│   │   │   ├── custodian.py       # Custodian entity
│   │   │   └── resource.py        # Resource entity with foreign keys
│   │   ├── schemas/               # Pydantic response models
│   │   │   ├── category.py
│   │   │   ├── location.py
│   │   │   ├── custodian.py
│   │   │   └── resource.py
│   │   ├── routers/
│   │   │   └── resources.py       # GET /resources, /summary, /{id}
│   │   └── services/
│   │       └── resource_service.py # Filter/sort/pagination logic
│   ├── alembic/                   # Database migrations
│   │   ├── env.py
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   ├── tests/
│   │   ├── conftest.py            # SQLite in-memory test fixtures
│   │   └── test_resources.py      # 13 backend test cases
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Backend environment template
│   ├── alembic.ini                # Alembic configuration
│   └── README.md                  # Dedicated backend documentation
├── src/                           # Phase 1 & 2 Frontend
│   ├── components/
│   │   ├── common/                # ImageWithFallback
│   │   ├── layout/                # AppSidebar, AppHeader, MobileNavigation
│   │   ├── resources/             # ResourceCard, ResourceGrid, ResourceFilters,
│   │   │                          # ResourceSearch, ResourceSummaryCards, ResourceDetailsModal
│   │   └── ui/                    # Badge, Button, EmptyState, Modal
│   ├── data/                      # mockResources.ts (offline fallback / seed reference)
│   ├── hooks/                     # useResourceFilters.ts
│   ├── pages/                     # DiscoverResources.tsx, PlaceholderPage.tsx
│   ├── services/                  # api.ts, resourceService.ts (REST integration)
│   ├── types/                     # resource.ts (Domain models and API DTOs)
│   ├── App.tsx                    # Main layout shell and navigation state
│   ├── main.tsx                   # React root entry
│   └── index.css                  # Tailwind styles
├── .env.example                   # Frontend environment template
├── package.json                   # Frontend npm configuration
├── tailwind.config.js             # Campus theme configuration
└── tsconfig.json                  # TypeScript compiler settings
```

---

## ⚡ Quickstart Guide

### 1. Backend Setup (FastAPI & PostgreSQL)

```bash
# 1. Create and activate virtual environment
python -m venv backend/.venv
backend\.venv\Scripts\Activate.ps1    # On Windows
# source backend/.venv/bin/activate    # On Linux/macOS

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL credentials

# 4. Apply database migrations
& "backend/.venv/Scripts/alembic.exe" -c backend/alembic.ini upgrade head

# 5. Seed fictional campus catalog
& "backend/.venv/Scripts/python.exe" -m app.seed

# 6. Start backend development server
& "backend/.venv/Scripts/uvicorn.exe" app.main:app --app-dir backend --reload --port 8000
```

Interactive API documentation will be available at:
- Swagger UI: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- Health Check: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)

### 2. Frontend Setup (React & Vite)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional, defaults to http://localhost:8000/api/v1)
cp .env.example .env

# 3. Start frontend development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Testing

### Run Backend Tests (pytest)
```bash
& "backend/.venv/Scripts/python.exe" -m pytest backend/tests -v
```
*Executes 13 unit and integration tests covering response schemas, combined filters, search, pagination, 404 handling, summary calculations, and validation rules against an isolated in-memory test database.*

### Verify Frontend TypeScript & Production Build
```bash
# Typecheck
npx tsc --noEmit

# Production build
npm run build
```

---

## 🗺️ Roadmap & Phase Progression

- [x] **Phase 1: Frontend Foundation + Resource Discovery** (React 18, Vite, TypeScript, Tailwind, Lucide).
- [x] **Phase 2: FastAPI Backend, PostgreSQL Models, API Integration & Persistence** (FastAPI, SQLAlchemy 2.x, psycopg, Alembic, live API integration, loading & error recovery).
- [ ] **Phase 3: Authentication & Verification Engine** (University SSO, user accounts, student/faculty/custodian roles, safety training credentials).
- [ ] **Phase 4: Booking & Approval Workflows** (Request submission, custodian approval/rejection queue, conflict prevention, waitlists).
- [ ] **Phase 5: Check-in/Check-out & Custody Operations** (QR/keycard handover verification, return deadlines, damage incident logging).
- [ ] **Phase 6: FairShare Allocation & Analytics Dashboard** (FairShare allocation algorithm, equipment utilization heatmaps, audit reporting).

# Forge

> **Build. Submit. Judge.**  
> An open-source, self-hostable platform for hackathon submissions and judging built for the **DOGFOOD 2026** hackathon.

---

## 1. What is Forge?

Forge is a reliable, developer-centric hackathon management platform providing complete Tier 1 + Tier 2 submission and judging workflows:
- **Public Project Gallery**: Open access to all submissions with search, track filtering, and architectural specifications without requiring authentication.
- **Participant Workspace**: Team creation, code sharing, project draft iteration, and submission deadline enforcement.
- **Dynamic Rubric Judging**: Server-authoritative weighted rubric evaluation with zero hardcoded criteria.
- **Cross-Judge Normalization**: Z-score calibration on a 5-point scale to remove judge scoring biases.
- **Strict Authorization & Isolation**: Strong server-side role enforcement preventing participants from viewing scores and preventing judges from inspecting peer reviews.
- **Organizer Telemetry & Export**: Live judging progress counters, assignment matrix, and authenticated CSV leaderboard export.

---

## 2. Project Structure

```text
/
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS
├── backend/                      # Python 3.12 + Flask + SQLite
├── docker-compose.yml            # Multi-container local orchestration
├── .dogfood.toml                 # DOGFOOD test configuration
├── acceptance-report.txt         # Official test output report (All 7 checks PASS)
├── README.md                     # Project overview and runbook
├── ARCHITECTURE.md               # Technical architecture & security model
├── DATA-MODEL.md                 # Relational schema & entity relationships
├── JUDGING.md                    # Scoring algorithm & normalization math
├── LICENSE                       # MIT License
├── fixtures.json                 # Seed fixtures & test dataset
└── run.py                        # DOGFOOD acceptance test runner
```

---

## 3. Running Locally

### Option A: Standard Local Setup

#### Prerequisites
- Node.js >= 18
- Python >= 3.11

#### 1. Backend Setup & Startup
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start the Flask API server (runs on http://localhost:8000 and auto-seeds database)
python3 backend/app.py
```

#### 2. Frontend Setup & Startup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** to access the web portal.

---

### Option B: Docker Compose

Start the full stack with persistent local storage:
```bash
docker compose up --build
```
- Frontend: **`http://localhost:5173`**
- Backend: **`http://localhost:8000`**

---

## 4. Database Seeding & Credentials

The database initializes automatically on startup from `fixtures.json`. You can also manually re-seed at any time:
```bash
python3 backend/seed.py
```

### Pre-Configured Test Accounts

| Role | Email | Password | Pre-seeded API Bearer Token |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@forge.internal` | `forge2026` | `forge_admin_token_2026` |
| **Organizer** | `organizer@forge.internal` | `forge2026` | `forge_organizer_token_2026` |
| **Judge A** | `judge_a@forge.internal` | `forge2026` | `forge_judge_a_token_2026` |
| **Judge B** | `judge_b@forge.internal` | `forge2026` | `forge_judge_b_token_2026` |
| **Participant** | `participant@forge.internal` | `forge2026` | `forge_participant_token_2026` |

*Tip: Use the **Role Switcher** dropdown in the web navigation bar to instantly switch between active roles in real time.*

---

## 5. Running DOGFOOD Acceptance Checks

Run the automated test runner against the running portal:
```bash
python3 run.py .dogfood.toml > acceptance-report.txt
cat acceptance-report.txt
```

Expected output:
```text
T1  gallery is public ......................... PASS
T1  project from fixtures shown ............... PASS
T1  closed event refuses submissions .......... PASS
T2  judge sees own scores ..................... PASS
T2  judge cannot see peer scores .............. PASS
T2  participant blocked ....................... PASS
T2  csv export works .......................... PASS
```

### Running Backend Unit & Integration Tests
```bash
python3 backend/tests/test_backend.py
```

---

## 6. Cloud Deployment (Render + Vercel)

Forge is configured for production cloud deployment:
- **Backend on Render**: Python Flask + Gunicorn web service with auto-seeding. Blueprint included in [`render.yaml`](./render.yaml).
- **Frontend on Vercel**: Vite React SPA with client-side rewrites configured in [`vercel.json`](./vercel.json).

For full step-by-step instructions with environment variables and verification commands, see [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 7. Known Limitations & Scope Control

In accordance with DOGFOOD T1/T2 requirements:
- Community voting, comments, and public cryptographic proofs are intentionally omitted to prioritize scoring reliability, deterministic normalization, and data isolation.
- Single-event hackathon model with local SQLite persistence.

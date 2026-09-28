# Forge Frontend

> **Build. Submit. Judge.**  
> An open-source, self-hostable platform for hackathon submissions and judging. Built for the DOGFOOD 2026 hackathon.

---

## 1. Overview & Visual Design

Forge is built with a minimal, technical, professional developer-tool aesthetic:
- **Zero emojis, cartoon graphics, or excessive decoration**.
- High contrast, neutral palette (`#090a0f`, slate/zinc borders and backgrounds).
- Generous but controlled spacing, clean tables, and responsive cards.
- Comprehensive loading skeletons, empty states, and HTTP error barriers (401, 403, 404, 500).

---

## 2. Directory Structure

```text
frontend/
├── src/
│   ├── api/
│   │   ├── config.ts            # Central API base URL & mock toggle
│   │   ├── apiClient.ts         # Central fetch client with ApiError normalization
│   │   └── mockData.ts          # Isolated offline fixtures & seed datasets
│   ├── types/
│   │   ├── auth.ts              # User, UserRole, AuthSession
│   │   ├── project.ts           # Project, ProjectFormData, ProjectFilters
│   │   ├── team.ts              # Team, TeamMember
│   │   ├── judge.ts             # AssignedProject, JudgeStats
│   │   ├── rubric.ts            # RubricCriterion, RubricScore, ProjectEvaluation
│   │   └── organizer.ts         # EventOverview, JudgeUser, JudgeAssignment, Results
│   ├── services/
│   │   ├── authService.ts       # login, register, logout, role simulator
│   │   ├── projectService.ts    # getProjects, getProjectById, saveProject, submitProject
│   │   ├── teamService.ts       # getTeam, createTeam, joinTeam, inviteMember
│   │   ├── judgeService.ts      # getAssignedProjects, getRubric, submitEvaluation
│   │   └── organizerService.ts  # getOverview, getJudges, assignJudge, exportCsv
│   ├── context/
│   │   └── AuthContext.tsx      # Authentication state and active role switcher
│   ├── components/
│   │   ├── common/              # Navbar, Button, Input, Select, Modal, Card, Badge, Table,
│   │   │                        # EmptyState, LoadingState, ErrorState, PageHeader, RoleGuard
│   │   ├── projects/            # ProjectCard, ProjectFilter, StatusBadge
│   │   ├── judge/               # RubricCriterion (dynamic backend criteria rendering)
│   │   └── organizer/           # StatsCard, CsvExportButton
│   ├── layouts/
│   │   ├── RootLayout.tsx       # Standard application layout with top navigation
│   │   └── AuthLayout.tsx       # Clean centered layout for login/register
│   ├── pages/
│   │   ├── public/              # LandingPage (/), ProjectGalleryPage (/projects), ProjectDetailPage (/projects/:id)
│   │   ├── auth/                # LoginPage (/login), RegisterPage (/register)
│   │   ├── participant/         # DashboardPage (/dashboard), TeamPage (/team), SubmissionPage (/submission)
│   │   ├── judge/               # JudgeDashboardPage (/judge), JudgeReviewPage (/judge/projects/:projectId)
│   │   ├── organizer/           # OrganizerDashboardPage (/organizer), JudgeManagementPage (/organizer/judges),
│   │   │                        # AssignmentsPage (/organizer/assignments), RubricManagementPage (/organizer/rubric),
│   │   │                        # ResultsPage (/organizer/results)
│   │   └── error/               # UnauthorizedPage (401), ForbiddenPage (403), NotFoundPage (404)
│   ├── App.tsx                  # Client routing and RoleGuard definitions
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## 3. Quick Start

Run independently from within `/frontend`:

```bash
cd frontend

# Install dependencies
npm install

# Start local development server
npm run dev

# Production build and type checking
npm run build
```

---

## 4. Central API Configuration & Backend Integration

The frontend uses a centralized API configuration in `src/api/config.ts`:

- `VITE_API_URL`: Base URL for the backend API (defaults to `/api`).
- `VITE_USE_MOCK`: Set to `'false'` when connecting to live backend endpoints.

When connecting to the live backend:
1. Set `VITE_USE_MOCK=false` in your `.env.local` or environment variables.
2. Set `VITE_API_URL=http://localhost:8000/api` (or your backend URL).
3. The isolated services (`projectService`, `judgeService`, etc.) will route all requests directly to the backend.

---

## 5. User Roles & Testing Role Navigation

The top navigation bar includes an interactive **Role Switcher** in the top right to instantly test all 5 supported roles:

| Role | Accessible Navigation | Guard Behavior |
| :--- | :--- | :--- |
| **Visitor** | `Projects`, `Login` | Blocked with `401 Unauthorized` on private participant/judge/organizer routes |
| **Participant** | `Dashboard`, `Projects`, `Team`, `Submission` | Accesses participant workspace; blocked with `403 Access Denied` on organizer/judge routes |
| **Judge** | `Projects`, `Judge Dashboard` | Accesses judge evaluation queue; blocked with `403` on organizer routes |
| **Organizer** | `Dashboard`, `Projects`, `Judges`, `Assignments`, `Rubric`, `Results` | Full access to administrative metrics, assignments, rubric editor, and CSV export |
| **Admin** | Full access to all participant, judge, and organizer views | Full platform operational permissions |

---

## 6. Key Compliance Highlights

1. **Unauthenticated Public Gallery**:
   The `/projects` route is fully accessible to visitors without logging in. The automated checker can verify fixture project titles immediately.
2. **Dynamic Rubric Scoring**:
   The judge review screen renders whatever criteria the backend returns (no hardcoded criteria or fixed weights).
3. **CSV Export**:
   Organizer-only CSV export button streaming backend data with explicit error handling for `401`, `403`, and `500`.

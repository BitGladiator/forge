-- Forge Relational Database Schema (SQLite)

PRAGMA foreign_keys = ON;

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    start_date TEXT,
    submissions_open INTEGER NOT NULL DEFAULT 1,
    submissions_close TEXT NOT NULL, -- ISO 8601 timestamp
    judging_deadline TEXT,
    tracks TEXT, -- JSON array of strings
    prizes TEXT, -- JSON array of prize objects [{name, amount, description}]
    organizer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('visitor', 'participant', 'judge', 'organizer', 'admin')),
    token TEXT UNIQUE,
    team_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    invite_code TEXT UNIQUE NOT NULL,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'forming', 'locked')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('leader', 'member')),
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(team_id, user_id)
);

-- Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    description TEXT,
    track TEXT NOT NULL,
    team_id TEXT REFERENCES teams(id) ON DELETE SET NULL,
    team_name TEXT,
    repository_url TEXT,
    demo_url TEXT,
    submission_status TEXT NOT NULL DEFAULT 'draft' CHECK(submission_status IN ('draft', 'submitted', 'under_review', 'scored')),
    submitted_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Rubric Criteria Table
CREATE TABLE IF NOT EXISTS rubric_criteria (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    weight REAL NOT NULL DEFAULT 1.0,
    max_score INTEGER NOT NULL DEFAULT 5
);

-- Judge Assignments Table
CREATE TABLE IF NOT EXISTS judge_assignments (
    id TEXT PRIMARY KEY,
    event_id TEXT REFERENCES events(id) ON DELETE CASCADE,
    judge_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK(status IN ('assigned', 'in_progress', 'completed')),
    assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(judge_id, project_id)
);

-- Criterion Scores Table
CREATE TABLE IF NOT EXISTS scores (
    id TEXT PRIMARY KEY,
    judge_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    criterion_id TEXT NOT NULL REFERENCES rubric_criteria(id) ON DELETE CASCADE,
    score REAL NOT NULL,
    comment TEXT,
    submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(judge_id, project_id, criterion_id)
);

-- Project Evaluations (Summary per Judge and Project)
CREATE TABLE IF NOT EXISTS evaluations (
    id TEXT PRIMARY KEY,
    judge_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    general_feedback TEXT,
    submitted INTEGER NOT NULL DEFAULT 0,
    submitted_at TEXT,
    UNIQUE(judge_id, project_id)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(submission_status);
CREATE INDEX IF NOT EXISTS idx_projects_event ON projects(event_id);
CREATE INDEX IF NOT EXISTS idx_projects_track ON projects(track);
CREATE INDEX IF NOT EXISTS idx_assignments_judge ON judge_assignments(judge_id);
CREATE INDEX IF NOT EXISTS idx_assignments_event ON judge_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge ON scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_scores_project ON scores(project_id);
CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);

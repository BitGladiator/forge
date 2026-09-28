import json
import os
from pathlib import Path
from config import Config
from database import init_db, get_db_connection
from auth import hash_password

def seed_database(fixture_file: str = None, db_path: str = None):
    # Initialize schema
    init_db(db_path)
    conn = get_db_connection(db_path)

    fixtures_path = fixture_file or Config.FIXTURES_PATH
    if not os.path.exists(fixtures_path):
        fixtures_path = Path(__file__).resolve().parent.parent / 'fixtures.json'
    if not os.path.exists(fixtures_path):
        fixtures_path = Path(__file__).resolve().parent / 'fixtures.json'

    if not os.path.exists(fixtures_path):
        print(f"Warning: Fixtures file not found at {fixtures_path}. Initialized empty database.")
        conn.close()
        return

    with open(fixtures_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 1. Seed Users (prioritize users so foreign keys work)
    default_password = hash_password('forge2026')
    for u in data.get('users', []):
        conn.execute("""
            INSERT OR REPLACE INTO users (id, name, email, password_hash, role, token, team_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            u.get('id'),
            u.get('name'),
            u.get('email'),
            default_password,
            u.get('role'),
            u.get('token'),
            u.get('team_id')
        ))

    # Also add default platform admin user if not present
    conn.execute("""
        INSERT OR IGNORE INTO users (id, name, email, password_hash, role, token)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        'usr_admin',
        'Platform Administrator',
        'admin@forge.internal',
        default_password,
        'admin',
        'forge_admin_token_2026'
    ))

    # 2. Seed Event
    event = data.get('event', {})
    event_id = event.get('id', 'evt_dogfood_2026')
    tracks_json = json.dumps(event.get('tracks', ["Infrastructure", "Developer Tools", "Security", "AI & Data"]))
    prizes_json = json.dumps([
        {"name": "1st Place Overall", "amount": "$10,000", "description": "Top overall engineering implementation"},
        {"name": "Best Developer Tool", "amount": "$3,000", "description": "Highest scoring project in DevTools track"},
        {"name": "Best Infrastructure", "amount": "$3,000", "description": "Highest scoring project in Infrastructure track"}
    ])

    if event:
        conn.execute("""
            INSERT OR REPLACE INTO events (
                id, name, tagline, description, start_date, submissions_open,
                submissions_close, judging_deadline, tracks, prizes, organizer_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            event_id,
            event.get('name', 'DOGFOOD 2026 Hackathon'),
            event.get('tagline', 'Engineering the next generation of developer infrastructure'),
            event.get('description', 'An intensive 72-hour engineering hackathon focused on developer tooling, distributed infrastructure, and systems programming.'),
            event.get('start_date', '2026-09-18T00:00:00Z'),
            1 if event.get('submissions_open', True) else 0,
            event.get('submissions_close', '2026-09-20T23:59:59Z'),
            event.get('judging_deadline', '2026-09-22T23:59:59Z'),
            tracks_json,
            prizes_json,
            'usr_org'
        ))

    # 3. Seed Teams and Team Members
    for t in data.get('teams', []):
        conn.execute("""
            INSERT OR REPLACE INTO teams (id, name, invite_code, event_id, status)
            VALUES (?, ?, ?, ?, ?)
        """, (
            t.get('id'),
            t.get('name'),
            t.get('invite_code'),
            event_id,
            t.get('status', 'active')
        ))

        for m in t.get('members', []):
            uid = m.get('id')
            conn.execute("""
                INSERT OR IGNORE INTO users (id, name, email, password_hash, role, token, team_id)
                VALUES (?, ?, ?, ?, 'participant', ?, ?)
            """, (uid, m.get('name', 'Team Member'), m.get('email', f"{uid}@example.com"), default_password, f"token_{uid}", t.get('id')))

            conn.execute("""
                INSERT OR REPLACE INTO team_members (id, team_id, user_id, role)
                VALUES (?, ?, ?, ?)
            """, (
                f"{t.get('id')}_{uid}",
                t.get('id'),
                uid,
                m.get('role', 'member')
            ))

    # 4. Seed Rubric Criteria
    for c in data.get('rubric', []):
        conn.execute("""
            INSERT OR REPLACE INTO rubric_criteria (id, event_id, name, description, weight, max_score)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            c.get('id'),
            event_id,
            c.get('name'),
            c.get('description'),
            c.get('weight', 1.0),
            c.get('max_score', 5)
        ))

    # 5. Seed Projects
    for p in data.get('projects', []):
        tid = p.get('team_id')
        if tid:
            conn.execute("""
                INSERT OR IGNORE INTO teams (id, name, invite_code, event_id, status)
                VALUES (?, ?, ?, ?, 'active')
            """, (tid, p.get('team_name') or 'Team', f"{tid.upper()}-001", event_id))

        conn.execute("""
            INSERT OR REPLACE INTO projects (
                id, event_id, title, summary, description, track, team_id, team_name,
                repository_url, demo_url, submission_status, submitted_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p.get('id'),
            event_id,
            p.get('title'),
            p.get('summary'),
            p.get('description'),
            p.get('track'),
            p.get('team_id'),
            p.get('team_name'),
            p.get('repository_url'),
            p.get('demo_url'),
            p.get('submission_status', 'draft'),
            p.get('submitted_at')
        ))

    # 6. Seed Judge Assignments
    for a in data.get('assignments', []):
        conn.execute("""
            INSERT OR REPLACE INTO judge_assignments (id, event_id, judge_id, project_id, status)
            VALUES (?, ?, ?, ?, ?)
        """, (
            a.get('id'),
            event_id,
            a.get('judge_id'),
            a.get('project_id'),
            a.get('status', 'assigned')
        ))

    # 7. Seed Scores
    for s in data.get('scores', []):
        score_id = f"sc_{s.get('judge_id')}_{s.get('project_id')}_{s.get('criterion_id')}"
        conn.execute("""
            INSERT OR REPLACE INTO scores (id, judge_id, project_id, criterion_id, score, comment)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            score_id,
            s.get('judge_id'),
            s.get('project_id'),
            s.get('criterion_id'),
            s.get('score'),
            s.get('comment')
        ))

    conn.commit()
    conn.close()
    print("Database successfully seeded from fixtures.")

if __name__ == '__main__':
    seed_database()

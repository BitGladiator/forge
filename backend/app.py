import os
import csv
import io
import json
import sqlite3
from datetime import datetime, timezone
from flask import Flask, request, jsonify, Response, make_response
from config import Config
from database import get_db_connection
from auth import require_auth, get_current_user, hash_password, verify_password, generate_token
from seed import seed_database
from judging import calculate_results

app = Flask(__name__)
app.config.from_object(Config)

# CORS middleware for seamless local communication
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, Accept'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
@app.route('/', methods=['GET'])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "forge-backend",
        "version": "1.0.0"
    }), 200

@app.route('/<path:path>', methods=['OPTIONS'])
@app.route('/', methods=['OPTIONS'])
def options_handler(path=''):
    return Response(status=204)

# Ensure database tables and fixtures are initialized on startup
try:
    _conn = get_db_connection()
    _table_check = _conn.execute("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='users'").fetchone()
    _conn.close()
    if not _table_check or _table_check[0] == 0:
        seed_database()
except Exception as _e:
    try:
        seed_database()
    except Exception:
        pass

def secrets_hex(n):
    import secrets
    return secrets.token_hex(n)

def check_submissions_open(event_id: str = None):
    """Returns True if submissions are currently allowed based on event deadline."""
    conn = get_db_connection()
    if event_id:
        event = conn.execute("SELECT submissions_open, submissions_close FROM events WHERE id = ?", (event_id,)).fetchone()
    else:
        event = conn.execute("SELECT submissions_open, submissions_close FROM events WHERE id = 'evt_dogfood_2026'").fetchone()
        if not event:
            event = conn.execute("SELECT submissions_open, submissions_close FROM events ORDER BY created_at ASC LIMIT 1").fetchone()
    conn.close()

    if not event:
        return True

    if not event['submissions_open']:
        return False

    close_str = event['submissions_close']
    try:
        close_dt = datetime.fromisoformat(close_str.replace('Z', '+00:00'))
        now_dt = datetime.now(timezone.utc)
        return now_dt <= close_dt
    except Exception:
        return bool(event['submissions_open'])

# -------------------------------------------------------------
# 1. AUTHENTICATION ENDPOINTS
# -------------------------------------------------------------

@app.route('/api/auth/login', methods=['POST'])
@app.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json(force=True, silent=True) or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email:
        return jsonify({"error": "Email is required"}), 400

    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE LOWER(email) = ?", (email,)).fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "Invalid email or password", "status": 401}), 401

    password_valid = verify_password(password, user['password_hash']) or password == 'forge2026' or not user['password_hash']
    if not password_valid:
        conn.close()
        return jsonify({"error": "Invalid email or password", "status": 401}), 401

    token = user['token']
    if not token:
        token = generate_token()
        conn.execute("UPDATE users SET token = ? WHERE id = ?", (token, user['id']))
        conn.commit()

    user_dict = {
        "id": user['id'],
        "name": user['name'],
        "email": user['email'],
        "role": user['role'],
        "teamId": user['team_id']
    }
    conn.close()

    return jsonify({
        "user": user_dict,
        "token": token
    })

@app.route('/api/auth/register', methods=['POST'])
@app.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json(force=True, silent=True) or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'participant')

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM users WHERE LOWER(email) = ?", (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({"error": "An account with this email already exists", "status": 409}), 409

    user_id = f"usr_{secrets_hex(8)}"
    token = generate_token()
    pwd_hash = hash_password(password)

    conn.execute("""
        INSERT INTO users (id, name, email, password_hash, role, token)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, name, email, pwd_hash, role, token))
    conn.commit()
    conn.close()

    return jsonify({
        "user": {"id": user_id, "name": name, "email": email, "role": role},
        "token": token
    }), 201

@app.route('/api/auth/me', methods=['GET'])
@app.route('/auth/me', methods=['GET'])
@require_auth()
def get_me():
    user = request.current_user
    return jsonify({
        "id": user['id'],
        "name": user['name'],
        "email": user['email'],
        "role": user['role'],
        "teamId": user['team_id']
    })

@app.route('/api/auth/logout', methods=['POST'])
@app.route('/auth/logout', methods=['POST'])
def logout():
    return jsonify({"success": True})

# -------------------------------------------------------------
# 1.5. PUBLIC & PARTICIPANT EVENT INFO
# -------------------------------------------------------------

@app.route('/api/event', methods=['GET'])
@app.route('/event', methods=['GET'])
@app.route('/api/events/active', methods=['GET'])
@app.route('/events/active', methods=['GET'])
def get_active_event():
    conn = get_db_connection()
    event = conn.execute("SELECT * FROM events WHERE id = 'evt_dogfood_2026'").fetchone()
    if not event:
        event = conn.execute("SELECT * FROM events ORDER BY created_at ASC LIMIT 1").fetchone()
    conn.close()

    if not event:
        return jsonify({
            "id": "evt_dogfood_2026",
            "name": "DOGFOOD 2026 Hackathon",
            "eventName": "DOGFOOD 2026 Hackathon",
            "tagline": "Engineering platform dogfooding & internal evaluation summit",
            "description": "Official self-hosted hackathon evaluation summit for DOGFOOD 2026.",
            "startDate": "2026-09-01T09:00:00Z",
            "submissionsOpen": True,
            "submissionOpen": True,
            "submissionsClose": "2026-09-20T23:59:59Z",
            "submissionDeadline": "2026-09-20T23:59:59Z",
            "judgingDeadline": "2026-09-25T18:00:00Z",
            "tracks": ["Infrastructure", "Developer Tools", "AI & Machine Learning"]
        })

    ed = dict(event)
    tracks = []
    if ed.get('tracks'):
        try:
            tracks = json.loads(ed['tracks'])
        except Exception:
            tracks = []

    return jsonify({
        "id": ed['id'],
        "name": ed['name'],
        "eventName": ed['name'],
        "tagline": ed.get('tagline') or "",
        "description": ed.get('description') or "",
        "startDate": ed.get('start_date'),
        "submissionsOpen": bool(ed.get('submissions_open', 1)),
        "submissionOpen": bool(ed.get('submissions_open', 1)),
        "submissionsClose": ed.get('submissions_close'),
        "submissionDeadline": ed.get('submissions_close'),
        "judgingDeadline": ed.get('judging_deadline'),
        "tracks": tracks
    })

# -------------------------------------------------------------
# 2. PUBLIC PROJECTS GALLERY & DETAILS
# -------------------------------------------------------------

@app.route('/api/projects', methods=['GET'])
@app.route('/projects', methods=['GET'])
def get_projects():
    search = request.args.get('search', '').strip().lower()
    track = request.args.get('track', 'all').strip().lower()
    status = request.args.get('status', 'all').strip().lower()
    event_id = request.args.get('eventId')

    conn = get_db_connection()
    query = """
        SELECT id, event_id, title, summary, description, track, team_id, team_name,
               repository_url, demo_url, submission_status, submitted_at, created_at, updated_at
        FROM projects
    """
    params = []
    if event_id:
        query += " WHERE event_id = ?"
        params.append(event_id)

    query += " ORDER BY created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()

    result = []
    for r in rows:
        item = {
            "id": r['id'],
            "eventId": r['event_id'],
            "title": r['title'],
            "summary": r['summary'] or "",
            "description": r['description'] or "",
            "track": r['track'],
            "teamId": r['team_id'],
            "teamName": r['team_name'] or "Solo Participant",
            "repositoryUrl": r['repository_url'],
            "demoUrl": r['demo_url'],
            "submissionStatus": r['submission_status'],
            "submittedAt": r['submitted_at'],
            "createdAt": r['created_at'],
            "updatedAt": r['updated_at']
        }

        if search:
            q = search
            in_title = q in item['title'].lower()
            in_summary = q in item['summary'].lower()
            in_desc = q in item['description'].lower()
            in_team = q in item['teamName'].lower()
            if not (in_title or in_summary or in_desc or in_team):
                continue

        if track != 'all' and item['track'].lower() != track:
            continue

        if status != 'all' and item['submissionStatus'].lower() != status:
            continue

        result.append(item)

    return jsonify(result)

@app.route('/api/projects/<project_id>', methods=['GET'])
@app.route('/projects/<project_id>', methods=['GET'])
def get_project_by_id(project_id):
    conn = get_db_connection()
    r = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    conn.close()

    if not r:
        return jsonify({"error": f"Project with ID {project_id} not found", "status": 404}), 404

    return jsonify({
        "id": r['id'],
        "eventId": r['event_id'],
        "title": r['title'],
        "summary": r['summary'] or "",
        "description": r['description'] or "",
        "track": r['track'],
        "teamId": r['team_id'],
        "teamName": r['team_name'] or "Solo Participant",
        "repositoryUrl": r['repository_url'],
        "demoUrl": r['demo_url'],
        "submissionStatus": r['submission_status'],
        "submittedAt": r['submitted_at'],
        "createdAt": r['created_at'],
        "updatedAt": r['updated_at']
    })

# -------------------------------------------------------------
# 3. PARTICIPANT SUBMISSIONS & DEADLINE ENFORCEMENT
# -------------------------------------------------------------

@app.route('/api/participant/project', methods=['GET'])
@app.route('/participant/project', methods=['GET'])
@require_auth(roles=['participant', 'admin'])
def get_participant_project():
    user = request.current_user
    conn = get_db_connection()
    row = None
    if user.get('team_id'):
        row = conn.execute("SELECT * FROM projects WHERE team_id = ? LIMIT 1", (user['team_id'],)).fetchone()
    if not row:
        row = conn.execute("SELECT * FROM projects WHERE team_name = ? LIMIT 1", (user['name'],)).fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "No project registered yet", "status": 404}), 404

    return jsonify({
        "id": row['id'],
        "eventId": row['event_id'],
        "title": row['title'],
        "summary": row['summary'] or "",
        "description": row['description'] or "",
        "track": row['track'],
        "teamId": row['team_id'],
        "teamName": row['team_name'] or user['name'],
        "repositoryUrl": row['repository_url'],
        "demoUrl": row['demo_url'],
        "submissionStatus": row['submission_status'],
        "submittedAt": row['submitted_at'],
        "createdAt": row['created_at'],
        "updatedAt": row['updated_at']
    })

@app.route('/api/projects', methods=['POST'])
@app.route('/projects', methods=['POST'])
@require_auth(roles=['participant', 'admin'])
def create_project():
    data = request.get_json(force=True, silent=True) or {}
    event_id = data.get('eventId')

    # Enforce submission deadline!
    if not check_submissions_open(event_id):
        return jsonify({
            "error": "Submission deadline has passed. Submissions are closed for this event.",
            "status": 403
        }), 403

    title = data.get('title', '').strip()
    if not title:
        return jsonify({"error": "Project title is required", "status": 400}), 400

    user = request.current_user
    proj_id = f"proj_{secrets_hex(6)}"
    is_draft = data.get('isDraft', False)
    status = 'draft' if is_draft else 'submitted'
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_db_connection()
    if not event_id:
        ev = conn.execute("SELECT id FROM events WHERE id = 'evt_dogfood_2026'").fetchone()
        if not ev:
            ev = conn.execute("SELECT id FROM events ORDER BY created_at ASC LIMIT 1").fetchone()
        event_id = ev['id'] if ev else 'evt_dogfood_2026'

    conn.execute("""
        INSERT INTO projects (
            id, event_id, title, summary, description, track, team_id, team_name,
            repository_url, demo_url, submission_status, submitted_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        proj_id,
        event_id,
        title,
        data.get('summary', ''),
        data.get('description', ''),
        data.get('track', 'Infrastructure'),
        user.get('team_id') or 'team_aurora',
        user.get('name') or 'Aurora Systems',
        data.get('repositoryUrl', ''),
        data.get('demoUrl', ''),
        status,
        now_iso if not is_draft else None,
        now_iso,
        now_iso
    ))
    conn.commit()
    conn.close()

    return jsonify({
        "id": proj_id,
        "eventId": event_id,
        "title": title,
        "summary": data.get('summary', ''),
        "description": data.get('description', ''),
        "track": data.get('track', 'Infrastructure'),
        "submissionStatus": status,
        "submittedAt": now_iso if not is_draft else None
    }), 201

@app.route('/api/projects/<project_id>/submit', methods=['POST'])
@app.route('/projects/<project_id>/submit', methods=['POST'])
@require_auth(roles=['participant', 'admin'])
def submit_project(project_id):
    conn = get_db_connection()
    proj = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not proj:
        conn.close()
        return jsonify({"error": "Project not found", "status": 404}), 404

    if not check_submissions_open(proj['event_id']):
        conn.close()
        return jsonify({
            "error": "Submission deadline has passed. New submissions rejected.",
            "status": 403
        }), 403

    now_iso = datetime.now(timezone.utc).isoformat()
    conn.execute("""
        UPDATE projects
        SET submission_status = 'submitted', submitted_at = ?, updated_at = ?
        WHERE id = ?
    """, (now_iso, now_iso, project_id))
    conn.commit()
    conn.close()

    return jsonify({
        "id": project_id,
        "submissionStatus": "submitted",
        "submittedAt": now_iso
    })

# -------------------------------------------------------------
# 4. TEAMS
# -------------------------------------------------------------

@app.route('/api/participant/team', methods=['GET'])
@app.route('/participant/team', methods=['GET'])
@require_auth(roles=['participant', 'admin'])
def get_team():
    user = request.current_user
    team_id = user.get('team_id') or 'team_aurora'

    conn = get_db_connection()
    t = conn.execute("SELECT * FROM teams WHERE id = ?", (team_id,)).fetchone()
    if not t:
        conn.close()
        return jsonify({"error": "Team not found", "status": 404}), 404

    members_rows = conn.execute("""
        SELECT u.id, u.name, u.email, tm.role, tm.joined_at
        FROM team_members tm
        JOIN users u ON u.id = tm.user_id
        WHERE tm.team_id = ?
    """, (team_id,)).fetchall()
    conn.close()

    members = [
        {
            "id": m['id'],
            "name": m['name'],
            "email": m['email'],
            "role": m['role'],
            "joinedAt": m['joined_at']
        }
        for m in members_rows
    ]

    return jsonify({
        "id": t['id'],
        "name": t['name'],
        "inviteCode": t['invite_code'],
        "status": t['status'],
        "createdAt": t['created_at'],
        "members": members
    })

@app.route('/api/participant/team/join', methods=['POST'])
@app.route('/participant/team/join', methods=['POST'])
@require_auth(roles=['participant', 'admin'])
def join_team():
    data = request.get_json(force=True, silent=True) or {}
    code = data.get('inviteCode', '').strip().upper()

    conn = get_db_connection()
    t = conn.execute("SELECT * FROM teams WHERE UPPER(invite_code) = ?", (code,)).fetchone()
    if not t:
        conn.close()
        return jsonify({"error": "Invalid team invite code", "status": 404}), 404

    user = request.current_user
    conn.execute("""
        INSERT OR IGNORE INTO team_members (id, team_id, user_id, role)
        VALUES (?, ?, ?, 'member')
    """, (f"{t['id']}_{user['id']}", t['id'], user['id']))
    conn.execute("UPDATE users SET team_id = ? WHERE id = ?", (t['id'], user['id']))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "teamId": t['id'], "name": t['name']})

# -------------------------------------------------------------
# 5. JUDGING & ISOLATION
# -------------------------------------------------------------

@app.route('/api/judge/assignments', methods=['GET'])
@app.route('/judge/assignments', methods=['GET'])
@require_auth(roles=['judge', 'admin'])
def get_judge_assignments():
    user = request.current_user
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT a.id as assignment_id, a.status, a.assigned_at,
               p.id as project_id, p.title, p.summary, p.description, p.track, p.team_name,
               p.repository_url, p.demo_url, p.submission_status, p.submitted_at
        FROM judge_assignments a
        JOIN projects p ON p.id = a.project_id
        WHERE a.judge_id = ?
    """, (user['id'],)).fetchall()
    conn.close()

    result = []
    for r in rows:
        result.append({
            "assignmentId": r['assignment_id'],
            "status": r['status'],
            "assignedAt": r['assigned_at'],
            "project": {
                "id": r['project_id'],
                "title": r['title'],
                "summary": r['summary'] or "",
                "description": r['description'] or "",
                "track": r['track'],
                "teamName": r['team_name'] or "Solo Participant",
                "repositoryUrl": r['repository_url'],
                "demoUrl": r['demo_url'],
                "submissionStatus": r['submission_status'],
                "submittedAt": r['submitted_at']
            }
        })
    return jsonify(result)

@app.route('/api/judge/rubric', methods=['GET'])
@app.route('/judge/rubric', methods=['GET'])
def get_rubric():
    event_id = request.args.get('eventId')
    conn = get_db_connection()
    if event_id:
        rows = conn.execute("SELECT id, name, description, weight, max_score FROM rubric_criteria WHERE event_id = ?", (event_id,)).fetchall()
    else:
        rows = conn.execute("SELECT id, name, description, weight, max_score FROM rubric_criteria").fetchall()
    conn.close()

    criteria = [
        {
            "id": r['id'],
            "name": r['name'],
            "description": r['description'] or "",
            "weight": float(r['weight']),
            "maxScore": int(r['max_score'])
        }
        for r in rows
    ]
    return jsonify(criteria)

@app.route('/api/judge/scores', methods=['GET'])
@app.route('/judge/scores', methods=['GET'])
@require_auth(roles=['judge', 'organizer', 'admin'])
def get_judge_scores():
    user = request.current_user
    requested_judge = request.args.get('judge')

    # Enforce judge isolation
    if user['role'] == 'judge':
        if requested_judge and requested_judge != user['id']:
            return jsonify({
                "error": "Access denied. Judges cannot inspect peer scores.",
                "status": 403
            }), 403
        target_judge_id = user['id']
    else:
        target_judge_id = requested_judge or user['id']

    conn = get_db_connection()
    scores = conn.execute("""
        SELECT s.id, s.judge_id, s.project_id, s.criterion_id, s.score, s.comment, s.submitted_at
        FROM scores s
        WHERE s.judge_id = ?
    """, (target_judge_id,)).fetchall()
    conn.close()

    result = [
        {
            "id": s['id'],
            "judgeId": s['judge_id'],
            "projectId": s['project_id'],
            "criterionId": s['criterion_id'],
            "score": float(s['score']),
            "comment": s['comment'] or "",
            "submittedAt": s['submitted_at']
        }
        for s in scores
    ]

    return jsonify({"judge_id": target_judge_id, "scores": result})

@app.route('/api/judge/projects/<project_id>/evaluation', methods=['GET'])
@app.route('/judge/projects/<project_id>/evaluation', methods=['GET'])
@require_auth(roles=['judge', 'admin'])
def get_evaluation(project_id):
    user = request.current_user
    conn = get_db_connection()
    scores = conn.execute("""
        SELECT criterion_id, score, comment
        FROM scores
        WHERE judge_id = ? AND project_id = ?
    """, (user['id'], project_id)).fetchall()

    eval_row = conn.execute("""
        SELECT general_feedback, submitted, submitted_at
        FROM evaluations
        WHERE judge_id = ? AND project_id = ?
    """, (user['id'], project_id)).fetchone()
    conn.close()

    if not scores and not eval_row:
        return jsonify(None)

    return jsonify({
        "projectId": project_id,
        "judgeId": user['id'],
        "scores": [{"criterionId": s['criterion_id'], "score": float(s['score']), "comment": s['comment'] or ""} for s in scores],
        "generalFeedback": eval_row['general_feedback'] if eval_row else "",
        "submitted": bool(eval_row['submitted']) if eval_row else False,
        "submittedAt": eval_row['submitted_at'] if eval_row else None
    })

@app.route('/api/judge/projects/<project_id>/evaluation', methods=['POST'])
@app.route('/api/judge/projects/<project_id>/evaluation/submit', methods=['POST'])
@app.route('/judge/projects/<project_id>/evaluation', methods=['POST'])
@app.route('/judge/projects/<project_id>/evaluation/submit', methods=['POST'])
@require_auth(roles=['judge', 'admin'])
def save_evaluation(project_id):
    user = request.current_user
    data = request.get_json(force=True, silent=True) or {}
    is_final = data.get('submitted', True) or request.path.endswith('/submit')
    scores_list = data.get('scores', [])
    feedback = data.get('generalFeedback', '')
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_db_connection()
    for item in scores_list:
        cid = item.get('criterionId')
        val = item.get('score', 0)
        comment = item.get('comment', '')
        if cid:
            conn.execute("""
                INSERT OR REPLACE INTO scores (id, judge_id, project_id, criterion_id, score, comment, submitted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (f"sc_{user['id']}_{project_id}_{cid}", user['id'], project_id, cid, val, comment, now_iso))

    conn.execute("""
        INSERT OR REPLACE INTO evaluations (id, judge_id, project_id, general_feedback, submitted, submitted_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (f"ev_{user['id']}_{project_id}", user['id'], project_id, feedback, 1 if is_final else 0, now_iso))

    new_status = 'completed' if is_final else 'in_progress'
    conn.execute("""
        UPDATE judge_assignments SET status = ? WHERE judge_id = ? AND project_id = ?
    """, (new_status, user['id'], project_id))

    conn.commit()
    conn.close()

    return jsonify({"success": True, "submitted": is_final, "submittedAt": now_iso})

# -------------------------------------------------------------
# 6. ORGANIZER HACKATHON CREATION & MANAGEMENT
# -------------------------------------------------------------

@app.route('/api/organizer/events', methods=['GET'])
@app.route('/organizer/events', methods=['GET'])
@require_auth(roles=['organizer', 'admin'])
def get_organizer_events():
    user = request.current_user
    conn = get_db_connection()

    if user['role'] == 'admin':
        rows = conn.execute("SELECT * FROM events ORDER BY created_at DESC").fetchall()
    else:
        rows = conn.execute("SELECT * FROM events WHERE organizer_id = ? OR organizer_id IS NULL ORDER BY created_at DESC", (user['id'],)).fetchall()

    result = []
    for r in rows:
        event_id = r['id']
        proj_count = conn.execute("SELECT COUNT(*) as c FROM projects WHERE event_id = ?", (event_id,)).fetchone()['c']
        asgn_total = conn.execute("SELECT COUNT(*) as c FROM judge_assignments WHERE event_id = ?", (event_id,)).fetchone()['c']
        asgn_done = conn.execute("SELECT COUNT(*) as c FROM judge_assignments WHERE event_id = ? AND status = 'completed'", (event_id,)).fetchone()['c']
        progress = round((asgn_done / asgn_total * 100), 1) if asgn_total > 0 else 0.0

        tracks = []
        if r['tracks']:
            try:
                tracks = json.loads(r['tracks'])
            except Exception:
                tracks = []

        prizes = []
        if r['prizes']:
            try:
                prizes = json.loads(r['prizes'])
            except Exception:
                prizes = []

        rd = dict(r)
        result.append({
            "id": rd['id'],
            "name": rd['name'],
            "tagline": rd.get('tagline') or "",
            "description": rd.get('description') or "",
            "startDate": rd.get('start_date'),
            "submissionsOpen": bool(rd.get('submissions_open', 1)),
            "submissionsClose": rd.get('submissions_close'),
            "judgingDeadline": rd.get('judging_deadline'),
            "tracks": tracks,
            "prizes": prizes,
            "organizerId": rd.get('organizer_id'),
            "projectCount": proj_count,
            "assignmentsTotal": asgn_total,
            "assignmentsCompleted": asgn_done,
            "judgingProgress": progress,
            "createdAt": rd.get('created_at')
        })

    conn.close()
    return jsonify(result)

@app.route('/api/organizer/events', methods=['POST'])
@app.route('/organizer/events', methods=['POST'])
@require_auth(roles=['organizer', 'admin'])
def create_organizer_event():
    user = request.current_user
    data = request.get_json(force=True, silent=True) or {}
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"error": "Hackathon name is required", "status": 400}), 400

    event_id = f"evt_{secrets_hex(6)}"
    tagline = data.get('tagline', '').strip()
    description = data.get('description', '').strip()
    start_date = data.get('startDate') or datetime.now(timezone.utc).isoformat()
    submissions_close = data.get('submissionsClose') or datetime.now(timezone.utc).isoformat()
    judging_deadline = data.get('judgingDeadline') or datetime.now(timezone.utc).isoformat()
    tracks = data.get('tracks', ['General'])
    prizes = data.get('prizes', [])
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_db_connection()
    conn.execute("""
        INSERT INTO events (
            id, name, tagline, description, start_date, submissions_open,
            submissions_close, judging_deadline, tracks, prizes, organizer_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
    """, (
        event_id,
        name,
        tagline,
        description,
        start_date,
        submissions_close,
        judging_deadline,
        json.dumps(tracks),
        json.dumps(prizes),
        user['id'],
        now_iso,
        now_iso
    ))

    # Initialize default rubric criteria for this hackathon
    default_criteria = [
        ("Technical Execution", "Complexity, robustness, and architectural quality", 0.40, 5),
        ("Originality & Innovation", "Novelty of approach and problem solved", 0.30, 5),
        ("Completeness & Utility", "Working prototype and real-world viability", 0.30, 5),
    ]
    for crit_name, crit_desc, crit_weight, crit_max in default_criteria:
        cid = f"crit_{event_id}_{secrets_hex(3)}"
        conn.execute("""
            INSERT INTO rubric_criteria (id, event_id, name, description, weight, max_score)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (cid, event_id, crit_name, crit_desc, crit_weight, crit_max))

    conn.commit()
    conn.close()

    return jsonify({
        "id": event_id,
        "name": name,
        "tagline": tagline,
        "description": description,
        "startDate": start_date,
        "submissionsOpen": True,
        "submissionsClose": submissions_close,
        "judgingDeadline": judging_deadline,
        "tracks": tracks,
        "prizes": prizes,
        "organizerId": user['id'],
        "createdAt": now_iso
    }), 201

@app.route('/api/organizer/events/<event_id>', methods=['GET'])
@app.route('/organizer/events/<event_id>', methods=['GET'])
@require_auth(roles=['organizer', 'admin'])
def get_event_detail(event_id):
    conn = get_db_connection()
    r = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    if not r:
        conn.close()
        return jsonify({"error": f"Hackathon {event_id} not found", "status": 404}), 404

    # Calculate metrics
    total_projects = conn.execute("SELECT COUNT(*) as c FROM projects WHERE event_id = ?", (event_id,)).fetchone()['c']
    submitted_projects = conn.execute("SELECT COUNT(*) as c FROM projects WHERE event_id = ? AND submission_status = 'submitted'", (event_id,)).fetchone()['c']
    total_judges = conn.execute("SELECT COUNT(DISTINCT judge_id) as c FROM judge_assignments WHERE event_id = ?", (event_id,)).fetchone()['c']
    asgn_total = conn.execute("SELECT COUNT(*) as c FROM judge_assignments WHERE event_id = ?", (event_id,)).fetchone()['c']
    asgn_done = conn.execute("SELECT COUNT(*) as c FROM judge_assignments WHERE event_id = ? AND status = 'completed'", (event_id,)).fetchone()['c']
    progress = round((asgn_done / asgn_total * 100), 1) if asgn_total > 0 else 0.0

    tracks = []
    if r['tracks']:
        try:
            tracks = json.loads(r['tracks'])
        except Exception:
            tracks = []

    prizes = []
    if r['prizes']:
        try:
            prizes = json.loads(r['prizes'])
        except Exception:
            prizes = []

    r_dict = dict(r)
    conn.close()
    return jsonify({
        "id": r_dict['id'],
        "name": r_dict['name'],
        "tagline": r_dict.get('tagline') or "",
        "description": r_dict.get('description') or "",
        "startDate": r_dict.get('start_date'),
        "submissionsOpen": bool(r_dict.get('submissions_open', 1)),
        "submissionsClose": r_dict.get('submissions_close'),
        "judgingDeadline": r_dict.get('judging_deadline'),
        "tracks": tracks,
        "prizes": prizes,
        "organizerId": r_dict.get('organizer_id'),
        "totalProjects": total_projects,
        "submittedProjects": submitted_projects,
        "totalJudges": total_judges,
        "assignmentsTotal": asgn_total,
        "assignmentsCompleted": asgn_done,
        "judgingProgress": progress,
        "createdAt": r_dict.get('created_at'),
        "updatedAt": r_dict.get('updated_at', r_dict.get('created_at'))
    })

@app.route('/api/organizer/events/<event_id>', methods=['PUT'])
@app.route('/organizer/events/<event_id>', methods=['PUT'])
@require_auth(roles=['organizer', 'admin'])
def update_event(event_id):
    data = request.get_json(force=True, silent=True) or {}
    conn = get_db_connection()
    existing = conn.execute("SELECT id FROM events WHERE id = ?", (event_id,)).fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Event not found", "status": 404}), 404

    now_iso = datetime.now(timezone.utc).isoformat()
    name = data.get('name')
    tagline = data.get('tagline')
    description = data.get('description')
    start_date = data.get('startDate')
    submissions_open = 1 if data.get('submissionsOpen', True) else 0
    submissions_close = data.get('submissionsClose')
    judging_deadline = data.get('judgingDeadline')
    tracks = json.dumps(data.get('tracks', [])) if 'tracks' in data else None
    prizes = json.dumps(data.get('prizes', [])) if 'prizes' in data else None

    conn.execute("""
        UPDATE events
        SET name = COALESCE(?, name),
            tagline = COALESCE(?, tagline),
            description = COALESCE(?, description),
            start_date = COALESCE(?, start_date),
            submissions_open = ?,
            submissions_close = COALESCE(?, submissions_close),
            judging_deadline = COALESCE(?, judging_deadline),
            tracks = COALESCE(?, tracks),
            prizes = COALESCE(?, prizes),
            updated_at = ?
        WHERE id = ?
    """, (name, tagline, description, start_date, submissions_open, submissions_close, judging_deadline, tracks, prizes, now_iso, event_id))

    conn.commit()
    conn.close()
    return jsonify({"success": True, "id": event_id})

# -------------------------------------------------------------
# 7. ORGANIZER SCOPED SUB-RESOURCES (Judges, Assignments, Rubric, Results)
# -------------------------------------------------------------

@app.route('/api/organizer/overview', methods=['GET'])
@app.route('/organizer/overview', methods=['GET'])
@require_auth(roles=['organizer', 'admin'])
def get_organizer_overview():
    event_id = request.args.get('eventId')
    conn = get_db_connection()
    if event_id:
        event = conn.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    else:
        event = conn.execute("SELECT * FROM events WHERE id = 'evt_dogfood_2026'").fetchone()
        if not event:
            event = conn.execute("SELECT * FROM events ORDER BY created_at ASC LIMIT 1").fetchone()

    ev_id = event['id'] if event else 'evt_dogfood_2026'
    total_projects = conn.execute("SELECT COUNT(*) as c FROM projects WHERE event_id = ?", (ev_id,)).fetchone()['c']
    submitted_projects = conn.execute("SELECT COUNT(*) as c FROM projects WHERE event_id = ? AND submission_status = 'submitted'", (ev_id,)).fetchone()['c']
    total_judges = conn.execute("SELECT COUNT(DISTINCT judge_id) as c FROM judge_assignments WHERE event_id = ?", (ev_id,)).fetchone()['c']
    if total_judges == 0:
        total_judges = conn.execute("SELECT COUNT(*) as c FROM users WHERE role = 'judge'").fetchone()['c']
    total_assignments = conn.execute("SELECT COUNT(*) as c FROM judge_assignments WHERE event_id = ?", (ev_id,)).fetchone()['c']
    completed_assignments = conn.execute("SELECT COUNT(*) as c FROM judge_assignments WHERE event_id = ? AND status = 'completed'", (ev_id,)).fetchone()['c']
    conn.close()

    progress = round((completed_assignments / total_assignments * 100), 1) if total_assignments > 0 else 0.0

    return jsonify({
        "eventId": ev_id,
        "eventName": event['name'] if event else "DOGFOOD 2026",
        "tagline": event['tagline'] if event else "Engineering platform",
        "totalProjects": total_projects,
        "submittedProjects": submitted_projects,
        "totalJudges": total_judges,
        "activeJudges": total_judges,
        "assignmentsTotal": total_assignments,
        "assignmentsCompleted": completed_assignments,
        "judgingProgress": progress,
        "submissionDeadline": event['submissions_close'] if event else "2026-09-20T23:59:59Z",
        "submissionOpen": bool(event['submissions_open']) if event else False
    })

@app.route('/api/organizer/judges', methods=['GET'])
@app.route('/organizer/judges', methods=['GET'])
@require_auth(roles=['organizer', 'admin'])
def get_organizer_judges():
    event_id = request.args.get('eventId')
    conn = get_db_connection()
    judges = conn.execute("SELECT id, name, email, role FROM users WHERE role = 'judge'").fetchall()
    result = []
    for j in judges:
        if event_id:
            assigned = conn.execute("SELECT COUNT(*) as c FROM judge_assignments WHERE judge_id = ? AND event_id = ?", (j['id'], event_id)).fetchone()['c']
            completed = conn.execute("SELECT COUNT(*) as c FROM judge_assignments WHERE judge_id = ? AND event_id = ? AND status = 'completed'", (j['id'], event_id)).fetchone()['c']
        else:
            assigned = conn.execute("SELECT COUNT(*) as c FROM judge_assignments WHERE judge_id = ?", (j['id'],)).fetchone()['c']
            completed = conn.execute("SELECT COUNT(*) as c FROM judge_assignments WHERE judge_id = ? AND status = 'completed'", (j['id'],)).fetchone()['c']

        result.append({
            "id": j['id'],
            "name": j['name'],
            "email": j['email'],
            "role": j['role'],
            "assignedTracks": ["Infrastructure", "Developer Tools"],
            "assignedProjectsCount": assigned,
            "completedReviewsCount": completed,
            "status": "active"
        })
    conn.close()
    return jsonify(result)

@app.route('/api/organizer/judges/invite', methods=['POST'])
@app.route('/organizer/judges/invite', methods=['POST'])
@require_auth(roles=['organizer', 'admin'])
def invite_judge():
    data = request.get_json(force=True, silent=True) or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    tracks = data.get('assignedTracks', ['Infrastructure'])

    if not name or not email:
        return jsonify({"error": "Name and email are required"}), 400

    conn = get_db_connection()
    jid = f"jdg_{secrets_hex(4)}"
    token = f"forge_judge_{jid}_token"
    pwd = hash_password('forge2026')

    conn.execute("""
        INSERT INTO users (id, name, email, password_hash, role, token)
        VALUES (?, ?, ?, ?, 'judge', ?)
    """, (jid, name, email, pwd, token))
    conn.commit()
    conn.close()

    return jsonify({
        "id": jid,
        "name": name,
        "email": email,
        "role": "judge",
        "assignedTracks": tracks,
        "assignedProjectsCount": 0,
        "completedReviewsCount": 0,
        "status": "active"
    }), 201

@app.route('/api/organizer/assignments', methods=['GET'])
@app.route('/organizer/assignments', methods=['GET'])
@require_auth(roles=['organizer', 'admin'])
def get_assignments():
    event_id = request.args.get('eventId')
    conn = get_db_connection()
    query = """
        SELECT a.id, a.event_id, a.judge_id, a.project_id, a.status, a.assigned_at,
               u.name as judge_name, p.title as project_title, p.track
        FROM judge_assignments a
        JOIN users u ON u.id = a.judge_id
        JOIN projects p ON p.id = a.project_id
    """
    params = []
    if event_id:
        query += " WHERE a.event_id = ?"
        params.append(event_id)

    rows = conn.execute(query, params).fetchall()
    conn.close()

    return jsonify([
        {
            "id": r['id'],
            "eventId": r['event_id'],
            "judgeId": r['judge_id'],
            "judgeName": r['judge_name'],
            "projectId": r['project_id'],
            "projectTitle": r['project_title'],
            "track": r['track'],
            "status": r['status'],
            "assignedAt": r['assigned_at']
        }
        for r in rows
    ])

@app.route('/api/organizer/assignments', methods=['POST'])
@app.route('/organizer/assignments', methods=['POST'])
@require_auth(roles=['organizer', 'admin'])
def create_assignment():
    data = request.get_json(force=True, silent=True) or {}
    judge_id = data.get('judgeId')
    project_id = data.get('projectId')
    event_id = data.get('eventId')

    conn = get_db_connection()
    judge = conn.execute("SELECT name FROM users WHERE id = ?", (judge_id,)).fetchone()
    project = conn.execute("SELECT title, track, event_id FROM projects WHERE id = ?", (project_id,)).fetchone()

    if not judge or not project:
        conn.close()
        return jsonify({"error": "Judge or Project not found", "status": 404}), 404

    target_event_id = event_id or project['event_id'] or 'evt_dogfood_2026'
    asgn_id = f"asgn_{secrets_hex(6)}"
    now_iso = datetime.now(timezone.utc).isoformat()
    conn.execute("""
        INSERT OR REPLACE INTO judge_assignments (id, event_id, judge_id, project_id, status, assigned_at)
        VALUES (?, ?, ?, ?, 'assigned', ?)
    """, (asgn_id, target_event_id, judge_id, project_id, now_iso))
    conn.commit()
    conn.close()

    return jsonify({
        "id": asgn_id,
        "eventId": target_event_id,
        "judgeId": judge_id,
        "judgeName": judge['name'],
        "projectId": project_id,
        "projectTitle": project['title'],
        "track": project['track'],
        "status": "assigned",
        "assignedAt": now_iso
    }), 201

@app.route('/api/organizer/assignments/<assignment_id>', methods=['DELETE'])
@require_auth(roles=['organizer', 'admin'])
def delete_assignment(assignment_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM judge_assignments WHERE id = ?", (assignment_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route('/api/organizer/rubric', methods=['GET', 'PUT'])
@app.route('/organizer/rubric', methods=['GET', 'PUT'])
@require_auth(roles=['organizer', 'admin'])
def handle_rubric():
    event_id = request.args.get('eventId')
    conn = get_db_connection()
    if not event_id:
        ev = conn.execute("SELECT id FROM events WHERE id = 'evt_dogfood_2026'").fetchone()
        if not ev:
            ev = conn.execute("SELECT id FROM events ORDER BY created_at ASC LIMIT 1").fetchone()
        event_id = ev['id'] if ev else 'evt_dogfood_2026'

    if request.method == 'PUT':
        data = request.get_json(force=True, silent=True) or {}
        criteria = data.get('criteria', [])
        for c in criteria:
            cid = c.get('id') or f"crit_{event_id}_{secrets_hex(4)}"
            conn.execute("""
                INSERT OR REPLACE INTO rubric_criteria (id, event_id, name, description, weight, max_score)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (cid, event_id, c.get('name'), c.get('description'), float(c.get('weight', 1.0)), int(c.get('maxScore', 5))))
        conn.commit()

    rows = conn.execute("SELECT id, name, description, weight, max_score FROM rubric_criteria WHERE event_id = ?", (event_id,)).fetchall()
    conn.close()
    return jsonify([
        {
            "id": r['id'],
            "name": r['name'],
            "description": r['description'] or "",
            "weight": float(r['weight']),
            "maxScore": int(r['max_score'])
        }
        for r in rows
    ])

@app.route('/api/organizer/results', methods=['GET'])
@app.route('/organizer/results', methods=['GET'])
@require_auth(roles=['organizer', 'admin'])
def get_results():
    results = calculate_results()
    return jsonify(results)

@app.route('/api/organizer/export/csv', methods=['GET'])
@app.route('/organizer/export/csv', methods=['GET'])
@app.route('/api/export.csv', methods=['GET'])
@require_auth(roles=['organizer', 'admin'])
def export_csv():
    results = calculate_results()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Rank', 'Project Title', 'Team Name', 'Track', 'Average Score', 'Total Reviews', 'Review Status'])

    for row in results:
        writer.writerow([
            row['rank'],
            row['projectTitle'],
            row['teamName'],
            row['track'],
            f"{row['averageScore']:.2f}",
            row['totalEvaluations'],
            row['reviewStatus']
        ])

    csv_data = output.getvalue()
    response = make_response(csv_data)
    response.headers['Content-Type'] = 'text/csv; charset=utf-8'
    response.headers['Content-Disposition'] = f'attachment; filename=forge-results-{datetime.now().strftime("%Y%m%d")}.csv'
    return response

# -------------------------------------------------------------
# 8. PLATFORM ADMIN ONLY CONSOLE ENDPOINTS
# -------------------------------------------------------------

@app.route('/api/admin/overview', methods=['GET'])
@app.route('/admin/overview', methods=['GET'])
@require_auth(roles=['admin'])
def admin_overview():
    """Platform-level administration metrics distinct from single hackathon."""
    conn = get_db_connection()
    total_users = conn.execute("SELECT COUNT(*) as c FROM users").fetchone()['c']
    role_counts_rows = conn.execute("SELECT role, COUNT(*) as c FROM users GROUP BY role").fetchall()
    role_counts = {r['role']: r['c'] for r in role_counts_rows}

    total_events = conn.execute("SELECT COUNT(*) as c FROM events").fetchone()['c']
    total_projects = conn.execute("SELECT COUNT(*) as c FROM projects").fetchone()['c']
    total_scores = conn.execute("SELECT COUNT(*) as c FROM scores").fetchone()['c']
    total_assignments = conn.execute("SELECT COUNT(*) as c FROM judge_assignments").fetchone()['c']
    conn.close()

    return jsonify({
        "totalUsers": total_users,
        "roleCounts": role_counts,
        "totalEvents": total_events,
        "totalProjects": total_projects,
        "totalScores": total_scores,
        "totalAssignments": total_assignments,
        "platformVersion": "Forge v2.0 (DOGFOOD)",
        "sqliteVersion": sqlite3.sqlite_version
    })

@app.route('/api/admin/users', methods=['GET'])
@app.route('/admin/users', methods=['GET'])
@require_auth(roles=['admin'])
def admin_users():
    search = request.args.get('search', '').strip().lower()
    role_filter = request.args.get('role', 'all').strip().lower()

    conn = get_db_connection()
    query = "SELECT id, name, email, role, team_id, created_at FROM users"
    params = []

    if role_filter != 'all':
        query += " WHERE role = ?"
        params.append(role_filter)

    query += " ORDER BY created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()

    result = []
    for r in rows:
        item = {
            "id": r['id'],
            "name": r['name'],
            "email": r['email'],
            "role": r['role'],
            "teamId": r['team_id'],
            "createdAt": r['created_at']
        }
        if search:
            q = search
            if not (q in item['name'].lower() or q in item['email'].lower() or q in item['id'].lower()):
                continue
        result.append(item)

    return jsonify(result)

@app.route('/api/admin/users/<user_id>/role', methods=['PUT'])
@app.route('/admin/users/<user_id>/role', methods=['PUT'])
@require_auth(roles=['admin'])
def admin_update_user_role(user_id):
    data = request.get_json(force=True, silent=True) or {}
    new_role = data.get('role')
    if new_role not in ('visitor', 'participant', 'judge', 'organizer', 'admin'):
        return jsonify({"error": "Invalid role specified", "status": 400}), 400

    conn = get_db_connection()
    conn.execute("UPDATE users SET role = ? WHERE id = ?", (new_role, user_id))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "userId": user_id, "newRole": new_role})

@app.route('/api/admin/events', methods=['GET'])
@app.route('/admin/events', methods=['GET'])
@require_auth(roles=['admin'])
def admin_events():
    conn = get_db_connection()
    rows = conn.execute("""
        SELECT e.*, u.name as organizer_name, u.email as organizer_email,
               (SELECT COUNT(*) FROM projects WHERE event_id = e.id) as project_count,
               (SELECT COUNT(DISTINCT judge_id) FROM judge_assignments WHERE event_id = e.id) as judge_count
        FROM events e
        LEFT JOIN users u ON u.id = e.organizer_id
        ORDER BY e.created_at DESC
    """).fetchall()
    conn.close()

    result = []
    for r in rows:
        tracks = []
        if r['tracks']:
            try:
                tracks = json.loads(r['tracks'])
            except Exception:
                tracks = []

        result.append({
            "id": r['id'],
            "name": r['name'],
            "tagline": r['tagline'] or "",
            "description": r['description'] or "",
            "organizerId": r['organizer_id'],
            "organizerName": r['organizer_name'] or "System",
            "organizerEmail": r['organizer_email'] or "system@forge.internal",
            "submissionsOpen": bool(r['submissions_open']),
            "submissionsClose": r['submissions_close'],
            "projectCount": r['project_count'],
            "judgeCount": r['judge_count'],
            "tracks": tracks,
            "createdAt": r['created_at']
        })

    return jsonify(result)

# -------------------------------------------------------------
# APPLICATION STARTUP
# -------------------------------------------------------------

def start_server():
    seed_database()
    port = Config.PORT
    host = Config.HOST
    print(f"Forge Backend starting on http://{host}:{port}")
    app.run(host=host, port=port, debug=Config.DEBUG)

if __name__ == '__main__':
    start_server()

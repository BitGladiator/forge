import sqlite3
import os
from pathlib import Path
from flask import current_app, has_app_context
from config import Config

def get_db_connection(db_path: str = None):
    if db_path:
        path = db_path
    elif has_app_context():
        path = current_app.config.get('DATABASE_PATH', Config.DATABASE_PATH)
    else:
        path = Config.DATABASE_PATH

    if path and os.path.dirname(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)

    conn = sqlite3.connect(path, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db(db_path: str = None):
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    def ensure_column(table, column, col_type):
        try:
            cursor.execute(f"SELECT {column} FROM {table} LIMIT 1")
        except sqlite3.OperationalError:
            try:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
                conn.commit()
            except Exception:
                pass

    try:
        tables = [r[0] for r in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
        if 'projects' in tables:
            ensure_column('projects', 'event_id', 'TEXT REFERENCES events(id) ON DELETE CASCADE')
        if 'judge_assignments' in tables:
            ensure_column('judge_assignments', 'event_id', 'TEXT REFERENCES events(id) ON DELETE CASCADE')
        if 'teams' in tables:
            ensure_column('teams', 'event_id', 'TEXT REFERENCES events(id) ON DELETE CASCADE')
        if 'rubric_criteria' in tables:
            ensure_column('rubric_criteria', 'event_id', 'TEXT REFERENCES events(id) ON DELETE CASCADE')
        if 'projects' in tables and 'teams' in tables:
            try:
                cursor.execute("""
                    UPDATE projects
                    SET team_name = (SELECT name FROM teams WHERE teams.id = projects.team_id)
                    WHERE team_id IN (SELECT id FROM teams) AND team_id IS NOT NULL
                """)
                conn.commit()
            except Exception:
                pass
        if 'events' in tables:
            ensure_column('events', 'description', 'TEXT')
            ensure_column('events', 'start_date', 'TEXT')
            ensure_column('events', 'judging_deadline', 'TEXT')
            ensure_column('events', 'tracks', 'TEXT')
            ensure_column('events', 'prizes', 'TEXT')
            ensure_column('events', 'organizer_id', 'TEXT REFERENCES users(id) ON DELETE SET NULL')
            ensure_column('events', 'updated_at', 'TEXT')
            try:
                cursor.execute("UPDATE events SET updated_at = created_at WHERE updated_at IS NULL")
                conn.commit()
            except Exception:
                pass
    except Exception:
        pass

    schema_path = Path(__file__).resolve().parent / 'schema.sql'
    with open(schema_path, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()

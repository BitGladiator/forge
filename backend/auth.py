import functools
import hashlib
import secrets
from flask import request, jsonify
from database import get_db_connection

def hash_password(password: str) -> str:
    # Deterministic SHA-256 for local self-hosted simplicity
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def generate_token() -> str:
    return secrets.token_hex(24)

def get_current_user():
    auth_header = request.headers.get('Authorization', '')
    token = None
    if auth_header.startswith('Bearer '):
        token = auth_header.split(' ', 1)[1].strip()
    elif auth_header:
        token = auth_header.strip()

    if not token:
        return None

    conn = get_db_connection()
    user = conn.execute(
        "SELECT id, name, email, role, token, team_id FROM users WHERE token = ?",
        (token,)
    ).fetchone()
    conn.close()

    if user:
        return dict(user)
    return None

def require_auth(roles: list = None):
    def decorator(f):
        @functools.wraps(f)
        def wrapper(*args, **kwargs):
            user = get_current_user()
            if not user:
                return jsonify({"error": "Authentication required", "status": 401}), 401

            if roles is not None:
                # 'admin' can access organizer, judge, and participant routes
                allowed = set(roles)
                if 'admin' not in allowed:
                    allowed.add('admin')

                if user.get('role') not in allowed:
                    return jsonify({
                        "error": "Access denied. Insufficient permissions for this resource.",
                        "status": 403,
                        "currentRole": user.get('role'),
                        "requiredRoles": roles
                    }), 403

            request.current_user = user
            return f(*args, **kwargs)
        return wrapper
    return decorator

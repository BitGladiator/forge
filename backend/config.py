import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'forge-secret-key-production-dogfood-2026')
    DATABASE_PATH = os.environ.get('DATABASE_PATH', str(BASE_DIR / 'forge.db'))
    FIXTURES_PATH = os.environ.get('FIXTURES_PATH', str(ROOT_DIR / 'fixtures.json'))
    PORT = int(os.environ.get('PORT', 8000))
    HOST = os.environ.get('HOST', '0.0.0.0')
    DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 't')

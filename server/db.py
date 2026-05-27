"""
db.py — PostgreSQL connection helper with connection pooling
"""
import os
import psycopg2
import psycopg2.extras
import psycopg2.pool
from urllib.parse import urlparse

# Support DATABASE_URL (Railway, Render, Heroku) or individual env vars
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    url = urlparse(DATABASE_URL)
    DB_CONFIG = {
        'host':     url.hostname,
        'port':     url.port or 5432,
        'user':     url.username,
        'password': url.password,
        'dbname':   url.path[1:],
    }
else:
    DB_CONFIG = {
        'host':     os.environ.get('DB_HOST',     'localhost'),
        'port':     int(os.environ.get('DB_PORT', '5432')),
        'user':     os.environ.get('DB_USER',     'postgres'),
        'password': os.environ.get('DB_PASSWORD', 'anhad12345'),
        'dbname':   os.environ.get('DB_NAME',     'satsang_portal'),
    }

# ThreadedConnectionPool: min 2, max 10 reused connections
_pool = psycopg2.pool.ThreadedConnectionPool(2, 10, **DB_CONFIG)

def get_conn():
    return _pool.getconn()

def _release(conn):
    _pool.putconn(conn)

def query(sql, params=None, one=False):
    """Run a SELECT and return list of dicts (or single dict if one=True)."""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            rows = cur.fetchall()
            return dict(rows[0]) if one and rows else [dict(r) for r in rows]
    finally:
        _release(conn)

def execute(sql, params=None, returning=False):
    """Run an INSERT/UPDATE/DELETE. Returns the row if RETURNING is used."""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params)
            result = None
            if returning:
                result = dict(cur.fetchone())
            conn.commit()
            return result
    except Exception:
        conn.rollback()
        raise
    finally:
        _release(conn)

def execute_many(sql, params_list):
    """Run the same statement with multiple param sets."""
    conn = get_conn()
    try:
        with conn.cursor() as cur:
            cur.executemany(sql, params_list)
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        _release(conn)

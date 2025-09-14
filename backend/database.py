import os
import psycopg2
from psycopg2.extras import DictCursor

def get_db_connection():
    """Establishes and returns a PostgreSQL database connection."""
    try:
        conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        return conn
    except Exception as e:
        print(f"Error connecting to the database: {e}")
        raise ConnectionError("Failed to connect to the database.")

def get_db_cursor():
    """Provides a database connection and cursor as a FastAPI dependency."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=DictCursor)
        yield cur, conn
    finally:
        if conn:
            cur.close()
            conn.close()

def create_table():
    """Creates the 'resumes_v2' table if it doesn't exist."""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('''
            CREATE TABLE IF NOT EXISTS resumes_v2 (
                id SERIAL PRIMARY KEY,
                filename TEXT NOT NULL,
                uploaded_at TIMESTAMPTZ NOT NULL,
                name TEXT,
                email TEXT,
                phone TEXT,
                extracted_data JSONB,
                llm_analysis JSONB
            )
        ''')
        conn.commit()
    except psycopg2.Error as e:
        print(f"Error creating table: {e}")
    finally:
        if conn:
            conn.close()
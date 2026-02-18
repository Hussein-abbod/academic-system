import sys
import os
import sqlite3

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import settings

def migrate():
    print("🔹 Starting migration: Adding time columns to courses table...", flush=True)
    
    # Database is in the backend directory
    db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "academic_system.db")

    if not os.path.exists(db_path):
        print(f"❌ Database not found at {db_path}", flush=True)
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if columns exist
        cursor.execute("PRAGMA table_info(courses)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "start_time" not in columns:
            print("🔹 Adding start_time column...", flush=True)
            cursor.execute("ALTER TABLE courses ADD COLUMN start_time VARCHAR(10)")
        else:
            print("🔸 start_time column already exists.", flush=True)

        if "end_time" not in columns:
            print("🔹 Adding end_time column...", flush=True)
            cursor.execute("ALTER TABLE courses ADD COLUMN end_time VARCHAR(10)")
        else:
            print("🔸 end_time column already exists.", flush=True)

        conn.commit()
        print("✅ Migration completed successfully.", flush=True)

    except Exception as e:
        print(f"❌ Migration failed: {e}", flush=True)
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()

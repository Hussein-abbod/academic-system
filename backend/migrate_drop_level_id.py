import sqlite3

def run_migration():
    try:
        conn = sqlite3.connect('academic_system.db')
        cursor = conn.cursor()
        
        # specific check for level_id
        cursor.execute("PRAGMA table_info(courses)")
        columns = cursor.fetchall()
        has_level_id = any(col[1] == 'level_id' for col in columns)
        
        if has_level_id:
            print("Found 'level_id' column. Dropping it...")
            # This works in SQLite 3.35+
            try:
                cursor.execute("ALTER TABLE courses DROP COLUMN level_id")
                conn.commit()
                print("Successfully dropped 'level_id' column.")
            except sqlite3.OperationalError as e:
                print(f"Could not drop column directly (old SQLite version?): {e}")
                # Fallback: recreate table logic omitted for simplicity unless needed
        else:
            print("'level_id' column not found.")
            
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")

if __name__ == "__main__":
    run_migration()

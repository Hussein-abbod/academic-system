import sqlite3

try:
    conn = sqlite3.connect('academic_system.db')
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(courses)")
    columns = cursor.fetchall()
    print("Columns in 'courses' table:")
    for col in columns:
        print(col)
    conn.close()
except Exception as e:
    print(f"Error: {e}")

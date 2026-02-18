import requests
import json
import sys

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@cosmic.academy"
ADMIN_PASSWORD = "admin123"

def debug_data():
    session = requests.Session()
    
    # Login
    resp = session.post(f"{BASE_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "role": "ADMIN"})
    if resp.status_code != 200:
        print(f"❌ Login failed: {resp.text}")
        return
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch Enrollments
    print("\n--- Enrollments ---")
    resp = session.get(f"{BASE_URL}/admin/enrollments", headers=headers)
    enrollments = resp.json()
    print(json.dumps(enrollments[:2], indent=2)) # Print first 2

    # Fetch Students
    print("\n--- Students ---")
    resp = session.get(f"{BASE_URL}/admin/users?role=STUDENT", headers=headers)
    students = resp.json()
    print(json.dumps(students[:2], indent=2))

    # Fetch Courses
    print("\n--- Courses ---")
    resp = session.get(f"{BASE_URL}/admin/courses", headers=headers)
    courses = resp.json()
    print(json.dumps(courses[:2], indent=2))
    
    # Fetch Payments
    print("\n--- Payments ---")
    resp = session.get(f"{BASE_URL}/admin/payments", headers=headers)
    payments = resp.json()
    print(json.dumps(payments[:2], indent=2))

if __name__ == "__main__":
    debug_data()

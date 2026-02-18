import requests
import sys
import time

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@cosmic.academy"
ADMIN_PASSWORD = "admin123"

def verify_inactive_enrollment():
    session = requests.Session()
    
    # 1. Login Admin
    print("🔹 Logging in Admin...", flush=True)
    resp = session.post(f"{BASE_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "role": "ADMIN"})
    if resp.status_code != 200:
        print(f"❌ Admin login failed: {resp.text}", flush=True)
        return
    admin_token = resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Get/Create Level
    print("🔹 Getting Level...", flush=True)
    resp = session.get(f"{BASE_URL}/admin/levels", headers=admin_headers)
    if not resp.json():
         session.post(f"{BASE_URL}/admin/levels", json={"name": "Inactive Test Level"}, headers=admin_headers)
         resp = session.get(f"{BASE_URL}/admin/levels", headers=admin_headers)
    level_id = resp.json()[0]["id"]

    # 3. Create INACTIVE Course
    course_name = f"Inactive Test Course {int(time.time())}"
    print(f"🔹 Creating INACTIVE Course '{course_name}'...", flush=True)
    resp = session.post(f"{BASE_URL}/admin/courses", json={
        "name": course_name, "level_id": level_id, "price": 100.0, 
        "start_date": "2024-01-01", "end_date": "2024-12-31",
        "is_active": False  # Key: Create as inactive (or update to inactive)
    }, headers=admin_headers)
    
    if resp.status_code != 200:
        print(f"❌ Course creation failed: {resp.text}", flush=True)
        return
    course_id = resp.json()["id"]
    
    # Update to ensure it is inactive (just in case default overrides)
    session.put(f"{BASE_URL}/admin/courses/{course_id}", json={"is_active": False}, headers=admin_headers)

    # 4. Create Student
    print("🔹 Creating Student...", flush=True)
    student_email = f"inactive_test_{int(time.time())}@example.com"
    resp = session.post(f"{BASE_URL}/admin/users", json={
        "email": student_email, "password": "password123", "full_name": "Inactive Test Student", "role": "STUDENT"
    }, headers=admin_headers)
    
    if resp.status_code == 200:
        student_id = resp.json()["id"]
    else:
         print(f"❌ Student creation failed: {resp.text}", flush=True)
         return

    # 5. Attempt to Enroll (Expect Failure)
    print("🔹 Attempting to Enroll (Expect 400 'inactive')...", flush=True)
    resp = session.post(f"{BASE_URL}/admin/enrollments", json={
        "student_id": student_id, "course_id": course_id
    }, headers=admin_headers)
    
    print(f"   -> Status Code: {resp.status_code}", flush=True)
    print(f"   -> Response: {resp.text}", flush=True)

    if resp.status_code == 400 and "inactive" in resp.text.lower():
        print("✅ BLOCKED: Enrollment prevented as expected.")
    elif resp.status_code == 200:
        print("❌ FAILED: Enrollment succeeded but should have failed.")
    else:
        print(f"❌ FAILED: Unexpected response {resp.status_code}")

    # Cleanup
    print("🔹 Cleaning up...", flush=True)
    session.delete(f"{BASE_URL}/admin/users/{student_id}", headers=admin_headers) # Hard delete should clean enrollments too if bug existed
    session.delete(f"{BASE_URL}/admin/courses/{course_id}", headers=admin_headers)

if __name__ == "__main__":
    verify_inactive_enrollment()

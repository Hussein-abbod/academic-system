import requests
import time
import sys

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@cosmic.academy"
ADMIN_PASSWORD = "admin123"

# Verification User
STUDENT_EMAIL = "verify_backend@example.com"
STUDENT_PASSWORD = "password123"

def verify_backend():
    session = requests.Session()
    
    # 1. Login Admin
    print("🔹 Logging in Admin...", flush=True)
    resp = session.post(f"{BASE_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "role": "ADMIN"})
    if resp.status_code != 200:
        print(f"❌ Admin login failed: {resp.text}", flush=True)
        return
    admin_token = resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Level
    print("🔹 Getting Level...", flush=True)
    print("🔹 Getting Level...", flush=True)
    resp = session.get(f"{BASE_URL}/admin/levels", headers=admin_headers)
    
    if resp.status_code != 200:
        print(f"❌ Failed to get levels: {resp.status_code} - {resp.text}", flush=True)
        return

    try:
        levels = resp.json()
    except Exception as e:
        print(f"❌ Failed to parse levels JSON: {e}. Content: {resp.text}", flush=True)
        return

    if not levels:
        print("🔹 Creating new level...", flush=True)
        l_resp = session.post(f"{BASE_URL}/admin/levels", json={"name": "Test Level"}, headers=admin_headers)
        if l_resp.status_code != 200:
             print(f"❌ Failed to create level: {l_resp.status_code} - {l_resp.text}", flush=True)
             return
        resp = session.get(f"{BASE_URL}/admin/levels", headers=admin_headers)
        levels = resp.json()
        
    level_id = levels[0]["id"]

    # 3. Create Course Price=500
    course_name = f"Backend Price Test {int(time.time())}"
    print(f"🔹 Creating Course '{course_name}' at $500...", flush=True)
    resp = session.post(f"{BASE_URL}/admin/courses", json={
        "name": course_name, "level_id": level_id, "price": 500.0, 
        "start_date": "2024-01-01", "end_date": "2024-12-31"
    }, headers=admin_headers)
    course_id = resp.json()["id"]

    # 4. Create/Login Student
    print("🔹 Setup Student...", flush=True)
    resp = session.post(f"{BASE_URL}/admin/users", json={
        "email": STUDENT_EMAIL, "password": STUDENT_PASSWORD, "full_name": "Verify Student", "role": "STUDENT"
    }, headers=admin_headers)
    
    if resp.status_code == 200:
        student_id = resp.json()["id"]
    else:
        # If user exists, find their ID
        users = session.get(f"{BASE_URL}/admin/users", headers=admin_headers).json()
        student_id = next(u["id"] for u in users if u["email"] == STUDENT_EMAIL)
    
    st_session = requests.Session()
    resp = st_session.post(f"{BASE_URL}/auth/login", json={"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD, "role": "STUDENT"})
    if resp.status_code != 200:
         print(f"❌ Student login failed: {resp.text}", flush=True)
         return
    st_token = resp.json()["access_token"]
    st_headers = {"Authorization": f"Bearer {st_token}"}

    # 5. Enroll (As Admin)
    print("🔹 Enrolling (via Admin)...", flush=True)
    resp = session.post(f"{BASE_URL}/admin/enrollments", json={
        "student_id": student_id,
        "course_id": course_id
    }, headers=admin_headers)
    
    if resp.status_code not in [200, 400]: # 400 if already enrolled
        print(f"❌ Enrollment failed: {resp.status_code} - {resp.text}", flush=True)
        return
    print("✅ Enrolled.", flush=True)

    # 6. Check Price (Expect 500)
    print("🔹 Checking Initial Price (Expect 500)...", flush=True)
    resp = st_session.get(f"{BASE_URL}/student/courses", headers=st_headers)
    course = next(c for c in resp.json() if c["course_id"] == course_id)
    print(f"   -> Price: {course['course_price']}", flush=True)

    # 7. Update Price to 600
    print("🔹 Updating Price to $600...", flush=True)
    session.put(f"{BASE_URL}/admin/courses/{course_id}", json={"price": 600.0}, headers=admin_headers)

    # 8. Check Price Again (Expect 600)
    print("🔹 Checking Updated Price (Expect 600)...", flush=True)
    resp = st_session.get(f"{BASE_URL}/student/courses", headers=st_headers)
    course = next(c for c in resp.json() if c["course_id"] == course_id)
    price = course['course_price']
    print(f"   -> Price: {price}", flush=True)
    
    if float(price) == 600.0:
        print("✅ BACKEND WORKS. Issue is purely Frontend.", flush=True)
    else:
        print("❌ BACKEND FAILED. Logic issue in API.", flush=True)

if __name__ == "__main__":
    verify_backend()

import requests
import sys
import time

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@cosmic.academy"
ADMIN_PASSWORD = "admin123"

TEST_USER_EMAIL = "delete_test_student@example.com"
TEST_USER_PASS = "password123"

def verify_hard_delete():
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
         session.post(f"{BASE_URL}/admin/levels", json={"name": "Delete Test Level"}, headers=admin_headers)
         resp = session.get(f"{BASE_URL}/admin/levels", headers=admin_headers)
    level_id = resp.json()[0]["id"]

    # 3. Create Course
    course_name = f"Delete Test Course {int(time.time())}"
    print(f"🔹 Creating Course '{course_name}'...", flush=True)
    resp = session.post(f"{BASE_URL}/admin/courses", json={
        "name": course_name, "level_id": level_id, "price": 100.0, 
        "start_date": "2024-01-01", "end_date": "2024-12-31"
    }, headers=admin_headers)
    if resp.status_code != 200:
        print(f"❌ Course creation failed: {resp.text}", flush=True)
        return
    course_id = resp.json()["id"]

    # 4. Create Student
    print("🔹 Creating Student...", flush=True)
    resp = session.post(f"{BASE_URL}/admin/users", json={
        "email": TEST_USER_EMAIL, "password": TEST_USER_PASS, "full_name": "Delete Test Student", "role": "STUDENT"
    }, headers=admin_headers)
    
    if resp.status_code == 200:
        student_id = resp.json()["id"]
    elif resp.status_code == 400 and "already registered" in resp.text:
         # Fetch existing
         users = session.get(f"{BASE_URL}/admin/users", headers=admin_headers).json()
         student_id = next(u["id"] for u in users if u["email"] == TEST_USER_EMAIL)
    else:
         print(f"❌ Student creation failed: {resp.text}", flush=True)
         return

    # 5. Enroll Student
    print("🔹 Enrolling Student...", flush=True)
    resp = session.post(f"{BASE_URL}/admin/enrollments", json={
        "student_id": student_id, "course_id": course_id
    }, headers=admin_headers)
    if resp.status_code not in [200, 400]:
        print(f"❌ Enrollment failed: {resp.text}", flush=True)
        return
    enrollment_resp = resp.json() if resp.status_code == 200 else None
    
    # If explicitly enrolled now, we have the ID. If 400, need to fetch it.
    if not enrollment_resp:
        enrs = session.get(f"{BASE_URL}/admin/enrollments?student_id={student_id}", headers=admin_headers).json()
        enrollment_id = enrs[0]["id"]
    else:
        enrollment_id = enrollment_resp["id"]

    # 6. Create Payment
    print("🔹 Creating Payment...", flush=True)
    resp = session.post(f"{BASE_URL}/admin/payments", json={
        "enrollment_id": enrollment_id, "amount": 50.0, "payment_status": "PAID"
    }, headers=admin_headers)
    if resp.status_code != 200:
        print(f"❌ Payment creation failed: {resp.text}", flush=True)
        return
    payment_id = resp.json()["id"]

    # 7. DELETE USER (The Test)
    print("🔹 Deleting User (Hard Delete)...", flush=True)
    resp = session.delete(f"{BASE_URL}/admin/users/{student_id}", headers=admin_headers)
    if resp.status_code != 200:
        print(f"❌ Delete failed: {resp.status_code} - {resp.text}", flush=True)
        return
    print("✅ Delete API call successful.")

    # 8. Verify Data Gone
    print("🔹 Verifying Data Removal...", flush=True)
    
    # Check User
    resp = session.get(f"{BASE_URL}/admin/users/{student_id}", headers=admin_headers)
    if resp.status_code == 404:
        print("✅ User not found (Good).")
    else:
        print(f"❌ User still exists! Status: {resp.status_code}")

    # Check Enrollment
    resp = session.get(f"{BASE_URL}/admin/enrollments/{enrollment_id}", headers=admin_headers)
    if resp.status_code == 404:
        print("✅ Enrollment not found (Good).")
    else:
        print(f"❌ Enrollment still exists! Status: {resp.status_code}")

    # Check Payment
    resp = session.get(f"{BASE_URL}/admin/payments/{payment_id}", headers=admin_headers)
    if resp.status_code == 404:
        print("✅ Payment not found (Good).")
    else:
        print(f"❌ Payment still exists! Status: {resp.status_code}")

    # Cleanup Course
    session.delete(f"{BASE_URL}/admin/courses/{course_id}", headers=admin_headers)

if __name__ == "__main__":
    verify_hard_delete()

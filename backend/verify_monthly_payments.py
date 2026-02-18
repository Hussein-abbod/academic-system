import requests
import sys
import time
from datetime import datetime, timedelta

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@cosmic.academy"
ADMIN_PASSWORD = "admin123"

def verify_monthly_payments():
    session = requests.Session()
    
    # 1. Login Admin
    print("🔹 Logging in Admin...", flush=True)
    resp = session.post(f"{BASE_URL}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD, "role": "ADMIN"})
    if resp.status_code != 200:
        print(f"❌ Admin login failed: {resp.text}", flush=True)
        return
    admin_token = resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Create Student
    print("🔹 Creating Student...", flush=True)
    student_email = f"monthly_student_{int(time.time())}@example.com"
    student_data = {
        "email": student_email,
        "password": "password123",
        "full_name": "Monthly Student",
        "role": "STUDENT"
    }
    resp = session.post(f"{BASE_URL}/admin/users", json=student_data, headers=admin_headers)
    if resp.status_code != 200:
        print(f"❌ Student creation failed: {resp.text}", flush=True)
        return
    student_id = resp.json()["id"]

    # 3. Create Course ($100/mo)
    print("🔹 Creating Course ($100/mo)...", flush=True)
    # Ensure we get a valid level ID first
    levels_resp = session.get(f"{BASE_URL}/admin/levels", headers=admin_headers)
    level_id = levels_resp.json()[0]["id"]
    
    course_data = {
        "name": f"Monthly Course {int(time.time())}",
        "level_id": level_id,
        "price": 100.0,
        "start_time": "10:00",
        "end_time": "12:00",
        "is_active": True
    }
    resp = session.post(f"{BASE_URL}/admin/courses", json=course_data, headers=admin_headers)
    course_id = resp.json()["id"]

    # 4. Enroll Student
    print("🔹 Enrolling Student...", flush=True)
    enroll_data = {
        "student_id": student_id,
        "course_id": course_id
    }
    resp = session.post(f"{BASE_URL}/admin/enrollments", json=enroll_data, headers=admin_headers)
    enrollment_id = resp.json()["id"]

    # Note: We cannot easily backdate enrollment via API without modifying the backend or direct DB access.
    # However, the frontend logic calculates based on current time vs enrollment time.
    # For a fresh enrollment, it should be 1 month due.
    
    print("✅ Setup complete. Please Verify via Frontend UI:", flush=True)
    print("   1. Go to Payments Page.")
    print(f"   2. Look for student 'Monthly Student'.")
    print(f"   3. Verify Balance is $100.00 (1 month x $100).")
    print(f"   4. Click Actions -> View Details.")
    print(f"   5. Verify Duration is 1 Month.")
    
    # 5. Simulate Partial Payment ($50)
    print("🔹 Simulating Partial Payment ($50)...", flush=True)
    payment_data = {
        "enrollment_id": enrollment_id,
        "amount": 50.0,
        "payment_status": "PAID",
        "notes": "Partial Payment"
    }
    session.post(f"{BASE_URL}/admin/payments", json=payment_data, headers=admin_headers)
    
    print("✅ Payment recorded. Please Verify via Frontend UI:", flush=True)
    print("   1. Refresh/Check Payments Page.")
    print("   2. Verify Balance is now $50.00.")

    # Cleanup
    print("🔹 Cleaning up...", flush=True)
    # Hard delete user will cascade delete enrollment and payment
    session.delete(f"{BASE_URL}/admin/users/{student_id}", headers=admin_headers)
    session.delete(f"{BASE_URL}/admin/courses/{course_id}", headers=admin_headers)

if __name__ == "__main__":
    verify_monthly_payments()

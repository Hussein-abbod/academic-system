import requests
import sys
import time
from datetime import datetime

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@cosmic.academy"
ADMIN_PASSWORD = "admin123"

def verify_max_payment_limit():
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
    student_email = f"max_pay_student_{int(time.time())}@example.com"
    student_data = {
        "email": student_email,
        "password": "password123",
        "full_name": "Max Pay Student",
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
        "name": f"Max Pay Course {int(time.time())}",
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

    # 5. ATTEMPT OVERPAYMENT ($101)
    print("🔹 Attempting Payment of $101 (Expect Balance $100)...", flush=True)
    bad_payment_data = {
        "enrollment_id": enrollment_id,
        "amount": 101.0,
        "payment_status": "PAID",
        "notes": "Overpayment attempt"
    }
    resp = session.post(f"{BASE_URL}/admin/payments", json=bad_payment_data, headers=admin_headers)
    
    if resp.status_code == 400:
        print("✅ BLOCKED: Server correctly rejected overpayment.", flush=True)
        print(f"   Response: {resp.json()['detail']}")
    else:
        print(f"❌ FAILED: Server allowed overpayment! Status: {resp.status_code}", flush=True)
        print(resp.text)

    # 6. ATTEMPT VALID PAYMENT ($100)
    print("🔹 Attempting Payment of $100 (Exact Balance)...", flush=True)
    good_payment_data = {
        "enrollment_id": enrollment_id,
        "amount": 100.0,
        "payment_status": "PAID",
        "notes": "Full payment"
    }
    resp = session.post(f"{BASE_URL}/admin/payments", json=good_payment_data, headers=admin_headers)
    
    if resp.status_code == 200:
        print("✅ SUCCESS: Server accepted full payment.", flush=True)
    else:
        print(f"❌ FAILED: Server rejected valid payment! Status: {resp.status_code}", flush=True)
        print(resp.text)

    # 7. ATTEMPT PAYMENT ON ZERO BALANCE ($1)
    print("🔹 Attempting Payment of $1 (Expect Balance $0)...", flush=True)
    zero_bal_payment_data = {
        "enrollment_id": enrollment_id,
        "amount": 1.0,
        "payment_status": "PAID",
        "notes": "Extra payment"
    }
    resp = session.post(f"{BASE_URL}/admin/payments", json=zero_bal_payment_data, headers=admin_headers)
    
    if resp.status_code == 400:
        print("✅ BLOCKED: Server correctly rejected payment on zero balance.", flush=True)
    else:
         print(f"❌ FAILED: Server allowed payment on zero balance! Status: {resp.status_code}", flush=True)

    # Cleanup
    print("🔹 Cleaning up...", flush=True)
    session.delete(f"{BASE_URL}/admin/users/{student_id}", headers=admin_headers)
    session.delete(f"{BASE_URL}/admin/courses/{course_id}", headers=admin_headers)

if __name__ == "__main__":
    verify_max_payment_limit()

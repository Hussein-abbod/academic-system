import requests
import sys

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@cosmic.academy" # Assuming this exists
ADMIN_PASSWORD = "admin123" # Assuming this is default

NEW_STUDENT_EMAIL = "test_manual_student@example.com"
NEW_STUDENT_PASS = "password123"

def reproduce_issue():
    session = requests.Session()
    
    # 1. Login as Admin
    print(f"🔹 Logging in as Admin...")
    try:
        resp = session.post(f"{BASE_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "role": "ADMIN"
        })
        if resp.status_code != 200:
            print(f"❌ Admin login failed: {resp.text}")
            return False
        
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Admin logged in.")
    except Exception as e:
        print(f"❌ Admin login error: {e}")
        return False

    # 2. Cleanup (Delete if exists) - checking by listing
    # Skipping extensive cleanup logic for simplicity, assuming uniqueness or fresh run
    
    # 3. Create Manual Student
    print(f"🔹 Creating Student {NEW_STUDENT_EMAIL}...")
    try:
        create_payload = {
            "email": NEW_STUDENT_EMAIL,
            "password": NEW_STUDENT_PASS,
            "full_name": "Test Manual Student",
            "phone_number": "1234567890",
            "role": "STUDENT"
        }
        resp = session.post(f"{BASE_URL}/admin/users", json=create_payload, headers=headers)
        
        if resp.status_code == 200:
            print("✅ Student created successfully.")
        elif resp.status_code == 400 and "Email already registered" in resp.text:
            print("⚠️ Student already exists, proceeding to login check...")
        else:
            print(f"❌ Student creation failed: {resp.status_code} - {resp.text}")
            return False
            
    except Exception as e:
        print(f"❌ Creation error: {e}")
        return False

    # 4. Try to Login as New Student
    print(f"🔹 Attempting login as New Student...")
    try:
        login_payload = {
            "email": NEW_STUDENT_EMAIL,
            "password": NEW_STUDENT_PASS,
            "role": "STUDENT"
        }
        # New session for student to avoid cookie/header polution
        student_session = requests.Session()
        resp = student_session.post(f"{BASE_URL}/auth/login", json=login_payload)
        
        if resp.status_code == 200:
            print("✅✅ STUDENT LOGIN SUCCESS!")
        else:
            print(f"❌❌ STUDENT LOGIN FAILED! Issue REPRODUCED.")
            print(f"Status: {resp.status_code}")
            return False

    except Exception as e:
        print(f"❌ Student login error: {e}")
        return False

    # 5. Create Manual Teacher
    NEW_TEACHER_EMAIL = "test_manual_teacher@example.com"
    print(f"\n🔹 Creating Teacher {NEW_TEACHER_EMAIL}...")
    try:
        create_payload = {
            "email": NEW_TEACHER_EMAIL,
            "password": NEW_STUDENT_PASS,
            "full_name": "Test Manual Teacher",
            "phone_number": "1234567890",
            "role": "TEACHER"
        }
        resp = session.post(f"{BASE_URL}/admin/users", json=create_payload, headers=headers)
        
        if resp.status_code == 200:
            print("✅ Teacher created successfully.")
        elif resp.status_code == 400 and "Email already registered" in resp.text:
            print("⚠️ Teacher already exists, proceeding to login check...")
        else:
            print(f"❌ Teacher creation failed: {resp.status_code} - {resp.text}")
            return False
            
    except Exception as e:
        print(f"❌ Creation error: {e}")
        return False

    # 6. Try to Login as New Teacher
    print(f"🔹 Attempting login as New Teacher...")
    try:
        login_payload = {
            "email": NEW_TEACHER_EMAIL,
            "password": NEW_STUDENT_PASS,
            "role": "TEACHER"
        }
        teacher_session = requests.Session()
        resp = teacher_session.post(f"{BASE_URL}/auth/login", json=login_payload)
        
        if resp.status_code == 200:
            print("✅✅ TEACHER LOGIN SUCCESS!")
            return True
        else:
            print(f"❌❌ TEACHER LOGIN FAILED! Issue REPRODUCED.")
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
            return False

    except Exception as e:
        print(f"❌ Teacher login error: {e}")
        return False

if __name__ == "__main__":
    reproduce_issue()

import requests
import sys
import time
import sys

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@cosmic.academy"
ADMIN_PASSWORD = "admin123"

# Reuse student from previous tests
STUDENT_EMAIL = "reproduce_price_test@example.com"
STUDENT_PASSWORD = "password123"

def reproduce_issue():
    session = requests.Session()
    
    print(f"🔹 Logging in as Admin...", flush=True)
    try:
        resp = session.post(f"{BASE_URL}/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD,
            "role": "ADMIN"
        })
        if resp.status_code != 200:
            print(f"❌ Admin login failed: {resp.text}", flush=True)
            return False
        
        token = resp.json()["access_token"]
        admin_headers = {"Authorization": f"Bearer {token}"}
    except Exception as e:
        print(f"❌ Admin login error: {e}", flush=True)
        return False

    print(f"🔹 Setting up Student {STUDENT_EMAIL}...", flush=True)
    try:
        create_payload = {
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD,
            "full_name": "Price Test Student",
            "phone_number": "1111111111",
            "role": "STUDENT"
        }
        resp = session.post(f"{BASE_URL}/admin/users", json=create_payload, headers=admin_headers)
        if resp.status_code not in [200, 400]:
             print(f"⚠️ Student creation failed with {resp.status_code}. Trying to login anyway...", flush=True)
        elif resp.status_code == 400 and "Email already registered" in resp.text:
            print("⚠️ Student already exists, continuing...", flush=True)
    except Exception as e:
        print(f"❌ Student setup error: {e}", flush=True)
        return False

    print(f"🔹 Creating Test Course ($100)...", flush=True)
    course_id = None
    try:
        resp = session.get(f"{BASE_URL}/admin/levels", headers=admin_headers)
        if resp.status_code != 200:
             print(f"❌ Failed to list levels: {resp.status_code} - {resp.text}", flush=True)
             return False
        
        levels = resp.json()
        if levels:
            level_id = levels[0]["id"]
            print(f"✅ Using existing level: {level_id}", flush=True)
        else:
            print("🔹 Creating new level 'Test Level'...", flush=True)
            l_resp = session.post(f"{BASE_URL}/admin/levels", json={"name": "Test Level"}, headers=admin_headers)
            if l_resp.status_code == 200:
                level_id = l_resp.json()["id"]
            else:
                print(f"❌ Failed to create level: {l_resp.status_code} - {l_resp.text}", flush=True)
                return False

        unique_name = f"Price Update Test Course {int(time.time())}"
        create_payload = {
            "name": unique_name,
            "level_id": level_id,
            "price": 100.00,
            "start_date": "2024-01-01",
            "end_date": "2024-12-31"
        }
        resp = session.post(f"{BASE_URL}/admin/courses", json=create_payload, headers=admin_headers)
        if resp.status_code == 200:
            course_id = resp.json()["id"]
            print(f"✅ Course created. ID: {course_id}", flush=True)
        else:
            print(f"❌ Course creation failed: {resp.status_code} - {resp.text}", flush=True)
            return False
            
    except Exception as e:
        print(f"❌ Course creation error: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return False

    print(f"🔹 Logging in as Student...", flush=True)
    student_session = requests.Session()
    try:
        resp = student_session.post(f"{BASE_URL}/auth/login", json={
            "email": STUDENT_EMAIL,
            "password": STUDENT_PASSWORD,
            "role": "STUDENT"
        })
        if resp.status_code != 200:
            print(f"❌ Student login failed: {resp.text}", flush=True)
            return False
        
        st_token = resp.json()["access_token"]
        st_headers = {"Authorization": f"Bearer {st_token}"}
        
        # Enrollment must be done via Admin API in this system
        print(f"🔹 Enrolling via Admin API...", flush=True)
        
        # Get Student ID
        users_resp = session.get(f"{BASE_URL}/admin/users", headers=admin_headers)
        if users_resp.status_code != 200:
             print(f"❌ Failed to get users: {users_resp.text}", flush=True)
             return False
             
        student_id = next((u["id"] for u in users_resp.json() if u["email"] == STUDENT_EMAIL), None)
        if not student_id:
             print("❌ Could not find student ID", flush=True)
             return False
             
        enroll_payload = {
            "student_id": student_id,
            "course_id": course_id
        }
        enroll_resp = session.post(f"{BASE_URL}/admin/enrollments", json=enroll_payload, headers=admin_headers)
        
        if enroll_resp.status_code == 200:
             print("✅ Enrolled successfully.", flush=True)
        elif enroll_resp.status_code == 400 and "already enrolled" in enroll_resp.text:
             print("⚠️ Already enrolled.", flush=True)
        else:
             print(f"❌ Enrollment failed: {enroll_resp.status_code} - {enroll_resp.text}", flush=True)
             return False

    except Exception as e:
        print(f"❌ Student login/enroll error: {e}", flush=True)
        return False

    print(f"🔹 Checking Student View of Price (Expect 100)...", flush=True)
    try:
        resp = student_session.get(f"{BASE_URL}/student/courses", headers=st_headers)
        if resp.status_code != 200:
            print(f"❌ Failed to get student courses: {resp.status_code} - {resp.text}", flush=True)
            return False
            
        courses = resp.json()
        my_course = next((c for c in courses if c["course_id"] == course_id), None)
        
        if my_course:
            price = my_course["course_price"]
            print(f"✅ Student sees price: ${price}", flush=True)
            if float(price) != 100.0:
                 print(f"❌ Price mismatch! Expected 100, got {price}", flush=True)
        else:
            print("❌ Course not found in student list", flush=True)
            print(f"List: {courses}", flush=True)
            return False
            
    except Exception as e:
        print(f"❌ Check error: {e}", flush=True)
        return False

    print(f"🔹 Updating Course Price to $200...", flush=True)
    try:
        update_payload = {
            "price": 200.00
        }
        resp = session.put(f"{BASE_URL}/admin/courses/{course_id}", json=update_payload, headers=admin_headers)
        if resp.status_code == 200:
            print("✅ Price updated.", flush=True)
        else:
            print(f"❌ Update failed: {resp.status_code} - {resp.text}", flush=True)
            return False
    except Exception as e:
        print(f"❌ Update error: {e}", flush=True)
        return False

    print(f"🔹 Checking Student View of Price AGAIN (Expect 200)...", flush=True)
    try:
        time.sleep(1) 
        resp = student_session.get(f"{BASE_URL}/student/courses", headers=st_headers)
        courses = resp.json()
        my_course = next((c for c in courses if c["course_id"] == course_id), None)
        
        if my_course:
            price = my_course["course_price"]
            print(f"✅ Student sees price: ${price}", flush=True)
            if float(price) == 200.0:
                 print("✅✅ SUCCESS! Backend returns updated price.", flush=True)
                 return True
            else:
                 print(f"❌❌ FAILURE! Backend returned OLD price: {price}. ISSUE REPRODUCED.", flush=True)
                 return False
        else:
            print("❌ Course not found in student list", flush=True)
            return False
            
    except Exception as e:
        print(f"❌ Check error: {e}", flush=True)
        return False

if __name__ == "__main__":
    reproduce_issue()

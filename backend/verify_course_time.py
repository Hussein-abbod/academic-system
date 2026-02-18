import requests
import sys
import time

# Force unbuffered output
sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@cosmic.academy"
ADMIN_PASSWORD = "admin123"

def verify_course_time():
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
         session.post(f"{BASE_URL}/admin/levels", json={"name": "Time Test Level"}, headers=admin_headers)
         resp = session.get(f"{BASE_URL}/admin/levels", headers=admin_headers)
    level_id = resp.json()[0]["id"]

    # 3. Create Course with Time
    course_name = f"Time Test Course {int(time.time())}"
    print(f"🔹 Creating Course '{course_name}' with Time...", flush=True)
    
    start_time = "10:00"
    end_time = "12:00"
    
    resp = session.post(f"{BASE_URL}/admin/courses", json={
        "name": course_name, 
        "level_id": level_id, 
        "price": 100.0, 
        "start_time": start_time,
        "end_time": end_time,
        "is_active": True
    }, headers=admin_headers)
    
    if resp.status_code != 200:
        print(f"❌ Course creation failed: {resp.text}", flush=True)
        return
        
    course_data = resp.json()
    print(f"   -> Response ID: {course_data.get('id')}", flush=True)
    print(f"   -> Start Time: {course_data.get('start_time')}", flush=True)
    print(f"   -> End Time: {course_data.get('end_time')}", flush=True)

    # 4. Verify Fields in Response
    if course_data.get('start_time') == start_time and course_data.get('end_time') == end_time:
        print("✅ SUCCESS: Course created with correct time fields.")
    else:
        print(f"❌ FAILED: Time fields missing or incorrect. Got: {course_data.get('start_time')} - {course_data.get('end_time')}")

    # Cleanup
    print("🔹 Cleaning up...", flush=True)
    session.delete(f"{BASE_URL}/admin/courses/{course_data['id']}", headers=admin_headers)

if __name__ == "__main__":
    verify_course_time()

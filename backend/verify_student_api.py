import requests
import sys

BASE_URL = "http://localhost:8000"
EMAIL = "student@cosmic.academy"
PASSWORD = "student123"

def verify_student_api():
    print(f"🔹 Testing Student API at {BASE_URL}...")
    
    # 1. Login
    print(f"   Attempting login as {EMAIL}...")
    try:
        login_response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": EMAIL,
            "password": PASSWORD,
            "role": "STUDENT"
        })
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
            return False
            
        token = login_response.json()["access_token"]
        print("✅ Login successful! Token received.")
        
        headers = {"Authorization": f"Bearer {token}"}
        
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False

    # 2. Get Dashboard Stats
    print("   Fetching Student Dashboard stats...")
    dashboard_response = requests.get(f"{BASE_URL}/student/dashboard", headers=headers)
    if dashboard_response.status_code == 200:
        print("✅ Dashboard stats: ", dashboard_response.json())
    else:
        print(f"❌ Dashboard stats failed: {dashboard_response.status_code} - {dashboard_response.text}")
        return False

    # 3. Get Courses
    print("   Fetching Student Courses...")
    courses_response = requests.get(f"{BASE_URL}/student/courses", headers=headers)
    if courses_response.status_code == 200:
        print("✅ Courses list: ", courses_response.json())
    else:
        print(f"❌ Courses list failed: {courses_response.status_code} - {courses_response.text}")
        return False

    # 4. Get Payments
    print("   Fetching Student Payments...")
    payments_response = requests.get(f"{BASE_URL}/student/payments", headers=headers)
    if payments_response.status_code == 200:
        print("✅ Payments list: ", payments_response.json())
    else:
        print(f"❌ Payments list failed: {payments_response.status_code} - {payments_response.text}")
        return False

    print("\n🎉 All Student API endpoints verified successfully!")
    return True

if __name__ == "__main__":
    if verify_student_api():
        sys.exit(0)
    else:
        sys.exit(1)

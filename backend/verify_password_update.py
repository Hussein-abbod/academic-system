import requests
import sys

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@cosmic.academy"
ADMIN_PASSWORD = "admin123"

# Reuse the teacher from previous test or create new
TEST_USER_EMAIL = "test_password_update@example.com"
INITIAL_PASSWORD = "password123"
NEW_PASSWORD = "newpassword456"

def verify_update():
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
    except Exception as e:
        print(f"❌ Admin login error: {e}")
        return False

    # 2. Create User
    print(f"🔹 Creating User {TEST_USER_EMAIL}...")
    try:
        create_payload = {
            "email": TEST_USER_EMAIL,
            "password": INITIAL_PASSWORD,
            "full_name": "Password Update Test",
            "phone_number": "0000000000",
            "role": "STUDENT"
        }
        resp = session.post(f"{BASE_URL}/admin/users", json=create_payload, headers=headers)
        
        user_id = None
        if resp.status_code == 200:
            user_id = resp.json()["id"]
            print(f"✅ User created. ID: {user_id}")
        elif resp.status_code == 400:
            # Fetch user to get ID
            print("⚠️ User exists, fetching existing user...")
            resp = session.get(f"{BASE_URL}/admin/users?role=STUDENT", headers=headers)
            users = resp.json()
            for u in users:
                if u["email"] == TEST_USER_EMAIL:
                    user_id = u["id"]
                    break
        
        if not user_id:
            print("❌ Could not get User ID")
            return False

    except Exception as e:
        print(f"❌ Creation error: {e}")
        return False

    # 3. Verify Initial Login
    print(f"🔹 Verifying Initial Login...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": INITIAL_PASSWORD,
            "role": "STUDENT"
        })
        if resp.status_code == 200:
            print("✅ Initial login success.")
        else:
            print(f"❌ Initial login failed: {resp.status_code}")
            return False
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False

    # 4. Update Password as Admin
    print(f"🔹 Updating Password to '{NEW_PASSWORD}'...")
    try:
        update_payload = {
            "password": NEW_PASSWORD
        }
        resp = session.put(f"{BASE_URL}/admin/users/{user_id}", json=update_payload, headers=headers)
        
        if resp.status_code == 200:
            print("✅ Password update request successful.")
        else:
            print(f"❌ Password update failed: {resp.status_code} - {resp.text}")
            return False
            
    except Exception as e:
        print(f"❌ Update error: {e}")
        return False

    # 5. Verify New Password Login
    print(f"🔹 Verifying Login with NEW Password...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": NEW_PASSWORD,
            "role": "STUDENT"
        })
        if resp.status_code == 200:
            print("✅✅ LOGIN WITH NEW PASSWORD SUCCESS!")
            return True
        else:
            print(f"❌❌ LOGIN WITH NEW PASSWORD FAILED! Fix did not work.")
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
            return False

    except Exception as e:
        print(f"❌ New Login error: {e}")
        return False

if __name__ == "__main__":
    verify_update()

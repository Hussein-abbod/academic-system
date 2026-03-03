import requests
import json

BASE_URL = "http://localhost:8000"

def debug_api():
    # 1. Login
    login_data = {
        "email": "teacher@cosmic.academy",
        "password": "password123",
        "role": "TEACHER"
    }
    
    try:
        print(f"Logging in as {login_data['email']}...")
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if response.status_code != 200:
            print(f"Login failed: {response.status_code}")
            print(response.text)
            return
            
        token_data = response.json()
        access_token = token_data.get("access_token")
        print("Login successful. Token received.")
        
        # 2. Get Students
        headers = {"Authorization": f"Bearer {access_token}"}
        print("\nFetching /teacher/students...")
        response = requests.get(f"{BASE_URL}/teacher/students", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Data received: {len(data)} items")
            print(json.dumps(data, indent=2))
        else:
            print("Failed to fetch students")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_api()

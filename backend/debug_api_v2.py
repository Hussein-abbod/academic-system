import requests
import json
import sys

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
        token_data = response.json()
        access_token = token_data.get("access_token")
        
        # 2. Get Students
        headers = {"Authorization": f"Bearer {access_token}"}
        print("\nFetching /teacher/students...")
        response = requests.get(f"{BASE_URL}/teacher/students", headers=headers)
        
        print(f"Status Code: {response.status_code}")
        
        # Write full response logic
        with open('api_response.json', 'w', encoding='utf-8') as f:
            try:
                data = response.json()
                json.dump(data, f, indent=2)
            except:
                f.write(response.text)
                
        print("Response written to api_response.json")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    debug_api()

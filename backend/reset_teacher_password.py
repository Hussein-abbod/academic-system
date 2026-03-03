from database import SessionLocal
from models.user import User
from auth.security import hash_password

def reset_password():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.full_name == "Sarah Connor").first()
        if user:
            print(f"Found user: {user.full_name}, Email: {user.email}")
            user.hashed_password = hash_password("password123")
            db.commit()
            print("Password reset to 'password123'")
        else:
            print("User 'Sarah Connor' not found.")
            
            # List all users to find a teacher
            users = db.query(User).all()
            for u in users:
                print(f"User: {u.full_name}, Role: {u.role}, Email: {u.email}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_password()

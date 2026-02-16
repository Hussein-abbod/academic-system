from database import SessionLocal, Base, engine
from models.user import User, UserRole
import hashlib

def create_demo_teacher():
    """Create a demo teacher account for testing"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if teacher exists
        existing = db.query(User).filter(User.email == "teacher@cosmic.academy").first()
        if existing:
            print("✅ Teacher account already exists: teacher@cosmic.academy")
            return

        # Simple hash for demo
        simple_hash = hashlib.sha256("teacher123".encode()).hexdigest()
        
        teacher = User(
            email="teacher@cosmic.academy",
            hashed_password=simple_hash,
            role=UserRole.TEACHER,
            full_name="Sarah Connor",
            is_active=True
        )
        db.add(teacher)
        db.commit()
        
        print("✅ Demo teacher created successfully!")
        print("   Email: teacher@cosmic.academy")
        print("   Password: teacher123")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_teacher()

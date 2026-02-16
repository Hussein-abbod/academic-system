from database import SessionLocal, Base, engine
from models.user import User, UserRole
import hashlib

def create_demo_student():
    """Create a demo student account for testing"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        # Check if student exists
        existing = db.query(User).filter(User.email == "student@cosmic.academy").first()
        if existing:
            print("✅ Student account already exists: student@cosmic.academy")
            return

        # Simple hash for demo
        simple_hash = hashlib.sha256("student123".encode()).hexdigest()
        
        student = User(
            email="student@cosmic.academy",
            hashed_password=simple_hash,
            role=UserRole.STUDENT,
            full_name="John Conner",
            is_active=True
        )
        db.add(student)
        db.commit()
        
        print("✅ Demo student created successfully!")
        print("   Email: student@cosmic.academy")
        print("   Password: student123")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_student()

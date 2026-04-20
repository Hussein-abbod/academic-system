import os
import sys

# Ensure backend path is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, Base, engine
from models import * # This imports models from __init__.py
from models.user import User, UserRole
from auth.security import hash_password

def reset_database():
    """Drop all tables, recreate them, and seed admin"""
    print("Dropping all tables...")
    # Drop all tables using SQLAlchemy metadata
    Base.metadata.drop_all(bind=engine)
    
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Create default admin user
        admin = User(
            email="admin@speakup.academy",
            hashed_password=hash_password("admin123"),
            role=UserRole.ADMIN,
            full_name="Admin User",
            is_active=True
        )
        db.add(admin)
        print("> Created default admin user (email: admin@speakup.academy, password: admin123)")
        
        db.commit()
        print("\n> Database reset successfully! All data removed except default admin.")
        
    except Exception as e:
        print(f"Error resetting database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_database()

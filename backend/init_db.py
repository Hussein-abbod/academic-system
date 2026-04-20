from database import SessionLocal, Base, engine
from models.user import User, UserRole
from auth.security import hash_password


def init_database():
    """Initialize database with tables and seed data"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if admin exists
        admin_exists = db.query(User).filter(User.role == UserRole.ADMIN).first()
        
        if not admin_exists:
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
        print("\n> Database initialized successfully!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_database()

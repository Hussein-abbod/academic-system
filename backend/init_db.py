from database import SessionLocal, Base, engine
from models.user import User, UserRole
from models.level import Level
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
                email="admin@cosmic.academy",
                hashed_password=hash_password("admin123"),
                role=UserRole.ADMIN,
                full_name="Admin User",
                is_active=True
            )
            db.add(admin)
            print("✓ Created default admin user (email: admin@cosmic.academy, password: admin123)")
        
        # Check if levels exist
        levels_exist = db.query(Level).count() > 0
        
        if not levels_exist:
            # Create default levels
            beginner = Level(
                name="Beginner",
                description="Foundation level for English learners",
                order=1,
                passing_score_requirement=70
            )
            intermediate = Level(
                name="Intermediate",
                description="Intermediate level for progressing students",
                order=2,
                passing_score_requirement=75
            )
            advanced = Level(
                name="Advanced",
                description="Advanced level for proficient students",
                order=3,
                passing_score_requirement=80
            )
            
            db.add_all([beginner, intermediate, advanced])
            print("✓ Created default levels (Beginner, Intermediate, Advanced)")
        
        db.commit()
        print("\n✓ Database initialized successfully!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    init_database()

"""Drops and recreates all tables, then seeds the admin user."""
from database import SessionLocal, Base, engine
from models.user import User, UserRole
from models.course import Course
from models.enrollment import Enrollment
from models.payment import Payment
from models.quiz import Quiz, QuizQuestion, QuizOption, QuizSubmission, QuizAnswer
from auth.security import hash_password

def recreate():
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

    db = SessionLocal()
    try:
        admin_exists = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if not admin_exists:
            admin = User(
                email="admin@cosmic.academy",
                hashed_password=hash_password("admin123"),
                role=UserRole.ADMIN,
                full_name="Admin User",
                is_active=True
            )
            db.add(admin)
            db.commit()
            print("✓ Admin user created: admin@cosmic.academy / admin123")
        else:
            print("✓ Admin user already exists")
        print("\nDatabase ready!")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    recreate()

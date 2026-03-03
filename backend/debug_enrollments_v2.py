from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from config import settings
from models.course import Course
from models.enrollment import Enrollment
from models.user import User, UserRole

def debug_enrollments():
    # Create engine with echo=False
    connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        echo=False
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        print("\n--- DEBUG START ---")
        
        # 1. Check Teachers
        teachers = db.query(User).filter(User.role == UserRole.TEACHER).all()
        print(f"Found {len(teachers)} teachers.")
        
        for t in teachers:
            print(f"\nTeacher: {t.full_name} ({t.email}) ID: {t.id}")
            
            # 2. Check Courses for Teacher
            courses = db.query(Course).filter(Course.teacher_id == t.id).all()
            print(f"  Courses Taught: {len(courses)}")
            
            for c in courses:
                print(f"    Course: {c.name} (ID: {c.id})")
                
                # 3. Check Enrollments for Course
                enrollments = db.query(Enrollment).filter(Enrollment.course_id == c.id).all()
                print(f"      Total Enrollments: {len(enrollments)}")
                
                active_enrollments = [e for e in enrollments if str(e.status) == "ACTIVE" or str(e.status) == "EnrollmentStatus.ACTIVE"]
                print(f"      Active Enrollments: {len(active_enrollments)}")
                
                for e in enrollments:
                    student = db.query(User).filter(User.id == e.student_id).first()
                    student_name = student.full_name if student else "Unknown"
                    print(f"        - Student: {student_name} (ID: {e.student_id})")
                    print(f"          Status: '{e.status}' (Type: {type(e.status)})")
                    
        print("\n--- ALL ENROLLMENTS SAMPLES ---")
        samples = db.query(Enrollment).limit(5).all()
        for e in samples:
            print(f"Sample: ID={e.id}, Status={e.status}, Type={type(e.status)}")

        print("--- DEBUG END ---")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_enrollments()

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from config import settings
from models.course import Course
from models.enrollment import Enrollment
from models.user import User, UserRole

def check_data():
    # Setup DB connection
    connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
    engine = create_engine(settings.DATABASE_URL, connect_args=connect_args, echo=False)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        print("\n=== DATA INTEGRITY CHECK ===")
        
        # 1. Teachers
        teachers = db.query(User).filter(User.role == UserRole.TEACHER).all()
        print(f"Teachers Found: {len(teachers)}")
        if not teachers:
            print("CRITICAL: No teachers found in the database.")
            return

        for t in teachers:
            print(f"\n[Teacher] {t.full_name} (ID: {t.id})")
            
            # 2. Courses
            courses = db.query(Course).filter(Course.teacher_id == t.id).all()
            print(f"  Courses: {len(courses)}")
            
            if not courses:
                print("    WARNING: This teacher has no courses.")
                continue

            for c in courses:
                print(f"    [Course] {c.name} (ID: {c.id})")
                
                # 3. Enrollments (Raw check)
                raw_enrollment_count = db.query(Enrollment).filter(Enrollment.course_id == c.id).count()
                print(f"      Total Enrollments (Raw): {raw_enrollment_count}")
                
                # 4. Enrollments (Joined check - simulating API query)
                # We do the exact query structure the API uses
                api_query_results = db.query(Enrollment).join(Course).filter(
                    Course.teacher_id == t.id,
                    Enrollment.course_id == c.id
                ).all()
                print(f"      Enrollments via API Query Logic: {len(api_query_results)}")
                
                if len(api_query_results) > 0:
                    for e in api_query_results:
                         student = db.query(User).filter(User.id == e.student_id).first()
                         student_name = student.full_name if student else "UNKNOWN_STUDENT"
                         print(f"        -> Student: {student_name}, Status: {e.status}")
                elif raw_enrollment_count > 0:
                     print("      CRITICAL: Enrollments exist but are missing from API Query Logic. Check Joins/Filters.")

    except Exception as e:
        print(f"\nERROR: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    # Redirect stdout to file with utf-8 encoding
    with open('integrity_results.txt', 'w', encoding='utf-8') as f:
        sys.stdout = f
        check_data()

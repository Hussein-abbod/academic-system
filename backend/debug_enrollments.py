import logging

# Disable sqlalchemy logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

def debug_enrollments():
    from sqlalchemy.orm import Session
    from database import SessionLocal, engine
    from models.course import Course
    from models.enrollment import Enrollment
    from models.user import User, UserRole

    db = SessionLocal()
    try:
        print("\n--- Teachers ---")
        teachers = db.query(User).filter(User.role == UserRole.TEACHER).all()
        for t in teachers:
            print(f"Teacher: {t.full_name} (ID: {t.id})")
            courses = db.query(Course).filter(Course.teacher_id == t.id).all()
            print(f"  Courses Taught: {len(courses)}")
            for c in courses:
                print(f"    - {c.name} (ID: {c.id})")
                enrollments = db.query(Enrollment).filter(Enrollment.course_id == c.id).all()
                print(f"      Enrollments: {len(enrollments)}")
                for e in enrollments:
                    student = db.query(User).filter(User.id == e.student_id).first()
                    student_name = student.full_name if student else "Unknown"
                    print(f"        - Student: {student_name} (ID: {e.student_id}), Status: '{e.status}'")

        print("\n--- All Enrollments Dump ---")
        all_enrollments = db.query(Enrollment).all()
        for e in all_enrollments:
             print(f"Enrollment ID: {e.id}, Course: {e.course_id}, Student: {e.student_id}, Status: {e.status}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    debug_enrollments()

import sys
import os

# Add current directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models.user import User
from models.course import Course
from models.enrollment import Enrollment
from models.payment import Payment

# Data to clean up
TARGET_EMAIL = "reproduce_price_test@example.com"
TARGET_COURSE_KEYPHRASE = "Price Update Test Course"

def cleanup():
    db = SessionLocal()
    print("🔹 Connected to database.", flush=True)
    
    try:
        # 1. Cleanup User
        print(f"🔹 Searching for user {TARGET_EMAIL}...", flush=True)
        user = db.query(User).filter(User.email == TARGET_EMAIL).first()
        if user:
            print(f"   🔹 Found user {user.id}. Deleting...", flush=True)
            # Check for enrollments for this user
            enrollments = db.query(Enrollment).filter(Enrollment.student_id == user.id).all()
            for enr in enrollments:
                print(f"      🔹 Deleting enrollment {enr.id} for user...", flush=True)
                # Delete payments for this enrollment
                payments = db.query(Payment).filter(Payment.enrollment_id == enr.id).all()
                for p in payments:
                    db.delete(p)
                db.delete(enr)
            
            db.delete(user)
            db.commit()
            print("✅ User deleted.", flush=True)
        else:
            print("✅ User not found.", flush=True)

        # 2. Cleanup Courses
        print(f"🔹 Searching for courses containing '{TARGET_COURSE_KEYPHRASE}'...", flush=True)
        courses = db.query(Course).filter(Course.name.contains(TARGET_COURSE_KEYPHRASE)).all()
        
        if not courses:
            print("✅ No test courses found.", flush=True)
        else:
            for course in courses:
                print(f"🔹 Processing course {course.id} ({course.name})...", flush=True)
                
                # Find all enrollments for this course (even for other users)
                enrollments = db.query(Enrollment).filter(Enrollment.course_id == course.id).all()
                for enr in enrollments:
                    print(f"   🔹 Deleting enrollment {enr.id}...", flush=True)
                    # Delete payments
                    payments = db.query(Payment).filter(Payment.enrollment_id == enr.id).all()
                    for p in payments:
                        print(f"      🔹 Deleting payment {p.id}...", flush=True)
                        db.delete(p)
                    db.delete(enr)
                
                # Now delete the course
                print(f"   🔹 Deleting course object...", flush=True)
                db.delete(course)
                db.commit()
                print("✅ Course deleted.", flush=True)

    except Exception as e:
        print(f"❌ Cleanup error: {e}", flush=True)
        db.rollback()
    finally:
        db.close()
        print("🔹 Cleanup finished.", flush=True)

if __name__ == "__main__":
    cleanup()

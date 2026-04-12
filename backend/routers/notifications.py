from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from database import get_db
from auth.dependencies import get_current_user
from models.user import User, UserRole
from models.payment import Payment, PaymentStatus
from models.attendance import Attendance
from models.enrollment import Enrollment
from models.course import Course
from datetime import datetime, timedelta, date

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Return derived notifications for the current user based on recent activity."""
    notifications = []
    since_date = date.today() - timedelta(days=30)
    since_datetime = datetime.utcnow() - timedelta(days=30)

    def to_utc_iso(dt):
        if hasattr(dt, "time"):
            if dt.tzinfo is None:
                return dt.isoformat() + "Z"
        return dt.isoformat()

    if current_user.role == UserRole.STUDENT:
        # 1. Recent payments recorded for this student
        enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id
        ).all()
        enrollment_ids = [e.id for e in enrollments]

        if enrollment_ids:
            recent_payments = db.query(Payment).options(
                joinedload(Payment.enrollment).joinedload(Enrollment.course)
            ).filter(
                Payment.enrollment_id.in_(enrollment_ids),
                Payment.created_at >= since_datetime
            ).order_by(Payment.created_at.desc()).limit(10).all()

            for p in recent_payments:
                course_name = (
                    p.enrollment.course.name
                    if p.enrollment and p.enrollment.course
                    else "a course"
                )
                label = "confirmed" if p.payment_status == PaymentStatus.PAID else "pending"
                notifications.append({
                    "id": f"pay-{p.id}",
                    "type": "payment",
                    "title": "Payment Update",
                    "message": f"Payment of ${float(p.amount):.2f} for {course_name} is {label}.",
                    "time": to_utc_iso(p.created_at),
                })

        # 2. Recent attendance records for this student
        recent_attendance = db.query(Attendance).options(
            joinedload(Attendance.course)
        ).filter(
            Attendance.student_id == current_user.id,
            Attendance.date >= since_date
        ).order_by(Attendance.date.desc()).limit(10).all()

        for a in recent_attendance:
            course_name = a.course.name if a.course else "a course"
            raw = a.status.value if hasattr(a.status, "value") else str(a.status)
            emoji = {"PRESENT": "✅", "ABSENT": "❌", "LATE": "⚠️", "EXCUSED": "📋"}.get(raw, "")
            notifications.append({
                "id": f"att-{a.id}",
                "type": "attendance",
                "title": "Attendance Recorded",
                "message": f"{course_name} on {a.date.strftime('%b %d')}: {raw.capitalize()} {emoji}",
                "time": to_utc_iso(a.date),
            })

        # 3. Recent enrollment confirmations
        recent_enrollments = db.query(Enrollment).options(
            joinedload(Enrollment.course)
        ).filter(
            Enrollment.student_id == current_user.id,
            Enrollment.enrollment_date >= since_datetime
        ).order_by(Enrollment.enrollment_date.desc()).limit(5).all()

        for e in recent_enrollments:
            course_name = e.course.name if e.course else "a course"
            notifications.append({
                "id": f"enr-{e.id}",
                "type": "enrollment",
                "title": "Enrollment Confirmed",
                "message": f"You have been enrolled in {course_name}.",
                "time": to_utc_iso(e.enrollment_date),
            })

        # 3.5 AI Advisor Enrollment
        from models.ai_advisor import AiSubscription
        ai_sub = db.query(AiSubscription).filter(
            AiSubscription.student_id == current_user.id,
            AiSubscription.is_active == True,
            AiSubscription.enrolled_at >= since_datetime
        ).first()

        if ai_sub:
            level_name = ai_sub.level.value if hasattr(ai_sub.level, "value") else str(ai_sub.level)
            notifications.append({
                "id": f"enr-ai-{current_user.id}",
                "type": "ai_advisor",
                "title": "Enrollment Confirmed",
                "message": f"You have been enrolled in AI Advisor ({level_name.capitalize()}).",
                "time": to_utc_iso(ai_sub.enrolled_at),
            })

        # 4. Recently published quizzes in the student's enrolled courses
        from models.quiz import Quiz, QuizStatus
        all_enrollments = db.query(Enrollment).filter(
            Enrollment.student_id == current_user.id
        ).all()
        all_course_ids = [e.course_id for e in all_enrollments]

        if all_course_ids:
            recent_quizzes = db.query(Quiz).options(
                joinedload(Quiz.course)
            ).filter(
                Quiz.course_id.in_(all_course_ids),
                Quiz.status == QuizStatus.PUBLISHED,
                Quiz.updated_at >= since_datetime
            ).order_by(Quiz.updated_at.desc()).limit(10).all()

            for q in recent_quizzes:
                course_name = q.course.name if q.course else "your course"
                quiz_type = q.quiz_type.value if hasattr(q.quiz_type, "value") else str(q.quiz_type)
                notifications.append({
                    "id": f"quiz-{q.id}",
                    "type": "quiz",
                    "title": "New Quiz Available 🎯",
                    "message": f"\"{q.title}\" ({quiz_type.capitalize()}) is now available in {course_name}.",
                    "time": to_utc_iso(q.updated_at),
                })

    elif current_user.role == UserRole.TEACHER:
        # New students enrolled in the teacher's courses in the last 30 days
        teacher_courses = db.query(Course).filter(
            Course.teacher_id == current_user.id
        ).all()
        course_ids = [c.id for c in teacher_courses]

        if course_ids:
            recent_enrollments = db.query(Enrollment).options(
                joinedload(Enrollment.student),
                joinedload(Enrollment.course)
            ).filter(
                Enrollment.course_id.in_(course_ids),
                Enrollment.enrollment_date >= since_datetime
            ).order_by(Enrollment.enrollment_date.desc()).limit(20).all()

            for e in recent_enrollments:
                student_name = e.student.full_name if e.student else "A student"
                course_name = e.course.name if e.course else "your course"
                notifications.append({
                    "id": f"enr-{e.id}",
                    "type": "enrollment",
                    "title": "New Student Enrolled",
                    "message": f"{student_name} enrolled in {course_name}.",
                    "time": to_utc_iso(e.enrollment_date),
                })

    # Sort by time descending and return top 20
    notifications.sort(key=lambda n: n["time"], reverse=True)
    return notifications[:20]

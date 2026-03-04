"""
Student Quiz API — view available quizzes, start attempts, submit answers, get results.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models.quiz import Quiz, QuizQuestion, QuizOption, QuizSubmission, QuizAnswer, QuizStatus, SubmissionStatus
from models.enrollment import Enrollment, EnrollmentStatus
from models.user import User
from schemas.models import (
    QuizResponse, QuestionResponse, OptionResponse,
    SubmissionCreate, QuizResultResponse, AnswerResult
)
from auth.dependencies import require_student

router = APIRouter(tags=["Student - Quizzes"])


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _strip_correct(quiz: Quiz) -> QuizResponse:
    """Build a QuizResponse but hide is_correct from options."""
    resp = QuizResponse.from_orm(quiz)
    for q in resp.questions:
        for o in q.options:
            o.is_correct = None   # don't expose the answer
    resp.total_points = sum(q.points for q in quiz.questions)
    resp.course_name = quiz.course.name if quiz.course else None
    return resp


def _check_enrollment(student_id: str, course_id: str, db: Session):
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.course_id == course_id,
        Enrollment.status == EnrollmentStatus.ACTIVE
    ).first()
    if not enrollment:
        raise HTTPException(status_code=403, detail="You are not enrolled in this course")


def _check_quiz_availability(quiz: Quiz):
    now = datetime.now().replace(tzinfo=None)
    if quiz.status != QuizStatus.PUBLISHED:
        raise HTTPException(status_code=403, detail="This quiz is not published yet")
    if quiz.open_date:
        open_dt = quiz.open_date.replace(tzinfo=None) if hasattr(quiz.open_date, 'tzinfo') else quiz.open_date
        if now < open_dt:
            raise HTTPException(status_code=403, detail="This quiz is not open yet")
    if quiz.close_date:
        close_dt = quiz.close_date.replace(tzinfo=None) if hasattr(quiz.close_date, 'tzinfo') else quiz.close_date
        if now > close_dt:
            raise HTTPException(status_code=403, detail="This quiz has closed")


# ─────────────────────────────────────────────────────────────────────────────
# Quiz list & detail
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/quizzes", response_model=List[QuizResponse])
async def list_my_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """List all published quizzes for the student's enrolled courses."""
    enrollments = db.query(Enrollment).filter(
        Enrollment.student_id == current_user.id,
        Enrollment.status == EnrollmentStatus.ACTIVE
    ).all()
    course_ids = [e.course_id for e in enrollments]

    quizzes = db.query(Quiz).filter(
        Quiz.course_id.in_(course_ids),
        Quiz.status == QuizStatus.PUBLISHED
    ).all()

    results = []
    for quiz in quizzes:
        resp = _strip_correct(quiz)
        # Count only SUBMITTED (completed) attempts — not abandoned IN_PROGRESS ones
        attempts_done = db.query(QuizSubmission).filter(
            QuizSubmission.quiz_id == quiz.id,
            QuizSubmission.student_id == current_user.id,
            QuizSubmission.status == SubmissionStatus.SUBMITTED
        ).count()
        resp.description = (resp.description or "") + f"__attempts_used:{attempts_done}"
        results.append(resp)
    return results


@router.get("/quizzes/{quiz_id}", response_model=QuizResponse)
async def get_quiz_detail(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Get a single quiz for taking (options without correct answer flag)."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    _check_enrollment(current_user.id, quiz.course_id, db)
    _check_quiz_availability(quiz)

    return _strip_correct(quiz)


# ─────────────────────────────────────────────────────────────────────────────
# Start attempt
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/quizzes/{quiz_id}/start")
async def start_quiz(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Begin a new attempt. Returns submission_id and quiz data."""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    _check_enrollment(current_user.id, quiz.course_id, db)
    _check_quiz_availability(quiz)

    # Count only fully SUBMITTED (completed) attempts — use the enum, not a raw string
    finished_attempts = db.query(QuizSubmission).filter(
        QuizSubmission.quiz_id == quiz_id,
        QuizSubmission.student_id == current_user.id,
        QuizSubmission.status == SubmissionStatus.SUBMITTED
    ).count()

    if finished_attempts >= quiz.max_attempts:
        raise HTTPException(
            status_code=403,
            detail=f"You have used all {quiz.max_attempts} attempt(s) for this quiz"
        )

    # Reuse an existing IN_PROGRESS submission rather than creating a duplicate.
    # This prevents abandoned starts from counting as wasted attempts.
    existing_in_progress = db.query(QuizSubmission).filter(
        QuizSubmission.quiz_id == quiz_id,
        QuizSubmission.student_id == current_user.id,
        QuizSubmission.status == SubmissionStatus.IN_PROGRESS
    ).first()

    if existing_in_progress:
        submission = existing_in_progress
    else:
        submission = QuizSubmission(
            quiz_id=quiz_id,
            student_id=current_user.id,
            attempt_number=finished_attempts + 1,
            started_at=datetime.utcnow()
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)

    quiz_data = _strip_correct(quiz)
    return {
        "submission_id": submission.id,
        "quiz": quiz_data,
        "attempt_number": submission.attempt_number
    }


# ─────────────────────────────────────────────────────────────────────────────
# Submit answers
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/submissions/{submission_id}/submit", response_model=QuizResultResponse)
async def submit_quiz(
    submission_id: str,
    submission_data: SubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Submit answers and receive auto-graded score."""
    submission = db.query(QuizSubmission).filter(
        QuizSubmission.id == submission_id,
        QuizSubmission.student_id == current_user.id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.status == "SUBMITTED":
        raise HTTPException(status_code=400, detail="This submission has already been submitted")

    quiz = submission.quiz
    questions = {q.id: q for q in quiz.questions}
    option_map = {}
    for q in quiz.questions:
        for o in q.options:
            option_map[o.id] = o

    total_score = 0.0
    max_score = sum(q.points for q in quiz.questions)
    answer_results = []

    for answer_data in submission_data.answers:
        q = questions.get(answer_data.question_id)
        if not q:
            continue  # skip unknown questions

        is_correct = None
        points_awarded = 0.0

        if q.question_type in ("MCQ", "LISTENING") and answer_data.selected_option_id:
            opt = option_map.get(answer_data.selected_option_id)
            if opt and opt.question_id == q.id:
                is_correct = opt.is_correct
                points_awarded = q.points if is_correct else 0.0

        if is_correct:
            total_score += points_awarded

        db_answer = QuizAnswer(
            submission_id=submission.id,
            question_id=q.id,
            selected_option_id=answer_data.selected_option_id,
            short_answer_text=answer_data.short_answer_text,
            is_correct=is_correct,
            points_awarded=points_awarded
        )
        db.add(db_answer)

        answer_results.append(AnswerResult(
            question_id=q.id,
            question_text=q.question_text,
            selected_option_id=answer_data.selected_option_id,
            is_correct=is_correct,
            points_awarded=points_awarded,
            max_points=q.points
        ))

    submission.status = "SUBMITTED"
    submission.submitted_at = datetime.utcnow()
    submission.score = total_score
    submission.max_score = max_score
    db.commit()
    db.refresh(submission)

    percentage = round((total_score / max_score * 100), 1) if max_score > 0 else 0.0

    return QuizResultResponse(
        submission_id=submission.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        score=total_score,
        max_score=max_score,
        percentage=percentage,
        attempt_number=submission.attempt_number,
        submitted_at=submission.submitted_at,
        answers=answer_results
    )


# ─────────────────────────────────────────────────────────────────────────────
# Get result
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/submissions/{submission_id}/result", response_model=QuizResultResponse)
async def get_submission_result(
    submission_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_student)
):
    """Retrieve a previously submitted quiz result."""
    submission = db.query(QuizSubmission).filter(
        QuizSubmission.id == submission_id,
        QuizSubmission.student_id == current_user.id
    ).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.status != "SUBMITTED":
        raise HTTPException(status_code=400, detail="Quiz has not been submitted yet")

    quiz = submission.quiz
    max_score = submission.max_score or 0
    percentage = round((submission.score / max_score * 100), 1) if max_score > 0 else 0.0

    answer_results = []
    for ans in submission.answers:
        answer_results.append(AnswerResult(
            question_id=ans.question_id,
            question_text=ans.question.question_text,
            selected_option_id=ans.selected_option_id,
            is_correct=ans.is_correct,
            points_awarded=ans.points_awarded or 0.0,
            max_points=ans.question.points
        ))

    return QuizResultResponse(
        submission_id=submission.id,
        quiz_id=quiz.id,
        quiz_title=quiz.title,
        score=submission.score or 0.0,
        max_score=max_score,
        percentage=percentage,
        attempt_number=submission.attempt_number,
        submitted_at=submission.submitted_at,
        answers=answer_results
    )

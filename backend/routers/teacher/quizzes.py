"""
Teacher Quiz API — full CRUD for quizzes, questions, and viewing student results.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models.course import Course
from models.quiz import Quiz, QuizQuestion, QuizOption, QuizSubmission, QuizStatus
from models.user import User
from schemas.models import (
    QuizCreate, QuizUpdate, QuizResponse,
    QuestionCreate, QuestionUpdate, QuestionResponse,
    SubmissionSummary
)
from auth.dependencies import require_teacher

router = APIRouter(tags=["Teacher - Quizzes"])


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _quiz_to_response(quiz: Quiz) -> QuizResponse:
    total = sum(q.points for q in quiz.questions)
    resp = QuizResponse.from_orm(quiz)
    resp.total_points = total
    resp.course_name = quiz.course.name if quiz.course else None
    return resp


def _get_teacher_quiz(quiz_id: str, teacher: User, db: Session) -> Quiz:
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    course = db.query(Course).filter(
        Course.id == quiz.course_id, Course.teacher_id == teacher.id
    ).first()
    if not course:
        raise HTTPException(status_code=403, detail="You do not have permission for this quiz")
    return quiz


# ─────────────────────────────────────────────────────────────────────────────
# Quiz CRUD
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/quizzes", response_model=List[QuizResponse])
async def list_teacher_quizzes(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """List all quizzes created by this teacher."""
    quizzes = db.query(Quiz).filter(Quiz.created_by == current_user.id).all()
    return [_quiz_to_response(q) for q in quizzes]


@router.post("/quizzes", response_model=QuizResponse, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    quiz_data: QuizCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Create a new draft quiz."""
    course = db.query(Course).filter(
        Course.id == quiz_data.course_id,
        Course.teacher_id == current_user.id
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or not assigned to you")

    quiz = Quiz(
        course_id=quiz_data.course_id,
        created_by=current_user.id,
        title=quiz_data.title,
        description=quiz_data.description,
        quiz_type=quiz_data.quiz_type,
        time_limit_minutes=quiz_data.time_limit_minutes,
        max_attempts=quiz_data.max_attempts,
        open_date=quiz_data.open_date,
        close_date=quiz_data.close_date,
        status=QuizStatus.DRAFT
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return _quiz_to_response(quiz)


@router.get("/quizzes/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Get a quiz with all questions and options."""
    quiz = _get_teacher_quiz(quiz_id, current_user, db)
    return _quiz_to_response(quiz)


@router.put("/quizzes/{quiz_id}", response_model=QuizResponse)
async def update_quiz(
    quiz_id: str,
    quiz_data: QuizUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Update quiz header settings."""
    quiz = _get_teacher_quiz(quiz_id, current_user, db)

    for field, value in quiz_data.dict(exclude_unset=True).items():
        setattr(quiz, field, value)
    db.commit()
    db.refresh(quiz)
    return _quiz_to_response(quiz)


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Delete a quiz and all its questions / submissions."""
    quiz = _get_teacher_quiz(quiz_id, current_user, db)
    db.delete(quiz)
    db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# Publish / Unpublish
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/quizzes/{quiz_id}/publish", response_model=QuizResponse)
async def publish_quiz(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Publish the quiz so students can see it."""
    quiz = _get_teacher_quiz(quiz_id, current_user, db)

    if not quiz.questions:
        raise HTTPException(status_code=400, detail="Quiz must have at least one question before publishing")

    # Every MCQ/LISTENING question must have a correct answer marked
    for q in quiz.questions:
        if q.question_type in ("MCQ", "LISTENING"):
            has_correct = any(o.is_correct for o in q.options)
            if not has_correct:
                raise HTTPException(
                    status_code=400,
                    detail=f"Question '{q.question_text[:50]}' has no correct answer marked"
                )

    quiz.status = QuizStatus.PUBLISHED
    quiz.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quiz)
    return _quiz_to_response(quiz)


@router.post("/quizzes/{quiz_id}/unpublish", response_model=QuizResponse)
async def unpublish_quiz(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Set a published quiz back to draft."""
    quiz = _get_teacher_quiz(quiz_id, current_user, db)
    quiz.status = QuizStatus.DRAFT
    db.commit()
    db.refresh(quiz)
    return _quiz_to_response(quiz)


# ─────────────────────────────────────────────────────────────────────────────
# Questions
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/quizzes/{quiz_id}/questions", response_model=QuestionResponse, status_code=201)
async def add_question(
    quiz_id: str,
    question_data: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Add a question (with options) to a quiz."""
    quiz = _get_teacher_quiz(quiz_id, current_user, db)

    # Determine next order index
    max_order = max((q.order_index for q in quiz.questions), default=-1)

    question = QuizQuestion(
        quiz_id=quiz_id,
        question_type=question_data.question_type,
        question_text=question_data.question_text,
        audio_file_path=question_data.audio_file_path,
        points=question_data.points,
        order_index=question_data.order_index if question_data.order_index else max_order + 1,
    )
    db.add(question)
    db.flush()  # get the question id

    # Add options
    if question_data.options:
        for opt in question_data.options:
            option = QuizOption(
                question_id=question.id,
                option_text=opt.option_text,
                option_image_path=opt.option_image_path,
                is_correct=opt.is_correct,
                order_index=opt.order_index,
            )
            db.add(option)

    db.commit()
    db.refresh(question)
    return QuestionResponse.from_orm(question)


@router.put("/quizzes/{quiz_id}/questions/{question_id}", response_model=QuestionResponse)
async def update_question(
    quiz_id: str,
    question_id: str,
    question_data: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Update a question and replace its options."""
    _get_teacher_quiz(quiz_id, current_user, db)

    question = db.query(QuizQuestion).filter(
        QuizQuestion.id == question_id,
        QuizQuestion.quiz_id == quiz_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    for field, value in question_data.dict(exclude_unset=True, exclude={"options"}).items():
        setattr(question, field, value)

    # Replace options if provided
    if question_data.options is not None:
        # Delete existing
        for opt in question.options:
            db.delete(opt)
        db.flush()
        for opt in question_data.options:
            option = QuizOption(
                question_id=question.id,
                option_text=opt.option_text,
                option_image_path=opt.option_image_path,
                is_correct=opt.is_correct,
                order_index=opt.order_index,
            )
            db.add(option)

    db.commit()
    db.refresh(question)
    return QuestionResponse.from_orm(question)


@router.delete("/quizzes/{quiz_id}/questions/{question_id}", status_code=204)
async def delete_question(
    quiz_id: str,
    question_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Delete a question and its options."""
    _get_teacher_quiz(quiz_id, current_user, db)

    question = db.query(QuizQuestion).filter(
        QuizQuestion.id == question_id,
        QuizQuestion.quiz_id == quiz_id
    ).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    db.delete(question)
    db.commit()


# ─────────────────────────────────────────────────────────────────────────────
# Results
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/quizzes/{quiz_id}/results", response_model=List[SubmissionSummary])
async def get_quiz_results(
    quiz_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Get all student submissions for this quiz."""
    _get_teacher_quiz(quiz_id, current_user, db)

    submissions = db.query(QuizSubmission).filter(
        QuizSubmission.quiz_id == quiz_id
    ).all()

    results = []
    for sub in submissions:
        pct = round((sub.score / sub.max_score * 100), 1) if (sub.score is not None and sub.max_score) else None
        results.append(SubmissionSummary(
            submission_id=sub.id,
            student_id=sub.student_id,
            student_name=sub.student.full_name,
            score=sub.score,
            max_score=sub.max_score,
            percentage=pct,
            attempt_number=sub.attempt_number,
            submitted_at=sub.submitted_at,
            status=sub.status.value
        ))
    return results

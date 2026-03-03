from fastapi import APIRouter

from . import courses, students, quizzes, attendance

router = APIRouter(prefix="/teacher", tags=["Teacher Dashboard"])

router.include_router(courses.router)
router.include_router(students.router)
router.include_router(quizzes.router)
router.include_router(attendance.router)

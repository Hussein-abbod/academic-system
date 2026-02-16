from fastapi import APIRouter

from . import courses, students

router = APIRouter(prefix="/teacher", tags=["Teacher Dashboard"])

router.include_router(courses.router)
router.include_router(students.router)

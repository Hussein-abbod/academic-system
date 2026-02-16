from fastapi import APIRouter

from . import courses, payments, dashboard

router = APIRouter(prefix="/student", tags=["Student Dashboard"])

router.include_router(dashboard.router)
router.include_router(courses.router)
router.include_router(payments.router)

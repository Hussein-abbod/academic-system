import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from config import settings
from limiter import limiter
from database import Base, engine
from routers import auth
from routers.admin import users, courses, enrollments, payments, statistics
from routers import teacher, student, student_ai, admin_ai
from routers.notifications import router as notifications_router
from routers.uploads import router as uploads_router
from models import ai_advisor  # Import to register models with Base

# Create database tables
Base.metadata.create_all(bind=engine)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security response headers to every response."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        # Uncomment the line below when serving over HTTPS:
        # response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
        return response

# Create FastAPI application — hide docs in production (DEBUG=false)
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Academic English Institute Management System API",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)

# Register the rate limiter on the app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Security headers on every response
app.add_middleware(SecurityHeadersMiddleware)

# Configure CORS — credentials=True requires explicit origins (not *)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Include routers
app.include_router(auth.router)
app.include_router(uploads_router)
app.include_router(users.router)
app.include_router(courses.router)
app.include_router(enrollments.router)
app.include_router(payments.router)
app.include_router(statistics.router)
app.include_router(teacher.router)
app.include_router(student.router)
app.include_router(notifications_router)
app.include_router(student_ai.router)
app.include_router(admin_ai.router)


@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Welcome to SpeakUP Academy Management System API",
        "version": settings.VERSION,
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


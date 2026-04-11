from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings and configuration"""

    # Database
    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/academic_system"

    # JWT Security — SECRET_KEY has NO default. Must be set in .env.
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Short-lived tokens (30 min)

    # App mode: set DEBUG=false in production to hide /docs
    DEBUG: bool = False

    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Cloudinary Cloud Storage
    CLOUDINARY_URL: str = ""

    # AI Feature (Groq)
    GROQ_API_KEY: str = ""

    # Application
    APP_NAME: str = "SpeakUP Academy Management System"
    VERSION: str = "1.0.0"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

import os
if settings.CLOUDINARY_URL:
    os.environ["CLOUDINARY_URL"] = settings.CLOUDINARY_URL

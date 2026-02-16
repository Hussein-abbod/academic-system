from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings and configuration"""
    
    # Database - Using SQLite for demo (easier setup, no PostgreSQL required)
    DATABASE_URL: str = "sqlite:///./academic_system.db"
    
    # JWT Security
    SECRET_KEY: str = "your-secret-key-change-in-production-cosmic-academy-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    
    # Application
    APP_NAME: str = "Cosmic Academy Management System"
    VERSION: str = "1.0.0"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# Create database engine
db_url = settings.DATABASE_URL
connect_args = {}

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # Aiven appending ?sslmode=require crashes PyMySQL. We strip it and pass {"ssl": {}} instead
    if "sslmode=" in db_url:
        import re
        db_url = re.sub(r'[?&]sslmode=[^&]+', '', db_url)
        connect_args["ssl"] = {}

engine_kwargs = {
    "pool_pre_ping": True if not db_url.startswith("sqlite") else False,
    "echo": False,
}

# Add connection pooling parameters for production databases (MySQL/PostgreSQL)
if not db_url.startswith("sqlite"):
    engine_kwargs["pool_size"] = 20
    engine_kwargs["max_overflow"] = 30
    engine_kwargs["pool_timeout"] = 30 # wait up to 30 seconds for a connection
    engine_kwargs["pool_recycle"] = 1800 # recycle connections every 30 minutes to prevent staleness

engine = create_engine(
    db_url,
    connect_args=connect_args,
    **engine_kwargs
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all models
Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

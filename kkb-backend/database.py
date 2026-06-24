"""
database.py
-----------
Creates the SQLAlchemy engine and session factory.
All routers import `get_db` to obtain a database session per request.
"""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL is not set. "
        "Copy .env.example to .env and fill in your PostgreSQL credentials."
    )

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # reconnects if the connection drops
    echo=False,           # set True to log all SQL queries during development
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    """Base class all models inherit from."""
    pass


def get_db():
    """
    FastAPI dependency — yields a database session per request,
    then closes it when the request is done.

    Usage in a router:
        @router.post("/example")
        def example(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

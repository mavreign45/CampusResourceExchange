import logging
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.exc import OperationalError, SQLAlchemyError
from fastapi import HTTPException, status
from app.core.config import settings

logger = logging.getLogger(__name__)

# Determine connect args depending on driver
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args=connect_args,
        pool_pre_ping=True,
        echo=settings.DEBUG,
    )
except Exception as e:
    logger.critical(f"Failed to initialize database engine for {settings.DATABASE_URL}: {e}")
    raise RuntimeError(
        f"Database engine initialization error. Please verify DATABASE_URL in .env: {e}"
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding an isolated database session.
    Catches connection failures explicitly and refuses silent fallbacks.
    """
    db = SessionLocal()
    try:
        # Validate connection on checkout
        yield db
    except OperationalError as err:
        logger.error(f"Database operational connection failure: {err}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database service connection unavailable. Please verify PostgreSQL status and configuration.",
        )
    except SQLAlchemyError as err:
        logger.error(f"Database transaction error: {err}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="A database error occurred during request processing.",
        )
    finally:
        db.close()


def check_db_connection() -> bool:
    """Verifies live database connectivity using a lightweight query."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False

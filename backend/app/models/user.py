from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str, Enum):
    STUDENT = "Student"
    FACULTY = "Faculty Researcher"
    CUSTODIAN = "Lab Custodian"
    ADMIN = "Admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.STUDENT.value, index=True)
    department = Column(String(150), nullable=True)
    student_id = Column(String(50), nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    eligibility_requests = relationship(
        "EligibilityVerification",
        back_populates="user",
        foreign_keys="EligibilityVerification.user_id",
        cascade="all, delete-orphan",
    )
    reviewed_eligibility_requests = relationship(
        "EligibilityVerification",
        back_populates="reviewer",
        foreign_keys="EligibilityVerification.reviewed_by",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} email='{self.email}' role='{self.role}'>"

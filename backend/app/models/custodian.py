from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Custodian(Base):
    __tablename__ = "custodians"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), nullable=False)
    department = Column(String(150), nullable=False, index=True)
    role = Column(String(100), nullable=True)
    contact_email = Column(String(150), nullable=False)
    office = Column(String(100), nullable=True)
    hours = Column(String(120), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    resources = relationship("Resource", back_populates="custodian")

    def __repr__(self) -> str:
        return f"<Custodian id={self.id} name='{self.name}' dept='{self.department}'>"

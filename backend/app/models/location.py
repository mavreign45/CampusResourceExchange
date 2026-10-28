from sqlalchemy import Column, Integer, String, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    building = Column(String(120), nullable=False, index=True)
    room = Column(String(80), nullable=False)
    campus_zone = Column(String(80), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    resources = relationship("Resource", back_populates="location")

    def __repr__(self) -> str:
        return f"<Location id={self.id} building='{self.building}' room='{self.room}'>"

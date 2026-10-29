from sqlalchemy import (
    Column,
    String,
    Text,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    JSON,
    func,
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    model_number = Column(String(100), nullable=True)
    short_description = Column(String(350), nullable=False)
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=False)

    # Foreign Keys
    category_id = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="RESTRICT"), nullable=False, index=True)
    custodian_id = Column(Integer, ForeignKey("custodians.id", ondelete="RESTRICT"), nullable=False, index=True)

    # Availability & Trust Fields
    availability_status = Column(String(50), nullable=False, default="available", index=True)
    estimated_available_date = Column(String(120), nullable=True)
    requires_verification = Column(Boolean, nullable=False, default=False, index=True)
    requires_training = Column(Boolean, nullable=False, default=False)
    requires_supervision = Column(Boolean, nullable=False, default=False)
    training_requirement = Column(String(255), nullable=True)
    eligibility = Column(String(255), nullable=True)

    # Borrowing & Condition Rules
    max_borrow_hours = Column(Integer, nullable=False, default=24)
    max_borrow_duration = Column(String(80), nullable=True)
    item_condition = Column(String(50), nullable=False, default="Good")

    # Rich metadata lists
    specifications = Column(JSON, nullable=True, default=list)
    accessories_included = Column(JSON, nullable=True, default=list)
    usage_guidelines = Column(JSON, nullable=True, default=list)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships with eager loading capability
    category = relationship("Category", back_populates="resources", lazy="joined")
    location = relationship("Location", back_populates="resources", lazy="joined")
    custodian = relationship("Custodian", back_populates="resources", lazy="joined")
    reservations = relationship(
        "Reservation",
        back_populates="resource",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Resource id='{self.id}' name='{self.name}' status='{self.availability_status}'>"

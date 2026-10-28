from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class LocationBase(BaseModel):
    building: str
    room: str
    campus_zone: Optional[str] = None
    description: Optional[str] = None


class LocationCreate(LocationBase):
    pass


class LocationRead(LocationBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

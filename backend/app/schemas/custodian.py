from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class CustodianBase(BaseModel):
    name: str
    department: str
    contact_email: str
    role: Optional[str] = None
    office: Optional[str] = None
    hours: Optional[str] = None


class CustodianCreate(CustodianBase):
    pass


class CustodianRead(CustodianBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

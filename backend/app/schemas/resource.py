from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from app.schemas.category import CategoryRead
from app.schemas.location import LocationRead
from app.schemas.custodian import CustodianRead


class ResourceBase(BaseModel):
    name: str
    model_number: Optional[str] = None
    short_description: str
    description: str
    image_url: str
    category_id: int
    location_id: int
    custodian_id: int
    availability_status: str = "available"
    estimated_available_date: Optional[str] = None
    requires_verification: bool = False
    requires_training: bool = False
    requires_supervision: bool = False
    training_requirement: Optional[str] = None
    eligibility: Optional[str] = None
    max_borrow_hours: int = 24
    max_borrow_duration: Optional[str] = None
    item_condition: str = "Good"
    specifications: List[str] = []
    accessories_included: List[str] = []
    usage_guidelines: List[str] = []


class ResourceCreate(ResourceBase):
    id: str


class ResourceRead(ResourceBase):
    id: str
    category: Optional[CategoryRead] = None
    location: Optional[LocationRead] = None
    custodian: Optional[CustodianRead] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    model_number: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    availability_status: Optional[str] = None
    estimated_available_date: Optional[str] = None
    requires_verification: Optional[bool] = None
    requires_training: Optional[bool] = None
    requires_supervision: Optional[bool] = None
    training_requirement: Optional[str] = None
    eligibility: Optional[str] = None
    max_borrow_hours: Optional[int] = None
    item_condition: Optional[str] = None


class ResourceListResponse(BaseModel):
    items: List[ResourceRead]
    total: int
    page: int
    page_size: int
    total_pages: int


class ResourceSummaryResponse(BaseModel):
    total_resources: int
    available_now: int
    in_use: int = 0
    maintenance: int = 0
    category_count: int
    requires_verification: int

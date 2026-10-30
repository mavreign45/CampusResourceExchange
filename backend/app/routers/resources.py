import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import require_roles
from app.models.user import User, UserRole
from app.schemas.resource import (
    ResourceRead,
    ResourceListResponse,
    ResourceSummaryResponse,
    ResourceUpdate,
)
from app.services.resource_service import ResourceService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resources", tags=["Resources"])


@router.get(
    "",
    response_model=ResourceListResponse,
    summary="List and filter campus resources",
    description="Retrieve a paginated list of campus resources with optional keyword search, category, status, and building filters.",
)
def list_resources(
    search: Optional[str] = Query(
        default=None,
        max_length=150,
        description="Search term matching resource name, model, description, department, or building",
    ),
    category: Optional[str] = Query(
        default=None,
        description="Filter by category name (e.g. 'Laboratory Equipment') or category ID",
    ),
    availability: Optional[str] = Query(
        default=None,
        description="Filter by status ('available', 'in_use', 'maintenance')",
    ),
    building: Optional[str] = Query(
        default=None,
        description="Filter by campus building name",
    ),
    sort_by: str = Query(
        default="name",
        pattern="^(name|category|availability|created_at)$",
        description="Attribute to sort by: 'name', 'category', 'availability', 'created_at'",
    ),
    sort_order: str = Query(
        default="asc",
        pattern="^(asc|desc)$",
        description="Sort direction: 'asc' or 'desc'",
    ),
    page: int = Query(
        default=1,
        ge=1,
        description="Page number (1-indexed)",
    ),
    page_size: int = Query(
        default=12,
        ge=1,
        le=100,
        description="Number of resources per page (max 100)",
    ),
    db: Session = Depends(get_db),
) -> ResourceListResponse:
    items, total, total_pages = ResourceService.get_resources(
        db=db,
        search=search,
        category=category,
        availability=availability,
        building=building,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size,
    )

    return ResourceListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get(
    "/summary",
    response_model=ResourceSummaryResponse,
    summary="Get campus inventory summary metrics",
    description="Calculates live catalog metrics: total resources, available now, categories count, and verification requirements.",
)
def get_resource_summary(
    db: Session = Depends(get_db),
) -> ResourceSummaryResponse:
    """Return live summary stats from database records."""
    summary_data = ResourceService.get_summary(db=db)
    return ResourceSummaryResponse(**summary_data)


@router.get(
    "/{id}",
    response_model=ResourceRead,
    summary="Get resource by ID",
    description="Retrieve comprehensive details for a specific campus resource by its primary key ID.",
    responses={
        404: {"description": "Resource not found"},
    },
)
def get_resource(
    id: str,
    db: Session = Depends(get_db),
) -> ResourceRead:
    resource = ResourceService.get_resource_by_id(db=db, resource_id=id)
    if not resource:
        logger.info(f"Resource lookup failed: ID '{id}' not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID '{id}' was not found in the campus catalog.",
        )
    return resource


@router.patch(
    "/{id}",
    response_model=ResourceRead,
    summary="Update resource attributes",
    description="Update resource status, description, or maintenance flag. Requires Lab Custodian or Admin role.",
)
def update_resource(
    id: str,
    payload: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.CUSTODIAN, UserRole.ADMIN)),
) -> ResourceRead:
    updated = ResourceService.update_resource(
        db=db,
        resource_id=id,
        payload_data=payload.model_dump(exclude_unset=True),
    )
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Resource with ID '{id}' was not found.",
        )
    return updated

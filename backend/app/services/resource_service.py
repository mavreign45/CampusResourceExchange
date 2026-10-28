import math
from typing import Optional, Tuple, List
from sqlalchemy import select, func, or_, case, desc, asc
from sqlalchemy.orm import Session, joinedload
from app.models.resource import Resource
from app.models.category import Category
from app.models.location import Location
from app.models.custodian import Custodian


class ResourceService:
    @staticmethod
    def get_resources(
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        availability: Optional[str] = None,
        building: Optional[str] = None,
        sort_by: str = "name",
        sort_order: str = "asc",
        page: int = 1,
        page_size: int = 12,
    ) -> Tuple[List[Resource], int, int]:
        """
        Query, filter, sort, and paginate resources.
        Returns: (items, total_count, total_pages)
        """
        query = (
            select(Resource)
            .join(Resource.category)
            .join(Resource.location)
            .join(Resource.custodian)
            .options(
                joinedload(Resource.category),
                joinedload(Resource.location),
                joinedload(Resource.custodian),
            )
        )

        # 1. Search Query Filter
        if search and search.strip():
            term = f"%{search.strip().lower()}%"
            query = query.where(
                or_(
                    func.lower(Resource.name).like(term),
                    func.lower(Resource.short_description).like(term),
                    func.lower(Resource.description).like(term),
                    func.lower(Resource.model_number).like(term),
                    func.lower(Custodian.department).like(term),
                    func.lower(Location.building).like(term),
                    func.lower(Location.room).like(term),
                )
            )

        # 2. Category Filter
        if category and category.strip() and category != "All":
            cat_val = category.strip()
            if cat_val.isdigit():
                query = query.where(Resource.category_id == int(cat_val))
            else:
                query = query.where(func.lower(Category.name) == cat_val.lower())

        # 3. Availability Filter
        if availability and availability.strip() and availability != "All":
            query = query.where(Resource.availability_status == availability.strip().lower())

        # 4. Building Location Filter
        if building and building.strip() and building != "All":
            query = query.where(func.lower(Location.building) == building.strip().lower())

        # Count total matching before pagination
        count_query = select(func.count()).select_from(query.subquery())
        total = db.scalar(count_query) or 0

        # 5. Sorting
        order_col = None
        if sort_by == "name":
            order_col = Resource.name
        elif sort_by == "category":
            order_col = Category.name
        elif sort_by == "created_at":
            order_col = Resource.created_at
        elif sort_by == "availability":
            # Priority order: 'available' -> 'in_use' -> 'maintenance'
            order_col = case(
                (Resource.availability_status == "available", 1),
                (Resource.availability_status == "in_use", 2),
                (Resource.availability_status == "maintenance", 3),
                else_=4,
            )
        else:
            order_col = Resource.name

        if sort_order.lower() == "desc":
            query = query.order_by(desc(order_col), desc(Resource.id))
        else:
            query = query.order_by(asc(order_col), asc(Resource.id))

        # 6. Pagination
        offset = max(0, (page - 1) * page_size)
        query = query.offset(offset).limit(page_size)

        items = db.scalars(query).unique().all()
        total_pages = max(1, math.ceil(total / page_size)) if total > 0 else 1

        return list(items), total, total_pages

    @staticmethod
    def get_resource_by_id(db: Session, resource_id: str) -> Optional[Resource]:
        """Fetch complete resource by primary key ID."""
        query = (
            select(Resource)
            .where(Resource.id == resource_id)
            .options(
                joinedload(Resource.category),
                joinedload(Resource.location),
                joinedload(Resource.custodian),
            )
        )
        return db.scalars(query).first()

    @staticmethod
    def get_summary(db: Session) -> dict:
        """Calculate real-time dashboard summary metrics from the database."""
        total_resources = db.scalar(select(func.count(Resource.id))) or 0
        available_now = (
            db.scalar(
                select(func.count(Resource.id)).where(Resource.availability_status == "available")
            )
            or 0
        )
        category_count = db.scalar(select(func.count(func.distinct(Resource.category_id)))) or 0
        requires_verification = (
            db.scalar(
                select(func.count(Resource.id)).where(Resource.requires_verification.is_(True))
            )
            or 0
        )

        return {
            "total_resources": total_resources,
            "available_now": available_now,
            "category_count": category_count,
            "requires_verification": requires_verification,
        }

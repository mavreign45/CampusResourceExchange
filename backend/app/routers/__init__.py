from app.routers.resources import router as resources_router
from app.routers.auth import router as auth_router
from app.routers.eligibility import router as eligibility_router
from app.routers.reservations import router as reservations_router
from app.routers.notifications import router as notifications_router

__all__ = [
    "resources_router",
    "auth_router",
    "eligibility_router",
    "reservations_router",
    "notifications_router",
]

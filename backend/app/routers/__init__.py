from app.routers.resources import router as resources_router
from app.routers.auth import router as auth_router
from app.routers.eligibility import router as eligibility_router

__all__ = ["resources_router", "auth_router", "eligibility_router"]

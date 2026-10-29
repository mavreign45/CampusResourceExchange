import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from app.core.config import settings
from app.core.database import check_db_connection
from app.routers import resources_router, auth_router, eligibility_router

# Configure structured logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("campus_resource_exchange")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Campus Resource Exchange REST API — Unlock Resources. Empower Innovation.",
    version="0.3.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected server error occurred. Please contact the campus system administrator."
        },
    )


@app.get("/", tags=["Root"])
def root():
    return {
        "project": settings.PROJECT_NAME,
        "tagline": "Unlock Resources. Empower Innovation.",
        "phase": "Phase 3: User Authentication & Role-Based Verification Engine",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "api_v1": settings.API_V1_STR,
    }


# Documentation convenience redirects for /api/v1 prefix
@app.get(f"{settings.API_V1_STR}/docs", include_in_schema=False)
def api_v1_docs_redirect():
    return RedirectResponse(url="/docs")


@app.get(f"{settings.API_V1_STR}/redoc", include_in_schema=False)
def api_v1_redoc_redirect():
    return RedirectResponse(url="/redoc")


@app.get(f"{settings.API_V1_STR}/openapi.json", include_in_schema=False)
def api_v1_openapi_redirect():
    return RedirectResponse(url="/openapi.json")


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
def health_check():
    db_ok = check_db_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "unreachable",
        "environment": settings.ENVIRONMENT,
    }


# Register routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(resources_router, prefix=settings.API_V1_STR)
app.include_router(eligibility_router, prefix=settings.API_V1_STR)

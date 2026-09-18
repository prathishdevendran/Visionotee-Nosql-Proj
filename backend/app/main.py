"""
Main Application Entry Point.

Production-ready FastAPI application setup with lifespan events,
CORS policies, centralized configuration, and modular API routers.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import api_router
from app.db.mongodb import db_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context manager for startup and shutdown event hooks.
    """
    # Startup: Verify database connection
    try:
        db_manager.ping()
        print(f"[{settings.PROJECT_NAME}] Successfully connected to MongoDB Atlas database: {settings.DATABASE_NAME}")
    except Exception as e:
        print(f"[{settings.PROJECT_NAME}] Warning: Database connection check failed on startup: {e}")
    
    #ready to serve request
    yield
    
    # Shutdown: Cleanly close database connection pool
    try:
        db_manager.close()
        print(f"[{settings.PROJECT_NAME}] Database connection pool closed.")
    except Exception:
        pass


def create_application() -> FastAPI:
    """
    Application factory initializing FastAPI with middleware, routers, and configuration.
    """
    fastapi_app = FastAPI(
        title=settings.PROJECT_NAME,
        description="Production Backend API for Visionote Sticky Notes Platform",
        version=settings.VERSION,
        lifespan=lifespan
    )

    # CORS middleware configuration
    fastapi_app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount central API router
    fastapi_app.include_router(api_router)

    @fastapi_app.get("/", tags=["Health"])
    def read_root():
        """
        Service Root Health & Documentation Discovery Endpoint.
        """
        return {
            "status": "online",
            "message": f"Welcome to {settings.PROJECT_NAME}",
            "version": settings.VERSION,
            "docs": "/docs"
        }

    return fastapi_app


app = create_application()
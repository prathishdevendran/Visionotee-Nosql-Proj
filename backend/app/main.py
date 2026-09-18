"""
Main Application Entry Point.

Initializes the FastAPI application instance, configures Cross-Origin
Resource Sharing (CORS) policies, registers API routers, and defines the root endpoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router
from app.routes.notes import router as notes_router
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()
if not os.getenv("ALLOWED_ORIGINS"):
    for env_path in [Path(__file__).resolve().parent / ".env", Path(__file__).resolve().parent.parent / ".env"]:
        if env_path.exists():
            load_dotenv(dotenv_path=env_path)
            break

# Parse allowed CORS origins (default to localhost frontend ports if not specified)
origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://localhost:8000")
origins = [origin.strip().rstrip("/") for origin in origins_str.split(",") if origin.strip()]

# Initialize the core FastAPI app
app = FastAPI(
    title="Visionote API",
    description="Backend API for Visionote Sticky Notes Platform",
    version="1.0.0"
)

# CORS middleware configuration: enables the React frontend application (running on
# a separate port/origin) to successfully issue HTTP requests to this backend.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, PUT, DELETE, OPTIONS, etc.
    allow_headers=["*"],  # Allows all headers (e.g., Content-Type, Authorization)
)

# Attach routers representing authentication and notes CRUD categories
app.include_router(auth_router)
app.include_router(notes_router)

@app.get("/")
def read_root():
    """
    Service Root Endpoint.
    Provides API welcome metadata and the interactive Swagger docs reference location.
    """
    return {
        "message": "Welcome to Visionote API",
        "docs": "/docs"
    }

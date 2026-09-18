from app.api.router import api_router
from app.api.auth import router as auth_router
from app.api.notes import router as notes_router

__all__ = ["api_router", "auth_router", "notes_router"]

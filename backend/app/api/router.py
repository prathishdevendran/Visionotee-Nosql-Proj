"""
Central API Router.
"""

from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.notes import router as notes_router
from app.api.analytics import router as analytics_router
from app.api.ai import router as ai_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(notes_router)
api_router.include_router(analytics_router)
api_router.include_router(ai_router)

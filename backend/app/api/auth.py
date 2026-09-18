"""
Authentication API Endpoints.
"""

from fastapi import APIRouter
from app.schemas import UserSignup, UserLogin
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", status_code=200)
def signup(user: UserSignup):
    """
    Register a new user account.
    """
    return auth_service.signup(user)


@router.post("/signin", status_code=200)
def signin(user: UserLogin):
    """
    Authenticate user login credentials.
    """
    return auth_service.signin(user)

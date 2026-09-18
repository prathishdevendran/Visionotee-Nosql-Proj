"""
Authentication Service Module.

Encapsulates business logic for user account registration and authentication.
"""

from fastapi import HTTPException
from app.schemas import UserSignup, UserLogin
from app.core.security import hash_password, verify_password
from app.db import users_collection


class AuthService:
    """
    Handles user authentication, credential verification, and user management.
    """

    @staticmethod
    def signup(user_data: UserSignup) -> dict:
        """
        Registers a new user account.
        Validates email uniqueness and stores password securely.
        """
        existing_user = users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")

        hashed_pw = hash_password(user_data.password)

        new_user = {
            "name": user_data.name,
            "email": user_data.email,
            "password": hashed_pw
        }

        result = users_collection.insert_one(new_user)

        return {
            "message": "User created successfully",
            "user_id": str(result.inserted_id)
        }

    @staticmethod
    def signin(login_data: UserLogin) -> dict:
        """
        Validates user credentials against stored bcrypt hash.
        """
        existing_user = users_collection.find_one({"email": login_data.email})
        if not existing_user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not verify_password(login_data.password, existing_user["password"]):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        return {
            "message": "Login successful",
            "user": {
                "id": str(existing_user["_id"]),
                "name": existing_user["name"],
                "email": existing_user["email"]
            }
        }


auth_service = AuthService()

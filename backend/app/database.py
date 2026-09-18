"""
Database Configuration Module.

Loads MongoDB connection settings from environment variables and 
initializes the PyMongo Client and database collection handlers.
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv
from pathlib import Path

# Load .env from backend directory or current directory
load_dotenv()
if not os.getenv("MONGODB_URL"):
    for env_path in [Path(__file__).resolve().parent / ".env", Path(__file__).resolve().parent.parent / ".env"]:
        if env_path.exists():
            load_dotenv(dotenv_path=env_path)
            break

# Retrieve MongoDB connection credentials and settings with localhost defaults
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "visionote")

# Establish connection with the MongoDB server instance
client = MongoClient(MONGODB_URL)

# Reference the active database namespace
db = client[DATABASE_NAME]

# Define collections accessible across the backend API routers
users_collection = db["users"]
notes_collection = db["notes"]
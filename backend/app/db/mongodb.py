"""
MongoDB Database Connection & Lifecycle Manager.

Manages MongoClient instances and exports collection handles.
"""

from pymongo import MongoClient
from pymongo.database import Database
from pymongo.collection import Collection
from app.core.config import settings


class MongoDBManager:
    """
    Encapsulates MongoDB connection lifecycle and collection accessors.
    """
    def __init__(self):
        self._client: MongoClient = MongoClient(settings.MONGODB_URL)
        self._db: Database = self._client[settings.DATABASE_NAME]

    @property
    def client(self) -> MongoClient:
        return self._client

    @property
    def db(self) -> Database:
        return self._db

    @property
    def users(self) -> Collection:
        return self._db["users"]

    @property
    def notes(self) -> Collection:
        return self._db["notes"]

    def ping(self) -> bool:
        """
        Verifies active connection to the database server.
        """
        self._client.admin.command("ping")
        return True

    def close(self):
        """
        Closes the active MongoClient connection pool.
        """
        self._client.close()


# Global database manager instance
db_manager = MongoDBManager()

# Direct convenience handles
db = db_manager.db
users_collection = db_manager.users
notes_collection = db_manager.notes

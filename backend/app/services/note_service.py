"""
Note Service Module.

Encapsulates CRUD operations, timestamp formatting, and BSON ObjectId
serialization for sticky notes.
"""

from typing import List, Dict, Any
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from app.schemas import NoteCreate, NoteUpdate
from app.db import notes_collection


class NoteService:
    """
    Handles business logic for note persistence, querying, updating, and serialization.
    """

    @staticmethod
    def _validate_object_id(note_id: str) -> ObjectId:
        """
        Validates string note ID format and converts to BSON ObjectId.
        """
        try:
            return ObjectId(note_id)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Invalid note ID format")

    @staticmethod
    def serialize_note(note: Dict[str, Any]) -> Dict[str, Any]:
        """
        Serializes MongoDB document into Pydantic schema-compatible dictionary.
        """
        return {
            "id": str(note["_id"]),
            "title": note.get("title", "Draft Note"),
            "content": note.get("content", ""),
            "color": note.get("color", "amber"),
            "tags": note.get("tags", []),
            "isPinned": note.get("isPinned", False),
            "userId": note.get("userId", ""),
            "updatedAt": note.get("updatedAt", "")
        }

    def create_note(self, note_data: NoteCreate) -> Dict[str, Any]:
        """
        Creates a new sticky note with current formatted timestamp.
        """
        note_dict = note_data.model_dump()
        note_dict["updatedAt"] = datetime.now().strftime("%b %d, %Y, %I:%M %p")

        result = notes_collection.insert_one(note_dict)
        created = notes_collection.find_one({"_id": result.inserted_id})
        if not created:
            raise HTTPException(status_code=500, detail="Failed to retrieve note after creation")

        return self.serialize_note(created)

    def get_notes_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves all sticky notes owned by the specified user, sorted by pin state and date.
        """
        notes_cursor = notes_collection.find({"userId": user_id})
        notes = list(notes_cursor)
        notes.sort(key=lambda n: (not n.get("isPinned", False), n.get("updatedAt", "")))
        return [self.serialize_note(n) for n in notes]

    def get_note_by_id(self, note_id: str) -> Dict[str, Any]:
        """
        Retrieves a single note by its ID.
        """
        obj_id = self._validate_object_id(note_id)
        note = notes_collection.find_one({"_id": obj_id})
        if not note:
            raise HTTPException(status_code=404, detail="Note not found")
        return self.serialize_note(note)

    def update_note(self, note_id: str, update_data: NoteUpdate) -> Dict[str, Any]:
        """
        Updates fields of an existing note and refreshes the modification timestamp.
        """
        obj_id = self._validate_object_id(note_id)
        existing = notes_collection.find_one({"_id": obj_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Note not found")

        updates = {k: v for k, v in update_data.model_dump().items() if v is not None}
        if updates:
            updates["updatedAt"] = datetime.now().strftime("%b %d, %Y, %I:%M %p")
            notes_collection.update_one({"_id": obj_id}, {"$set": updates})

        updated = notes_collection.find_one({"_id": obj_id})
        return self.serialize_note(updated)

    def delete_note(self, note_id: str) -> Dict[str, str]:
        """
        Deletes a note resource by its ID.
        """
        obj_id = self._validate_object_id(note_id)
        existing = notes_collection.find_one({"_id": obj_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Note not found")

        notes_collection.delete_one({"_id": obj_id})
        return {"message": "Note deleted successfully"}


note_service = NoteService()

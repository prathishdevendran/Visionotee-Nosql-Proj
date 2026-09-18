"""
Sticky Notes API Endpoints.
"""

from typing import List
from fastapi import APIRouter, Query
from app.schemas import NoteCreate, NoteUpdate, NoteResponse
from app.services.note_service import note_service

router = APIRouter(prefix="/notes", tags=["Notes"])


@router.post("", response_model=NoteResponse, status_code=201)
def create_note(note: NoteCreate):
    """
    Create a new sticky note.
    """
    return note_service.create_note(note)


@router.get("", response_model=List[NoteResponse])
def get_notes(userId: str = Query(..., description="The ID of the user whose notes are to be retrieved")):
    """
    Retrieve all sticky notes for a user.
    """
    return note_service.get_notes_by_user(userId)


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: str):
    """
    Retrieve details of a single sticky note by its ID.
    """
    return note_service.get_note_by_id(note_id)


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(note_id: str, note_update: NoteUpdate):
    """
    Modify fields of an existing sticky note.
    """
    return note_service.update_note(note_id, note_update)


@router.delete("/{note_id}")
def delete_note(note_id: str):
    """
    Delete a sticky note resource.
    """
    return note_service.delete_note(note_id)

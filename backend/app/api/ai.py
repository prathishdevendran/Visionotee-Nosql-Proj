"""
Local AI & Semantic Search API Endpoints.

Provides endpoints for private, on-device AI chat assistant (RAG)
and vector similarity search powered by local Ollama (Llama 3.2).
"""

from typing import List
from fastapi import APIRouter, Query
from app.schemas.ai import AIChatRequest, AIChatResponse, AISearchResult, AIStatusResponse
from app.services.ai_service import ai_service

router = APIRouter(prefix="/ai", tags=["Local AI & Semantic Search"])


@router.get("/status", response_model=AIStatusResponse)
async def get_ai_status():
    """
    Check if local Ollama daemon is active and verify model availability.
    """
    return await ai_service.check_status()


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_notes(request: AIChatRequest):
    """
    Chat with your personal sticky notes using local RAG and Llama 3.2.
    Retrieves semantically relevant notes and generates cited responses.
    """
    return await ai_service.chat_rag(
        user_id=request.userId,
        message=request.message,
        conversation_history=request.conversationHistory
    )


@router.get("/search", response_model=List[AISearchResult])
def semantic_search_notes(
    userId: str = Query(..., description="ID of the note owner"),
    q: str = Query(..., description="Search query string"),
    limit: int = Query(6, ge=1, le=20, description="Max notes to return")
):
    """
    Perform semantic vector/relevance search across the user's sticky notes.
    """
    return ai_service.semantic_search(user_id=userId, query=q, limit=limit)

"""
AI Schemas Module.

Defines Pydantic models for local AI chat requests, RAG responses,
semantic search payloads, and Ollama status inspections.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: str  # "user", "assistant", or "system"
    content: str


class AIChatRequest(BaseModel):
    userId: str
    message: str
    conversationHistory: Optional[List[ChatMessage]] = Field(default_factory=list)


class NoteCitation(BaseModel):
    id: str
    title: str
    category: str
    priority: str
    status: str
    color: str
    score: Optional[float] = None


class AIChatResponse(BaseModel):
    reply: str
    relevantNotes: List[NoteCitation] = Field(default_factory=list)
    model: str = "llama3.2:latest"
    isLocal: bool = True


class AISearchResult(BaseModel):
    id: str
    title: str
    content: str
    category: str
    priority: str
    status: str
    color: str
    tags: List[str]
    score: float


class AIStatusResponse(BaseModel):
    online: bool
    model: str
    provider: str = "Ollama (Local & Private)"
    message: str

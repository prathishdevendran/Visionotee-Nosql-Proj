"""
Note Schemas Module.

Defines Pydantic models for validation, parsing, and documentation 
of Sticky Note request bodies, response payloads, and MongoDB aggregation analytics.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class NoteBase(BaseModel):
    """Base schema containing standard properties of a sticky note."""
    title: str = "Draft Note"
    content: str = ""
    color: str = "amber"
    tags: List[str] = []
    isPinned: bool = False
    category: str = "General"
    priority: str = "medium"  # "high", "medium", "low"
    status: str = "pending"   # "pending", "completed"


class NoteCreate(NoteBase):
    """Schema for validating note creation requests; requires the note owner ID."""
    userId: str


class NoteUpdate(BaseModel):
    """Schema for validating note update requests; all parameters are optional to support PATCH operations."""
    title: Optional[str] = None
    content: Optional[str] = None
    color: Optional[str] = None
    tags: Optional[List[str]] = None
    isPinned: Optional[bool] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class NoteResponse(NoteBase):
    """Schema representing the serialized note returned to the frontend."""
    id: str
    userId: str
    updatedAt: str


# ==========================================
# MongoDB Aggregation Analytics Schemas
# ==========================================

class CategoryMetric(BaseModel):
    """Aggregated metrics per note category."""
    category: str
    totalNotes: int
    completedNotes: int
    pendingNotes: int
    completionRate: float
    pinnedNotes: int


class PriorityMetric(BaseModel):
    """Aggregated metrics per priority level."""
    priority: str
    totalNotes: int
    completedNotes: int
    pendingNotes: int
    completionRate: float


class StatusSummary(BaseModel):
    """Overall note completion and counts summary."""
    totalNotes: int
    completedNotes: int
    pendingNotes: int
    pinnedNotes: int
    completionRate: float
    highPriorityPending: int


class TagMetric(BaseModel):
    """Aggregated tag frequency metrics."""
    tag: str
    count: int


class ColorMetric(BaseModel):
    """Aggregated note count per color palette."""
    color: str
    count: int


class DashboardAnalyticsResponse(BaseModel):
    """Consolidated response schema for the analytics dashboard."""
    userId: str
    summary: StatusSummary
    categories: List[CategoryMetric]
    priorities: List[PriorityMetric]
    topTags: List[TagMetric]
    colorDistribution: List[ColorMetric]
    recentActivity: List[Dict[str, Any]]


class VivaStageInfo(BaseModel):
    """Information regarding an aggregation pipeline stage."""
    stage: str
    description: str
    syntax: Dict[str, Any]


class VivaPipelineItem(BaseModel):
    """A single MongoDB aggregation pipeline with metadata and live output for viva defense."""
    id: str
    title: str
    purpose: str
    stages: List[VivaStageInfo]
    mongoShellQuery: str
    pyMongoCode: str
    liveOutput: Any


class VivaQueriesResponse(BaseModel):
    """Response containing all viva aggregation pipelines and explanations."""
    userId: str
    pipelines: List[VivaPipelineItem]

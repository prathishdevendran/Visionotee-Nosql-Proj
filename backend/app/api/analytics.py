"""
Analytics & MongoDB Aggregation Endpoints.

Provides endpoints for fetching real-time aggregation metrics and live pipeline inspector data
for registered users and viva presentations.
"""

from fastapi import APIRouter, Query
from app.schemas import DashboardAnalyticsResponse, VivaQueriesResponse
from app.services.note_service import note_service

router = APIRouter(prefix="/analytics", tags=["Analytics & MongoDB Aggregations"])


@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
def get_dashboard_analytics(
    userId: str = Query(..., description="The ID of the user whose analytics are to be aggregated")
):
    """
    Execute multi-stage MongoDB Aggregation Pipelines to fetch consolidated
    analytics (Categories, Priorities, Completion Status, Tag Cloud, Colors) for a registered user.
    """
    return note_service.get_dashboard_analytics(userId)


@router.get("/viva-queries", response_model=VivaQueriesResponse)
def get_viva_queries(
    userId: str = Query(..., description="The ID of the user to run live aggregation inspection for")
):
    """
    Fetch comprehensive MongoDB Aggregation queries, stage descriptions,
    PyMongo code snippets, and live executed outputs for presentation and viva defense.
    """
    return note_service.get_viva_queries(userId)

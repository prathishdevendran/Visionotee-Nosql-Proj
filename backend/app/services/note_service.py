"""
Note Service Module.

Encapsulates CRUD operations, timestamp formatting, BSON ObjectId serialization,
and production-ready PyMongo aggregation pipelines for notes analytics and viva defense.
"""

from typing import List, Dict, Any
from datetime import datetime
import json
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException
from app.schemas import (
    NoteCreate,
    NoteUpdate,
    CategoryMetric,
    PriorityMetric,
    StatusSummary,
    TagMetric,
    ColorMetric,
    DashboardAnalyticsResponse,
    VivaStageInfo,
    VivaPipelineItem,
    VivaQueriesResponse
)
from app.db import notes_collection


def sanitize_bson(obj: Any) -> Any:
    """
    Recursively converts BSON ObjectId, datetime, and nested types into
    standard JSON-serializable Python data structures.
    """
    if isinstance(obj, list):
        return [sanitize_bson(x) for x in obj]
    elif isinstance(obj, dict):
        return {str(k): sanitize_bson(v) for k, v in obj.items()}
    elif isinstance(obj, ObjectId):
        return str(obj)
    elif isinstance(obj, datetime):
        return obj.isoformat()
    return obj


class NoteService:
    """
    Handles business logic for note persistence, querying, updating, serialization,
    and high-performance MongoDB aggregation pipelines.
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
        Serializes MongoDB document into Pydantic schema-compatible dictionary
        with fallback defaults for newly supported fields.
        """
        return {
            "id": str(note["_id"]),
            "title": note.get("title", "Draft Note"),
            "content": note.get("content", ""),
            "color": note.get("color", "amber"),
            "tags": note.get("tags", []) or [],
            "isPinned": note.get("isPinned", False) or False,
            "category": note.get("category", "General") or "General",
            "priority": (note.get("priority") or "medium").lower(),
            "status": (note.get("status") or "pending").lower(),
            "userId": note.get("userId", ""),
            "updatedAt": note.get("updatedAt", "")
        }

    def create_note(self, note_data: NoteCreate) -> Dict[str, Any]:
        """
        Creates a new sticky note with current formatted timestamp.
        """
        note_dict = note_data.model_dump()
        note_dict["updatedAt"] = datetime.now().strftime("%b %d, %Y, %I:%M %p")

        # Sanitize defaults
        if not note_dict.get("category"):
            note_dict["category"] = "General"
        if not note_dict.get("priority"):
            note_dict["priority"] = "medium"
        else:
            note_dict["priority"] = note_dict["priority"].lower()
        if not note_dict.get("status"):
            note_dict["status"] = "pending"
        else:
            note_dict["status"] = note_dict["status"].lower()

        result = notes_collection.insert_one(note_dict)
        created = notes_collection.find_one({"_id": result.inserted_id})
        if not created:
            raise HTTPException(status_code=500, detail="Failed to retrieve note after creation")

        return self.serialize_note(created)

    def get_notes_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves all sticky notes owned by the specified user, sorted by pin state and newest first.
        """
        notes_cursor = notes_collection.find({"userId": user_id}).sort("_id", -1)
        notes = list(notes_cursor)
        notes.sort(key=lambda n: not n.get("isPinned", False))
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
        if "priority" in updates and updates["priority"]:
            updates["priority"] = updates["priority"].lower()
        if "status" in updates and updates["status"]:
            updates["status"] = updates["status"].lower()

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

    # =========================================================================
    # MONGO DB AGGREGATION PIPELINES & ANALYTICS
    # =========================================================================

    def get_dashboard_analytics(self, user_id: str) -> DashboardAnalyticsResponse:
        """
        Executes meaningful MongoDB aggregation pipelines to extract multi-dimensional
        metrics for registered users: Category breakdown, Priority distribution,
        Completed vs Pending status counts, Top Tags ($unwind), and Palette usage.
        """
        # 1. Summary & Status Pipeline
        summary_pipeline = [
            {"$match": {"userId": user_id}},
            {
                "$group": {
                    "_id": None,
                    "totalNotes": {"$sum": 1},
                    "completedNotes": {
                        "$sum": {
                            "$cond": [
                                {"$eq": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]},
                                1,
                                0
                            ]
                        }
                    },
                    "pendingNotes": {
                        "$sum": {
                            "$cond": [
                                {"$ne": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]},
                                1,
                                0
                            ]
                        }
                    },
                    "pinnedNotes": {
                        "$sum": {"$cond": [{"$eq": ["$isPinned", True]}, 1, 0]}
                    },
                    "highPriorityPending": {
                        "$sum": {
                            "$cond": [
                                {
                                    "$and": [
                                        {"$eq": [{"$toLower": {"$ifNull": ["$priority", "medium"]}}, "high"]},
                                        {"$ne": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]}
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "totalNotes": 1,
                    "completedNotes": 1,
                    "pendingNotes": 1,
                    "pinnedNotes": 1,
                    "highPriorityPending": 1,
                    "completionRate": {
                        "$cond": [
                            {"$gt": ["$totalNotes", 0]},
                            {"$round": [{"$multiply": [{"$divide": ["$completedNotes", "$totalNotes"]}, 100]}, 1]},
                            0.0
                        ]
                    }
                }
            }
        ]

        summary_docs = list(notes_collection.aggregate(summary_pipeline))
        summary = summary_docs[0] if summary_docs else {
            "totalNotes": 0,
            "completedNotes": 0,
            "pendingNotes": 0,
            "pinnedNotes": 0,
            "highPriorityPending": 0,
            "completionRate": 0.0
        }

        # 2. Category Aggregation Pipeline
        category_pipeline = [
            {"$match": {"userId": user_id}},
            {
                "$group": {
                    "_id": {"$ifNull": ["$category", "General"]},
                    "totalNotes": {"$sum": 1},
                    "completedNotes": {
                        "$sum": {
                            "$cond": [
                                {"$eq": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]},
                                1,
                                0
                            ]
                        }
                    },
                    "pendingNotes": {
                        "$sum": {
                            "$cond": [
                                {"$ne": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]},
                                1,
                                0
                            ]
                        }
                    },
                    "pinnedNotes": {
                        "$sum": {"$cond": [{"$eq": ["$isPinned", True]}, 1, 0]}
                    }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "category": "$_id",
                    "totalNotes": 1,
                    "completedNotes": 1,
                    "pendingNotes": 1,
                    "pinnedNotes": 1,
                    "completionRate": {
                        "$cond": [
                            {"$gt": ["$totalNotes", 0]},
                            {"$round": [{"$multiply": [{"$divide": ["$completedNotes", "$totalNotes"]}, 100]}, 1]},
                            0.0
                        ]
                    }
                }
            },
            {"$sort": {"totalNotes": -1, "category": 1}}
        ]
        category_docs = list(notes_collection.aggregate(category_pipeline))

        # 3. Priority Aggregation Pipeline
        priority_pipeline = [
            {"$match": {"userId": user_id}},
            {
                "$group": {
                    "_id": {"$toLower": {"$ifNull": ["$priority", "medium"]}},
                    "totalNotes": {"$sum": 1},
                    "completedNotes": {
                        "$sum": {
                            "$cond": [
                                {"$eq": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]},
                                1,
                                0
                            ]
                        }
                    },
                    "pendingNotes": {
                        "$sum": {
                            "$cond": [
                                {"$ne": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]},
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "priority": "$_id",
                    "totalNotes": 1,
                    "completedNotes": 1,
                    "pendingNotes": 1,
                    "completionRate": {
                        "$cond": [
                            {"$gt": ["$totalNotes", 0]},
                            {"$round": [{"$multiply": [{"$divide": ["$completedNotes", "$totalNotes"]}, 100]}, 1]},
                            0.0
                        ]
                    }
                }
            }
        ]
        priority_docs = list(notes_collection.aggregate(priority_pipeline))

        # Normalize priority array to guarantee high, medium, low orders
        priority_map = {p["priority"]: p for p in priority_docs}
        ordered_priorities = []
        for level in ["high", "medium", "low"]:
            if level in priority_map:
                ordered_priorities.append(priority_map[level])
            else:
                ordered_priorities.append({
                    "priority": level,
                    "totalNotes": 0,
                    "completedNotes": 0,
                    "pendingNotes": 0,
                    "completionRate": 0.0
                })

        # 4. Top Tags Pipeline ($unwind)
        tags_pipeline = [
            {"$match": {"userId": user_id, "tags": {"$exists": True, "$ne": []}}},
            {"$unwind": "$tags"},
            {"$match": {"tags": {"$nin": ["", None]}}},
            {
                "$group": {
                    "_id": {"$trim": {"input": "$tags"}},
                    "count": {"$sum": 1}
                }
            },
            {"$match": {"_id": {"$ne": ""}}},
            {"$project": {"_id": 0, "tag": "$_id", "count": 1}},
            {"$sort": {"count": -1, "tag": 1}},
            {"$limit": 10}
        ]
        tag_docs = list(notes_collection.aggregate(tags_pipeline))

        # 5. Color Distribution Pipeline
        color_pipeline = [
            {"$match": {"userId": user_id}},
            {
                "$group": {
                    "_id": {"$ifNull": ["$color", "amber"]},
                    "count": {"$sum": 1}
                }
            },
            {"$project": {"_id": 0, "color": "$_id", "count": 1}},
            {"$sort": {"count": -1}}
        ]
        color_docs = list(notes_collection.aggregate(color_pipeline))

        # 6. Recent Notes
        recent_cursor = notes_collection.find({"userId": user_id}).sort("_id", -1).limit(6)
        recent_docs = [
            {
                "id": str(n["_id"]),
                "title": n.get("title", "Draft Note"),
                "category": n.get("category", "General") or "General",
                "priority": n.get("priority", "medium") or "medium",
                "status": n.get("status", "pending") or "pending",
                "color": n.get("color", "amber") or "amber",
                "updatedAt": n.get("updatedAt", "")
            }
            for n in recent_cursor
        ]

        return DashboardAnalyticsResponse(
            userId=user_id,
            summary=StatusSummary(**summary),
            categories=[CategoryMetric(**c) for c in category_docs],
            priorities=[PriorityMetric(**p) for p in ordered_priorities],
            topTags=[TagMetric(**t) for t in tag_docs],
            colorDistribution=[ColorMetric(**cd) for cd in color_docs],
            recentActivity=recent_docs
        )

    def get_viva_queries(self, user_id: str) -> VivaQueriesResponse:
        """
        Generates detailed MongoDB Aggregation Pipelines with syntax, purpose,
        stage breakdown explanations, and live executed outputs for presentation & viva defense.
        """
        pipelines = []

        # Pipeline 1: Category Aggregation
        p1_stages = [
            {
                "stage": "$match",
                "description": "Filters documents belonging exclusively to the authenticated user ID.",
                "syntax": {"$match": {"userId": user_id}}
            },
            {
                "stage": "$group",
                "description": "Groups documents by '$category' and aggregates total notes, completed notes ($cond), and pending notes.",
                "syntax": {
                    "$group": {
                        "_id": {"$ifNull": ["$category", "General"]},
                        "totalNotes": {"$sum": 1},
                        "completedNotes": {
                            "$sum": {
                                "$cond": [{"$eq": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]}, 1, 0]
                            }
                        },
                        "pendingNotes": {
                            "$sum": {
                                "$cond": [{"$ne": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]}, 1, 0]
                            }
                        }
                    }
                }
            },
            {
                "stage": "$project",
                "description": "Shapes the output document structure and computes the percentage completionRate dynamically.",
                "syntax": {
                    "$project": {
                        "_id": 0,
                        "category": "$_id",
                        "totalNotes": 1,
                        "completedNotes": 1,
                        "pendingNotes": 1,
                        "completionRate": {
                            "$cond": [
                                {"$gt": ["$totalNotes", 0]},
                                {"$round": [{"$multiply": [{"$divide": ["$completedNotes", "$totalNotes"]}, 100]}, 1]},
                                0.0
                            ]
                        }
                    }
                }
            },
            {
                "stage": "$sort",
                "description": "Orders categories in descending order by note volume ($totalNotes: -1).",
                "syntax": {"$sort": {"totalNotes": -1, "category": 1}}
            }
        ]
        p1_pipeline = [s["syntax"] for s in p1_stages]
        p1_output = sanitize_bson(list(notes_collection.aggregate(p1_pipeline)))
        pipelines.append(VivaPipelineItem(
            id="category_aggregation",
            title="Category Breakdown & Completion Rate Pipeline",
            purpose="Calculates note counts, completed vs pending status breakdown, and dynamic completion percentage per category.",
            stages=[VivaStageInfo(**s) for s in p1_stages],
            mongoShellQuery=f"db.notes.aggregate({json.dumps(p1_pipeline, indent=2)})",
            pyMongoCode="""# PyMongo Category Aggregation Pipeline
pipeline = [
    {"$match": {"userId": user_id}},
    {
        "$group": {
            "_id": {"$ifNull": ["$category", "General"]},
            "totalNotes": {"$sum": 1},
            "completedNotes": {
                "$sum": {"$cond": [{"$eq": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]}, 1, 0]}
            },
            "pendingNotes": {
                "$sum": {"$cond": [{"$ne": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]}, 1, 0]}
            }
        }
    },
    {
        "$project": {
            "_id": 0,
            "category": "$_id",
            "totalNotes": 1,
            "completedNotes": 1,
            "pendingNotes": 1,
            "completionRate": {
                "$cond": [
                    {"$gt": ["$totalNotes", 0]},
                    {"$round": [{"$multiply": [{"$divide": ["$completedNotes", "$totalNotes"]}, 100]}, 1]},
                    0.0
                ]
            }
        }
    },
    {"$sort": {"totalNotes": -1}}
]
results = list(notes_collection.aggregate(pipeline))""",
            liveOutput=p1_output
        ))

        # Pipeline 2: Priority Distribution
        p2_stages = [
            {
                "stage": "$match",
                "description": "Filters notes for the active user.",
                "syntax": {"$match": {"userId": user_id}}
            },
            {
                "stage": "$group",
                "description": "Groups documents by normalized '$priority' ('high', 'medium', 'low') and counts task completion status.",
                "syntax": {
                    "$group": {
                        "_id": {"$toLower": {"$ifNull": ["$priority", "medium"]}},
                        "totalNotes": {"$sum": 1},
                        "completedNotes": {
                            "$sum": {
                                "$cond": [{"$eq": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]}, 1, 0]
                            }
                        },
                        "pendingNotes": {
                            "$sum": {
                                "$cond": [{"$ne": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]}, 1, 0]
                            }
                        }
                    }
                }
            },
            {
                "stage": "$project",
                "description": "Formats result fields and computes priority-specific completion ratios.",
                "syntax": {
                    "$project": {
                        "_id": 0,
                        "priority": "$_id",
                        "totalNotes": 1,
                        "completedNotes": 1,
                        "pendingNotes": 1,
                        "completionRate": {
                            "$cond": [
                                {"$gt": ["$totalNotes", 0]},
                                {"$round": [{"$multiply": [{"$divide": ["$completedNotes", "$totalNotes"]}, 100]}, 1]},
                                0.0
                            ]
                        }
                    }
                }
            }
        ]
        p2_pipeline = [s["syntax"] for s in p2_stages]
        p2_output = sanitize_bson(list(notes_collection.aggregate(p2_pipeline)))
        pipelines.append(VivaPipelineItem(
            id="priority_distribution",
            title="Priority Distribution & Urgency Matrix Pipeline",
            purpose="Analyzes workload distribution across High, Medium, and Low priorities with pending vs. completed ratios.",
            stages=[VivaStageInfo(**s) for s in p2_stages],
            mongoShellQuery=f"db.notes.aggregate({json.dumps(p2_pipeline, indent=2)})",
            pyMongoCode="""# PyMongo Priority Aggregation Pipeline
pipeline = [
    {"$match": {"userId": user_id}},
    {
        "$group": {
            "_id": {"$toLower": {"$ifNull": ["$priority", "medium"]}},
            "totalNotes": {"$sum": 1},
            "completedNotes": {
                "$sum": {"$cond": [{"$eq": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]}, 1, 0]}
            },
            "pendingNotes": {
                "$sum": {"$cond": [{"$ne": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]}, 1, 0]}
            }
        }
    },
    {
        "$project": {
            "_id": 0,
            "priority": "$_id",
            "totalNotes": 1,
            "completedNotes": 1,
            "pendingNotes": 1,
            "completionRate": {
                "$round": [{"$multiply": [{"$divide": ["$completedNotes", "$totalNotes"]}, 100]}, 1]
            }
        }
    }
]
results = list(notes_collection.aggregate(pipeline))""",
            liveOutput=p2_output
        ))

        # Pipeline 3: Tag Frequency with $unwind
        p3_stages = [
            {
                "stage": "$match",
                "description": "Filters notes having a non-empty array in the 'tags' field.",
                "syntax": {"$match": {"userId": user_id, "tags": {"$exists": True, "$ne": []}}}
            },
            {
                "stage": "$unwind",
                "description": "Deconstructs the tags array field to output a document for each tag element.",
                "syntax": {"$unwind": "$tags"}
            },
            {
                "stage": "$group",
                "description": "Groups by tag string and sums the total occurrences.",
                "syntax": {
                    "$group": {
                        "_id": {"$trim": {"input": "$tags"}},
                        "count": {"$sum": 1}
                    }
                }
            },
            {
                "stage": "$sort & $limit",
                "description": "Orders tags by frequency descending and limits output to the top 10 tags.",
                "syntax": {"$sort": {"count": -1, "tag": 1}}
            }
        ]
        p3_pipeline = [
            {"$match": {"userId": user_id, "tags": {"$exists": True, "$ne": []}}},
            {"$unwind": "$tags"},
            {"$match": {"tags": {"$nin": ["", None]}}},
            {
                "$group": {
                    "_id": {"$trim": {"input": "$tags"}},
                    "count": {"$sum": 1}
                }
            },
            {"$match": {"_id": {"$ne": ""}}},
            {"$project": {"_id": 0, "tag": "$_id", "count": 1}},
            {"$sort": {"count": -1, "tag": 1}},
            {"$limit": 10}
        ]
        p3_output = sanitize_bson(list(notes_collection.aggregate(p3_pipeline)))
        pipelines.append(VivaPipelineItem(
            id="tags_unwind_frequency",
            title="Tag Cloud & Keyword Extraction Pipeline ($unwind)",
            purpose="Demonstrates array deconstruction using $unwind to analyze keyword and tag frequency across all user notes.",
            stages=[VivaStageInfo(**s) for s in p3_stages],
            mongoShellQuery=f"db.notes.aggregate({json.dumps(p3_pipeline, indent=2)})",
            pyMongoCode="""# PyMongo Tag Frequency with $unwind
pipeline = [
    {"$match": {"userId": user_id, "tags": {"$exists": True, "$ne": []}}},
    {"$unwind": "$tags"},
    {
        "$group": {
            "_id": {"$trim": {"input": "$tags"}},
            "count": {"$sum": 1}
        }
    },
    {"$project": {"_id": 0, "tag": "$_id", "count": 1}},
    {"$sort": {"count": -1}},
    {"$limit": 10}
]
results = list(notes_collection.aggregate(pipeline))""",
            liveOutput=p3_output
        ))

        # Pipeline 4: Multi-Facet Unified Pipeline
        p4_facet_pipeline = [
            {"$match": {"userId": user_id}},
            {
                "$facet": {
                    "kpiStats": [
                        {
                            "$group": {
                                "_id": None,
                                "total": {"$sum": 1},
                                "completed": {
                                    "$sum": {"$cond": [{"$eq": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]}, 1, 0]}
                                },
                                "pending": {
                                    "$sum": {"$cond": [{"$ne": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]}, 1, 0]}
                                }
                            }
                        }
                    ],
                    "categoryCounts": [
                        {"$group": {"_id": {"$ifNull": ["$category", "General"]}, "count": {"$sum": 1}}},
                        {"$sort": {"count": -1}}
                    ],
                    "priorityCounts": [
                        {"$group": {"_id": {"$ifNull": ["$priority", "medium"]}, "count": {"$sum": 1}}}
                    ]
                }
            }
        ]
        p4_output = sanitize_bson(list(notes_collection.aggregate(p4_facet_pipeline)))
        p4_stages = [
            {
                "stage": "$match",
                "description": "Scoped document match on userId.",
                "syntax": {"$match": {"userId": user_id}}
            },
            {
                "stage": "$facet",
                "description": "Executes multiple aggregation sub-pipelines simultaneously within a single stage on the incoming documents.",
                "syntax": p4_facet_pipeline[1]
            }
        ]
        pipelines.append(VivaPipelineItem(
            id="facet_multi_aggregation",
            title="Multi-Faceted Real-Time Aggregation ($facet)",
            purpose="Demonstrates advanced $facet stage to process multiple independent sub-pipelines in a single database roundtrip.",
            stages=[VivaStageInfo(**s) for s in p4_stages],
            mongoShellQuery=f"db.notes.aggregate({json.dumps(p4_facet_pipeline, indent=2)})",
            pyMongoCode="""# PyMongo Advanced Multi-Facet Aggregation
pipeline = [
    {"$match": {"userId": user_id}},
    {
        "$facet": {
            "kpiStats": [
                {
                    "$group": {
                        "_id": None,
                        "total": {"$sum": 1},
                        "completed": {"$sum": {"$cond": [{"$eq": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]}, 1, 0]}},
                        "pending": {"$sum": {"$cond": [{"$ne": [{"$toLower": {"$ifNull": ["$status", "pending"]}}, "completed"]}, 1, 0]}}
                    }
                }
            ],
            "categoryCounts": [
                {"$group": {"_id": {"$ifNull": ["$category", "General"]}, "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ],
            "priorityCounts": [
                {"$group": {"_id": {"$ifNull": ["$priority", "medium"]}, "count": {"$sum": 1}}}
            ]
        }
    }
]
results = list(notes_collection.aggregate(pipeline))""",
            liveOutput=p4_output
        ))

        return VivaQueriesResponse(userId=user_id, pipelines=pipelines)


note_service = NoteService()

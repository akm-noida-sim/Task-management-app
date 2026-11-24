"""Task CRUD, filtering and dashboard aggregation logic.

Every database query is scoped by ``user_id``, which enforces per-user
authorisation at the data-access layer (not just in the HTTP controller).
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from bson import ObjectId

from app.db import TASKS, get_collection
from app.models.schemas import PRIORITIES, STATUSES
from app.utils.errors import NotFoundError, UnauthorizedError
from app.utils.serializers import serialize_task

PRIORITY_RANK = {"Low": 1, "Medium": 2, "High": 3}
SORT_FIELDS = {
    "created_at": "created_at",
    "updated_at": "updated_at",
    "due_date": "due_date",
    "title": "title",
    "priority": "priority_rank",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _user_oid(user_id: Any) -> ObjectId:
    try:
        return ObjectId(str(user_id))
    except Exception:
        raise UnauthorizedError("Invalid user identity in token.", code="INVALID_IDENTITY") from None


def _task_oid(task_id: str) -> ObjectId:
    try:
        return ObjectId(task_id)
    except Exception:
        raise NotFoundError("Task not found.", code="TASK_NOT_FOUND") from None


class TaskService:
    @staticmethod
    def _base_query(user_id: Any, filters: dict | None = None) -> dict:
        query: dict[str, Any] = {"user_id": _user_oid(user_id)}
        for key, value in (filters or {}).items():
            if not value or key in {"sort_by", "order", "page", "limit"}:
                continue
            if key == "q":
                query["title"] = {"$regex": re.escape(value), "$options": "i"}
            elif key == "category":
                query["category"] = {"$regex": f"^{re.escape(value)}$", "$options": "i"}
            else:
                query[key] = value
        return query

    @staticmethod
    def list_tasks(
        user_id: Any,
        filters: dict | None = None,
        *,
        page: int = 1,
        limit: int = 10,
        max_limit: int = 100,
        default_limit: int = 10,
    ) -> tuple[list[dict], dict]:
        """Return a page of tasks plus pagination metadata."""
        limit = min(max(1, limit or default_limit), max_limit)
        query = TaskService._base_query(user_id, filters)
        collection = get_collection(TASKS)

        total = collection.count_documents(query)
        total_pages = (total + limit - 1) // limit
        current_page = min(page, max(total_pages, 1))
        skip = (current_page - 1) * limit

        filters = filters or {}
        sort_field = SORT_FIELDS.get(filters.get("sort_by", "created_at"), "created_at")
        direction = -1 if filters.get("order", "desc") == "desc" else 1

        cursor = (
            collection.find(query)
            .sort(sort_field, direction)
            .skip(skip)
            .limit(limit)
        )
        tasks = [serialize_task(task) for task in cursor]
        meta = {
            "page": current_page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": current_page < total_pages,
            "has_prev": current_page > 1,
        }
        return tasks, meta

    @staticmethod
    def get_task(user_id: Any, task_id: str) -> dict:
        task = get_collection(TASKS).find_one(
            {"_id": _task_oid(task_id), "user_id": _user_oid(user_id)}
        )
        if not task:
            raise NotFoundError("Task not found.", code="TASK_NOT_FOUND")
        return serialize_task(task)

    @staticmethod
    def create_task(user_id: Any, payload: dict) -> dict:
        now = _now()
        task = {
            "user_id": _user_oid(user_id),
            "title": payload["title"],
            "description": payload.get("description", ""),
            "category": payload.get("category", "General"),
            "priority": payload.get("priority", "Medium"),
            "priority_rank": PRIORITY_RANK.get(payload.get("priority", "Medium"), 2),
            "status": payload.get("status", "Pending"),
            "start_date": payload.get("start_date"),
            "due_date": payload["due_date"],
            "created_at": now,
            "updated_at": now,
        }
        result = get_collection(TASKS).insert_one(task)
        task["_id"] = result.inserted_id
        return serialize_task(task)

    @staticmethod
    def update_task(user_id: Any, task_id: str, payload: dict) -> dict:
        if "priority" in payload:
            payload["priority_rank"] = PRIORITY_RANK[payload["priority"]]
        payload["updated_at"] = _now()
        task = get_collection(TASKS).find_one_and_update(
            {"_id": _task_oid(task_id), "user_id": _user_oid(user_id)},
            {"$set": payload},
            return_document=True,
        )
        if not task:
            raise NotFoundError("Task not found.", code="TASK_NOT_FOUND")
        return serialize_task(task)

    @staticmethod
    def delete_task(user_id: Any, task_id: str) -> None:
        result = get_collection(TASKS).delete_one(
            {"_id": _task_oid(task_id), "user_id": _user_oid(user_id)}
        )
        if result.deleted_count == 0:
            raise NotFoundError("Task not found.", code="TASK_NOT_FOUND")

    @staticmethod
    def get_stats(user_id: Any) -> dict:
        """Compute dashboard numbers from the current user's stored tasks."""
        base = {"user_id": _user_oid(user_id)}
        collection = get_collection(TASKS)

        by_status = {
            row["_id"]: row["count"]
            for row in collection.aggregate(
                [
                    {"$match": base},
                    {"$group": {"_id": "$status", "count": {"$sum": 1}}},
                ]
            )
        }
        by_priority = {
            row["_id"]: row["count"]
            for row in collection.aggregate(
                [
                    {"$match": base},
                    {"$group": {"_id": "$priority", "count": {"$sum": 1}}},
                ]
            )
        }
        by_category = [
            {"name": row["_id"] or "General", "count": row["count"]}
            for row in collection.aggregate(
                [
                    {"$match": base},
                    {"$group": {"_id": "$category", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}},
                    {"$limit": 6},
                ]
            )
        ]

        total = sum(by_status.values())
        completed = by_status.get("Completed", 0)
        # Use UTC to match the frontend's todayISO() calculation.
        today = datetime.now(timezone.utc).date().isoformat()
        overdue = collection.count_documents(
            {**base, "status": {"$ne": "Completed"}, "due_date": {"$lt": today}}
        )

        recent = [
            serialize_task(task)
            for task in collection.find(base).sort("created_at", -1).limit(5)
        ]
        upcoming = [
            serialize_task(task)
            for task in collection.find(
                {**base, "status": {"$ne": "Completed"}, "due_date": {"$gte": today}}
            )
            .sort("due_date", 1)
            .limit(5)
        ]

        return {
            "overview": {
                "total_tasks": total,
                "completed_tasks": completed,
                "pending_tasks": by_status.get("Pending", 0),
                "in_progress_tasks": by_status.get("In Progress", 0),
                "overdue_tasks": overdue,
                "completion_rate": round((completed / total) * 100, 1) if total else 0,
            },
            "by_status": [
                {"name": name, "count": by_status.get(name, 0)}
                for name in STATUSES
            ],
            "by_priority": [
                {"name": name, "count": by_priority.get(name, 0)}
                for name in PRIORITIES
            ],
            "by_category": by_category,
            "recent_tasks": recent,
            "upcoming_deadlines": upcoming,
        }

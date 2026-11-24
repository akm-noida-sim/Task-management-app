"""Convert MongoDB documents into safe, JSON-serialisable API objects."""

from __future__ import annotations

from typing import Any

from bson import ObjectId


def oid_to_str(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, ObjectId):
        return str(value)
    return str(value)


def serialize_user(user: dict) -> dict:
    """Remove the password hash and convert ObjectIds before responding."""
    return {
        "id": oid_to_str(user.get("_id")),
        "name": user.get("name"),
        "email": user.get("email"),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at"),
    }


def serialize_task(task: dict) -> dict:
    return {
        "id": oid_to_str(task.get("_id")),
        "user_id": oid_to_str(task.get("user_id")),
        "title": task.get("title"),
        "description": task.get("description", ""),
        "category": task.get("category", "General"),
        "priority": task.get("priority", "Medium"),
        "status": task.get("status", "Pending"),
        "start_date": task.get("start_date"),
        "due_date": task.get("due_date"),
        "created_at": task.get("created_at"),
        "updated_at": task.get("updated_at"),
    }

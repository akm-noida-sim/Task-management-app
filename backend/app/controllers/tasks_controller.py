"""Controllers for task CRUD, status updates and filtering."""

from __future__ import annotations

from flask import current_app, request
from flask_jwt_extended import jwt_required

from app.middleware import current_user_id
from app.models.schemas import (
    validate_status_payload,
    validate_task_payload,
    validate_task_query,
)
from app.services.task_service import TaskService
from app.utils.errors import ValidationError
from app.utils.responses import success


@jwt_required()
def create_task():
    task = TaskService.create_task(
        current_user_id(), validate_task_payload(request.get_json(silent=True))
    )
    return success({"task": task}, "Task created successfully.", 201)


@jwt_required()
def list_tasks():
    filters = validate_task_query(request.args)
    page = filters.pop("page")
    limit = filters.pop("limit")
    max_limit = current_app.config["MAX_PAGE_SIZE"]
    if limit is not None and not 1 <= limit <= max_limit:
        raise ValidationError(
            f"Limit must be between 1 and {max_limit}.",
            details={"limit": f"Maximum is {max_limit}."},
        )
    tasks, meta = TaskService.list_tasks(
        current_user_id(),
        filters,
        page=page,
        limit=limit,
        max_limit=max_limit,
        default_limit=current_app.config["DEFAULT_PAGE_SIZE"],
    )
    return success({"tasks": tasks}, meta=meta)


@jwt_required()
def get_task(task_id: str):
    return success({"task": TaskService.get_task(current_user_id(), task_id)})


@jwt_required()
def update_task(task_id: str):
    user_id = current_user_id()
    current = TaskService.get_task(user_id, task_id)
    payload = validate_task_payload(
        request.get_json(silent=True), partial=True, current=current
    )
    task = TaskService.update_task(user_id, task_id, payload)
    return success({"task": task}, "Task updated successfully.")


@jwt_required()
def update_status(task_id: str):
    task = TaskService.update_task(
        current_user_id(),
        task_id,
        {"status": validate_status_payload(request.get_json(silent=True))},
    )
    return success({"task": task}, "Task status updated successfully.")


@jwt_required()
def delete_task(task_id: str):
    TaskService.delete_task(current_user_id(), task_id)
    return success(message="Task deleted successfully.")

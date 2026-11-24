"""Task resource routes (all protected by JWT)."""

from flask import Blueprint

from app.controllers import tasks_controller

tasks_bp = Blueprint("tasks", __name__)

tasks_bp.post("")(tasks_controller.create_task)
tasks_bp.get("")(tasks_controller.list_tasks)
tasks_bp.get("/<task_id>")(tasks_controller.get_task)
tasks_bp.put("/<task_id>")(tasks_controller.update_task)
tasks_bp.patch("/<task_id>/status")(tasks_controller.update_status)
tasks_bp.delete("/<task_id>")(tasks_controller.delete_task)

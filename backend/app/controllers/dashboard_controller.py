"""Controller for database-driven dashboard statistics."""

from flask_jwt_extended import jwt_required

from app.middleware import current_user_id
from app.services.task_service import TaskService
from app.utils.responses import success


@jwt_required()
def stats():
    return success(TaskService.get_stats(current_user_id()))

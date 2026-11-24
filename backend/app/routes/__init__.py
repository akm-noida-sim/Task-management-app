"""API blueprint registration."""

from app.routes.auth_routes import auth_bp
from app.routes.dashboard_routes import dashboard_bp
from app.routes.tasks_routes import tasks_bp

__all__ = ["auth_bp", "tasks_bp", "dashboard_bp"]

"""Dashboard statistics routes."""

from flask import Blueprint

from app.controllers import dashboard_controller

dashboard_bp = Blueprint("dashboard", __name__)

dashboard_bp.get("/stats")(dashboard_controller.stats)

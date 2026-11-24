"""Authentication and account routes."""

from flask import Blueprint

from app.controllers import auth_controller

auth_bp = Blueprint("auth", __name__)

auth_bp.post("/register")(auth_controller.register)
auth_bp.post("/login")(auth_controller.login)
auth_bp.post("/logout")(auth_controller.logout)
auth_bp.get("/me")(auth_controller.me)
auth_bp.put("/me")(auth_controller.update_me)
auth_bp.post("/change-password")(auth_controller.change_password)

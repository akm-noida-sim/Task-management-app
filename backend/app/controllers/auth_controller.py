"""Controllers for registration, login, logout and account settings."""

from __future__ import annotations

from datetime import datetime, timezone

from flask import request
from flask_jwt_extended import create_access_token, get_jwt, jwt_required

from app.middleware import current_user_id
from app.models.schemas import (
    validate_login,
    validate_password_change,
    validate_profile_update,
    validate_registration,
)
from app.services.auth_service import AuthService
from app.utils.errors import UnauthorizedError
from app.utils.responses import success


def _token_for(user_id: str) -> str:
    return create_access_token(identity=user_id)


def register():
    user = AuthService.register(validate_registration(request.get_json(silent=True)))
    return success(
        {"user": user, "access_token": _token_for(user["id"])},
        "Account created successfully.",
        201,
    )


def login():
    user = AuthService.authenticate(validate_login(request.get_json(silent=True)))
    return success(
        {"user": user, "access_token": _token_for(user["id"])},
        "Logged in successfully.",
    )


@jwt_required()
def logout():
    claims = get_jwt()
    expires_at = datetime.fromtimestamp(claims["exp"], tz=timezone.utc)
    AuthService.revoke_token(claims["jti"], expires_at)
    return success(message="Logged out successfully.")


@jwt_required()
def me():
    user = AuthService.get_user_by_id(current_user_id())
    if not user:
        raise UnauthorizedError("Account not found.", code="ACCOUNT_NOT_FOUND")
    return success({"user": user})


@jwt_required()
def update_me():
    user = AuthService.update_profile(
        current_user_id(), validate_profile_update(request.get_json(silent=True))
    )
    return success({"user": user}, "Profile updated successfully.")


@jwt_required()
def change_password():
    AuthService.change_password(
        current_user_id(), validate_password_change(request.get_json(silent=True))
    )
    return success(message="Password changed successfully.")

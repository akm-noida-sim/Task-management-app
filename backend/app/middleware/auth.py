"""Authentication middleware helpers shared by protected controllers.

``jwt_required()`` verifies the token signature, expiry and revocation. This
helper additionally confirms that the account referenced by the token still
exists, then returns the trusted user id used for all ownership checks.
"""

from __future__ import annotations

from flask_jwt_extended import get_jwt_identity

from app.services.auth_service import AuthService
from app.utils.errors import UnauthorizedError


def current_user_id() -> str:
    user_id = get_jwt_identity()
    if not user_id or not AuthService.get_user_by_id(user_id):
        raise UnauthorizedError("Account not found or no longer active.", code="ACCOUNT_NOT_FOUND")
    return user_id

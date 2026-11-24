"""Authentication and account-related business logic."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from app import bcrypt
from app.db import REVOKED_TOKENS, USERS, get_collection
from app.utils.errors import ConflictError, UnauthorizedError
from app.utils.serializers import serialize_user


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _user_object_id(user_id: Any) -> ObjectId:
    try:
        return ObjectId(str(user_id))
    except Exception:
        raise UnauthorizedError("Invalid user identity in token.", code="INVALID_IDENTITY") from None


def _email_conflict() -> ConflictError:
    return ConflictError(
        "An account with this email already exists.", code="EMAIL_EXISTS"
    )


class AuthService:
    @staticmethod
    def register(payload: dict) -> dict:
        users = get_collection(USERS)
        if users.find_one({"email": payload["email"]}):
            raise _email_conflict()

        now = _now()
        user = {
            "name": payload["name"],
            "email": payload["email"],
            "password_hash": bcrypt.generate_password_hash(
                payload["password"]
            ).decode("utf-8"),
            "created_at": now,
            "updated_at": now,
        }
        try:
            result = users.insert_one(user)
        except DuplicateKeyError as exc:
            # Another request may have inserted the same email after our pre-check.
            raise _email_conflict() from exc
        user["_id"] = result.inserted_id
        return serialize_user(user)

    @staticmethod
    def authenticate(payload: dict) -> dict:
        user = get_collection(USERS).find_one({"email": payload["email"]})
        if not user or not bcrypt.check_password_hash(
            user["password_hash"], payload["password"]
        ):
            raise UnauthorizedError(
                "Incorrect email or password.", code="INVALID_CREDENTIALS"
            )
        return serialize_user(user)

    @staticmethod
    def get_user_by_id(user_id: Any) -> dict | None:
        user = get_collection(USERS).find_one({"_id": _user_object_id(user_id)})
        return serialize_user(user) if user else None

    @staticmethod
    def update_profile(user_id: Any, payload: dict) -> dict:
        users = get_collection(USERS)
        oid = _user_object_id(user_id)
        if "email" in payload:
            existing = users.find_one({"email": payload["email"], "_id": {"$ne": oid}})
            if existing:
                raise _email_conflict()
        try:
            result = users.find_one_and_update(
                {"_id": oid},
                {"$set": {**payload, "updated_at": _now()}},
                return_document=True,
            )
        except DuplicateKeyError as exc:
            raise _email_conflict() from exc
        if not result:
            raise UnauthorizedError("Account not found.", code="ACCOUNT_NOT_FOUND")
        return serialize_user(result)

    @staticmethod
    def change_password(user_id: Any, payload: dict) -> None:
        users = get_collection(USERS)
        user = users.find_one({"_id": _user_object_id(user_id)})
        if not user or not bcrypt.check_password_hash(
            user["password_hash"], payload["current_password"]
        ):
            raise UnauthorizedError(
                "Current password is incorrect.", code="INVALID_CREDENTIALS"
            )
        users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "password_hash": bcrypt.generate_password_hash(
                        payload["new_password"]
                    ).decode("utf-8"),
                    "updated_at": _now(),
                }
            },
        )

    @staticmethod
    def revoke_token(jti: str, expires_at: datetime) -> None:
        """Persist a logged-out token until its natural expiry."""
        get_collection(REVOKED_TOKENS).update_one(
            {"jti": jti},
            {"$set": {"jti": jti, "expires_at": expires_at}},
            upsert=True,
        )

    @staticmethod
    def is_token_revoked(jti: str | None) -> bool:
        if not jti:
            return False
        return (
            get_collection(REVOKED_TOKENS).find_one({"jti": jti}, {"_id": 1})
            is not None
        )

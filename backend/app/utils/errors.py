"""Domain exceptions and centralised Flask/JWT error handling."""

from __future__ import annotations

from typing import Any

from flask import Flask, request
from pymongo.errors import PyMongoError
from werkzeug.exceptions import HTTPException

from app.utils.responses import error


class ApiError(Exception):
    """An expected, safely reportable API error."""

    status_code = 400
    code = "BAD_REQUEST"

    def __init__(
        self,
        message: str,
        status_code: int | None = None,
        code: str | None = None,
        details: Any | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.code = code
        self.details = details


class ValidationError(ApiError):
    status_code = 422
    code = "VALIDATION_ERROR"


class NotFoundError(ApiError):
    status_code = 404
    code = "NOT_FOUND"


class UnauthorizedError(ApiError):
    status_code = 401
    code = "UNAUTHORIZED"


class ConflictError(ApiError):
    status_code = 409
    code = "CONFLICT"


def register_error_handlers(app: Flask, jwt_manager=None) -> None:
    """Register consistent JSON error responses for every failure path."""

    if jwt_manager is not None:

        @jwt_manager.unauthorized_loader
        def missing_token(reason: str):
            return error("AUTH_REQUIRED", "Authentication is required.", 401)

        @jwt_manager.invalid_token_loader
        def invalid_token(reason: str):
            return error("INVALID_TOKEN", "The access token is invalid.", 401)

        @jwt_manager.expired_token_loader
        def expired_token(_header, _payload):
            return error("TOKEN_EXPIRED", "The access token has expired.", 401)

        @jwt_manager.revoked_token_loader
        def revoked_token(_header, _payload):
            return error("TOKEN_REVOKED", "This session has been logged out.", 401)

        @jwt_manager.needs_fresh_token_loader
        def fresh_token_required(_header, _payload):
            return error("FRESH_TOKEN_REQUIRED", "A fresh token is required.", 401)

    @app.errorhandler(ApiError)
    def handle_api_error(exc: ApiError):
        return error(exc.code, exc.message, exc.status_code, exc.details)

    @app.errorhandler(HTTPException)
    def handle_http_error(exc: HTTPException):
        code_by_status = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "ROUTE_NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            415: "UNSUPPORTED_MEDIA_TYPE",
        }
        status = exc.code or 500
        return error(
            code_by_status.get(status, "HTTP_ERROR"),
            exc.description if status < 500 else "An unexpected error occurred.",
            status,
        )

    @app.errorhandler(PyMongoError)
    def handle_database_error(_exc: PyMongoError):
        app.logger.exception("Database error while handling %s %s", request.method, request.path)
        return error(
            "DATABASE_ERROR", "The database is temporarily unavailable.", 503
        )

    @app.errorhandler(Exception)
    def handle_unexpected_error(exc: Exception):
        # Never leak stack traces, SQL/DB details or secrets to API clients.
        app.logger.exception(
            "Unhandled error while handling %s %s: %s", request.method, request.path, exc
        )
        return error("INTERNAL_ERROR", "An unexpected error occurred.", 500)

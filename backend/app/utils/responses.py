"""Consistent JSON response helpers used by all controllers."""

from __future__ import annotations

from typing import Any

from flask import jsonify


def success(
    data: Any = None,
    message: str | None = None,
    status_code: int = 200,
    meta: dict | None = None,
):
    """Build a successful JSON response.

    Response shape: ``{"success": true, "message": ..., "data": ..., "meta": ...}``
    """
    payload: dict[str, Any] = {"success": True}
    if message:
        payload["message"] = message
    if data is not None:
        payload["data"] = data
    if meta is not None:
        payload["meta"] = meta
    return jsonify(payload), status_code


def error(
    code: str,
    message: str,
    status_code: int,
    details: Any | None = None,
):
    """Build an error JSON response.

    Response shape: ``{"success": false, "error": {"code", "message", "details"}}``
    """
    error_body: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        error_body["details"] = details
    return jsonify({"success": False, "error": error_body}), status_code

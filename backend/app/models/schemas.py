"""Server-side validation for every user-supplied payload and query string.

Validation is intentionally explicit rather than relying on a large schema
library: there are few fields, and this keeps error messages predictable for
both the frontend and API consumers.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from app.utils.errors import ValidationError

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")

PRIORITIES = {"Low": "Low", "Medium": "Medium", "High": "High"}
STATUSES = {
    "Pending": "Pending",
    "In Progress": "In Progress",
    "Completed": "Completed",
}
SORT_FIELDS = {"created_at", "due_date", "priority", "title", "updated_at"}
SORT_ORDERS = {"asc", "desc"}

DATE_FORMAT = "%Y-%m-%d"


def ensure_object(data: Any) -> dict:
    if not isinstance(data, dict):
        raise ValidationError("The request body must be a JSON object.")
    return data


def _text(
    data: dict,
    field: str,
    *,
    required: bool = False,
    default: str | None = None,
    min_length: int = 0,
    max_length: int = 255,
    trim: bool = True,
) -> str | None:
    value = data.get(field, default)
    if value is None:
        if required:
            raise ValidationError(f"{field.replace('_', ' ').capitalize()} is required.", details={field: "This field is required."})
        return None
    if not isinstance(value, str):
        raise ValidationError(
            f"{field.replace('_', ' ').capitalize()} must be a string.",
            details={field: "Must be a string."},
        )
    value = value.strip() if trim else value
    if len(value) < min_length:
        raise ValidationError(
            f"{field.replace('_', ' ').capitalize()} must be at least {min_length} characters.",
            details={field: f"Minimum length is {min_length}."},
        )
    if len(value) > max_length:
        raise ValidationError(
            f"{field.replace('_', ' ').capitalize()} must be at most {max_length} characters.",
            details={field: f"Maximum length is {max_length}."},
        )
    return value


def _enum(value: Any, allowed: dict[str, str], field: str) -> str:
    if not isinstance(value, str):
        raise ValidationError(f"{field.capitalize()} must be a string.", details={field: "Must be a string."})
    canonical = allowed.get(value.strip())
    if canonical is None:
        options = ", ".join(allowed.keys())
        raise ValidationError(
            f"{field.capitalize()} must be one of: {options}.",
            details={field: f"Allowed values: {options}."},
        )
    return canonical


def _date(data: dict, field: str, *, required: bool = False) -> str | None:
    value = data.get(field)
    if value in (None, ""):
        if required:
            raise ValidationError(
                f"{field.replace('_', ' ').capitalize()} is required.",
                details={field: "This field is required."},
            )
        return None
    if not isinstance(value, str):
        raise ValidationError(
            f"{field.replace('_', ' ').capitalize()} must be a date in YYYY-MM-DD format.",
            details={field: "Use YYYY-MM-DD."},
        )
    try:
        parsed = datetime.strptime(value.strip(), DATE_FORMAT)
    except ValueError:
        raise ValidationError(
            f"{field.replace('_', ' ').capitalize()} must be a valid date in YYYY-MM-DD format.",
            details={field: "Use YYYY-MM-DD."},
        ) from None
    return parsed.strftime(DATE_FORMAT)


def validate_registration(payload: Any) -> dict:
    data = ensure_object(payload)
    email = _text(data, "email", required=True, max_length=254)
    assert email is not None
    if not EMAIL_RE.match(email):
        raise ValidationError("Enter a valid email address.", details={"email": "Invalid email format."})
    return {
        "name": _text(data, "name", required=True, min_length=2, max_length=80),
        "email": email.lower(),
        "password": _text(data, "password", required=True, min_length=8, max_length=128, trim=False),
    }


def validate_login(payload: Any) -> dict:
    data = ensure_object(payload)
    email = _text(data, "email", required=True, max_length=254)
    if email is None or not EMAIL_RE.match(email):
        raise ValidationError("Enter a valid email address.", details={"email": "Invalid email format."})
    password = _text(data, "password", required=True, max_length=128, trim=False)
    return {"email": email.lower(), "password": password or ""}


def validate_profile_update(payload: Any) -> dict:
    data = ensure_object(payload)
    allowed = {"name", "email"}
    if not any(key in data for key in allowed):
        raise ValidationError("Provide at least one field to update.")
    result: dict[str, Any] = {}
    if "name" in data:
        result["name"] = _text(data, "name", required=True, min_length=2, max_length=80)
    if "email" in data:
        email = _text(data, "email", required=True, max_length=254)
        assert email is not None
        if not EMAIL_RE.match(email):
            raise ValidationError("Enter a valid email address.", details={"email": "Invalid email format."})
        result["email"] = email.lower()
    return result


def validate_password_change(payload: Any) -> dict:
    data = ensure_object(payload)
    return {
        "current_password": _text(
            data, "current_password", required=True, max_length=128, trim=False
        ),
        "new_password": _text(
            data, "new_password", required=True, min_length=8, max_length=128, trim=False
        ),
    }


def validate_task_payload(
    payload: Any, *, partial: bool = False, current: dict | None = None
) -> dict:
    """Validate and normalise a create (partial=False) or update payload.

    ``current`` holds the stored task for partial updates so cross-field rules
    (such as the date order) are checked against the final merged values.
    """
    data = ensure_object(payload)
    allowed = {
        "title",
        "description",
        "category",
        "priority",
        "status",
        "start_date",
        "due_date",
    }
    unknown = set(data) - allowed
    if unknown:
        raise ValidationError(
            f"Unknown field(s): {', '.join(sorted(unknown))}.",
            details={field: "This field is not allowed." for field in sorted(unknown)},
        )
    if partial and not any(key in data for key in allowed):
        raise ValidationError("Provide at least one field to update.")

    result: dict[str, Any] = {}
    if "title" in data or not partial:
        result["title"] = _text(data, "title", required=True, min_length=1, max_length=120)
    if "description" in data or (not partial and "description" not in data):
        result["description"] = _text(
            data, "description", default="", max_length=2000
        ) or ""
    if "category" in data or not partial:
        result["category"] = _text(
            data, "category", default="General", min_length=1, max_length=60
        ) or "General"
    if "priority" in data or not partial:
        result["priority"] = _enum(
            data.get("priority", "Medium"), PRIORITIES, "priority"
        )
    if "status" in data or not partial:
        result["status"] = _enum(data.get("status", "Pending"), STATUSES, "status")
    if "start_date" in data:
        result["start_date"] = _date(data, "start_date")
    elif not partial:
        result["start_date"] = None
    if "due_date" in data or not partial:
        result["due_date"] = _date(data, "due_date", required=True)

    stored = current or {}
    start_date = result.get("start_date", stored.get("start_date"))
    due_date = result.get("due_date", stored.get("due_date"))
    if start_date and due_date and due_date < start_date:
        raise ValidationError(
            "Due date cannot be earlier than the start date.",
            details={"due_date": "Must be on or after the start date."},
        )
    return result


def validate_status_payload(payload: Any) -> str:
    data = ensure_object(payload)
    if "status" not in data:
        raise ValidationError("Status is required.", details={"status": "This field is required."})
    return _enum(data["status"], STATUSES, "status")


def validate_task_query(args) -> dict:
    """Parse and validate listing query parameters."""
    result: dict[str, Any] = {}

    q = args.get("q", "").strip()
    if len(q) > 100:
        raise ValidationError("Search text cannot exceed 100 characters.", details={"q": "Maximum length is 100."})
    result["q"] = q

    for field, allowed in (("status", STATUSES), ("priority", PRIORITIES)):
        value = args.get(field, "").strip()
        if value:
            result[field] = _enum(value, allowed, field)

    category = args.get("category", "").strip()
    if len(category) > 60:
        raise ValidationError("Category filter is too long.", details={"category": "Maximum length is 60."})
    result["category"] = category

    sort_by = args.get("sort_by", "created_at").strip()
    if sort_by not in SORT_FIELDS:
        raise ValidationError(
            "Invalid sort field.", details={"sort_by": f"Allowed values: {', '.join(sorted(SORT_FIELDS))}."}
        )
    result["sort_by"] = sort_by

    order = args.get("order", "desc").strip().lower()
    if order not in SORT_ORDERS:
        raise ValidationError("Invalid sort order.", details={"order": "Use asc or desc."})
    result["order"] = order

    for field, default in (("page", 1), ("limit", None)):
        raw = args.get(field, default)
        if raw is None:
            result[field] = None
            continue
        try:
            parsed = int(raw)
        except (TypeError, ValueError):
            raise ValidationError(
                f"{field.capitalize()} must be an integer.", details={field: "Must be an integer."}
            ) from None
        result[field] = parsed

    if result["page"] < 1:
        raise ValidationError("Page must be at least 1.", details={"page": "Minimum is 1."})
    return result

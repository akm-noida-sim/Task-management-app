"""MongoDB connection, collection access and index management."""

from __future__ import annotations

from flask import current_app, g
from pymongo import ASCENDING, DESCENDING, MongoClient

USERS = "users"
TASKS = "tasks"
REVOKED_TOKENS = "revoked_tokens"


def init_db(app, client=None) -> None:
    """Attach a MongoClient to the app and ensure indexes exist."""
    if client is None:
        client = MongoClient(
            app.config["MONGODB_URI"],
            serverSelectionTimeoutMS=5000,
            appname="TaskFlow",
        )
    app.extensions["mongo_client"] = client

    with app.app_context():
        create_indexes()


def get_db():
    """Return the database for the current application context."""
    if "db" not in g:
        g.db = current_app.extensions["mongo_client"][
            current_app.config["MONGODB_DB_NAME"]
        ]
    return g.db


def get_collection(name: str):
    """Return a collection from the current request's database."""
    return get_db()[name]


def close_db(_error=None) -> None:
    """Remove the request-scoped database handle."""
    g.pop("db", None)


def create_indexes() -> None:
    """Create indexes that support the application's most common queries.

    Safe to call repeatedly: MongoDB treats identical index specs as a no-op.
    """
    db = get_db()

    db[USERS].create_index("email", unique=True, name="uniq_user_email")
    db[USERS].create_index("created_at", name="user_created_at")

    # Every task query is scoped to a user, then sorted/filtered by these fields.
    db[TASKS].create_index(
        [("user_id", ASCENDING), ("created_at", DESCENDING)], name="user_created"
    )
    db[TASKS].create_index(
        [("user_id", ASCENDING), ("due_date", ASCENDING)], name="user_due_date"
    )
    db[TASKS].create_index(
        [("user_id", ASCENDING), ("status", ASCENDING)], name="user_status"
    )
    db[TASKS].create_index(
        [("user_id", ASCENDING), ("priority", ASCENDING)], name="user_priority"
    )
    db[TASKS].create_index(
        [("user_id", ASCENDING), ("category", ASCENDING)], name="user_category"
    )

    # Logout tokens are removed automatically once they expire.
    db[REVOKED_TOKENS].create_index(
        "expires_at", expireAfterSeconds=0, name="token_expiry_ttl"
    )

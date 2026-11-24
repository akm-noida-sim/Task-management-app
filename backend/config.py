"""Application configuration loaded from environment variables.

All secrets and environment-specific values live here so that no module needs
to read ``os.environ`` directly. See ``.env.example`` at the repository root.
"""

from __future__ import annotations

import os
from datetime import timedelta

from dotenv import load_dotenv

BACKEND_DIR = os.path.abspath(os.path.dirname(__file__))
ROOT_DIR = os.path.dirname(BACKEND_DIR)

# Loading is harmless when the file does not exist (deployment uses real env vars).
load_dotenv(os.path.join(ROOT_DIR, ".env"))
load_dotenv(os.path.join(BACKEND_DIR, ".env"))


def _as_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


class Config:
    """Base configuration shared by every environment."""

    FLASK_ENV = os.environ.get("FLASK_ENV", "development")
    DEBUG = FLASK_ENV == "development"

    MONGODB_URI = os.environ.get("MONGODB_URI", "mongodb://127.0.0.1:27017")
    MONGODB_DB_NAME = os.environ.get("MONGODB_DB_NAME", "taskflow")

    # A development-only fallback keeps local setup simple. Production leaves
    # this empty; create_app() refuses to start unless a real key is supplied.
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or (
        "" if FLASK_ENV == "production" else "taskflow-development-only-secret-change-me"
    )
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        hours=max(1, _as_int("JWT_ACCESS_TOKEN_HOURS", 24))
    )
    JWT_TOKEN_LOCATION = ["headers"]

    CORS_ORIGINS = [
        origin.strip()
        for origin in os.environ.get(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ]

    DEFAULT_PAGE_SIZE = _as_int("DEFAULT_PAGE_SIZE", 10)
    MAX_PAGE_SIZE = _as_int("MAX_PAGE_SIZE", 100)
    BCRYPT_LOG_ROUNDS = max(4, _as_int("BCRYPT_LOG_ROUNDS", 12))

    TESTING = False
    PROPAGATE_EXCEPTIONS = False


class DevelopmentConfig(Config):
    FLASK_ENV = "development"
    DEBUG = True


class ProductionConfig(Config):
    FLASK_ENV = "production"
    DEBUG = False
    # Do not inherit the development fallback when this class is selected directly.
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "")


class TestingConfig(Config):
    FLASK_ENV = "testing"
    TESTING = True
    DEBUG = False
    JWT_SECRET_KEY = "taskflow-test-only-secret-0123456789abcdef"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    MONGODB_DB_NAME = "taskflow_test"
    BCRYPT_LOG_ROUNDS = 4  # Keep tests fast; production uses the configured cost.


CONFIG_BY_NAME = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}

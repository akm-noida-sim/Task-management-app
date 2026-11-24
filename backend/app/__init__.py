"""Flask application factory for TaskFlow."""

from __future__ import annotations

from flask import Flask
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from app.db import close_db, init_db
from app.utils.errors import register_error_handlers
from config import Config, TestingConfig

bcrypt = Bcrypt()
jwt = JWTManager()


def create_app(
    config_object: type[Config] | None = None,
    overrides: dict | None = None,
    mongo_client=None,
) -> Flask:
    """Build and configure a Flask application.

    Args:
        config_object: A config class (defaults to ``Config``).
        overrides: Optional config key/value overrides, mainly for tests.
        mongo_client: Optional pre-built PyMongo-compatible client. When given,
            the app will not open a new connection (used with mongomock).
    """
    app = Flask(__name__)
    app.config.from_object(config_object or Config)
    if overrides:
        app.config.update(overrides)

    if app.config.get("FLASK_ENV") == "production" and not app.config.get("JWT_SECRET_KEY"):
        raise RuntimeError(
            "JWT_SECRET_KEY must be set in production. See .env.example for guidance."
        )

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization"],
        supports_credentials=False,
    )

    bcrypt.init_app(app)
    jwt.init_app(app)

    from app.services.auth_service import AuthService

    @jwt.token_in_blocklist_loader
    def is_token_revoked(jwt_header, jwt_payload):  # noqa: ANN001
        return AuthService.is_token_revoked(jwt_payload.get("jti"))

    init_db(app, client=mongo_client)
    app.teardown_appcontext(close_db)

    from app.routes import auth_bp, dashboard_bp, tasks_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(tasks_bp, url_prefix="/api/tasks")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    register_error_handlers(app, jwt_manager=jwt)

    @app.get("/api/health")
    def health_check():
        from app.utils.responses import success

        return success({"status": "ok", "service": "taskflow-api"})

    return app


__all__ = ["create_app", "bcrypt", "jwt", "Config", "TestingConfig"]

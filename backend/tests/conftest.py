"""Shared pytest fixtures: an isolated app backed by an in-memory MongoDB."""

from __future__ import annotations

import pytest
import mongomock

from app import create_app
from config import TestingConfig


@pytest.fixture()
def app():
    # mongomock implements the PyMongo API in memory, so tests need no server.
    application = create_app(TestingConfig, mongo_client=mongomock.MongoClient())
    application.config["PROPAGATE_EXCEPTIONS"] = False
    yield application


@pytest.fixture()
def client(app):
    with app.test_client() as test_client:
        yield test_client


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def register(client, email: str = "user@example.com", password: str = "StrongPass123"):
    response = client.post(
        "/api/auth/register",
        json={"name": "Test User", "email": email, "password": password},
    )
    assert response.status_code == 201, response.get_json()
    body = response.get_json()
    return body["data"]["access_token"], body["data"]["user"]


def create_task(client, token: str, **overrides):
    payload = {
        "title": "Write project documentation",
        "description": "Document the API and architecture.",
        "category": "Work",
        "priority": "High",
        "status": "Pending",
        "due_date": "2026-12-31",
    }
    payload.update(overrides)
    return client.post("/api/tasks", json=payload, headers=auth_header(token))

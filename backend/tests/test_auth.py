"""Authentication, JWT and account-settings tests."""

from tests.conftest import auth_header, register


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.get_json()["data"]["status"] == "ok"


def test_registration_hashes_password_and_hides_hash(client, app):
    token, user = register(client)
    assert token
    assert "password_hash" not in user
    assert user["email"] == "user@example.com"
    with app.app_context():
        from app.db import USERS, get_collection

        stored = get_collection(USERS).find_one({"email": "user@example.com"})
    assert stored["password_hash"] != "StrongPass123"
    assert stored["password_hash"].startswith("$2b$")


def test_duplicate_registration_is_rejected(client):
    register(client)
    duplicate = client.post(
        "/api/auth/register",
        json={
            "name": "Other User",
            "email": "USER@example.com",
            "password": "StrongPass123",
        },
    )
    assert duplicate.status_code == 409
    assert duplicate.get_json()["error"]["code"] == "EMAIL_EXISTS"


def test_invalid_registration_payload(client):
    response = client.post(
        "/api/auth/register", json={"name": "A", "email": "bad", "password": "short"}
    )
    assert response.status_code == 422
    assert response.get_json()["success"] is False


def test_login_success_and_invalid_credentials(client):
    register(client)
    good = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "StrongPass123"},
    )
    assert good.status_code == 200
    assert good.get_json()["data"]["access_token"]

    bad = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "WrongPassword1"},
    )
    assert bad.status_code == 401
    assert bad.get_json()["error"]["code"] == "INVALID_CREDENTIALS"


def test_protected_routes_require_token(client):
    for method, path in (
        ("get", "/api/auth/me"),
        ("get", "/api/tasks"),
        ("post", "/api/tasks"),
        ("get", "/api/dashboard/stats"),
    ):
        response = getattr(client, method)(path)
        assert response.status_code == 401
        assert response.get_json()["error"]["code"] == "AUTH_REQUIRED"


def test_me_and_logout_token_revocation(client):
    token, _ = register(client)
    me = client.get("/api/auth/me", headers=auth_header(token))
    assert me.status_code == 200
    assert me.get_json()["data"]["user"]["name"] == "Test User"

    logout = client.post("/api/auth/logout", headers=auth_header(token))
    assert logout.status_code == 200
    after = client.get("/api/auth/me", headers=auth_header(token))
    assert after.status_code == 401
    assert after.get_json()["error"]["code"] == "TOKEN_REVOKED"


def test_profile_update_and_password_change(client):
    token, _ = register(client)
    updated = client.put(
        "/api/auth/me",
        json={"name": "Renamed User", "email": "new@example.com"},
        headers=auth_header(token),
    )
    assert updated.status_code == 200
    assert updated.get_json()["data"]["user"]["email"] == "new@example.com"

    changed = client.post(
        "/api/auth/change-password",
        json={"current_password": "StrongPass123", "new_password": "EvenStronger456"},
        headers=auth_header(token),
    )
    assert changed.status_code == 200
    relogin = client.post(
        "/api/auth/login",
        json={"email": "new@example.com", "password": "EvenStronger456"},
    )
    assert relogin.status_code == 200

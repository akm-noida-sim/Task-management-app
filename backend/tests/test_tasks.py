"""Task CRUD, authorisation, filtering and pagination tests."""

from tests.conftest import auth_header, create_task, register


def test_create_and_read_task(client):
    token, _ = register(client)
    created = create_task(client, token)
    assert created.status_code == 201
    task = created.get_json()["data"]["task"]
    assert task["title"] == "Write project documentation"
    assert task["status"] == "Pending"
    assert task["priority"] == "High"
    assert task["id"]

    listed = client.get("/api/tasks", headers=auth_header(token))
    assert listed.status_code == 200
    assert listed.get_json()["data"]["tasks"][0]["id"] == task["id"]
    assert listed.get_json()["meta"]["total"] == 1

    detail = client.get(f"/api/tasks/{task['id']}", headers=auth_header(token))
    assert detail.status_code == 200
    assert detail.get_json()["data"]["task"]["description"].startswith("Document")


def test_update_status_and_delete(client):
    token, _ = register(client)
    task_id = create_task(client, token).get_json()["data"]["task"]["id"]

    updated = client.put(
        f"/api/tasks/{task_id}",
        json={"title": "Updated title", "priority": "Low"},
        headers=auth_header(token),
    )
    assert updated.status_code == 200
    assert updated.get_json()["data"]["task"]["title"] == "Updated title"
    assert updated.get_json()["data"]["task"]["priority"] == "Low"

    status = client.patch(
        f"/api/tasks/{task_id}/status",
        json={"status": "Completed"},
        headers=auth_header(token),
    )
    assert status.status_code == 200
    assert status.get_json()["data"]["task"]["status"] == "Completed"

    deleted = client.delete(f"/api/tasks/{task_id}", headers=auth_header(token))
    assert deleted.status_code == 200
    missing = client.get(f"/api/tasks/{task_id}", headers=auth_header(token))
    assert missing.status_code == 404
    assert missing.get_json()["error"]["code"] == "TASK_NOT_FOUND"


def test_partial_update_keeps_date_order_valid(client):
    token, _ = register(client)
    task_id = create_task(
        client, token, start_date="2026-11-01", due_date="2026-12-01"
    ).get_json()["data"]["task"]["id"]

    late_start = client.put(
        f"/api/tasks/{task_id}",
        json={"start_date": "2026-12-15"},
        headers=auth_header(token),
    )
    assert late_start.status_code == 422
    assert late_start.get_json()["error"]["code"] == "VALIDATION_ERROR"

    early_due = client.put(
        f"/api/tasks/{task_id}",
        json={"due_date": "2026-10-01"},
        headers=auth_header(token),
    )
    assert early_due.status_code == 422

    unchanged = client.get(f"/api/tasks/{task_id}", headers=auth_header(token)).get_json()
    assert unchanged["data"]["task"]["start_date"] == "2026-11-01"
    assert unchanged["data"]["task"]["due_date"] == "2026-12-01"


def test_users_cannot_access_other_users_tasks(client):
    token_a, _ = register(client, "a@example.com")
    token_b, _ = register(client, "b@example.com")
    task_id = create_task(client, token_a).get_json()["data"]["task"]["id"]

    assert client.get(f"/api/tasks/{task_id}", headers=auth_header(token_b)).status_code == 404
    assert client.put(
        f"/api/tasks/{task_id}", json={"title": "Stolen"}, headers=auth_header(token_b)
    ).status_code == 404
    assert client.delete(f"/api/tasks/{task_id}", headers=auth_header(token_b)).status_code == 404
    assert client.get("/api/tasks", headers=auth_header(token_b)).get_json()["meta"]["total"] == 0


def test_search_filters_sort_and_pagination(client):
    token, _ = register(client)
    create_task(client, token, title="Alpha report", status="Pending", priority="High", category="Work", due_date="2026-12-01")
    create_task(client, token, title="Beta report", status="Completed", priority="Low", category="Personal", due_date="2026-10-01")
    create_task(client, token, title="Gamma notes", status="In Progress", priority="Medium", category="Work", due_date="2026-11-01")

    def get(query: str):
        return client.get(f"/api/tasks?{query}", headers=auth_header(token)).get_json()

    assert len(get("q=alpha")["data"]["tasks"]) == 1
    assert len(get("status=Completed")["data"]["tasks"]) == 1
    assert len(get("priority=High")["data"]["tasks"]) == 1
    assert len(get("category=work")["data"]["tasks"]) == 2
    assert get("sort_by=due_date&order=asc")["data"]["tasks"][0]["title"] == "Beta report"
    assert get("sort_by=priority&order=desc")["data"]["tasks"][0]["priority"] == "High"

    page1 = get("page=1&limit=2")
    page2 = get("page=2&limit=2")
    assert len(page1["data"]["tasks"]) == 2
    assert len(page2["data"]["tasks"]) == 1
    assert page1["meta"]["total"] == 3
    assert page1["meta"]["has_next"] is True
    assert page2["meta"]["has_prev"] is True


def test_invalid_task_payloads_and_ids(client):
    token, _ = register(client)
    assert client.post("/api/tasks", json={"title": ""}, headers=auth_header(token)).status_code == 422
    assert client.post(
        "/api/tasks",
        json={"title": "Bad dates", "start_date": "2026-10-10", "due_date": "2026-01-01"},
        headers=auth_header(token),
    ).status_code == 422
    assert client.post(
        "/api/tasks", json={"title": "Bad priority", "priority": "Urgent", "due_date": "2026-12-31"},
        headers=auth_header(token),
    ).status_code == 422
    assert client.get("/api/tasks/not-an-object-id", headers=auth_header(token)).status_code == 404
    assert client.get("/api/tasks?sort_by=unknown", headers=auth_header(token)).status_code == 422

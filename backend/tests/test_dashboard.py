"""Dashboard statistics are derived from stored tasks, not static values."""

from tests.conftest import auth_header, create_task, register


def test_empty_dashboard(client):
    token, _ = register(client)
    response = client.get("/api/dashboard/stats", headers=auth_header(token))
    assert response.status_code == 200
    overview = response.get_json()["data"]["overview"]
    assert overview["total_tasks"] == 0
    assert overview["completion_rate"] == 0
    assert response.get_json()["data"]["recent_tasks"] == []


def test_dashboard_counts_and_lists(client):
    token, _ = register(client)
    create_task(client, token, title="Done task", status="Completed", priority="High")
    create_task(client, token, title="Active task", status="In Progress", priority="Medium")
    create_task(client, token, title="Waiting task", status="Pending", priority="Low", due_date="2020-01-01")

    stats = client.get("/api/dashboard/stats", headers=auth_header(token)).get_json()["data"]
    overview = stats["overview"]
    assert overview["total_tasks"] == 3
    assert overview["completed_tasks"] == 1
    assert overview["in_progress_tasks"] == 1
    assert overview["pending_tasks"] == 1
    assert overview["overdue_tasks"] == 1
    assert overview["completion_rate"] == 33.3
    assert len(stats["recent_tasks"]) == 3
    assert stats["upcoming_deadlines"][0]["status"] != "Completed"
    assert [item["name"] for item in stats["by_status"]] == ["Pending", "In Progress", "Completed"]


def test_dashboard_is_user_scoped(client):
    token_a, _ = register(client, "a@example.com")
    token_b, _ = register(client, "b@example.com")
    create_task(client, token_a)
    stats_b = client.get("/api/dashboard/stats", headers=auth_header(token_b)).get_json()["data"]
    assert stats_b["overview"]["total_tasks"] == 0

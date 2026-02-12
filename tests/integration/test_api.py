import os
from typing import Any
from unittest.mock import MagicMock, patch

# Set dummy env vars BEFORE importing src.main to avoid Database init error
os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_KEY"] = "dummy-key"

from fastapi.testclient import TestClient
from src.main import app, backend

client = TestClient(app)

# --- API TESTS ---

# 1. Test that the API is alive
def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "status" in response.json()

# 2. Test to see if we can fetch events (The Core Feature)
def test_get_events():
    # Mock the database response
    mock_response = MagicMock()
    mock_response.data = [{"id": 1, "title": "Mock Event"}]
    
    # We need to mock the chain: backend.db.client.table().select().execute()
    with patch.object(backend.db.client, 'table') as mock_table:
        mock_table.return_value.select.return_value.execute.return_value = mock_response
        
        response = client.get("/events")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        assert response.json()[0]["title"] == "Mock Event"

# 3. Test Create Event
def test_create_event():
    mock_response = MagicMock()
    mock_response.data = [{"id": 1, "title": "New Event", "status": "Draft"}]

    payload: dict[str, Any] = {
        "title": "New Event",
        "date": "2025-12-01T10:00:00",
        "location": "Conference Room",
        "capacity": 50,
        "organizer": "Test Org"
    }

    with patch.object(backend.db.client, 'table') as mock_table:
        mock_table.return_value.insert.return_value.execute.return_value = mock_response

        response = client.post("/events", json=payload)
        
        assert response.status_code == 200
        assert response.json()["title"] == "New Event"
        
        # Verify the mock was called correctly
        mock_table.assert_called_with("events")
        # Check if insert called (args verification is tricky with chained mocks, but checking call count helps)
        assert mock_table.return_value.insert.called

# 4. Test Delete Event
def test_delete_event():
    mock_response = MagicMock()
    mock_response.data = [] # Supabase delete returns data sometimes, but we just check success here

    with patch.object(backend.db.client, 'table') as mock_table:
        mock_table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_response

        response = client.delete("/events/123")
        
        assert response.status_code == 200
        assert response.json() == {"message": "Event deleted successfully"}

# 5. Test Update Event
def test_update_event():
    mock_response = MagicMock()
    mock_response.data = [{"id": 1, "title": "Updated Title"}]

    payload: dict[str, Any] = {"title": "Updated Title"}

    with patch.object(backend.db.client, 'table') as mock_table:
        mock_table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response

        response = client.patch("/events/1", json=payload)
        
        assert response.status_code == 200
        assert response.json()[0]["title"] == "Updated Title"

# 6. test_FR16_create_rsvp — RSVP creates record and returns 201
def test_FR16_create_rsvp():
    existing_response = MagicMock()
    existing_response.data = []

    attendance_response = MagicMock()
    attendance_response.data = [{"id": 1, "event_id": 1, "user_id": "user-1"}]

    select_response = MagicMock()
    select_response.data = {"attendee_count": 2, "capacity": 50}

    rpc_response = MagicMock()
    rpc_response.data = 3

    attendance_table = MagicMock()
    attendance_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = existing_response
    attendance_table.insert.return_value.execute.return_value = attendance_response

    events_table = MagicMock()
    events_table.select.return_value.eq.return_value.single.return_value.execute.return_value = select_response

    def table_side_effect(name: str):
        return attendance_table if name == "event_attendance" else events_table

    with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
        with patch.object(backend.db.client, 'rpc', return_value=MagicMock(execute=MagicMock(return_value=rpc_response))):
            payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}
            response = client.post("/api/rsvp", json=payload)

            assert response.status_code == 201

# 6b. test_FR16_duplicate_rsvp_returns_409
def test_FR16_duplicate_rsvp_returns_409():
    existing_response = MagicMock()
    existing_response.data = [{"id": 99}]

    attendance_table = MagicMock()
    attendance_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = existing_response

    events_table = MagicMock()

    def table_side_effect(name: str):
        return attendance_table if name == "event_attendance" else events_table

    with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
        payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}
        response = client.post("/api/rsvp", json=payload)

        assert response.status_code == 409
        assert "Already RSVP" in response.json()["detail"]

# 6c. test_FR16_rsvp_at_capacity_returns_400
def test_FR16_rsvp_at_capacity_returns_400():
    existing_response = MagicMock()
    existing_response.data = []

    select_response = MagicMock()
    select_response.data = {"attendee_count": 50, "capacity": 50}

    attendance_table = MagicMock()
    attendance_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = existing_response

    events_table = MagicMock()
    events_table.select.return_value.eq.return_value.single.return_value.execute.return_value = select_response

    def table_side_effect(name: str):
        return attendance_table if name == "event_attendance" else events_table

    with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
        payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}
        response = client.post("/api/rsvp", json=payload)

        assert response.status_code == 400
        assert "Event is full" in response.json()["detail"]

# 6d. test_NFR03_rsvp_performance — RSVP completes within 1 second
def test_NFR03_rsvp_performance():
    import time

    existing_response = MagicMock()
    existing_response.data = []

    attendance_response = MagicMock()
    attendance_response.data = [{"id": 1, "event_id": 1, "user_id": "user-1"}]

    select_response = MagicMock()
    select_response.data = {"attendee_count": 0, "capacity": 50}

    rpc_response = MagicMock()
    rpc_response.data = 1

    attendance_table = MagicMock()
    attendance_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = existing_response
    attendance_table.insert.return_value.execute.return_value = attendance_response

    events_table = MagicMock()
    events_table.select.return_value.eq.return_value.single.return_value.execute.return_value = select_response

    def table_side_effect(name: str):
        return attendance_table if name == "event_attendance" else events_table

    with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
        with patch.object(backend.db.client, 'rpc', return_value=MagicMock(execute=MagicMock(return_value=rpc_response))):
            start = time.time()
            payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}
            response = client.post("/api/rsvp", json=payload)
            elapsed = time.time() - start

            assert response.status_code == 201
            assert elapsed < 1.0, f"RSVP took {elapsed:.3f}s, exceeds 1s NFR-03 limit"

# 7. test_FR17_cancel_rsvp_decrements_count
def test_FR17_cancel_rsvp_decrements_count():
    delete_response = MagicMock()
    delete_response.data = [{"id": 1}]

    rpc_response = MagicMock()
    rpc_response.data = 0

    attendance_table = MagicMock()
    attendance_table.delete.return_value.eq.return_value.eq.return_value.execute.return_value = delete_response

    def table_side_effect(name: str):
        return attendance_table if name == "event_attendance" else MagicMock()

    with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
        with patch.object(backend.db.client, 'rpc', return_value=MagicMock(execute=MagicMock(return_value=rpc_response))) as mock_rpc:
            payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}
            response = client.request("DELETE", "/events/1/rsvp", json=payload)

            assert response.status_code == 204
            mock_rpc.assert_called_once_with("decrement_attendee_count", {"p_event_id": 1})

# 7b. test_FR17_cancel_rsvp_not_found
def test_FR17_cancel_rsvp_not_found():
    delete_response = MagicMock()
    delete_response.data = []

    attendance_table = MagicMock()
    attendance_table.delete.return_value.eq.return_value.eq.return_value.execute.return_value = delete_response

    def table_side_effect(name: str):
        return attendance_table if name == "event_attendance" else MagicMock()

    with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
        payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}
        response = client.request("DELETE", "/events/1/rsvp", json=payload)

        assert response.status_code == 404

# 8. test_FR21_get_user_rsvps_with_event_data
def test_FR21_get_user_rsvps_with_event_data():
    attendance_response = MagicMock()
    attendance_response.data = [
        {"id": 1, "event_id": 10, "user_id": "user-1", "created_at": "2025-02-01T10:00:00"}
    ]

    events_response = MagicMock()
    events_response.data = [
        {"id": 10, "title": "Test Event", "location": "Hall", "start_time": "2025-02-02T10:00:00"}
    ]

    attendance_table = MagicMock()
    attendance_table.select.return_value.eq.return_value.execute.return_value = attendance_response

    events_table = MagicMock()
    events_table.select.return_value.in_.return_value.execute.return_value = events_response

    def table_side_effect(name: str):
        return attendance_table if name == "event_attendance" else events_table

    with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
        response = client.get("/api/rsvp", params={"user_id": "user-1"})

        assert response.status_code == 200
        body = response.json()
        assert isinstance(body, list)
        assert body[0]["event"]["id"] == 10

# 8b. test_FR14_get_event_rsvps — organiser views attendee list
def test_FR14_get_event_rsvps():
    attendance_response = MagicMock()
    attendance_response.data = [
        {"user_id": "uid-abc", "created_at": "2025-02-01T10:00:00"}
    ]

    attendance_table = MagicMock()
    attendance_table.select.return_value.eq.return_value.execute.return_value = attendance_response

    mock_user = MagicMock()
    mock_user.user.email = "alice@bath.ac.uk"
    mock_user.user.user_metadata = {"full_name": "Alice Smith"}

    with patch.object(backend.db.admin, 'table', return_value=attendance_table):
        with patch.object(backend.db.admin.auth.admin, 'get_user_by_id', return_value=mock_user) as mock_get:
            response = client.get("/api/events/1/rsvps")

            assert response.status_code == 200
            body = response.json()
            assert len(body) == 1
            assert body[0]["name"] == "Alice Smith"
            assert body[0]["email"] == "alice@bath.ac.uk"
            assert body[0]["rsvp_time"] == "2025-02-01T10:00:00"
            mock_get.assert_called_once_with("uid-abc")

# 9. Test Signup
def test_signup():
    mock_response = MagicMock()
    # Mocking what Supabase Auth response looks like roughly
    mock_response.user.id = "user-123"
    mock_response.user.email = "test@bath.ac.uk"
    
    payload: dict[str, Any] = {
        "email": "test@bath.ac.uk",
        "password": "strongpassword",
        "full_name": "Test User"
    }

    with patch.object(backend.db.client, 'auth') as mock_auth:
        mock_auth.sign_up.return_value = mock_response

        response = client.post("/auth/signup", json=payload)
        
        assert response.status_code == 200
        # The endpoint returns the whole response object, we might want to check its content
        # Note: Response serialization might vary, but usually status 200 is good enough for now with mock

# 10. Test Login
def test_login():
    mock_response = MagicMock()
    mock_response.session.access_token = "fake-token"
    
    payload: dict[str, Any] = {
        "email": "test@example.com",
        "password": "strongpassword"
    }

    with patch.object(backend.db.client, 'auth') as mock_auth:
        mock_auth.sign_in_with_password.return_value = mock_response

        response = client.post("/auth/login", json=payload)
        
        assert response.status_code == 200

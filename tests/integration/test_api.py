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

# 6. Test RSVP increments attendee_count
def test_rsvp_increments_attendee_count():
    attendance_response = MagicMock()
    attendance_response.data = [{"id": 1, "event_id": 1, "user_id": "user-1"}]

    select_response = MagicMock()
    select_response.data = {"attendee_count": 2}

    update_response = MagicMock()
    update_response.data = [{"id": 1, "attendee_count": 3}]

    attendance_table = MagicMock()
    attendance_table.insert.return_value.execute.return_value = attendance_response

    events_table = MagicMock()
    events_table.select.return_value.eq.return_value.single.return_value.execute.return_value = select_response
    events_table.update.return_value.eq.return_value.execute.return_value = update_response

    def table_side_effect(name: str):
        return attendance_table if name == "event_attendance" else events_table

    with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
        payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}
        response = client.post("/events/1/rsvp", json=payload)

        assert response.status_code == 200
        events_table.update.assert_called_with({"attendee_count": 3})

# 7. Test RSVP cancel decrements attendee_count
def test_rsvp_cancel_decrements_attendee_count():
    delete_response = MagicMock()
    delete_response.data = [{"id": 1}]

    select_response = MagicMock()
    select_response.data = {"attendee_count": 1}

    update_response = MagicMock()
    update_response.data = [{"id": 1, "attendee_count": 0}]

    attendance_table = MagicMock()
    attendance_table.delete.return_value.eq.return_value.execute.return_value = delete_response

    events_table = MagicMock()
    events_table.select.return_value.eq.return_value.single.return_value.execute.return_value = select_response
    events_table.update.return_value.eq.return_value.execute.return_value = update_response

    def table_side_effect(name: str):
        return attendance_table if name == "event_attendance" else events_table

    with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
        payload: dict[str, Any] = {"event_id": 1, "user_id": None}
        response = client.request("DELETE", "/events/1/rsvp", json=payload)

        assert response.status_code == 204
        events_table.update.assert_called_with({"attendee_count": 0})

def test_rsvp_cancel_not_found():
    delete_response = MagicMock()
    delete_response.data = []

    attendance_table = MagicMock()
    attendance_table.delete.return_value.eq.return_value.execute.return_value = delete_response

    events_table = MagicMock()

    def table_side_effect(name: str):
        return attendance_table if name == "event_attendance" else events_table

    with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
        payload: dict[str, Any] = {"event_id": 1, "user_id": None}
        response = client.request("DELETE", "/events/1/rsvp", json=payload)

        assert response.status_code == 404

# 8. Test Get RSVPs with nested event data
def test_get_rsvps_with_event_data():
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

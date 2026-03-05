import os
from datetime import datetime, timezone
from typing import Any
from unittest.mock import MagicMock, patch
from types import SimpleNamespace

# Set dummy env vars BEFORE importing src.main to avoid Database init error
os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_KEY"] = "dummy-key"

from fastapi.testclient import TestClient
from src.main import app, backend

client = TestClient(app)

# --- Auth helper: mock a valid authenticated request ---
VALID_TOKEN = "valid-test-token"
AUTH_HEADER = {"Authorization": f"Bearer {VALID_TOKEN}"}
MOCK_USER_ID = "user-auth-123"

def mock_get_user_success(token: str):
    """Simulate Supabase auth.get_user returning a valid user."""
    mock_user = MagicMock()
    mock_user.user.id = MOCK_USER_ID
    mock_user.user.email = "test@bath.ac.uk"
    return mock_user

def patch_auth_valid():
    """Context manager to patch auth.get_user for valid token."""
    return patch.object(backend.db.client, 'auth', **{
        'get_user.side_effect': mock_get_user_success
    })

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
    mock_response.data = [
        {"id": 1, "title": "Mock Event", "description": "Test", "location": "Hall",
         "start_time": "2026-04-01T10:00:00+00:00", "capacity": 50, "attendee_count": 10,
         "status": "Published", "organizer": "Org"}
    ]

    # Chain: table().select().eq().gte().order().execute()
    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        assert response.json()[0]["title"] == "Mock Event"

# --- FR-01: Event List Display Tests ---

def test_FR01_display_events_sorted_by_date():
    """GET /events returns published upcoming events sorted by start_time ASC."""
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Event A", "start_time": "2026-03-01T10:00:00", "location": "Hall A",
         "capacity": 100, "attendee_count": 5, "status": "Published"},
        {"id": 2, "title": "Event B", "start_time": "2026-04-01T10:00:00", "location": "Hall B",
         "capacity": 50, "attendee_count": 10, "status": "Published"},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events")
        assert response.status_code == 200
        body = response.json()
        assert isinstance(body, list)
        assert len(body) == 2
        # Verify sort order (soonest first)
        assert body[0]["title"] == "Event A"
        assert body[1]["title"] == "Event B"
        # Verify required fields present
        for event in body:
            assert "id" in event
            assert "title" in event
            assert "start_time" in event
            assert "location" in event
            assert "capacity" in event
            assert "attendee_count" in event

def test_FR01_display_events_empty():
    """GET /events returns empty list when no upcoming published events."""
    mock_response = MagicMock()
    mock_response.data = []

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events")
        assert response.status_code == 200
        assert response.json() == []

def test_FR01_display_events_calls_correct_filters():
    """GET /events filters by Published status and future start_time."""
    mock_response = MagicMock()
    mock_response.data = []

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        client.get("/events")

        # Verify table and select were called
        mock_table.assert_called_with("events")
        # Verify filter chain: .eq("status", "Published").gte("start_time", ...).order("start_time")
        chain.eq.assert_called_once_with("status", "Published")
        chain.eq.return_value.gte.assert_called_once()
        gte_args = chain.eq.return_value.gte.call_args
        assert gte_args[0][0] == "start_time"  # First arg is column name
        chain.eq.return_value.gte.return_value.order.assert_called_once_with("start_time")

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

    mock_admin = MagicMock()
    mock_admin.table.return_value.insert.return_value.execute.return_value = mock_response

    with patch_auth_valid():
        with patch.object(backend.db, 'admin', mock_admin):
            response = client.post("/events", json=payload, headers=AUTH_HEADER)

            assert response.status_code == 200
            assert response.json()["title"] == "New Event"

            mock_admin.table.assert_called_with("events")
            assert mock_admin.table.return_value.insert.called


# 3b. test_FR09_create_event_sets_organiser_id — organiser_id derived from JWT
def test_FR09_create_event_sets_organiser_id():
    """Event creation sets organiser_id from the authenticated user's JWT."""
    mock_response = MagicMock()
    mock_response.data = [{"id": 2, "title": "My Event", "organiser_id": MOCK_USER_ID}]

    payload: dict[str, Any] = {
        "title": "My Event",
        "date": "2025-12-01T10:00:00",
        "location": "Hall B",
        "capacity": 30,
    }

    mock_admin = MagicMock()
    mock_admin.table.return_value.insert.return_value.execute.return_value = mock_response

    with patch_auth_valid():
        with patch.object(backend.db, 'admin', mock_admin):
            response = client.post("/events", json=payload, headers=AUTH_HEADER)

            assert response.status_code == 200

            # Verify organiser_id was included in the insert payload
            inserted_data = mock_admin.table.return_value.insert.call_args[0][0]
            assert inserted_data["organiser_id"] == MOCK_USER_ID


# 3c. test_FR09_create_event_missing_required_fields — validation rejects incomplete payload
def test_FR09_create_event_missing_required_fields():
    """Event creation without required fields returns 422 validation error."""
    payload: dict[str, Any] = {
        "title": "Incomplete Event"
        # Missing date, location, capacity
    }

    with patch_auth_valid():
        response = client.post("/events", json=payload, headers=AUTH_HEADER)
        assert response.status_code == 422


# 3d. test_FR09_create_event_defaults_to_draft — status defaults to Draft
def test_FR09_create_event_defaults_to_draft():
    """Event creation without explicit status defaults to 'Draft'."""
    mock_response = MagicMock()
    mock_response.data = [{"id": 3, "title": "Draft Event", "status": "Draft"}]

    payload: dict[str, Any] = {
        "title": "Draft Event",
        "date": "2025-12-01T10:00:00",
        "location": "Room C",
        "capacity": 20,
    }

    mock_admin = MagicMock()
    mock_admin.table.return_value.insert.return_value.execute.return_value = mock_response

    with patch_auth_valid():
        with patch.object(backend.db, 'admin', mock_admin):
            response = client.post("/events", json=payload, headers=AUTH_HEADER)

            assert response.status_code == 200

            inserted_data = mock_admin.table.return_value.insert.call_args[0][0]
            assert inserted_data["status"] == "Draft"


# 3e. test_FR09_create_event_unauthenticated — no token returns 401
def test_FR09_create_event_unauthenticated():
    """Event creation without auth token returns 401."""
    payload: dict[str, Any] = {
        "title": "Unauth Event",
        "date": "2025-12-01T10:00:00",
        "location": "Room D",
        "capacity": 10,
    }

    response = client.post("/events", json=payload)
    assert response.status_code == 401


# 4. Test Delete Event
def test_delete_event():
    mock_response = MagicMock()
    mock_response.data = [] # Supabase delete returns data sometimes, but we just check success here

    with patch_auth_valid():
        with patch.object(backend.db.client, 'table') as mock_table:
            mock_table.return_value.delete.return_value.eq.return_value.execute.return_value = mock_response

            response = client.delete("/events/123", headers=AUTH_HEADER)

            assert response.status_code == 200
            assert response.json() == {"message": "Event deleted successfully"}

# 5. Test Update Event
def test_update_event():
    mock_response = MagicMock()
    mock_response.data = [{"id": 1, "title": "Updated Title"}]

    payload: dict[str, Any] = {"title": "Updated Title"}

    with patch_auth_valid():
        with patch.object(backend.db.client, 'table') as mock_table:
            mock_table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response

            response = client.patch("/events/1", json=payload, headers=AUTH_HEADER)

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

    with patch_auth_valid():
        with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
            with patch.object(backend.db.client, 'rpc', return_value=MagicMock(execute=MagicMock(return_value=rpc_response))):
                payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}
                response = client.post("/api/rsvp", json=payload, headers=AUTH_HEADER)

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

    with patch_auth_valid():
        with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
            payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}
            response = client.post("/api/rsvp", json=payload, headers=AUTH_HEADER)

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

    with patch_auth_valid():
        with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
            payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}
            response = client.post("/api/rsvp", json=payload, headers=AUTH_HEADER)

            assert response.status_code == 400
            assert "Event is full" in response.json()["detail"]

# 6d. test_FR11_capacity_limits — capacity saved, RSVP blocked at capacity, unlimited when 0
def test_FR11_capacity_limits():
    """FR-11: Capacity saved on creation, RSVP blocked at capacity, unlimited when capacity=0."""
    # --- Part 1: capacity is saved with event creation ---
    mock_create_response = MagicMock()
    mock_create_response.data = [{"id": 10, "title": "Capped Event", "capacity": 30, "status": "Draft"}]

    create_payload: dict[str, Any] = {
        "title": "Capped Event",
        "date": "2025-12-01T10:00:00",
        "location": "Room A",
        "capacity": 30,
    }

    mock_admin = MagicMock()
    mock_admin.table.return_value.insert.return_value.execute.return_value = mock_create_response

    with patch_auth_valid():
        with patch.object(backend.db, 'admin', mock_admin):
            response = client.post("/events", json=create_payload, headers=AUTH_HEADER)
            assert response.status_code == 200
            inserted = mock_admin.table.return_value.insert.call_args[0][0]
            assert inserted["capacity"] == 30

    # --- Part 2: RSVP blocked when at capacity ---
    existing_response = MagicMock()
    existing_response.data = []

    at_cap_response = MagicMock()
    at_cap_response.data = {"attendee_count": 30, "capacity": 30}

    attendance_table = MagicMock()
    attendance_table.select.return_value.eq.return_value.eq.return_value.execute.return_value = existing_response

    events_table = MagicMock()
    events_table.select.return_value.eq.return_value.single.return_value.execute.return_value = at_cap_response

    def table_at_cap(name: str):
        return attendance_table if name == "event_attendance" else events_table

    with patch_auth_valid():
        with patch.object(backend.db.client, 'table', side_effect=table_at_cap):
            payload: dict[str, Any] = {"event_id": 10, "user_id": "user-1"}
            response = client.post("/api/rsvp", json=payload, headers=AUTH_HEADER)
            assert response.status_code == 400
            assert "Event is full" in response.json()["detail"]

    # --- Part 3: unlimited capacity (capacity=0) allows RSVP ---
    unlimited_response = MagicMock()
    unlimited_response.data = {"attendee_count": 500, "capacity": 0}

    attendance_insert_response = MagicMock()
    attendance_insert_response.data = [{"id": 99, "event_id": 10, "user_id": "user-1"}]

    rpc_response = MagicMock()
    rpc_response.data = 501

    unlimited_attendance = MagicMock()
    unlimited_attendance.select.return_value.eq.return_value.eq.return_value.execute.return_value = existing_response
    unlimited_attendance.insert.return_value.execute.return_value = attendance_insert_response

    unlimited_events = MagicMock()
    unlimited_events.select.return_value.eq.return_value.single.return_value.execute.return_value = unlimited_response

    def table_unlimited(name: str):
        return unlimited_attendance if name == "event_attendance" else unlimited_events

    with patch_auth_valid():
        with patch.object(backend.db.client, 'table', side_effect=table_unlimited):
            with patch.object(backend.db.client, 'rpc', return_value=MagicMock(execute=MagicMock(return_value=rpc_response))):
                payload = {"event_id": 10, "user_id": "user-1"}
                response = client.post("/api/rsvp", json=payload, headers=AUTH_HEADER)
                assert response.status_code == 201, f"Expected 201 for unlimited capacity, got {response.status_code}: {response.json()}"


# 6e. test_NFR03_rsvp_performance — RSVP completes within 1 second
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

    with patch_auth_valid():
        with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
            with patch.object(backend.db.client, 'rpc', return_value=MagicMock(execute=MagicMock(return_value=rpc_response))):
                start = time.time()
                payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}
                response = client.post("/api/rsvp", json=payload, headers=AUTH_HEADER)
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

    with patch_auth_valid():
        with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
            with patch.object(backend.db.client, 'rpc', return_value=MagicMock(execute=MagicMock(return_value=rpc_response))) as mock_rpc:
                payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}
                response = client.request("DELETE", "/events/1/rsvp", json=payload, headers=AUTH_HEADER)

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

    with patch_auth_valid():
        with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
            payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}
            response = client.request("DELETE", "/events/1/rsvp", json=payload, headers=AUTH_HEADER)

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

    with patch_auth_valid():
        with patch.object(backend.db.client, 'table', side_effect=table_side_effect):
            response = client.get("/api/rsvp", params={"user_id": "user-1"}, headers=AUTH_HEADER)

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

    # Build a full mock admin client so the test works regardless of whether
    # SERVICE_ROLE_KEY is set (db.admin may be None in CI).
    mock_admin = MagicMock()
    mock_admin.table.return_value = attendance_table
    mock_admin.auth.admin.get_user_by_id.return_value = mock_user

    with patch_auth_valid():
        with patch.object(backend.db, 'admin', mock_admin):
            response = client.get("/api/events/1/rsvps", headers=AUTH_HEADER)

            assert response.status_code == 200
            body = response.json()
            assert len(body) == 1
            assert body[0]["name"] == "Alice Smith"
            assert body[0]["email"] == "alice@bath.ac.uk"
            assert body[0]["rsvp_time"] == "2025-02-01T10:00:00"
            mock_admin.auth.admin.get_user_by_id.assert_called_once_with("uid-abc")

# 9. Test Signup
def test_signup():
    mock_response = MagicMock()
    mock_response.user.id = "user-123"
    mock_response.user.email = "test@bath.ac.uk"
    mock_response.user.identities = [{"id": "identity-1"}]  # Non-empty = new user

    payload: dict[str, Any] = {
        "email": "test@bath.ac.uk",
        "password": "strongpassword",
        "full_name": "Test User"
    }

    with patch.object(backend.db.client, 'auth') as mock_auth:
        mock_auth.sign_up.return_value = mock_response

        response = client.post("/auth/signup", json=payload)

        assert response.status_code == 200
        body = response.json()
        assert body["user"]["id"] == "user-123"
        assert body["user"]["email"] == "test@bath.ac.uk"

# --- NFR-08: User Registration Tests ---

def test_NFR08_signup_duplicate_email_identities():
    """Duplicate user detected via empty identities array (email confirmation enabled)."""
    mock_response = MagicMock()
    mock_response.user.id = "user-existing"
    mock_response.user.email = "dupe@bath.ac.uk"
    mock_response.user.identities = []  # Empty = duplicate

    payload: dict[str, Any] = {
        "email": "dupe@bath.ac.uk",
        "password": "strongpassword",
        "full_name": "Dupe User"
    }

    with patch.object(backend.db.client, 'auth') as mock_auth:
        mock_auth.sign_up.return_value = mock_response
        response = client.post("/auth/signup", json=payload)

    assert response.status_code == 409
    assert "An account with this email already exists" in response.json()["detail"]

def test_NFR08_signup_duplicate_email_exception():
    """Duplicate user detected via Supabase 'already registered' exception."""
    payload: dict[str, Any] = {
        "email": "dupe@bath.ac.uk",
        "password": "strongpassword",
        "full_name": "Dupe User"
    }

    with patch.object(backend.db.client, 'auth') as mock_auth:
        mock_auth.sign_up.side_effect = Exception("User already registered")
        response = client.post("/auth/signup", json=payload)

    assert response.status_code == 409
    assert "An account with this email already exists" in response.json()["detail"]

def test_NFR08_signup_non_bath_email():
    """Non-bath email rejected at endpoint level."""
    payload: dict[str, Any] = {
        "email": "user@gmail.com",
        "password": "strongpassword",
        "full_name": "Test User"
    }
    response = client.post("/auth/signup", json=payload)
    assert response.status_code == 422  # Pydantic validation rejects before endpoint

def test_NFR08_signup_missing_password():
    """Missing password field returns validation error."""
    payload: dict[str, Any] = {
        "email": "test@bath.ac.uk"
    }
    response = client.post("/auth/signup", json=payload)
    assert response.status_code == 422

def test_NFR08_signup_weak_password():
    """Password shorter than 8 characters is rejected by Pydantic validator."""
    payload: dict[str, Any] = {
        "email": "test@bath.ac.uk",
        "password": "short",
        "full_name": "Test User"
    }
    response = client.post("/auth/signup", json=payload)
    assert response.status_code == 422

# --- NFR-08: User Login Tests ---

def test_NFR08_user_login_valid():
    """Valid credentials return 200 with session containing access_token."""
    from types import SimpleNamespace

    mock_response = SimpleNamespace(
        session={"access_token": "fake-jwt-token", "token_type": "bearer"},
        user={"id": "user-123", "email": "test@bath.ac.uk"},
    )

    payload: dict[str, Any] = {
        "email": "test@bath.ac.uk",
        "password": "strongpassword"
    }

    with patch.object(backend.db.client, 'auth') as mock_auth:
        mock_auth.sign_in_with_password.return_value = mock_response
        response = client.post("/auth/login", json=payload)

        assert response.status_code == 200
        body = response.json()
        assert "session" in body
        assert body["session"]["access_token"] == "fake-jwt-token"
        assert body["user"]["email"] == "test@bath.ac.uk"
        mock_auth.sign_in_with_password.assert_called_once_with({
            "email": "test@bath.ac.uk",
            "password": "strongpassword"
        })

def test_NFR08_user_login_invalid_password():
    """Invalid password returns 401 with 'Invalid email or password'."""
    payload: dict[str, Any] = {
        "email": "test@bath.ac.uk",
        "password": "wrongpassword"
    }

    with patch.object(backend.db.client, 'auth') as mock_auth:
        mock_auth.sign_in_with_password.side_effect = Exception("Invalid login credentials")
        response = client.post("/auth/login", json=payload)

        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

def test_NFR08_user_login_nonexistent_email():
    """Non-existent email returns 401 with 'Invalid email or password'."""
    payload: dict[str, Any] = {
        "email": "nonexistent@bath.ac.uk",
        "password": "somepassword"
    }

    with patch.object(backend.db.client, 'auth') as mock_auth:
        mock_auth.sign_in_with_password.side_effect = Exception("Invalid login credentials")
        response = client.post("/auth/login", json=payload)

        assert response.status_code == 401
        assert "Invalid email or password" in response.json()["detail"]

# --- NFR-10: API Authentication Middleware Tests ---

def test_NFR10_no_token_returns_401():
    """All protected endpoints return 401 without Authorization header."""
    event_payload: dict[str, Any] = {
        "title": "Test Event",
        "date": "2025-12-01T10:00:00",
        "location": "Room A",
        "capacity": 50,
        "organizer": "Test Org"
    }
    rsvp_payload: dict[str, Any] = {"event_id": 1, "user_id": "user-1"}

    protected_requests = [
        ("POST", "/events", event_payload),
        ("DELETE", "/events/1", None),
        ("PATCH", "/events/1", {"title": "X"}),
        ("POST", "/api/rsvp", rsvp_payload),
        ("DELETE", "/events/1/rsvp", rsvp_payload),
        ("GET", "/api/rsvp?user_id=u1", None),
        ("GET", "/api/events/1/rsvps", None),
    ]

    for method, path, body in protected_requests:
        kwargs: dict[str, Any] = {}
        if body is not None:
            kwargs["json"] = body
        response = client.request(method, path, **kwargs)
        assert response.status_code == 401, f"{method} {path} returned {response.status_code}, expected 401"
        assert "Authorization required" in response.json()["detail"]

def test_NFR10_valid_token_allows_request():
    """Request with valid JWT proceeds to handler."""
    mock_response = MagicMock()
    mock_response.data = [{"id": 1, "title": "New Event", "status": "Draft"}]

    payload: dict[str, Any] = {
        "title": "New Event",
        "date": "2025-12-01T10:00:00",
        "location": "Room A",
        "capacity": 50,
        "organizer": "Test Org"
    }

    mock_admin = MagicMock()
    mock_admin.table.return_value.insert.return_value.execute.return_value = mock_response

    with patch_auth_valid():
        with patch.object(backend.db, 'admin', mock_admin):
            response = client.post("/events", json=payload, headers=AUTH_HEADER)
            assert response.status_code == 200

def test_NFR10_expired_token_returns_401():
    """Request with expired JWT returns 401 with 'Token expired'."""
    with patch.object(backend.db.client, 'auth') as mock_auth:
        mock_auth.get_user.side_effect = Exception("Token expired")
        response = client.post("/events", json={
            "title": "Test", "date": "2025-12-01T10:00:00",
            "location": "Room", "capacity": 10, "organizer": "Org"
        }, headers=AUTH_HEADER)
        assert response.status_code == 401
        assert "Token expired" in response.json()["detail"]

def test_NFR10_malformed_token_returns_401():
    """Request with malformed JWT returns 401 with 'Invalid token'."""
    with patch.object(backend.db.client, 'auth') as mock_auth:
        mock_auth.get_user.side_effect = Exception("Invalid JWT")
        response = client.post("/events", json={
            "title": "Test", "date": "2025-12-01T10:00:00",
            "location": "Room", "capacity": 10, "organizer": "Org"
        }, headers={"Authorization": "Bearer malformed-token"})
        assert response.status_code == 401
        assert "Invalid token" in response.json()["detail"]

def test_NFR10_empty_bearer_token_returns_401():
    """Request with 'Bearer ' but no actual token returns 401."""
    response = client.post("/events", json={
        "title": "Test", "date": "2025-12-01T10:00:00",
        "location": "Room", "capacity": 10, "organizer": "Org"
    }, headers={"Authorization": "Bearer "})
    assert response.status_code == 401
    assert "Authorization required" in response.json()["detail"]

def test_NFR10_public_endpoints_no_auth():
    """Public endpoints (GET /events, auth routes) don't require auth."""
    # GET /events should work without token
    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = MagicMock(data=[])
        response = client.get("/events")
        assert response.status_code == 200

    # GET / (root) should work without token
    response = client.get("/")
    assert response.status_code == 200

# --- NFR-01: Event List Performance Tests ---

# --- NFR-14: Event API Integration Tests ---

def test_NFR14_events_api_integration():
    """GET /events returns all required fields per AC-1: id, title, description, location, datetime, capacity, attendee_count."""
    mock_response = MagicMock()
    mock_response.data = [
        {
            "id": 1,
            "title": "Campus Meetup",
            "description": "A social gathering",
            "location": "Student Union",
            "start_time": "2026-04-01T14:00:00+00:00",
            "capacity": 100,
            "attendee_count": 25,
            "status": "Published",
            "organizer": "CS Society",
            "latitude": 51.38,
            "longitude": -2.36,
        },
        {
            "id": 2,
            "title": "Hackathon",
            "description": None,
            "location": "Engineering Building",
            "start_time": "2026-05-10T09:00:00+00:00",
            "capacity": 200,
            "attendee_count": 0,
            "status": "Published",
            "organizer": "Tech Society",
            "latitude": None,
            "longitude": None,
        },
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events")
        assert response.status_code == 200
        body = response.json()
        assert isinstance(body, list)
        assert len(body) == 2

        # Verify ALL required fields are present in every event (AC-1)
        required_fields = {"id", "title", "description", "location", "start_time", "capacity", "attendee_count"}
        for event in body:
            missing = required_fields - set(event.keys())
            assert not missing, f"Event missing required fields: {missing}"

        # Verify field types/values for first event
        first = body[0]
        assert first["id"] == 1
        assert first["title"] == "Campus Meetup"
        assert first["description"] == "A social gathering"
        assert first["location"] == "Student Union"
        assert first["start_time"] == "2026-04-01T14:00:00Z"
        assert first["capacity"] == 100
        assert first["attendee_count"] == 25

        # Verify nullable description works
        assert body[1]["description"] is None


def test_NFR14_events_api_integration_error_returns_503():
    """GET /events returns 503 when database fails so clients can show error UI (AC-2)."""
    with patch.object(backend.db.client, 'table') as mock_table:
        mock_table.side_effect = Exception("DB connection failed")

        response = client.get("/events")
        assert response.status_code == 503
        assert "Unable to load events" in response.json()["detail"]


def test_NFR01_event_list_performance():
    """GET /events responds within 2000ms (NFR-01).

    Note: This test uses a mocked database, so it only validates FastAPI
    overhead — not real Supabase query latency. Full NFR-01 validation
    requires an end-to-end test against the live database.
    """
    import time

    mock_response = MagicMock()
    mock_response.data = [
        {"id": i, "title": f"Event {i}", "description": f"Desc {i}", "location": "Hall",
         "start_time": "2026-04-01T10:00:00+00:00", "capacity": 100, "attendee_count": i,
         "status": "Published", "organizer": "Org"}
        for i in range(20)
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        start = time.time()
        response = client.get("/events")
        elapsed = time.time() - start

        assert response.status_code == 200
        assert elapsed < 2.0, f"GET /events took {elapsed:.3f}s, exceeds 2s NFR-01 limit"


# --- FR-02: Location/Radius Filter Tests ---

def test_FR02_location_filter_returns_nearby_events():
    """GET /events?lat=...&lng=...&radius_m=... returns only events within radius."""
    # Bath campus center: 51.3758, -2.3599
    # Event A: ~100m away (very close)
    # Event B: ~5000m away (far)
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Nearby Event", "description": "Close",
         "location": "Student Union", "start_time": "2026-04-01T10:00:00+00:00",
         "capacity": 100, "attendee_count": 10, "status": "Published",
         "organizer": "Org", "latitude": 51.3760, "longitude": -2.3601},
        {"id": 2, "title": "Far Event", "description": "Far away",
         "location": "Remote Building", "start_time": "2026-04-02T10:00:00+00:00",
         "capacity": 50, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": 51.4200, "longitude": -2.3000},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events", params={"lat": 51.3758, "lng": -2.3599, "radius_m": 500})
        assert response.status_code == 200
        body = response.json()
        # Only the nearby event should be returned (within 500m)
        assert len(body) == 1
        assert body[0]["title"] == "Nearby Event"


def test_FR02_location_filter_without_radius_returns_all():
    """GET /events without radius params returns all events (no filter)."""
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Event A", "description": "Test",
         "location": "Hall A", "start_time": "2026-04-01T10:00:00+00:00",
         "capacity": 100, "attendee_count": 10, "status": "Published",
         "organizer": "Org", "latitude": 51.3760, "longitude": -2.3601},
        {"id": 2, "title": "Event B", "description": "Test",
         "location": "Hall B", "start_time": "2026-04-02T10:00:00+00:00",
         "capacity": 50, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": 51.4200, "longitude": -2.3000},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events")
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 2


def test_FR02_location_filter_excludes_events_without_coordinates():
    """Events without lat/lng are excluded when radius filter is active."""
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Has Coords", "description": "Test",
         "location": "Hall", "start_time": "2026-04-01T10:00:00+00:00",
         "capacity": 100, "attendee_count": 10, "status": "Published",
         "organizer": "Org", "latitude": 51.3760, "longitude": -2.3601},
        {"id": 2, "title": "No Coords", "description": "Test",
         "location": "Unknown", "start_time": "2026-04-02T10:00:00+00:00",
         "capacity": 50, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events", params={"lat": 51.3758, "lng": -2.3599, "radius_m": 500})
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["title"] == "Has Coords"


def test_FR02_location_filter_invalid_lat_returns_422():
    """Invalid latitude (>90) returns 422 validation error."""
    response = client.get("/events", params={"lat": 999, "lng": -2.3599, "radius_m": 500})
    assert response.status_code == 422


def test_FR02_location_filter_negative_radius_returns_422():
    """Negative radius returns 422 validation error."""
    response = client.get("/events", params={"lat": 51.3758, "lng": -2.3599, "radius_m": -1})
    assert response.status_code == 422


# --- FR-03: Time Filter Tests ---

def test_FR03_time_filter_2hr():
    """GET /events?time_filter=2hr returns only events starting within the next 2 hours."""
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    soon = (now + timedelta(hours=1)).isoformat()       # within 2hr
    later = (now + timedelta(hours=5)).isoformat()       # outside 2hr

    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Soon Event", "description": "Test",
         "location": "Hall A", "start_time": soon,
         "capacity": 100, "attendee_count": 10, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
        {"id": 2, "title": "Later Event", "description": "Test",
         "location": "Hall B", "start_time": later,
         "capacity": 50, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events", params={"time_filter": "2hr"})
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["title"] == "Soon Event"


def test_FR03_time_filter_today():
    """GET /events?time_filter=today returns only events happening today."""
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    # Event starting in 1 hour (today)
    today_event_time = (now + timedelta(hours=1)).isoformat()
    # Event starting in 3 days (not today)
    future_event_time = (now + timedelta(days=3)).isoformat()

    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Today Event", "description": "Test",
         "location": "Hall A", "start_time": today_event_time,
         "capacity": 100, "attendee_count": 10, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
        {"id": 2, "title": "Future Event", "description": "Test",
         "location": "Hall B", "start_time": future_event_time,
         "capacity": 50, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events", params={"time_filter": "today"})
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["title"] == "Today Event"


def test_FR03_time_filter_week():
    """GET /events?time_filter=week returns events within the next 7 days."""
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    this_week = (now + timedelta(days=3)).isoformat()
    next_month = (now + timedelta(days=30)).isoformat()

    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "This Week Event", "description": "Test",
         "location": "Hall A", "start_time": this_week,
         "capacity": 100, "attendee_count": 10, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
        {"id": 2, "title": "Next Month Event", "description": "Test",
         "location": "Hall B", "start_time": next_month,
         "capacity": 50, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events", params={"time_filter": "week"})
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["title"] == "This Week Event"


def test_FR03_time_filter_no_filter_returns_all():
    """GET /events without time_filter returns all future events."""
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Event A", "description": "Test",
         "location": "Hall A", "start_time": (now + timedelta(hours=1)).isoformat(),
         "capacity": 100, "attendee_count": 10, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
        {"id": 2, "title": "Event B", "description": "Test",
         "location": "Hall B", "start_time": (now + timedelta(days=30)).isoformat(),
         "capacity": 50, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events")
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 2


def test_FR03_time_filter_combined_with_radius():
    """GET /events?time_filter=2hr&lat=...&lng=...&radius_m=... applies BOTH filters."""
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    soon = (now + timedelta(hours=1)).isoformat()

    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Nearby Soon", "description": "Test",
         "location": "Hall A", "start_time": soon,
         "capacity": 100, "attendee_count": 10, "status": "Published",
         "organizer": "Org", "latitude": 51.3760, "longitude": -2.3601},
        {"id": 2, "title": "Far Soon", "description": "Test",
         "location": "Hall B", "start_time": soon,
         "capacity": 50, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": 51.4200, "longitude": -2.3000},
        {"id": 3, "title": "Nearby Later", "description": "Test",
         "location": "Hall C", "start_time": (now + timedelta(hours=5)).isoformat(),
         "capacity": 50, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": 51.3760, "longitude": -2.3601},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events", params={
            "time_filter": "2hr",
            "lat": 51.3758, "lng": -2.3599, "radius_m": 500
        })
        assert response.status_code == 200
        body = response.json()
        # Only "Nearby Soon" should pass both filters
        assert len(body) == 1
        assert body[0]["title"] == "Nearby Soon"


def test_FR03_time_filter_invalid_value_returns_422():
    """GET /events?time_filter=invalid returns 422 validation error."""
    response = client.get("/events", params={"time_filter": "invalid"})
    assert response.status_code == 422


# --- FR-07: Keyword Search Tests ---

def test_FR07_keyword_search():
    """GET /events?search=coffee returns events with 'coffee' in title or description (AC-1)."""
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Coffee Morning", "description": "Free coffee for students",
         "location": "Cafe", "start_time": "2026-04-01T10:00:00+00:00",
         "capacity": 30, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
        {"id": 2, "title": "Hackathon", "description": "Build cool stuff",
         "location": "Lab", "start_time": "2026-04-02T10:00:00+00:00",
         "capacity": 100, "attendee_count": 20, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events", params={"search": "coffee"})
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["title"] == "Coffee Morning"


def test_FR07_keyword_search_description():
    """GET /events?search=cool returns events with 'cool' in description (AC-1)."""
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Coffee Morning", "description": "Free coffee for students",
         "location": "Cafe", "start_time": "2026-04-01T10:00:00+00:00",
         "capacity": 30, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
        {"id": 2, "title": "Hackathon", "description": "Build cool stuff",
         "location": "Lab", "start_time": "2026-04-02T10:00:00+00:00",
         "capacity": 100, "attendee_count": 20, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events", params={"search": "cool"})
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["title"] == "Hackathon"


def test_FR07_keyword_search_case_insensitive():
    """GET /events?search=COFFEE matches case-insensitively in title and description (AC-1)."""
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Coffee Morning", "description": "Free coffee",
         "location": "Cafe", "start_time": "2026-04-01T10:00:00+00:00",
         "capacity": 30, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
        {"id": 2, "title": "SPORTS DAY", "description": "COMPETITIVE GAMES",
         "location": "Field", "start_time": "2026-04-02T10:00:00+00:00",
         "capacity": 200, "attendee_count": 50, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        # Uppercase search matches mixed-case title
        response = client.get("/events", params={"search": "COFFEE"})
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["title"] == "Coffee Morning"

        # Lowercase search matches uppercase title
        response = client.get("/events", params={"search": "sports"})
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["title"] == "SPORTS DAY"

        # Lowercase search matches uppercase description
        response = client.get("/events", params={"search": "competitive"})
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["title"] == "SPORTS DAY"


def test_FR07_keyword_search_no_results():
    """GET /events?search=xyz returns empty list when no matches (AC-2)."""
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Coffee Morning", "description": "Free coffee",
         "location": "Cafe", "start_time": "2026-04-01T10:00:00+00:00",
         "capacity": 30, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events", params={"search": "xyz"})
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 0


def test_FR07_keyword_search_cleared_returns_all():
    """GET /events without search param returns all events (AC-3)."""
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Event A", "description": "Desc A",
         "location": "Hall", "start_time": "2026-04-01T10:00:00+00:00",
         "capacity": 100, "attendee_count": 10, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
        {"id": 2, "title": "Event B", "description": "Desc B",
         "location": "Lab", "start_time": "2026-04-02T10:00:00+00:00",
         "capacity": 50, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": None, "longitude": None},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events")
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 2


def test_FR07_keyword_search_combined_with_filters():
    """GET /events?search=coffee&time_filter=2hr&lat=...&lng=...&radius_m=... applies all filters (AC-1,2,3)."""
    from datetime import timedelta

    now = datetime.now(timezone.utc)
    soon = (now + timedelta(hours=1)).isoformat()

    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Coffee Nearby Soon", "description": "Great coffee",
         "location": "Cafe", "start_time": soon,
         "capacity": 30, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": 51.3760, "longitude": -2.3601},
        {"id": 2, "title": "Coffee Far", "description": "Also coffee",
         "location": "Remote", "start_time": soon,
         "capacity": 30, "attendee_count": 5, "status": "Published",
         "organizer": "Org", "latitude": 51.4200, "longitude": -2.3000},
        {"id": 3, "title": "Hackathon Nearby", "description": "Coding event",
         "location": "Lab", "start_time": soon,
         "capacity": 100, "attendee_count": 20, "status": "Published",
         "organizer": "Org", "latitude": 51.3760, "longitude": -2.3601},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events", params={
            "search": "coffee",
            "time_filter": "2hr",
            "lat": 51.3758, "lng": -2.3599, "radius_m": 500
        })
        assert response.status_code == 200
        body = response.json()
        # Only "Coffee Nearby Soon" passes all three filters
        assert len(body) == 1
        assert body[0]["title"] == "Coffee Nearby Soon"


def test_FR02_location_filter_partial_params_ignored():
    """If only lat is provided (no lng/radius_m), filter is not applied — all events returned."""
    mock_response = MagicMock()
    mock_response.data = [
        {"id": 1, "title": "Event A", "description": "Test",
         "location": "Hall A", "start_time": "2026-04-01T10:00:00+00:00",
         "capacity": 100, "attendee_count": 10, "status": "Published",
         "organizer": "Org", "latitude": 51.3760, "longitude": -2.3601},
    ]

    with patch.object(backend.db.client, 'table') as mock_table:
        chain = mock_table.return_value.select.return_value
        chain.eq.return_value.gte.return_value.order.return_value.execute.return_value = mock_response

        response = client.get("/events", params={"lat": 51.3758})
        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1  # All events returned (no filtering)

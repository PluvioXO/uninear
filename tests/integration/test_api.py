import os
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
        mock_table.return_value.select.return_value.execute.return_value = MagicMock(data=[])
        response = client.get("/events")
        assert response.status_code == 200

    # GET / (root) should work without token
    response = client.get("/")
    assert response.status_code == 200

import os
import pytest
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

    payload = {
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

    payload = {"title": "Updated Title"}

    with patch.object(backend.db.client, 'table') as mock_table:
        mock_table.return_value.update.return_value.eq.return_value.execute.return_value = mock_response

        response = client.patch("/events/1", json=payload)
        
        assert response.status_code == 200
        assert response.json()[0]["title"] == "Updated Title"

# 6. Test Signup
def test_signup():
    mock_response = MagicMock()
    # Mocking what Supabase Auth response looks like roughly
    mock_response.user.id = "user-123"
    mock_response.user.email = "test@bath.ac.uk"
    
    payload = {
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

# 7. Test Login
def test_login():
    mock_response = MagicMock()
    mock_response.session.access_token = "fake-token"
    
    payload = {
        "email": "test@example.com",
        "password": "strongpassword"
    }

    with patch.object(backend.db.client, 'auth') as mock_auth:
        mock_auth.sign_in_with_password.return_value = mock_response

        response = client.post("/auth/login", json=payload)
        
        assert response.status_code == 200

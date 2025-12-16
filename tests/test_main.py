import os
import pytest
from unittest.mock import MagicMock, patch

# Set dummy env vars BEFORE importing src.main to avoid Database init error
os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_KEY"] = "dummy-key"

from fastapi.testclient import TestClient
from pydantic import ValidationError
from datetime import datetime
from src.main import app, EventCreateSchema, EventUpdateSchema, backend

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

# --- DATA MODEL TESTS ---

def test_event_create_schema_valid():
    """Test that EventCreateSchema accepts valid data and sets defaults."""
    data = {
        "title": "Test Event",
        "date": "2025-10-15T09:00:00",
        "location": "Test Location",
        "capacity": 100,
        "price": 10.0
    }
    event = EventCreateSchema(**data)
    assert event.title == "Test Event"
    assert event.capacity == 100
    assert event.status == "Draft"  # Check default value
    assert isinstance(event.date, datetime)

def test_event_create_schema_missing_required():
    """Test that EventCreateSchema raises error when required fields are missing."""
    data = {
        "title": "Test Event"
        # Missing date, location, capacity, price
    }
    with pytest.raises(ValidationError) as excinfo:
        EventCreateSchema(**data)
    
    errors = excinfo.value.errors()
    missing_fields = [err['loc'][0] for err in errors]
    assert "date" in missing_fields
    assert "location" in missing_fields
    assert "capacity" in missing_fields
    assert "price" in missing_fields

def test_event_create_schema_invalid_types():
    """Test that EventCreateSchema raises error for invalid data types."""
    data = {
        "title": "Test Event",
        "date": "not-a-date",
        "location": "Test Location",
        "capacity": "not-a-number",
        "price": 10.0
    }
    with pytest.raises(ValidationError):
        EventCreateSchema(**data)

def test_event_update_schema_partial():
    """Test that EventUpdateSchema accepts partial data."""
    data = {
        "title": "Updated Title"
    }
    event = EventUpdateSchema(**data)
    assert event.title == "Updated Title"
    assert event.location is None
    assert event.capacity is None

def test_event_update_schema_empty():
    """Test that EventUpdateSchema accepts empty data (all optional)."""
    event = EventUpdateSchema()
    assert event.title is None


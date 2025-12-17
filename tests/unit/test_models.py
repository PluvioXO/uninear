import pytest
from pydantic import ValidationError
from datetime import datetime
from src.models import EventCreateSchema, EventUpdateSchema

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

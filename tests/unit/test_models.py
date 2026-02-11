import pytest
from pydantic import ValidationError
from datetime import datetime
from src.models import EventCreateSchema, EventUpdateSchema, UserSignupSchema, UserLoginSchema

# --- DATA MODEL TESTS ---

def test_event_create_schema_valid():
    """Test that EventCreateSchema accepts valid data and sets defaults."""
    data = {
        "title": "Test Event",
        "date": "2025-10-15T09:00:00",
        "location": "Test Location",
        "capacity": 100,
        "organizer": "Test Organizer"
    }
    event = EventCreateSchema(**data)
    assert event.title == "Test Event"
    assert event.capacity == 100
    assert event.status == "Draft"  # Check default value
    assert isinstance(event.date, datetime)
    assert event.organizer == "Test Organizer"

def test_event_create_schema_missing_required():
    """Test that EventCreateSchema raises error when required fields are missing."""
    data = {
        "title": "Test Event"
        # Missing date, location, capacity, organizer
    }
    with pytest.raises(ValidationError) as excinfo:
        EventCreateSchema(**data)
    
    errors = excinfo.value.errors()
    missing_fields = [err['loc'][0] for err in errors]
    assert "date" in missing_fields
    assert "location" in missing_fields
    assert "capacity" in missing_fields
    assert "organizer" in missing_fields 

def test_event_create_schema_invalid_types():
    """Test that EventCreateSchema raises error for invalid data types."""
    data = {
        "title": "Test Event",
        "date": "not-a-date",
        "location": "Test Location",
        "capacity": "not-a-number",
        "organizer": "Test Organizer"
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

# --- USER MODEL TESTS ---

def test_user_signup_schema_valid():
    """Test that UserSignupSchema accepts valid data."""
    data = {
        "email": "test@bath.ac.uk",
        "password": "secretpassword",
        "full_name": "Test User"
    }
    user = UserSignupSchema(**data)
    assert user.email == "test@bath.ac.uk"
    assert user.password == "secretpassword"
    assert user.full_name == "Test User"

def test_user_signup_schema_accepts_bath_email():
    """Test that UserSignupSchema accepts @bath.ac.uk emails."""
    data = {
        "email": "member@bath.ac.uk",
        "password": "secretpassword",
        "full_name": "Bath Member"
    }
    user = UserSignupSchema(**data)
    assert user.email == "member@bath.ac.uk"

def test_user_signup_schema_rejects_non_bath_email():
    """Test that UserSignupSchema rejects non-bath emails."""
    data = {
        "email": "test@example.com",
        "password": "secretpassword",
        "full_name": "Test User"
    }
    with pytest.raises(ValidationError):
        UserSignupSchema(**data)

def test_user_login_schema_valid():
    """Test that UserLoginSchema accepts valid data."""
    data = {
        "email": "test@example.com",
        "password": "secretpassword"
    }
    user = UserLoginSchema(**data)
    assert user.email == "test@example.com"
    assert user.password == "secretpassword"

def test_user_signup_schema_missing_required():
    """Test that UserSignupSchema raises error when required fields are missing."""
    data = {
        "email": "test@example.com"
        # Missing password
    }
    with pytest.raises(ValidationError) as excinfo:
        UserSignupSchema(**data)
    
    errors = excinfo.value.errors()
    missing_fields = [err['loc'][0] for err in errors]
    assert "password" in missing_fields

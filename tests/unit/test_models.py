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
        # Missing date, location, capacity
    }
    with pytest.raises(ValidationError) as excinfo:
        EventCreateSchema(**data)

    errors = excinfo.value.errors()
    missing_fields = [err['loc'][0] for err in errors]
    assert "date" in missing_fields
    assert "location" in missing_fields
    assert "capacity" in missing_fields

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

# --- NFR-07: Bath Email Validation ---

class TestNFR07BathEmailValidation:
    """Comprehensive Bath email validation tests per Story 1.1 AC 1, 2."""

    def test_NFR07_valid_bath_email(self):
        user = UserSignupSchema(email="ab1234@bath.ac.uk", password="pass1234")
        assert user.email == "ab1234@bath.ac.uk"

    def test_NFR07_valid_bath_email_case_insensitive(self):
        user = UserSignupSchema(email="AB1234@Bath.AC.UK", password="pass1234")
        assert user.email.lower().endswith("@bath.ac.uk")

    def test_NFR07_rejects_non_bath_email_with_message(self):
        with pytest.raises(ValidationError) as excinfo:
            UserSignupSchema(email="user@gmail.com", password="pass123")
        assert "Only @bath.ac.uk emails are allowed" in str(excinfo.value)

    def test_NFR07_rejects_empty_email(self):
        with pytest.raises(ValidationError):
            UserSignupSchema(email="", password="pass123")

    def test_NFR07_rejects_malformed_email(self):
        with pytest.raises(ValidationError):
            UserSignupSchema(email="notanemail", password="pass123")

def test_user_login_schema_valid():
    """Test that UserLoginSchema accepts valid bath email and normalizes to lowercase."""
    data = {
        "email": "Test@Bath.ac.uk",
        "password": "secretpassword"
    }
    user = UserLoginSchema(**data)
    assert user.email == "test@bath.ac.uk"
    assert user.password == "secretpassword"

def test_user_login_schema_rejects_non_bath_email():
    """Test that UserLoginSchema rejects non-bath emails."""
    data = {
        "email": "test@gmail.com",
        "password": "secretpassword"
    }
    with pytest.raises(ValidationError):
        UserLoginSchema(**data)

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

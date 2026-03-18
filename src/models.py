from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime

class EventCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime  # Frontend sends 'date'
    end_date: Optional[datetime] = None
    location: str
    capacity: int = 0
    status: str = "Draft"
    organizer: Optional[str] = None
    
    # Legacy/Optional fields
    end_time: Optional[datetime] = None
    mood_tags: List[str] = Field(default_factory=list)
    energy_level: Optional[str] = None
    organiser_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class EventUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    organizer: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: Optional[str]) -> Optional[str]:
        if value is not None and value not in ("Draft", "Published"):
            raise ValueError("Status must be 'Draft' or 'Published'")
        return value

class UserSignupSchema(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password_length(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        return value

    @field_validator("email")
    @classmethod
    def validate_bath_email(cls, value: str) -> str:
        if not value.lower().endswith("@bath.ac.uk"):
            raise ValueError("Only @bath.ac.uk emails are allowed")
        return value.lower()

class UserLoginSchema(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_and_normalize_email(cls, value: str) -> str:
        if not value.lower().endswith("@bath.ac.uk"):
            raise ValueError("Only @bath.ac.uk emails are allowed")
        return value.lower()

class UserForgotPasswordSchema(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_and_normalize_email(cls, value: str) -> str:
        if not value.lower().endswith("@bath.ac.uk"):
            raise ValueError("Only @bath.ac.uk emails are allowed")
        return value.lower()

class EventResponseSchema(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    location: str
    start_time: datetime
    end_time: Optional[datetime] = None
    capacity: int
    attendee_count: int
    status: str = "Published"
    organizer: Optional[str] = None
    mood_tags: List[str] = Field(default_factory=list)
    energy_level: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class EventAttendanceSchema(BaseModel):
    event_id: int
    user_id: str

class EventAttendanceResponseSchema(BaseModel):
    id: int
    event_id: int
    user_id: str
    created_at: datetime


class UserProfileUpdateSchema(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    interests: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    society_name: Optional[str] = None
    society_description: Optional[str] = None
    contact_email: Optional[str] = None
    website: Optional[str] = None
    notification_prefs: Optional[dict] = None

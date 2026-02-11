from pydantic import BaseModel, field_validator
from typing import List, Optional
from datetime import datetime

class EventCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime  # Frontend sends 'date'
    location: str
    capacity: int
    status: str = "Draft"
    organizer: str
    
    # Legacy/Optional fields
    end_time: Optional[datetime] = None
    mood_tags: List[str] = []
    energy_level: Optional[str] = None
    organiser_id: Optional[str] = None

class EventUpdateSchema(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    capacity: Optional[int] = None
    status: Optional[str] = None
    organizer: Optional[str] = None

class UserSignupSchema(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_bath_email(cls, value: str) -> str:
        if not value.lower().endswith("@bath.ac.uk"):
            raise ValueError("Only @bath.ac.uk emails are allowed")
        return value

class UserLoginSchema(BaseModel):
    email: str
    password: str

class EventAttendanceSchema(BaseModel):
    event_id: int
    user_id: Optional[str] = None

class EventAttendanceResponseSchema(BaseModel):
    id: int
    event_id: int
    user_id: str
    created_at: datetime

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EventCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime  # Frontend sends 'date'
    location: str
    capacity: int
    price: float
    status: str = "Draft"
    
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
    price: Optional[float] = None
    status: Optional[str] = None

class UserSignupSchema(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class UserLoginSchema(BaseModel):
    email: str
    password: str

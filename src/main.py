from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Import the database connection
from src.database import supabase

app = FastAPI()

# --- CORS (Security) ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- MODELS ---
class EventCreateSchema(BaseModel):
    title: str
    description: Optional[str] = None
    location_id: str
    start_time: datetime
    end_time: datetime
    mood_tags: List[str] = []
    energy_level: str
    organiser_id: Optional[str] = None


# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "UniNear API is Live 🚀"}


@app.get("/events")
def get_events():
    # Fetch events AND their related location data
    response = supabase.table("events").select("*, locations(*)").execute()
    return response.data


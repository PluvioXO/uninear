from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

# Import the database connection
from src.database import Database

# --- MODELS ---
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

class UniNearBackend:
    def __init__(self):
        self.app = FastAPI()
        self.db = Database()
        self.setup_middleware()
        self.setup_routes()

    def setup_middleware(self):
        origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def setup_routes(self):
        self.app.get("/")(self.read_root)
        self.app.get("/events")(self.get_events)
        self.app.post("/events")(self.create_event)
        self.app.delete("/events/{event_id}")(self.delete_event)
        self.app.patch("/events/{event_id}")(self.update_event)

    def read_root(self):
        return {"status": "UniNear API is Live 🚀"}

    def get_events(self):
        try:
            response = self.db.client.table("events").select("*").execute()
            return response.data
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    def create_event(self, event: EventCreateSchema):
        try:
            event_data = event.model_dump(exclude_none=True)
            if 'date' in event_data:
                event_data['start_time'] = event_data.pop('date').isoformat()
            
            response = self.db.client.table("events").insert(event_data).execute()
            return response.data[0]
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def delete_event(self, event_id: str):
        try:
            response = self.db.client.table("events").delete().eq("id", event_id).execute()
            return {"message": "Event deleted successfully"}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def update_event(self, event_id: str, event: EventUpdateSchema):
        try:
            event_data = event.model_dump(exclude_unset=True)
            if 'date' in event_data and event_data['date']:
                 event_data['start_time'] = event_data.pop('date').isoformat()

            response = self.db.client.table("events").update(event_data).eq("id", event_id).execute()
            return response.data
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

# Create the app instance for uvicorn to pick up
backend = UniNearBackend()
app = backend.app


from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# Import the database connection
from src.database import Database

# --- MODELS ---
from src.models import EventCreateSchema, EventUpdateSchema, UserSignupSchema, UserLoginSchema

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
            "http://localhost:8081",
            "http://127.0.0.1:8081",
            "*" # Allow all for development to rule out CORS issues
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
        
        # Auth Routes
        self.app.post("/auth/signup")(self.signup)
        self.app.post("/auth/login")(self.login)

        # Event Routes
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
            print(f"Database error: {e}. Returning mock data.")
            return [
                {
                    "id": 1,
                    "title": "Annual Tech Hackathon (Mock)",
                    "date": "2025-10-15T09:00:00",
                    "location": "Engineering Hub",
                    "capacity": 200,
                    "status": "Published",
                    "latitude": 51.3758,
                    "longitude": -2.3599,
                    "moods": ["focused", "energetic"],
                    "energy_level": "high",
                    "friends_attending": ["Alice", "Bob", "Charlie"],
                    "rating": 4.8,
                    "organizer": "Tech Society"
                },
                {
                    "id": 2,
                    "title": "Industry Panel Night (Mock)",
                    "date": "2025-10-22T18:30:00",
                    "location": "Main Auditorium",
                    "capacity": 150,
                    "status": "Draft",
                    "latitude": 51.3800,
                    "longitude": -2.3600,
                    "moods": ["social", "relaxed"],
                    "energy_level": "medium",
                    "friends_attending": [],
                    "rating": 4.2,
                    "organizer": "Business School"
                },
                {
                    "id": 3,
                    "title": "Yoga & Mindfulness",
                    "date": "2025-10-16T08:00:00",
                    "location": "Student Center",
                    "capacity": 30,
                    "status": "Published",
                    "latitude": 51.3700,
                    "longitude": -2.3550,
                    "moods": ["relaxed", "focused"],
                    "energy_level": "low",
                    "friends_attending": ["Alice"],
                    "rating": 4.9,
                    "organizer": "Wellness Club"
                },
                {
                    "id": 4,
                    "title": "Friday Night Social",
                    "date": "2025-10-17T20:00:00",
                    "location": "Student Bar",
                    "capacity": 100,
                    "status": "Published",
                    "latitude": 51.3750,
                    "longitude": -2.3650,
                    "moods": ["social", "energetic"],
                    "energy_level": "high",
                    "friends_attending": ["Bob", "David", "Eve"],
                    "rating": 4.5,
                    "organizer": "Student Union"
                }
            ]

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

    def signup(self, user: UserSignupSchema):
        try:
            response = self.db.client.auth.sign_up({
                "email": user.email,
                "password": user.password,
                "options": {
                    "data": {
                        "full_name": user.full_name
                    }
                }
            })
            return response
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def login(self, user: UserLoginSchema):
        try:
            response = self.db.client.auth.sign_in_with_password({
                "email": user.email,
                "password": user.password
            })
            return response
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

# Create the app instance for uvicorn to pick up
backend = UniNearBackend()
app = backend.app


from fastapi import FastAPI, HTTPException, Response
from typing import Any, Dict, cast
from fastapi.middleware.cors import CORSMiddleware

# Import the database connection
from src.database import Database

# --- MODELS ---
from src.models import EventCreateSchema, EventUpdateSchema, UserSignupSchema, UserLoginSchema, EventAttendanceSchema

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
        self.app.post("/events/{event_id}/rsvp")(self.create_rsvp)
        self.app.delete("/events/{event_id}/rsvp")(self.cancel_rsvp)

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
            self.db.client.table("events").delete().eq("id", event_id).execute()
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

    def create_rsvp(self, event_id: int, attendance: EventAttendanceSchema) -> Dict[str, Any]:
        try:
            if attendance.event_id != event_id:
                raise HTTPException(status_code=400, detail="Event ID mismatch")

            payload: Dict[str, Any] = {"event_id": event_id, "user_id": attendance.user_id}
            response = self.db.client.table("event_attendance").insert(payload).execute()

            event_response = (
                self.db.client
                .table("events")
                .select("attendee_count")
                .eq("id", event_id)
                .single()
                .execute()
            )
            event_data: Dict[str, Any] = event_response.data if isinstance(event_response.data, dict) else {}
            current_count = int(event_data.get("attendee_count") or 0)
            updated_count = current_count + 1

            self.db.client.table("events").update({"attendee_count": updated_count}).eq("id", event_id).execute()

            response_data = cast(list[Dict[str, Any]], response.data) if response.data else []
            return response_data[0] if response_data else {"event_id": event_id, "user_id": attendance.user_id}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def cancel_rsvp(self, event_id: int, attendance: EventAttendanceSchema):
        try:
            if attendance.event_id != event_id:
                raise HTTPException(status_code=400, detail="Event ID mismatch")

            delete_query = self.db.client.table("event_attendance").delete().eq("event_id", event_id)
            if attendance.user_id:
                delete_query = delete_query.eq("user_id", attendance.user_id)
            delete_response = delete_query.execute()

            if not delete_response.data:
                raise HTTPException(status_code=404, detail="RSVP not found")

            event_response = (
                self.db.client
                .table("events")
                .select("attendee_count")
                .eq("id", event_id)
                .single()
                .execute()
            )
            event_data: Dict[str, Any] = event_response.data if isinstance(event_response.data, dict) else {}
            current_count = int(event_data.get("attendee_count") or 0)
            updated_count = max(current_count - 1, 0)

            self.db.client.table("events").update({"attendee_count": updated_count}).eq("id", event_id).execute()

            return Response(status_code=204)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def signup(self, user: UserSignupSchema):
        try:
            if not user.email.lower().endswith("@bath.ac.uk"):
                raise HTTPException(status_code=400, detail="Only @bath.ac.uk emails are allowed")

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


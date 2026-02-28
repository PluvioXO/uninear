from fastapi import FastAPI, HTTPException, Response, Query, Depends, Request
from fastapi.responses import JSONResponse
from typing import Any, Dict, cast
from fastapi.middleware.cors import CORSMiddleware

# Import the database connection
from src.database import Database

# --- MODELS ---
from src.models import EventCreateSchema, EventUpdateSchema, UserSignupSchema, UserLoginSchema, EventAttendanceSchema


# --- AUTH DEPENDENCY ---
_db_instance: "Database | None" = None

def _get_db() -> "Database":
    if _db_instance is None:
        raise RuntimeError("Database not initialised")
    return _db_instance

def verify_token(request: Request, db: Database = Depends(_get_db)) -> Dict[str, Any]:
    """FastAPI dependency that verifies JWT from Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization required")

    token = auth_header.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Authorization required")

    try:
        user_response = db.client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_response.user.id, "email": user_response.user.email}
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e).lower()
        if "expired" in error_msg:
            raise HTTPException(status_code=401, detail="Token expired")
        raise HTTPException(status_code=401, detail="Invalid token")

class UniNearBackend:
    def __init__(self):
        self.app = FastAPI()
        self.db = Database()
        global _db_instance
        _db_instance = self.db
        self.setup_middleware()
        self.setup_routes()

    def setup_middleware(self):
        origins = [
            "https://uninear-gvjz.vercel.app",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8081",
            "http://127.0.0.1:8081",
        ]
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def setup_routes(self):
        # Public endpoints (no auth required)
        self.app.get("/")(self.read_root)
        self.app.post("/auth/signup")(self.signup)
        self.app.post("/auth/login")(self.login)
        self.app.get("/events")(self.get_events)

        # Protected endpoints (require valid JWT)
        auth = [Depends(verify_token)]
        self.app.post("/events", dependencies=auth)(self.create_event)
        self.app.delete("/events/{event_id}", dependencies=auth)(self.delete_event)
        self.app.patch("/events/{event_id}", dependencies=auth)(self.update_event)
        self.app.post("/api/rsvp", status_code=201, dependencies=auth)(self.create_rsvp)
        self.app.delete("/events/{event_id}/rsvp", dependencies=auth)(self.cancel_rsvp)
        self.app.get("/api/rsvp", dependencies=auth)(self.get_rsvps)
        self.app.get("/api/events/{event_id}/rsvps", dependencies=auth)(self.get_event_rsvps)

    def read_root(self):
        return {"status": "UniNear API is Live 🚀"}

    def get_events(self) -> list[Dict[str, Any]]:
        try:
            response = self.db.client.table("events").select("*").execute()
            return cast(list[Dict[str, Any]], response.data or [])
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

    def create_event(self, event: EventCreateSchema, user: Dict[str, Any] = Depends(verify_token)):
        try:
            event_data = event.model_dump(exclude_none=True)
            if 'date' in event_data:
                event_data['start_time'] = event_data.pop('date').isoformat()
            event_data['organiser_id'] = user['user_id']

            # Use admin client to bypass RLS insert policy (the anon-key client
            # cannot insert into events because the RLS policy restricts inserts
            # to the service_role). Auth is still enforced via the JWT dependency.
            db = self.db.admin or self.db.client
            response = db.table("events").insert(event_data).execute()
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

    def create_rsvp(self, attendance: EventAttendanceSchema) -> JSONResponse:
        event_id = attendance.event_id
        try:
            # SCRUM-348: Check for duplicate RSVP
            existing = (
                self.db.client
                .table("event_attendance")
                .select("id")
                .eq("event_id", event_id)
                .eq("user_id", attendance.user_id)
                .execute()
            )
            if existing.data:
                raise HTTPException(status_code=409, detail="Already RSVP'd")

            # SCRUM-349: Check capacity
            event_response = (
                self.db.client
                .table("events")
                .select("attendee_count, capacity")
                .eq("id", event_id)
                .single()
                .execute()
            )
            event_data: Dict[str, Any] = event_response.data if isinstance(event_response.data, dict) else {}
            current_count = int(event_data.get("attendee_count") or 0)
            capacity = int(event_data.get("capacity") or 0)

            if current_count >= capacity:
                raise HTTPException(status_code=400, detail="Event is full")

            payload: Dict[str, Any] = {"event_id": event_id, "user_id": attendance.user_id}
            response = self.db.client.table("event_attendance").insert(payload).execute()

            # Atomic increment via RPC (prevents race conditions)
            self.db.client.rpc("increment_attendee_count", {"p_event_id": event_id}).execute()

            response_data = cast(list[Dict[str, Any]], response.data) if response.data else []
            result = response_data[0] if response_data else {"event_id": event_id, "user_id": attendance.user_id}
            return JSONResponse(content=result, status_code=201)
        except HTTPException:
            raise
        except Exception as e:
            # Handle DB unique constraint as 409 fallback
            if "unique_rsvp" in str(e).lower() or "duplicate" in str(e).lower():
                raise HTTPException(status_code=409, detail="Already RSVP'd")
            raise HTTPException(status_code=400, detail=str(e))

    def cancel_rsvp(self, event_id: int, attendance: EventAttendanceSchema):
        try:
            if attendance.event_id != event_id:
                raise HTTPException(status_code=400, detail="Event ID mismatch")

            delete_response = (
                self.db.client
                .table("event_attendance")
                .delete()
                .eq("event_id", event_id)
                .eq("user_id", attendance.user_id)
                .execute()
            )

            if not delete_response.data:
                raise HTTPException(status_code=404, detail="RSVP not found")

            # Atomic decrement via RPC (prevents race conditions)
            self.db.client.rpc("decrement_attendee_count", {"p_event_id": event_id}).execute()

            return Response(status_code=204)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def get_rsvps(self, user_id: str = Query(..., min_length=1)) -> list[Dict[str, Any]]:
        try:
            attendance_response = (
                self.db.client
                .table("event_attendance")
                .select("id, event_id, user_id, created_at")
                .eq("user_id", user_id)
                .execute()
            )
            attendance_rows = cast(list[Dict[str, Any]], attendance_response.data or [])

            if not attendance_rows:
                return []

            event_ids = [row.get("event_id") for row in attendance_rows if row.get("event_id") is not None]
            events_response = (
                self.db.client
                .table("events")
                .select("*")
                .in_("id", event_ids)
                .execute()
            )
            events_rows = cast(list[Dict[str, Any]], events_response.data or [])
            events_by_id = {event.get("id"): event for event in events_rows}

            return [
                {
                    **row,
                    "event": events_by_id.get(row.get("event_id"))
                }
                for row in attendance_rows
            ]
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def get_event_rsvps(self, event_id: int) -> list[Dict[str, Any]]:
        """GET /api/events/{event_id}/rsvps — Return RSVPs for an organiser's event."""
        try:
            # Use admin client to bypass RLS (organiser-level query)
            db = self.db.admin or self.db.client
            attendance_response = (
                db
                .table("event_attendance")
                .select("user_id, created_at")
                .eq("event_id", event_id)
                .execute()
            )
            attendance_rows = cast(list[Dict[str, Any]], attendance_response.data or [])

            if not attendance_rows:
                return []

            # Fetch user details via admin client (service_role bypasses RLS on auth.users)
            results: list[Dict[str, Any]] = []
            for row in attendance_rows:
                user_info: Dict[str, Any] = {"user_id": row["user_id"], "name": None, "email": None}
                if self.db.admin:
                    try:
                        user = self.db.admin.auth.admin.get_user_by_id(row["user_id"])
                        if user and user.user:
                            user_info["email"] = user.user.email
                            user_info["name"] = (user.user.user_metadata or {}).get("full_name")
                    except Exception:
                        pass  # Graceful fallback if user lookup fails
                results.append({
                    **user_info,
                    "rsvp_time": row["created_at"],
                })

            return results
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

            # Detect duplicate user (Supabase returns user with empty identities when email confirmation is on)
            if (response.user
                    and hasattr(response.user, 'identities')
                    and response.user.identities is not None
                    and len(response.user.identities) == 0):
                raise HTTPException(status_code=409, detail="An account with this email already exists")

            if not response.user:
                raise HTTPException(status_code=500, detail="Signup failed: no user returned")

            return {"user": {"id": response.user.id, "email": response.user.email}}
        except HTTPException:
            raise
        except Exception as e:
            if "already registered" in str(e).lower():
                raise HTTPException(status_code=409, detail="An account with this email already exists")
            raise HTTPException(status_code=400, detail=str(e))

    def login(self, user: UserLoginSchema):
        try:
            response = self.db.client.auth.sign_in_with_password({
                "email": user.email,
                "password": user.password
            })
            return response
        except Exception as e:
            error_msg = str(e).lower()
            if "invalid login credentials" in error_msg or "invalid credentials" in error_msg or "user not found" in error_msg:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            raise HTTPException(status_code=400, detail=str(e))

# Create the app instance for uvicorn to pick up
backend = UniNearBackend()
app = backend.app


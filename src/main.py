import logging
import math
import os
from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import Any, Dict, Optional, cast

from fastapi import FastAPI, HTTPException, Response, Query, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Import the database connection
from src.database import Database

# --- MODELS ---
from src.models import EventCreateSchema, EventUpdateSchema, EventResponseSchema, UserSignupSchema, UserLoginSchema, UserForgotPasswordSchema, EventAttendanceSchema


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

def _haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Return the great-circle distance in metres between two points."""
    R = 6_371_000  # Earth radius in metres
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class TimeFilter(str, Enum):
    TWO_HOURS = "2hr"
    TODAY = "today"
    WEEK = "week"


class UniNearBackend:
    def __init__(self):
        self.app = FastAPI()
        self.db = Database()
        global _db_instance
        _db_instance = self.db
        self.setup_middleware()
        self.setup_routes()

    def setup_middleware(self):
        origins = self._get_allowed_origins()
        origin_regex = os.getenv("CORS_ALLOW_ORIGIN_REGEX")

        # Allows Vercel preview deployments by default while still keeping
        # explicit allow_origins for known production/local origins.
        if not origin_regex and os.getenv("ENABLE_VERCEL_PREVIEW_CORS", "true").lower() in {"1", "true", "yes"}:
            origin_regex = r"^https:\/\/.*\.vercel\.app$"

        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_origin_regex=origin_regex,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def _get_allowed_origins(self) -> list[str]:
        env_origins = os.getenv("CORS_ALLOW_ORIGINS")
        if env_origins:
            origins = [o.strip().rstrip("/") for o in env_origins.split(",") if o.strip()]
            if origins:
                return list(dict.fromkeys(origins))

        origins = [
            "https://uninear-gvjz.vercel.app",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8081",
            "http://127.0.0.1:8081",
        ]
        frontend_url = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
        if frontend_url:
            origins.append(frontend_url)

        return list(dict.fromkeys(origins))

    def setup_routes(self):
        # Public endpoints (no auth required)
        self.app.get("/")(self.read_root)
        self.app.post("/auth/signup")(self.signup)
        self.app.post("/auth/login")(self.login)
        self.app.post("/auth/forgot-password")(self.forgot_password)
        self.app.delete("/auth/account", dependencies=[Depends(verify_token)])(self.delete_account)
        self.app.get("/events", response_model=list[EventResponseSchema])(self.get_events)

        # Protected endpoints (require valid JWT)
        auth = [Depends(verify_token)]
        self.app.post("/events", dependencies=auth)(self.create_event)
        self.app.delete("/events/{event_id}", dependencies=auth)(self.delete_event)
        self.app.patch("/events/{event_id}", dependencies=auth)(self.update_event)
        self.app.post("/api/rsvp", status_code=201, dependencies=auth)(self.create_rsvp)
        self.app.delete("/events/{event_id}/rsvp", dependencies=auth)(self.cancel_rsvp)
        self.app.get("/api/rsvp", dependencies=auth)(self.get_rsvps)
        self.app.get("/api/events/{event_id}/rsvps", dependencies=auth)(self.get_event_rsvps)
        self.app.get("/api/organizer/events", dependencies=auth)(self.get_organizer_events)

    def read_root(self):
        return {"status": "UniNear API is Live 🚀"}

    def get_events(
        self,
        lat: Optional[float] = Query(None, ge=-90, le=90),
        lng: Optional[float] = Query(None, ge=-180, le=180),
        radius_m: Optional[float] = Query(None, gt=0),
        time_filter: Optional[TimeFilter] = Query(None),
        search: Optional[str] = Query(None),
    ) -> list[dict]:
        try:
            now = datetime.now(timezone.utc)
            response = (
                self.db.client
                .table("events")
                .select("id, title, description, location, start_time, capacity, attendee_count, status, organizer, latitude, longitude")
                .eq("status", "Published")
                .gte("start_time", now.isoformat())
                .order("start_time")
                .execute()
            )
            events = cast(list[Dict[str, Any]], response.data or [])

            # Apply keyword search filter when provided (post-fetch, consistent
            # with time/radius filters; Supabase ilike not used to keep pattern uniform)
            if search:
                term = search.lower()
                events = [
                    e for e in events
                    if term in (e.get("title") or "").lower()
                    or term in (e.get("description") or "").lower()
                ]

            # Apply time filter when provided
            if time_filter is not None:
                if time_filter == TimeFilter.TWO_HOURS:
                    cutoff = now + timedelta(hours=2)
                elif time_filter == TimeFilter.TODAY:
                    cutoff = now.replace(hour=23, minute=59, second=59, microsecond=999999)
                else:  # TimeFilter.WEEK
                    cutoff = now + timedelta(days=7)

                events = [
                    e for e in events
                    if e.get("start_time") is not None
                    and datetime.fromisoformat(e["start_time"].replace("Z", "+00:00")) <= cutoff
                ]

            # Apply radius filter when all three params are provided
            if lat is not None and lng is not None and radius_m is not None:
                events = [
                    e for e in events
                    if e.get("latitude") is not None
                    and e.get("longitude") is not None
                    and _haversine_distance(lat, lng, e["latitude"], e["longitude"]) <= radius_m
                ]

            return events
        except Exception as e:
            logging.error(f"Database error fetching events: {e}")
            raise HTTPException(status_code=503, detail="Unable to load events")

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

    def update_event(self, event_id: str, event: EventUpdateSchema, user: Dict[str, Any] = Depends(verify_token)):
        try:
            db = self.db.admin or self.db.client

            # Verify the authenticated user owns this event
            existing = db.table("events").select("organiser_id").eq("id", event_id).execute()
            if not existing.data:
                raise HTTPException(status_code=404, detail="Event not found")
            if existing.data[0].get("organiser_id") != user["user_id"]:
                raise HTTPException(status_code=403, detail="You can only update your own events")

            event_data = event.model_dump(exclude_unset=True)
            if 'date' in event_data and event_data['date']:
                 event_data['start_time'] = event_data.pop('date').isoformat()

            response = db.table("events").update(event_data).eq("id", event_id).execute()
            if not response.data:
                raise HTTPException(status_code=404, detail="Event not found")
            return response.data
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def create_rsvp(self, attendance: EventAttendanceSchema, user: Dict[str, Any] = Depends(verify_token)) -> JSONResponse:
        event_id = attendance.event_id
        try:
            if attendance.user_id != user["user_id"]:
                raise HTTPException(status_code=403, detail="Cannot RSVP for another user")
            db = self.db.admin or self.db.client

            # SCRUM-348: Check for duplicate RSVP
            existing = (
                db
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
                db
                .table("events")
                .select("attendee_count, capacity")
                .eq("id", event_id)
                .single()
                .execute()
            )
            event_data: Dict[str, Any] = event_response.data if isinstance(event_response.data, dict) else {}
            current_count = int(event_data.get("attendee_count") or 0)
            capacity = int(event_data.get("capacity") or 0)

            if capacity > 0 and current_count >= capacity:
                raise HTTPException(status_code=400, detail="Event is full")

            payload: Dict[str, Any] = {"event_id": event_id, "user_id": attendance.user_id}
            response = db.table("event_attendance").insert(payload).execute()

            # Atomic increment via RPC (prevents race conditions)
            db.rpc("increment_attendee_count", {"p_event_id": event_id}).execute()

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

    def cancel_rsvp(self, event_id: int, attendance: EventAttendanceSchema, user: Dict[str, Any] = Depends(verify_token)):
        try:
            if attendance.event_id != event_id:
                raise HTTPException(status_code=400, detail="Event ID mismatch")
            if attendance.user_id != user["user_id"]:
                raise HTTPException(status_code=403, detail="Cannot cancel RSVP for another user")
            db = self.db.admin or self.db.client

            delete_response = (
                db
                .table("event_attendance")
                .delete()
                .eq("event_id", event_id)
                .eq("user_id", attendance.user_id)
                .execute()
            )

            if not delete_response.data:
                raise HTTPException(status_code=404, detail="RSVP not found")

            # Atomic decrement via RPC (prevents race conditions)
            db.rpc("decrement_attendee_count", {"p_event_id": event_id}).execute()

            return Response(status_code=204)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def get_rsvps(self, user_id: str = Query(..., min_length=1), user: Dict[str, Any] = Depends(verify_token)) -> list[Dict[str, Any]]:
        try:
            if user_id != user["user_id"]:
                raise HTTPException(status_code=403, detail="Cannot view RSVPs for another user")
            db = self.db.admin or self.db.client
            attendance_response = (
                db
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
                db
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
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def get_event_rsvps(self, event_id: int, user: Dict[str, Any] = Depends(verify_token)) -> list[Dict[str, Any]]:
        """GET /api/events/{event_id}/rsvps — Return RSVPs for an organiser's event."""
        try:
            # Use admin client to bypass RLS (organiser-level query)
            db = self.db.admin or self.db.client

            # Verify the authenticated user owns this event
            event_check = db.table("events").select("organiser_id").eq("id", event_id).execute()
            if not event_check.data:
                raise HTTPException(status_code=404, detail="Event not found")
            if event_check.data[0].get("organiser_id") != user["user_id"]:
                raise HTTPException(status_code=403, detail="You can only view RSVPs for your own events")
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
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def get_organizer_events(self, user: Dict[str, Any] = Depends(verify_token)) -> list[Dict[str, Any]]:
        """GET /api/organizer/events — Return all events owned by the authenticated organiser (Draft + Published)."""
        try:
            db = self.db.admin or self.db.client
            response = (
                db.table("events")
                .select("id, title, description, location, start_time, capacity, attendee_count, status, organizer, latitude, longitude")
                .eq("organiser_id", user["user_id"])
                .execute()
            )
            return cast(list[Dict[str, Any]], response.data or [])
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
            if "email not confirmed" in error_msg:
                raise HTTPException(status_code=403, detail="Please confirm your email before logging in. Check your inbox for a confirmation link.")
            if "invalid login credentials" in error_msg or "invalid credentials" in error_msg or "user not found" in error_msg:
                raise HTTPException(status_code=401, detail="Invalid email or password")
            raise HTTPException(status_code=400, detail=str(e))

    def forgot_password(self, payload: UserForgotPasswordSchema):
        try:
            auth = self.db.client.auth
            if hasattr(auth, "reset_password_for_email"):
                auth.reset_password_for_email(payload.email)
            elif hasattr(auth, "reset_password_email"):
                auth.reset_password_email(payload.email)
            else:
                raise RuntimeError("Password reset is not supported by current auth client")
            return {"message": "If that account exists, a password reset email has been sent."}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    def delete_account(self, user: Dict[str, Any] = Depends(verify_token)):
        try:
            if not self.db.admin:
                raise HTTPException(status_code=503, detail="Account deletion is unavailable")
            self.db.admin.auth.admin.delete_user(user["user_id"])
            return {"message": "Account deleted successfully"}
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

# Create the app instance for uvicorn to pick up
backend = UniNearBackend()
app = backend.app

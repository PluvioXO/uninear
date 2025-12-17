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


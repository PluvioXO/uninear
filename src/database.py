
import os
from supabase import create_client, Client
from dotenv import load_dotenv

class Database:
    def __init__(self):
        # Load variables from .env file
        load_dotenv()

        # Get the keys
        url: str = os.environ.get("SUPABASE_URL")
        key: str = os.environ.get("SUPABASE_KEY")

        # Safety check
        if not url or not key:
            raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env file. Did you forget to save them?")

        # Initialize the Supabase client (anon key – respects RLS)
        self.client: Client = create_client(url, key)

        # Admin client (service_role key – bypasses RLS, used for auth lookups)
        service_role_key: str = os.environ.get("SERVICE_ROLE_KEY", "")
        self.admin: Client | None = create_client(url, service_role_key) if service_role_key else None

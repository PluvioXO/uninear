import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

# Get the keys
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

# Safety check
if not url or not key:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_KEY in .env file. Did you forget to save them?")

# Initialize the Supabase client
supabase: Client = create_client(url, key)
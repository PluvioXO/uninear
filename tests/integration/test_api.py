import os
import pytest
from unittest.mock import MagicMock, patch

# Set dummy env vars BEFORE importing src.main to avoid Database init error
os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_KEY"] = "dummy-key"

from fastapi.testclient import TestClient
from src.main import app, backend

client = TestClient(app)

# --- API TESTS ---

# 1. Test that the API is alive
def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "status" in response.json()

# 2. Test to see if we can fetch events (The Core Feature)
def test_get_events():
    # Mock the database response
    mock_response = MagicMock()
    mock_response.data = [{"id": 1, "title": "Mock Event"}]
    
    # We need to mock the chain: backend.db.client.table().select().execute()
    with patch.object(backend.db.client, 'table') as mock_table:
        mock_table.return_value.select.return_value.execute.return_value = mock_response
        
        response = client.get("/events")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        assert response.json()[0]["title"] == "Mock Event"

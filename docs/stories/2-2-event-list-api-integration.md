# Story 2.2: Event List API Integration

Status: ready-for-dev

## Story

As a **student**,
I want **the event list to show real data from the backend**,
so that **I see actual events, not placeholder data**.

## Acceptance Criteria

1. **Given** the frontend/mobile app requests events, **When** GET /api/events is called, **Then** the response includes events from Supabase **And** each event has: id, title, description, location, datetime, capacity, attendee_count
2. **Given** the API request fails, **When** the events page loads, **Then** an error message displays "Unable to load events. Please try again." **And** a retry button is shown

**Test:** `test_NFR14_events_api_integration`

## Tasks / Subtasks

- [ ] Task 1: Backend — verify complete event response schema (AC: 1)
  - [ ] 1.1 Ensure GET /events in src/main.py returns all required fields: id, title, description, location, start_time (as datetime), capacity, attendee_count
  - [ ] 1.2 Add Pydantic response model EventResponseSchema in src/models.py for consistent API contract
  - [ ] 1.3 Add test test_NFR14_events_api_integration in tests/integration/test_api.py verifying all fields present in response
- [ ] Task 2: Frontend — wire dashboard to live API (AC: 1, 2)
  - [ ] 2.1 In frontend/app/dashboard/page.tsx, use fetchEvents() from frontend/lib/api.ts (created in Story 2.1)
  - [ ] 2.2 Map API response fields to event card components (title, date formatting, location, attendee count)
  - [ ] 2.3 On API failure, show "Unable to load events. Please try again." with retry button that re-calls fetchEvents()
- [ ] Task 3: Mobile — verify API integration (AC: 1, 2)
  - [ ] 3.1 In mobile/App.js, verify fetchEvents() correctly maps API response fields to event card rendering
  - [ ] 3.2 Ensure error fallback shows "Unable to load events" message instead of silently showing mock data
- [ ] Task 4: Integration tests (AC: 1, 2)
  - [ ] 4.1 Add frontend test test_NFR14_events_api_integration testing: API response renders correct fields, error state shows retry

## Dev Notes

- **EXISTING CODE:** Backend endpoint exists and returns Supabase data. Mobile already calls the API. Frontend dashboard is the main gap — uses hardcoded data.
- **DEPENDENCY:** This story builds on Story 2.1's API service (frontend/lib/api.ts). If 2.1 isn't done, create the API service here.
- **Response mapping:** Backend returns start_time (timestamptz), frontend needs to format as readable date/time. Use standard Date formatting.
- **Mobile mock fallback:** Currently silently falls back to mock data on error. Update to show error UI first, with mock data as last resort.

### Project Structure Notes

- Backend: src/main.py (GET /events)
- Frontend: frontend/app/dashboard/page.tsx, frontend/lib/api.ts
- Mobile: mobile/App.js (fetchEvents function)
- Models: src/models.py (add EventResponseSchema)

### References

- [Source: src/main.py - get_events with mock fallback]
- [Source: mobile/App.js - fetchEvents with error handling]
- [Source: PRD#NFR-14]

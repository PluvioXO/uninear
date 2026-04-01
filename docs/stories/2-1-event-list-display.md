# Story 2.1: Event List Display

Status: ready-for-dev

## Story

As a **student**,
I want **to see a list of upcoming events**,
so that **I can browse what's happening on campus**.

## Acceptance Criteria

1. **Given** a student opens the app/dashboard, **When** the events page loads, **Then** a list of upcoming events displays (title, date, location, attendee count) **And** events are sorted by date (soonest first) **And** the list loads within 2 seconds (NFR-01)
2. **Given** there are no upcoming events, **When** the events page loads, **Then** a message displays "No upcoming events"

**Test:** `test_FR01_display_events`

## Tasks / Subtasks

- [ ] Task 1: Backend — ensure GET /events returns sorted upcoming events (AC: 1)
  - [ ] 1.1 Update GET /events in src/main.py to filter by status='Published' and start_time > now(), ordered by start_time ASC
  - [ ] 1.2 Ensure response includes: id, title, description, location, start_time, capacity, attendee_count
  - [ ] 1.3 Add test test_FR01_display_events in tests/integration/test_api.py verifying sort order and field presence
- [ ] Task 2: Frontend — replace mock data with real API call (AC: 1, 2)
  - [ ] 2.1 Create API service function fetchEvents() in frontend/lib/api.ts that calls GET /events with auth header
  - [ ] 2.2 In frontend/app/dashboard/page.tsx, replace INITIAL_EVENTS with useEffect + fetchEvents() call
  - [ ] 2.3 Add loading skeleton/spinner while fetching
  - [ ] 2.4 Show "No upcoming events" message when API returns empty array
  - [ ] 2.5 Show error state with retry button on API failure
- [ ] Task 3: Frontend event list tests (AC: 1, 2)
  - [ ] 3.1 Add test test_FR01_display_events in frontend/__tests__/ testing: events render from API, sorted by date, empty state shows message, loading state displays
- [ ] Task 4: Performance validation (AC: 1 — NFR-01)
  - [ ] 4.1 Add test test_NFR01_event_list_performance in tests/integration/test_api.py asserting GET /events responds within 2000ms

## Dev Notes

- **EXISTING CODE:** Backend GET /events exists but returns all events unsorted with mock fallback. Frontend dashboard has hardcoded INITIAL_EVENTS. Mobile already fetches from API with fallback.
- **KEY CHANGE:** Backend needs query refinement (filter published, sort by date). Frontend needs to replace mock data with API calls.
- **API Service Pattern:** Create frontend/lib/api.ts as central API service — will be reused by ALL subsequent stories. Include base URL config and auth header attachment.
- **DO NOT** remove the mock fallback in the backend — it's useful for development. But the primary path should return real Supabase data.
- **Performance:** Supabase query with .order('start_time') is fast. The events_start_time_idx index already exists.

### Project Structure Notes

- Backend: src/main.py (GET /events endpoint)
- Frontend dashboard: frontend/app/dashboard/page.tsx
- New API service: frontend/lib/api.ts (CREATE THIS — central API client)
- Database: events table with start_time index

### References

- [Source: src/main.py - get_events endpoint]
- [Source: frontend/app/dashboard/page.tsx - INITIAL_EVENTS mock data]
- [Source: supabase/schema.sql - events table, events_start_time_idx]
- [Source: PRD#FR-01, NFR-01]

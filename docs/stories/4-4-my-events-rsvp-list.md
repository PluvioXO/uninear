# Story 4.4: My Events (RSVP List)

Status: ready-for-dev

## Story

As a **student**,
I want **to view all events I've RSVP'd to**,
so that **I can see my upcoming schedule**.

## Acceptance Criteria

1. **Given** a student navigates to "My Events" / "My RSVPs", **When** the page loads, **Then** a list of their RSVP'd events displays **And** events are sorted by date (soonest first) **And** each event shows title, date, time, location
2. **Given** a student has no RSVPs, **When** the page loads, **Then** a message displays "No upcoming events. Discover events nearby!" **And** a link to the discovery page is shown
3. **Given** a student taps an event in their list, **When** the event is selected, **Then** the full event details page opens

**Test:** `test_FR21_my_events`

## Tasks / Subtasks

- [ ] Task 1: Backend — verify user RSVPs endpoint (AC: 1)
  - [ ] 1.1 Confirm GET /api/rsvp?user_id={uid} in src/main.py returns user's RSVPs with joined event data (title, start_time, location)
  - [ ] 1.2 Verify response includes event details (not just RSVP records)
  - [ ] 1.3 Ensure results are sorted by event start_time ASC (soonest first)
  - [ ] 1.4 Verify/add test test_FR21_my_events in tests/integration/test_api.py
- [ ] Task 2: Frontend — create My Events page (AC: 1, 2, 3)
  - [ ] 2.1 Create frontend/app/my-events/page.tsx showing list of RSVP'd events
  - [ ] 2.2 Fetch user's RSVPs via GET /api/rsvp?user_id={uid} using frontend/lib/api.ts
  - [ ] 2.3 Display each event: title, formatted date/time, location
  - [ ] 2.4 Sort events by date (soonest first)
  - [ ] 2.5 Empty state: "No upcoming events. Discover events nearby!" with link to /dashboard
  - [ ] 2.6 Make each event clickable — navigate to /events/{id} (detail page from Story 4.2)
- [ ] Task 3: Add navigation to My Events (AC: 1)
  - [ ] 3.1 Add "My Events" link to frontend/components/Navbar.tsx navigation
  - [ ] 3.2 Add "My Events" tab or section to mobile/App.js (or add to existing Events tab)
- [ ] Task 4: Mobile — add My Events section (AC: 1, 2)
  - [ ] 4.1 In mobile/App.js, add a "My RSVPs" section or tab
  - [ ] 4.2 Fetch user's RSVPs from GET /api/rsvp?user_id={uid}
  - [ ] 4.3 Display RSVP'd event cards sorted by date
  - [ ] 4.4 Empty state: "No upcoming events. Discover events nearby!"
- [ ] Task 5: My Events tests (AC: 1, 2, 3)
  - [ ] 5.1 Add test test_FR21_my_events in frontend/__tests__/ testing: events list renders from API, sorted by date, empty state with discovery link, event click navigates to detail

## Dev Notes

- **EXISTING CODE:** Backend GET /api/rsvp?user_id={uid} is IMPLEMENTED — returns RSVPs with joined event data using `.select('*, events(*)')`. Tests exist. Frontend has NO "My Events" page. Mobile has no RSVP list view.
- **NEW PAGE:** frontend/app/my-events/page.tsx — completely new.
- **Event data join:** The backend already joins event_attendance with events table, so each RSVP includes full event details. No additional endpoint needed.
- **User ID:** After auth middleware (Story 1.4), user_id comes from JWT. Until then, pass from client auth session.
- **Navigation:** Add "My Events" to the main Navbar. This is a primary navigation item for students.

### Project Structure Notes

- Backend (done): src/main.py (GET /api/rsvp?user_id=)
- New page: frontend/app/my-events/page.tsx
- Navigation: frontend/components/Navbar.tsx (add link)
- Mobile: mobile/App.js (add My RSVPs section)

### References

- [Source: src/main.py - get_user_rsvps endpoint with event join]
- [Source: tests/integration/test_api.py - user RSVP retrieval tests]
- [Source: PRD#FR-21]

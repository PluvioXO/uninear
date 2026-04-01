# Story 4.2: RSVP Button on Event Details

Status: ready-for-dev

## Story

As a **student**,
I want **to tap/click an RSVP button on an event**,
so that **I can confirm my attendance**.

## Acceptance Criteria

1. **Given** a student views an event they haven't RSVP'd to, **When** the event details load, **Then** an "RSVP" button is displayed **And** the current attendee count is shown
2. **Given** a student taps the RSVP button, **When** the RSVP is successful, **Then** a confirmation message displays "You're going!" **And** the button changes to "Cancel RSVP" **And** the attendee count increments
3. **Given** the RSVP fails (network error), **When** the request fails, **Then** an error message displays "Unable to RSVP. Please try again."

**Test:** `test_FR16_rsvp_ui`

## Tasks / Subtasks

- [ ] Task 1: Frontend — create event detail page with RSVP (AC: 1, 2, 3)
  - [ ] 1.1 Create frontend/app/events/[id]/page.tsx showing full event details (title, description, date, time, location, capacity, attendee_count)
  - [ ] 1.2 Add RSVP button that calls POST /api/rsvp with event_id via frontend/lib/api.ts
  - [ ] 1.3 Check user's existing RSVP status on page load: GET /api/rsvp?user_id={uid} and check if event_id is in the list
  - [ ] 1.4 If already RSVP'd, show "Cancel RSVP" button instead of "RSVP"
  - [ ] 1.5 On successful RSVP: show "You're going!" confirmation, toggle button to "Cancel RSVP", increment displayed attendee count
  - [ ] 1.6 On RSVP failure: show "Unable to RSVP. Please try again." error message
  - [ ] 1.7 Show attendee count: "12/30 attending" or "12 attending"
- [ ] Task 2: Frontend — link event cards to detail page (AC: 1)
  - [ ] 2.1 In dashboard event list, make event cards clickable — navigate to /events/{id}
  - [ ] 2.2 Add "View Details" link/button on event cards
- [ ] Task 3: Mobile — wire RSVP button to backend (AC: 1, 2, 3)
  - [ ] 3.1 In mobile/App.js, update RSVP button to call POST /api/rsvp with event_id and user_id
  - [ ] 3.2 On success, update local event state (attendee_count +1, mark as RSVP'd)
  - [ ] 3.3 Show "You're going!" alert/toast on success
  - [ ] 3.4 Show error message on failure
  - [ ] 3.5 Toggle button between "RSVP" and "Cancel RSVP" based on user's RSVP status
- [ ] Task 4: RSVP UI tests (AC: 1, 2, 3)
  - [ ] 4.1 Add test test_FR16_rsvp_ui in frontend/__tests__/ testing: RSVP button renders, click calls API, success shows confirmation, failure shows error, button toggles state

## Dev Notes

- **EXISTING CODE:** Backend RSVP endpoint fully works. Frontend has NO event detail page — this is net new. Mobile has RSVP button on event cards but it's LOCAL STATE ONLY (not connected to API).
- **NEW PAGE:** frontend/app/events/[id]/page.tsx — Next.js dynamic route for event details.
- **RSVP status check:** On page load, check if the current user has already RSVP'd. Use GET /api/rsvp?user_id={uid} and check if the event_id appears in the results. This determines initial button state.
- **Optimistic UI:** On RSVP click, immediately update the UI (increment count, toggle button), then confirm with API. Revert on failure.
- **Auth required:** RSVP requires authenticated user. If not logged in, redirect to login page.
- **Route reconciliation needed:** The MapView component (Story 2.3) links to `/dashboard/events/{id}`, but this story creates the detail page at `/events/[id]`. Either the MapView link or the detail page route needs to be updated so they match.

### Project Structure Notes

- New page: frontend/app/events/[id]/page.tsx (event detail with RSVP)
- Dashboard: frontend/app/dashboard/page.tsx (make event cards clickable)
- Mobile: mobile/App.js (wire RSVP button to API)
- API service: frontend/lib/api.ts (add rsvpToEvent function)

### References

- [Source: src/main.py - POST /api/rsvp, GET /api/rsvp]
- [Source: mobile/App.js - RSVP button in event cards]
- [Source: PRD#FR-16]

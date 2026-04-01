# Story 3.1: Event Creation Form

Status: ready-for-dev

## Story

As an **organiser**,
I want **to fill out a form with event details**,
so that **I can create a new event on the platform**.

## Acceptance Criteria

1. **Given** an organiser is on the "Create Event" page, **When** the page loads, **Then** a form displays with fields: title, description, location, date, time, capacity, tags
2. **Given** required fields are empty, **When** the organiser attempts to submit, **Then** validation errors display for missing fields **And** the form is not submitted
3. **Given** all required fields are filled, **When** the organiser clicks "Create Event", **Then** the event is saved to the database via POST /api/events

**Test:** `test_FR09_create_event`

## Tasks / Subtasks

- [ ] Task 1: Backend — verify event creation endpoint (AC: 3)
  - [ ] 1.1 Confirm POST /events in src/main.py accepts all required fields and saves to Supabase
  - [ ] 1.2 Ensure organiser_id is set from the authenticated user (requires auth middleware from Story 1.4)
  - [ ] 1.3 Verify event defaults to status='Draft' on creation
  - [ ] 1.4 Add/update test test_FR09_create_event in tests/integration/test_api.py
- [ ] Task 2: Frontend — connect create event form to API (AC: 1, 2, 3)
  - [ ] 2.1 In frontend/app/organizer/create-event/page.tsx, wire form submission to POST /events via frontend/lib/api.ts
  - [ ] 2.2 Add client-side validation: require title, description, location, date, time. Show inline error messages for empty required fields
  - [ ] 2.3 On successful creation, redirect to organizer dashboard and show success toast/message
  - [ ] 2.4 On API error, display error message without losing form data
  - [ ] 2.5 Map form fields to API schema: combine date+time into datetime, map tags to mood_tags
- [ ] Task 3: Frontend form tests (AC: 1, 2, 3)
  - [ ] 3.1 Add test test_FR09_create_event in frontend/__tests__/ testing: form renders all fields, validation blocks empty submit, successful submit calls API

## Dev Notes

- **EXISTING CODE:** Backend POST /events works. Frontend has TWO create event forms: dashboard modal (frontend/app/dashboard/page.tsx) and organizer page (frontend/app/organizer/create-event/page.tsx). Consolidate to organizer page as primary.
- **Field mapping:** Frontend form has date+time as separate fields. Backend expects date (datetime). Combine: `new Date(date + 'T' + time)`.
- **organiser_id:** Currently a manual field. After Story 1.4 (auth middleware), this should come from the verified JWT token user. For now, pass it from the frontend auth session.
- **Tags/mood_tags:** Frontend form has mood tags as multi-select. Maps to mood_tags text array in database.

### Project Structure Notes

- Backend: src/main.py (POST /events)
- Frontend form: frontend/app/organizer/create-event/page.tsx
- Dashboard modal: frontend/app/dashboard/page.tsx (secondary, may remove)
- API service: frontend/lib/api.ts
- Models: src/models.py (EventCreateSchema)

### References

- [Source: src/main.py - create_event endpoint]
- [Source: frontend/app/organizer/create-event/page.tsx - form fields]
- [Source: src/models.py - EventCreateSchema]
- [Source: PRD#FR-09]

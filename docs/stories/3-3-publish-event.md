# Story 3.3: Publish Event

Status: ready-for-dev

## Story

As an **organiser**,
I want **to publish my event so students can discover it**,
so that **my event appears in search results and on the map**.

## Acceptance Criteria

1. **Given** an organiser has created an event, **When** they click "Publish", **Then** the event status changes to "published" **And** the event becomes visible in student event listings
2. **Given** an event is published, **When** students browse events, **Then** the published event appears in list and map views
3. **Given** an organiser views their dashboard, **When** they see their events list, **Then** each event shows its status (draft/published)

**Test:** `test_FR10_publish_event`

## Tasks / Subtasks

- [ ] Task 1: Backend — verify publish functionality (AC: 1, 2)
  - [ ] 1.1 Confirm PATCH /events/{id} can update status to "Published"
  - [ ] 1.2 Confirm GET /events only returns events with status='Published' (RLS policy already filters — verify)
  - [ ] 1.3 Add test test_FR10_publish_event in tests/integration/test_api.py testing: status update to Published, published event visible in GET /events
- [ ] Task 2: Frontend — add publish button to organizer dashboard (AC: 1, 3)
  - [ ] 2.1 In frontend/app/organizer/page.tsx, add "Publish" button for Draft events
  - [ ] 2.2 Publish button calls PATCH /events/{id} with { status: "Published" }
  - [ ] 2.3 Show status badge on each event card: "Draft" (grey) or "Published" (green)
  - [ ] 2.4 After publish, update the event card status badge without page reload
  - [ ] 2.5 Add confirmation dialog before publishing: "Publish [Event Name]? Students will be able to see and RSVP."
- [ ] Task 3: Wire organizer dashboard to real API (AC: 3)
  - [ ] 3.1 Replace mock event data in frontend/app/organizer/page.tsx with API call to GET /events filtered by organiser_id
  - [ ] 3.2 Show both Draft and Published events for the organiser (unlike student view which only sees Published)
- [ ] Task 4: Publish tests (AC: 1, 2, 3)
  - [ ] 4.1 Add test test_FR10_publish_event in frontend/__tests__/ testing: publish button calls API, status badge updates, draft/published filtering

## Dev Notes

- **EXISTING CODE:** Backend PATCH /events/{id} exists and can update any field including status. RLS policy on events allows anonymous to view Published events. Frontend organizer page shows status badges but uses mock data.
- **KEY CHANGE:** Wire organizer dashboard to real API and add publish button. Events are created as "Draft" by default — organiser explicitly publishes.
- **Organiser's own events:** Need a backend endpoint or query param to get events by organiser_id. Options: add organiser_id param to GET /events or create GET /organizer/events endpoint.
- **RLS consideration:** The anonymous/student view only sees Published events (RLS policy). The organiser needs to see their own Draft events too — may need authenticated query.

### Project Structure Notes

- Backend: src/main.py (PATCH /events/{id}, GET /events)
- Frontend organizer: frontend/app/organizer/page.tsx
- RLS: supabase/schema.sql (events policies)

### References

- [Source: src/main.py - update_event endpoint]
- [Source: supabase/schema.sql - RLS "Anonymous can view published" policy]
- [Source: frontend/app/organizer/page.tsx - status badges mock]
- [Source: PRD#FR-10]

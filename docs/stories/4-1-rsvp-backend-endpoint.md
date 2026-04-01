# Story 4.1: RSVP Backend Endpoint

Status: ready-for-dev

## Story

As a **system**,
I want **API endpoints for creating and managing RSVPs**,
so that **students can RSVP to events**.

## Acceptance Criteria

1. **Given** an authenticated student calls POST /api/rsvp with event_id, **When** the request is valid, **Then** an RSVP record is created (user_id, event_id, timestamp) **And** the event's attendee_count increments by 1 **And** response returns 201 Created within 1 second (NFR-03)
2. **Given** a student tries to RSVP to an event they've already RSVP'd to, **When** POST /api/rsvp is called, **Then** response returns 409 Conflict with "Already RSVP'd"
3. **Given** a student RSVPs to a full event, **When** capacity is reached, **Then** response returns 400 Bad Request with "Event is full"

**Test:** `test_FR16_create_rsvp`, `test_NFR03_rsvp_performance`

## Tasks / Subtasks

- [ ] Task 1: Verify RSVP creation endpoint (AC: 1)
  - [ ] 1.1 Confirm POST /api/rsvp in src/main.py creates event_attendance record with event_id and user_id
  - [ ] 1.2 Confirm atomic increment_attendee_count RPC is called after insert
  - [ ] 1.3 Verify response is 201 with attendance record data
  - [ ] 1.4 Verify/add test test_FR16_create_rsvp in tests/integration/test_api.py
- [ ] Task 2: Verify duplicate RSVP prevention (AC: 2)
  - [ ] 2.1 Confirm endpoint checks for existing RSVP before insert
  - [ ] 2.2 Confirm 409 Conflict response with "Already RSVP'd" message
  - [ ] 2.3 Verify UNIQUE(event_id, user_id) constraint in database as backup
  - [ ] 2.4 Verify test covers duplicate scenario
- [ ] Task 3: Verify capacity enforcement (AC: 3)
  - [ ] 3.1 Confirm endpoint queries event attendee_count and capacity before insert
  - [ ] 3.2 Confirm 400 response with "Event is full" when attendee_count >= capacity
  - [ ] 3.3 Confirm unlimited capacity (null/0) bypasses check
  - [ ] 3.4 Verify test covers capacity scenario
- [ ] Task 4: Performance validation (AC: 1 — NFR-03)
  - [ ] 4.1 Verify/add test test_NFR03_rsvp_performance asserting POST /api/rsvp responds within 1000ms
- [ ] Task 5: Auth integration (AC: 1)
  - [ ] 5.1 Once Story 1.4 auth middleware is done, ensure POST /api/rsvp extracts user_id from JWT instead of request body
  - [ ] 5.2 Update tests to include auth token mocking

## Dev Notes

- **EXISTING CODE:** This endpoint is MOSTLY COMPLETE. Recent commits (d5e563f, 56e616e, e4b6dd0) built and hardened the RSVP endpoints. Backend has: duplicate check (409), capacity check (400), atomic counter increment via RPC, 201 response. Tests exist.
- **KEY TASK:** Verify everything works correctly. Main remaining work is auth integration (extracting user_id from JWT rather than request body) once Story 1.4 is complete.
- **Atomic operations:** increment_attendee_count and decrement_attendee_count are PL/pgSQL RPC functions in Supabase that atomically update the count to prevent race conditions.
- **DO NOT** rewrite what already works — verify and fill gaps only.

### Project Structure Notes

- Backend: src/main.py (POST /api/rsvp — already implemented)
- Database: supabase/schema.sql (event_attendance table, RPC functions)
- Tests: tests/integration/test_api.py (RSVP tests exist)

### References

- [Source: src/main.py - rsvp_to_event endpoint]
- [Source: supabase/schema.sql - event_attendance table, increment/decrement RPCs]
- [Source: tests/integration/test_api.py - RSVP test cases]
- [Source: PRD#FR-16, NFR-03]
- [Source: git commit d5e563f - admin client for RSVP queries]
- [Source: git commit 56e616e - Story 4.1 code review fixes]

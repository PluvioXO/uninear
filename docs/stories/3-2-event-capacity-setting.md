# Story 3.2: Event Capacity Setting

Status: ready-for-dev

## Story

As an **organiser**,
I want **to set a maximum capacity for my event**,
so that **I can manage attendance and venue limits**.

## Acceptance Criteria

1. **Given** an organiser is creating an event, **When** they enter a capacity value (e.g., 30), **Then** the capacity is saved with the event
2. **Given** an event has reached capacity, **When** a student views the event, **Then** the RSVP button is disabled **And** a message displays "Event is full"
3. **Given** capacity is set to 0 or left blank, **When** the event is created, **Then** the event has unlimited capacity

**Test:** `test_FR11_capacity_limits`

## Tasks / Subtasks

- [ ] Task 1: Backend — verify capacity handling (AC: 1, 2, 3)
  - [ ] 1.1 Confirm POST /events saves capacity field correctly
  - [ ] 1.2 Ensure capacity=0 or null means unlimited (no cap on RSVPs)
  - [ ] 1.3 Verify POST /api/rsvp checks attendee_count < capacity before allowing RSVP (already exists — confirm)
  - [ ] 1.4 Add test test_FR11_capacity_limits in tests/integration/test_api.py testing: capacity saved, RSVP blocked at capacity, unlimited when 0/null
- [ ] Task 2: Frontend — capacity in event creation (AC: 1, 3)
  - [ ] 2.1 Ensure capacity field in create-event form accepts positive integers and blank (unlimited)
  - [ ] 2.2 Add helper text: "Leave blank for unlimited capacity"
  - [ ] 2.3 Validate capacity is positive number if provided
- [ ] Task 3: Frontend — show "Event is full" state (AC: 2)
  - [ ] 3.1 In event card/detail component, compare attendee_count to capacity
  - [ ] 3.2 When attendee_count >= capacity (and capacity > 0), disable RSVP button and show "Event is full"
  - [ ] 3.3 Show capacity info on event card: "12/30 attending" or "12 attending (unlimited)"
- [ ] Task 4: Capacity tests (AC: 1, 2, 3)
  - [ ] 4.1 Add frontend test test_FR11_capacity_limits testing: "Event is full" displays when at capacity, RSVP button disabled, unlimited capacity allows RSVP

## Dev Notes

- **EXISTING CODE:** Backend RSVP endpoint already checks capacity: queries event for attendee_count and capacity, returns 400 "Event is full" when at capacity. Capacity field exists in create form and database.
- **KEY CHANGE:** Frontend needs to show capacity status visually — disable RSVP button and display "Event is full" message. This is primarily a frontend task.
- **Unlimited capacity:** When capacity is 0 or null, backend should skip the capacity check. Verify this logic exists.
- **Attendee count display:** Show "X/Y attending" format where Y is capacity. If unlimited, show "X attending".

### Project Structure Notes

- Backend: src/main.py (POST /api/rsvp capacity check)
- Frontend event cards: frontend/app/dashboard/page.tsx
- Create event form: frontend/app/organizer/create-event/page.tsx
- Database: events.capacity, events.attendee_count

### References

- [Source: src/main.py - RSVP capacity check logic]
- [Source: supabase/schema.sql - events capacity column]
- [Source: PRD#FR-11]

# Story 4.3: Cancel RSVP

Status: ready-for-dev

## Story

As a **student**,
I want **to cancel my RSVP if my plans change**,
so that **my spot is freed for another student**.

## Acceptance Criteria

1. **Given** a student has RSVP'd to an event, **When** they tap "Cancel RSVP", **Then** a confirmation dialog displays "Cancel your RSVP for [Event Name]?"
2. **Given** the student confirms cancellation, **When** DELETE /api/rsvp/{id} is called, **Then** the RSVP record is removed **And** the event's attendee_count decrements **And** the button changes back to "RSVP"
3. **Given** the student dismisses the confirmation, **When** they tap "No, keep my RSVP", **Then** the dialog closes and RSVP remains

**Test:** `test_FR17_cancel_rsvp`

## Tasks / Subtasks

- [ ] Task 1: Backend — verify cancel RSVP endpoint (AC: 2)
  - [ ] 1.1 Confirm DELETE /events/{event_id}/rsvp in src/main.py removes the RSVP record
  - [ ] 1.2 Confirm decrement_attendee_count RPC is called after delete
  - [ ] 1.3 Confirm 204 response on success, 404 if RSVP not found
  - [ ] 1.4 Verify/add test test_FR17_cancel_rsvp in tests/integration/test_api.py
- [ ] Task 2: Frontend — add cancel RSVP with confirmation (AC: 1, 2, 3)
  - [ ] 2.1 On event detail page (frontend/app/events/[id]/page.tsx), when user has RSVP'd, show "Cancel RSVP" button
  - [ ] 2.2 On click, show confirmation dialog: "Cancel your RSVP for [Event Name]?" with "Yes, cancel" and "No, keep my RSVP" buttons
  - [ ] 2.3 On confirm: call DELETE /events/{event_id}/rsvp via frontend/lib/api.ts, toggle button back to "RSVP", decrement displayed count
  - [ ] 2.4 On dismiss: close dialog, no action
  - [ ] 2.5 Handle API error with "Unable to cancel RSVP. Please try again."
- [ ] Task 3: Mobile — add cancel RSVP (AC: 1, 2, 3)
  - [ ] 3.1 In mobile/App.js, when event is RSVP'd, show "Cancel RSVP" button
  - [ ] 3.2 On tap, show Alert.alert confirmation dialog
  - [ ] 3.3 On confirm: call DELETE /events/{event_id}/rsvp, update local state
  - [ ] 3.4 On cancel: dismiss alert
- [ ] Task 4: Cancel RSVP tests (AC: 1, 2, 3)
  - [ ] 4.1 Add test test_FR17_cancel_rsvp in frontend/__tests__/ testing: cancel button shows dialog, confirm calls API, dismiss keeps RSVP, button toggles back

## Dev Notes

- **EXISTING CODE:** Backend DELETE /events/{event_id}/rsvp is FULLY IMPLEMENTED with atomic decrement and 204/404 responses. Tests exist. Frontend and mobile have NO cancel RSVP UI.
- **DEPENDENCY:** Story 4.2 creates the event detail page where Cancel RSVP lives. If 4.2 isn't done, this story adds the cancel functionality to whatever event view exists.
- **Confirmation pattern:** Use a simple modal/dialog component. React: create a ConfirmDialog component or use window.confirm for MVP. Mobile: use React Native Alert.alert.
- **API call:** DELETE /events/{event_id}/rsvp — note the URL uses event_id, not rsvp_id. The backend finds the RSVP by (event_id, user_id).

### Project Structure Notes

- Backend (done): src/main.py (DELETE /events/{event_id}/rsvp)
- Frontend: frontend/app/events/[id]/page.tsx (from Story 4.2)
- Mobile: mobile/App.js (event card section)
- API service: frontend/lib/api.ts (add cancelRsvp function)

### References

- [Source: src/main.py - cancel_rsvp endpoint]
- [Source: tests/integration/test_api.py - cancel RSVP tests]
- [Source: PRD#FR-17]

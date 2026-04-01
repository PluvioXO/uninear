# Story 3.4: View RSVP List

Status: ready-for-dev

## Story

As an **organiser**,
I want **to see who has RSVP'd to my event**,
so that **I can prepare for expected attendance**.

## Acceptance Criteria

1. **Given** an organiser views their event details, **When** they click "View RSVPs", **Then** a list of attendees displays (name, email, RSVP time) **And** the total RSVP count is shown
2. **Given** no one has RSVP'd, **When** the organiser views RSVPs, **Then** a message displays "No RSVPs yet"
3. **Given** a student cancels their RSVP, **When** the organiser refreshes the RSVP list, **Then** that student no longer appears in the list **And** the count decreases by 1

**Test:** `test_FR14_view_rsvp_list`

## Tasks / Subtasks

- [ ] Task 1: Backend — verify RSVP list endpoint (AC: 1, 2, 3)
  - [ ] 1.1 Confirm GET /api/events/{id}/rsvps in src/main.py returns attendee list with: name (full_name from auth.users metadata), email, RSVP time (created_at)
  - [ ] 1.2 Confirm endpoint uses admin client for auth.users lookup (already implemented)
  - [ ] 1.3 Verify empty RSVP list returns empty array (not error)
  - [ ] 1.4 Add/verify test test_FR14_view_rsvp_list in tests/integration/test_api.py
- [ ] Task 2: Frontend — create RSVP list view for organisers (AC: 1, 2)
  - [ ] 2.1 Create RSVPList component in frontend/components/RSVPList.tsx showing attendee table: name, email, RSVP time
  - [ ] 2.2 Add "View RSVPs" button to each event on organizer dashboard (frontend/app/organizer/page.tsx)
  - [ ] 2.3 On click, fetch GET /api/events/{id}/rsvps and display RSVPList
  - [ ] 2.4 Show total RSVP count as header: "RSVPs (12)"
  - [ ] 2.5 Show "No RSVPs yet" when list is empty
- [ ] Task 3: RSVP list tests (AC: 1, 2)
  - [ ] 3.1 Add test test_FR14_view_rsvp_list in frontend/__tests__/ testing: RSVP list renders attendees, empty state shows message, count displayed

## Dev Notes

- **EXISTING CODE:** Backend GET /api/events/{id}/rsvps is FULLY IMPLEMENTED. Uses admin client to fetch user details from auth.users (bypasses RLS). Returns attendee objects with email and full_name from user metadata. Tests exist in test_api.py.
- **KEY CHANGE:** Frontend needs the RSVP list UI — this is the main gap. Backend is done.
- **Admin client usage:** The endpoint uses self.db.admin_client (service_role) to call auth.admin.get_user_by_id() for each attendee. This is necessary because auth.users is not accessible via normal RLS.
- **Real-time updates (AC: 3):** For D2 MVP, manual refresh is sufficient. Don't implement WebSockets.

### Project Structure Notes

- Backend (done): src/main.py (GET /api/events/{id}/rsvps)
- New component: frontend/components/RSVPList.tsx
- Organizer page: frontend/app/organizer/page.tsx (add View RSVPs button)
- Backend test (exists): tests/integration/test_api.py

### References

- [Source: src/main.py - get_event_rsvps endpoint with admin client]
- [Source: PRD#FR-14]

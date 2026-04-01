
# UniNear - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for UniNear, decomposing the PRD requirements into implementable stories for the D2 coursework submission (due 27/03/2026).

**Context:** Brownfield project with existing React Native mobile, Next.js web, and FastAPI backend. Primary work is API integration and RSVP implementation.

## Requirements Inventory

### Functional Requirements (D2 MVP Scope)

- FR-01: Students can view a list of upcoming events
- FR-02: Students can filter events by location/radius
- FR-03: Students can filter events by time window
- FR-07: Students can search events by keyword
- FR-08: Students can view events on an interactive map
- FR-09: Organisers can create new events with required details
- FR-10: Organisers can publish events to the platform
- FR-11: Organisers can set event capacity limits
- FR-14: Organisers can view RSVP list for their events
- FR-16: Students can RSVP to events
- FR-17: Students can cancel their RSVP
- FR-21: Students can view their upcoming RSVPs ("My Events")

### Non-Functional Requirements (D2 MVP Scope)

- NFR-01: Event list loads within 2 seconds
- NFR-02: Map renders within 3 seconds
- NFR-03: RSVP action completes within 1 second
- NFR-07: System validates @bath.ac.uk email addresses
- NFR-08: User sessions are securely managed
- NFR-09: Personal data is encrypted at rest
- NFR-10: API endpoints require authentication
- NFR-13: Google Maps API integration
- NFR-14: Supabase database connectivity
- NFR-15: Redis cache integration
- NFR-16: System handles API errors gracefully

### Additional Requirements

- API Integration: Connect frontend/mobile to existing backend endpoints (currently using mock data)
- RSVP Backend: Build complete RSVP create/cancel endpoints (currently 5% complete)
- Auth Wiring: Connect @bath.ac.uk validation to frontend authentication flows
- Test Traceability: All tests must follow `test_FR##_description` and `test_NFR##_description` naming convention
- CI Pipeline: GitHub Actions must pass on all commits to main branch
- Demo Readiness: 3 user journeys must be demonstrable for D2 video (Event Discovery, Event Creation, RSVP Cancellation)
- Architecture: 3-tier layered (Presentation → Application → Data), read-aside caching via Redis, Supabase RLS policies, JWT auth middleware
- Atomic Operations: RSVP count increment/decrement via Supabase RPC functions to prevent race conditions
- Database: event_attendance table with UNIQUE(event_id, user_id) constraint for duplicate prevention

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR-01 | Epic 2 | View upcoming events |
| FR-02 | Epic 2 | Filter by location/radius |
| FR-03 | Epic 2 | Filter by time window |
| FR-07 | Epic 2 | Search by keyword |
| FR-08 | Epic 2 | Interactive map view |
| FR-09 | Epic 3 | Create event with details |
| FR-10 | Epic 3 | Publish event |
| FR-11 | Epic 3 | Set capacity limits |
| FR-14 | Epic 3 | View RSVP list |
| FR-16 | Epic 4 | RSVP to events |
| FR-17 | Epic 4 | Cancel RSVP |
| FR-21 | Epic 4 | View "My Events" |

**Coverage:** 12/12 FRs mapped (100%)

## Epic List

### Epic 1: Authentication & User Identity
Students and organisers can securely access UniNear with their @bath.ac.uk credentials.

**NFRs covered:** NFR-07, NFR-08, NFR-09, NFR-10
**Status:** 40% complete - needs frontend/backend wiring
**Sprint:** Sprint 1

### Epic 2: Event Discovery
Students can find nearby events that fit their schedule using map, list, and filter views.

**FRs covered:** FR-01, FR-02, FR-03, FR-07, FR-08
**NFRs covered:** NFR-01, NFR-02, NFR-13, NFR-14, NFR-15
**Status:** 55-60% complete - needs API integration
**Sprint:** Sprint 2

### Epic 3: Event Management (Organiser)
Society organisers can create, publish, and manage events to reach students beyond their existing followers.

**FRs covered:** FR-09, FR-10, FR-11, FR-14
**NFRs covered:** NFR-14, NFR-16
**Status:** 50% complete - needs frontend-to-API connection
**Sprint:** Sprint 2

### Epic 4: RSVP & Engagement
Students can RSVP to events, view their upcoming events, and cancel if plans change.

**FRs covered:** FR-16, FR-17, FR-21
**NFRs covered:** NFR-03, NFR-16
**Status:** 5% complete - highest priority build
**Sprint:** Sprint 1

---

## Epic 1: Authentication & User Identity

Students and organisers can securely access UniNear with their @bath.ac.uk credentials.

### Story 1.1: Bath Email Validation

As a **student or organiser**,
I want **the system to only accept @bath.ac.uk email addresses**,
So that **only University of Bath members can access the platform**.

**Acceptance Criteria:**

**Given** a user is on the registration form
**When** they enter an email that doesn't end with @bath.ac.uk
**Then** the form displays "Only @bath.ac.uk emails are allowed"
**And** the submit button remains disabled

**Given** a user enters a valid @bath.ac.uk email
**When** they complete other required fields
**Then** the submit button becomes enabled

**Test:** `test_NFR07_bath_email_validation`

---

### Story 1.2: User Registration Flow

As a **new user**,
I want **to create an account with my Bath email and password**,
So that **I can access UniNear features**.

**Acceptance Criteria:**

**Given** a user is on the signup page
**When** they submit valid @bath.ac.uk email, password (min 8 chars), and name
**Then** the account is created in Supabase
**And** the user is redirected to the dashboard

**Given** a user submits an email that already exists
**When** the form is submitted
**Then** an error message displays "An account with this email already exists"

**Test:** `test_NFR08_user_registration`

---

### Story 1.3: User Login Flow

As a **registered user**,
I want **to log in with my email and password**,
So that **I can access my personalised UniNear experience**.

**Acceptance Criteria:**

**Given** a user is on the login page with valid credentials
**When** they submit the form
**Then** a JWT token is generated and stored
**And** the user is redirected to the dashboard

**Given** a user enters incorrect credentials
**When** the form is submitted
**Then** an error message displays "Invalid email or password"
**And** the user remains on the login page

**Test:** `test_NFR08_user_login`

---

### Story 1.4: API Authentication Middleware

As a **system**,
I want **all protected API endpoints to require valid authentication**,
So that **unauthorised users cannot access user data**.

**Acceptance Criteria:**

**Given** a request to a protected endpoint (e.g., /api/events)
**When** the request has no Authorization header
**Then** the API returns 401 Unauthorized

**Given** a request with a valid JWT token
**When** the token is not expired
**Then** the request proceeds to the endpoint handler

**Given** a request with an expired JWT token
**When** the endpoint is called
**Then** the API returns 401 with "Token expired"

**Test:** `test_NFR10_api_authentication`

---

## Epic 2: Event Discovery

Students can find nearby events that fit their schedule using map, list, and filter views.

### Story 2.1: Event List Display

As a **student**,
I want **to see a list of upcoming events**,
So that **I can browse what's happening on campus**.

**Acceptance Criteria:**

**Given** a student opens the app/dashboard
**When** the events page loads
**Then** a list of upcoming events displays (title, date, location, attendee count)
**And** events are sorted by date (soonest first)
**And** the list loads within 2 seconds (NFR-01)

**Given** there are no upcoming events
**When** the events page loads
**Then** a message displays "No upcoming events"

**Test:** `test_FR01_display_events`

---

### Story 2.2: Event List API Integration

As a **student**,
I want **the event list to show real data from the backend**,
So that **I see actual events, not placeholder data**.

**Acceptance Criteria:**

**Given** the frontend/mobile app requests events
**When** GET /api/events is called
**Then** the response includes events from Supabase
**And** each event has: id, title, description, location, datetime, capacity, attendee_count

**Given** the API request fails
**When** the events page loads
**Then** an error message displays "Unable to load events. Please try again."
**And** a retry button is shown

**Test:** `test_NFR14_events_api_integration`

---

### Story 2.3: Interactive Map View

As a **student**,
I want **to view events on a map**,
So that **I can see what's happening near my current location**.

**Acceptance Criteria:**

**Given** a student is on the events page
**When** they select the map view toggle
**Then** Google Maps displays centered on campus (Bath coordinates)
**And** event markers appear at each event location
**And** the map renders within 3 seconds (NFR-02)

**Given** a student taps/clicks an event marker
**When** the marker is selected
**Then** an info card displays event title, time, and attendee count
**And** a "View Details" button is shown

**Test:** `test_FR08_map_view`, `test_NFR13_google_maps_integration`

---

### Story 2.4: Filter by Location/Radius

As a **student**,
I want **to filter events within a certain distance**,
So that **I only see events I can easily walk to**.

**Acceptance Criteria:**

**Given** a student is viewing events
**When** they set the radius filter to 500m
**Then** only events within 500m of their location (or campus center) display
**And** the event count updates to reflect filtered results

**Given** a student clears the location filter
**When** the filter is removed
**Then** all events display again

**Test:** `test_FR02_location_filter`

---

### Story 2.5: Filter by Time Window

As a **student**,
I want **to filter events by time (e.g., "Next 2 hours", "Today", "This week")**,
So that **I find events that fit my current schedule**.

**Acceptance Criteria:**

**Given** a student is viewing events
**When** they select "Next 2 hours" filter
**Then** only events starting within the next 2 hours display

**Given** a student selects "Today" filter
**When** the filter is applied
**Then** only events happening today display

**Given** multiple filters are applied (location + time)
**When** both filters are active
**Then** events matching BOTH criteria display

**Test:** `test_FR03_time_filter`

---

### Story 2.6: Keyword Search

As a **student**,
I want **to search events by keyword**,
So that **I can find specific types of events (e.g., "coding", "sports")**.

**Acceptance Criteria:**

**Given** a student enters "coffee" in the search box
**When** the search is submitted
**Then** events with "coffee" in title or description display

**Given** a search returns no results
**When** the results load
**Then** a message displays "No events match your search"

**Given** a student clears the search
**When** the search box is emptied
**Then** all events display again

**Test:** `test_FR07_keyword_search`

---

## Epic 3: Event Management (Organiser)

Society organisers can create, publish, and manage events to reach students beyond their existing followers.

### Story 3.1: Event Creation Form

As an **organiser**,
I want **to fill out a form with event details**,
So that **I can create a new event on the platform**.

**Acceptance Criteria:**

**Given** an organiser is on the "Create Event" page
**When** the page loads
**Then** a form displays with fields: title, description, location, date, time, capacity, tags

**Given** required fields are empty
**When** the organiser attempts to submit
**Then** validation errors display for missing fields
**And** the form is not submitted

**Given** all required fields are filled
**When** the organiser clicks "Create Event"
**Then** the event is saved to the database via POST /api/events

**Test:** `test_FR09_create_event`

---

### Story 3.2: Event Capacity Setting

As an **organiser**,
I want **to set a maximum capacity for my event**,
So that **I can manage attendance and venue limits**.

**Acceptance Criteria:**

**Given** an organiser is creating an event
**When** they enter a capacity value (e.g., 30)
**Then** the capacity is saved with the event

**Given** an event has reached capacity
**When** a student views the event
**Then** the RSVP button is disabled
**And** a message displays "Event is full"

**Given** capacity is set to 0 or left blank
**When** the event is created
**Then** the event has unlimited capacity

**Test:** `test_FR11_capacity_limits`

---

### Story 3.3: Publish Event

As an **organiser**,
I want **to publish my event so students can discover it**,
So that **my event appears in search results and on the map**.

**Acceptance Criteria:**

**Given** an organiser has created an event
**When** they click "Publish"
**Then** the event status changes to "published"
**And** the event becomes visible in student event listings

**Given** an event is published
**When** students browse events
**Then** the published event appears in list and map views

**Given** an organiser views their dashboard
**When** they see their events list
**Then** each event shows its status (draft/published)

**Test:** `test_FR10_publish_event`

---

### Story 3.4: View RSVP List

As an **organiser**,
I want **to see who has RSVP'd to my event**,
So that **I can prepare for expected attendance**.

**Acceptance Criteria:**

**Given** an organiser views their event details
**When** they click "View RSVPs"
**Then** a list of attendees displays (name, email, RSVP time)
**And** the total RSVP count is shown

**Given** no one has RSVP'd
**When** the organiser views RSVPs
**Then** a message displays "No RSVPs yet"

**Given** a student cancels their RSVP
**When** the organiser refreshes the RSVP list
**Then** that student no longer appears in the list
**And** the count decreases by 1

**Test:** `test_FR14_view_rsvp_list`

---

## Epic 4: RSVP & Engagement

Students can RSVP to events, view their upcoming events, and cancel if plans change.

### Story 4.1: RSVP Backend Endpoint

As a **system**,
I want **API endpoints for creating and managing RSVPs**,
So that **students can RSVP to events**.

**Acceptance Criteria:**

**Given** an authenticated student calls POST /api/rsvp with event_id
**When** the request is valid
**Then** an RSVP record is created (user_id, event_id, timestamp)
**And** the event's attendee_count increments by 1
**And** response returns 201 Created within 1 second (NFR-03)

**Given** a student tries to RSVP to an event they've already RSVP'd to
**When** POST /api/rsvp is called
**Then** response returns 409 Conflict with "Already RSVP'd"

**Given** a student RSVPs to a full event
**When** capacity is reached
**Then** response returns 400 Bad Request with "Event is full"

**Test:** `test_FR16_create_rsvp`, `test_NFR03_rsvp_performance`

---

### Story 4.2: RSVP Button on Event Details

As a **student**,
I want **to tap/click an RSVP button on an event**,
So that **I can confirm my attendance**.

**Acceptance Criteria:**

**Given** a student views an event they haven't RSVP'd to
**When** the event details load
**Then** an "RSVP" button is displayed
**And** the current attendee count is shown

**Given** a student taps the RSVP button
**When** the RSVP is successful
**Then** a confirmation message displays "You're going!"
**And** the button changes to "Cancel RSVP"
**And** the attendee count increments

**Given** the RSVP fails (network error)
**When** the request fails
**Then** an error message displays "Unable to RSVP. Please try again."

**Test:** `test_FR16_rsvp_ui`

---

### Story 4.3: Cancel RSVP

As a **student**,
I want **to cancel my RSVP if my plans change**,
So that **my spot is freed for another student**.

**Acceptance Criteria:**

**Given** a student has RSVP'd to an event
**When** they tap "Cancel RSVP"
**Then** a confirmation dialog displays "Cancel your RSVP for [Event Name]?"

**Given** the student confirms cancellation
**When** DELETE /api/rsvp/{id} is called
**Then** the RSVP record is removed
**And** the event's attendee_count decrements
**And** the button changes back to "RSVP"

**Given** the student dismisses the confirmation
**When** they tap "No, keep my RSVP"
**Then** the dialog closes and RSVP remains

**Test:** `test_FR17_cancel_rsvp`

---

### Story 4.4: My Events (RSVP List)

As a **student**,
I want **to view all events I've RSVP'd to**,
So that **I can see my upcoming schedule**.

**Acceptance Criteria:**

**Given** a student navigates to "My Events" / "My RSVPs"
**When** the page loads
**Then** a list of their RSVP'd events displays
**And** events are sorted by date (soonest first)
**And** each event shows title, date, time, location

**Given** a student has no RSVPs
**When** the page loads
**Then** a message displays "No upcoming events. Discover events nearby!"
**And** a link to the discovery page is shown

**Given** a student taps an event in their list
**When** the event is selected
**Then** the full event details page opens

**Test:** `test_FR21_my_events`

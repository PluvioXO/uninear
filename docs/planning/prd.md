
# Product Requirements Document - UniNear

**Author:** Ayda Yazdani
**Date:** 2026-02-05

## Executive Summary

**Vision:** UniNear is a university event discovery platform that solves student disconnection by providing a single, location-aware source for campus events.

**Problem:** 44% of UK students report loneliness; event information is fragmented across Instagram, society emails, and word-of-mouth. Students experience search fatigue and miss events happening nearby.

**Differentiator:** Real-time, location-based event discovery with social proof (attendee counts, friend visibility) that makes spontaneous campus engagement frictionless.

**Target Users:**
- **Primary:** University of Bath students seeking social connection and campus activities
- **Secondary:** Society organisers wanting to reach students beyond their existing followers

**Context:** This is a brownfield project with existing React Native mobile app, Next.js web dashboard, and FastAPI backend. D2 coursework submission due 27/03/2026.

## Success Criteria

### User Success
- **Demonstrable features** that map directly to D1B functional requirements (FR-01 through FR-24)
- Working user flows suitable for 5-minute demo video showcasing key interactions
- Minimum demonstrable: Event discovery → filtering → RSVP flow (end-to-end)

### Business Success (Coursework Marks)
- **D2 (7 weeks - due 27/03/2026):** Working implementation with comprehensive test suite, clear requirements traceability, polished presentation
- **D3 (12 weeks):** User evaluation data, iteration evidence, final system demonstration

### Technical Success
- **Testing (22.5% of D2):**
  - Unit tests covering core business logic (models, services)
  - Integration tests validating API endpoints
  - Tests explicitly linked to FR/NFR requirements from D1B
  - CI pipeline (GitHub Actions) running tests on every commit
- **Implementation (17.5% of D2):**
  - Justified tech stack decisions (React Native, Next.js, FastAPI, Supabase, Redis)
  - Clear architecture aligned with D1B design (4+1 views)
  - Version control evidence with meaningful commit history

### Measurable Outcomes
| Metric | Target | Measurement |
|--------|--------|-------------|
| Test coverage | Core business logic covered | pytest + jest reports |
| Requirements traceability | Each test maps to FR/NFR | Test naming convention |
| Demo features | 3+ complete user flows | Video demonstration |
| Presentation | Under 25 minutes | Timed rehearsal |

## Product Scope

### MVP - D2 Deliverable (7 weeks)
**Goal:** Score well on "System Demo" (12.5%) and "Use Cases" (40% of video)

1. **Event Discovery & Filtering** (FR-01, FR-02, FR-03)
   - Display events on map and list views
   - Filter by location radius and time
   - Proves core value proposition

2. **RSVP Flow** (FR-16, FR-17)
   - Students can RSVP to events
   - Students can cancel RSVP
   - Proves engagement mechanism

3. **Organiser Event Creation** (FR-09, FR-10)
   - Create event with required fields
   - Publish event to platform
   - Proves two-sided platform

4. **Authentication** (NFR-07, NFR-08)
   - @bath.ac.uk email verification
   - Secure login flow

### Growth Features (Post-D2, for D3)
- Mood/energy filtering (FR-04, FR-05)
- Friend attendance visibility (FR-06)
- Push notifications (FR-19, FR-20)
- Post-event ratings (FR-22)
- Calendar integration (FR-18)

### Vision (Future/Out of Scope)
- Event aggregation from SU/external sources
- Recommendation algorithm
- Analytics dashboard for organisers (FR-15)

## User Journeys

### Journey 1: Sarah Discovers a Spontaneous Event (Primary - Success Path)

**Persona:** Sarah, 2nd-year Engineering student with fragmented timetable, experiences search fatigue from checking multiple platforms.

**Opening Scene:** Sarah has 90 minutes between her 11am lecture and 1pm lab. She's sitting in the library feeling bored and disconnected from campus life.

**Rising Action:**
1. Opens UniNear app on her phone
2. Sees map view centered on her location with nearby event markers
3. Applies filters: "Next 2 hours" + "Within 500m"
4. Browses 3 matching events: coding workshop (12 attending), coffee meetup (8 attending), meditation session (5 attending)

**Climax:** Sees the coffee meetup has 8 people attending. Taps the event card, reviews details, and hits "RSVP."

**Resolution:** Confirmation appears, event shows in her "My RSVPs" list. She walks 3 minutes to the Parade, meets new people, returns to her lab feeling connected rather than isolated.

**Requirements Revealed:** FR-01 (display events), FR-02 (location filter), FR-03 (time filter), FR-08 (map view), FR-16 (RSVP)

---

### Journey 2: Organiser Creates and Promotes Event (Secondary - Success Path)

**Persona:** Jamie, Drama Society committee member, wants to promote improv night but struggles to reach beyond existing society members.

**Opening Scene:** Jamie has booked a room for Thursday's improv night but their Instagram posts only reach existing followers. They need to attract students outside the Drama bubble.

**Rising Action:**
1. Logs into UniNear web dashboard with @bath.ac.uk credentials
2. Clicks "Create Event" button
3. Fills in event details: title ("Improv Night"), location (3 West), date/time, description, capacity (30), tags (social, performance, creative)
4. Reviews preview and clicks "Publish"

**Climax:** Event goes live immediately. Students browsing "social" events or "this week" can now discover it.

**Resolution:** Over the next 2 days, Jamie sees RSVPs accumulating from students they've never met. The event reaches beyond the Drama Society echo chamber.

**Requirements Revealed:** FR-09 (create event), FR-10 (publish event), FR-11 (capacity tracking)

---

### Journey 3: Student Cancels RSVP (Primary - Edge Case)

**Persona:** Sarah again - demonstrating error recovery flow.

**Opening Scene:** Sarah RSVP'd to a board games event at 4pm, but her lab overruns unexpectedly.

**Rising Action:**
1. Opens UniNear while still in lab
2. Navigates to "My RSVPs" section
3. Sees the board games event she can no longer attend
4. Taps on the event, then taps "Cancel RSVP"

**Climax:** Confirmation dialog: "Cancel your RSVP for Board Games Night?" She confirms.

**Resolution:** RSVP cancelled, her spot freed for another student, organiser's attendee count updates in real-time. No awkward no-show.

**Requirements Revealed:** FR-17 (RSVP cancellation)

---

### Journey Requirements Summary

| Journey | User Type | Key Features Demonstrated | Requirements |
|---------|-----------|---------------------------|--------------|
| Spontaneous Discovery | Student (Primary) | Map view, filters, RSVP | FR-01, FR-02, FR-03, FR-08, FR-16 |
| Event Creation | Organiser (Secondary) | Dashboard, create form, publish | FR-09, FR-10, FR-11 |
| RSVP Cancellation | Student (Primary) | My RSVPs, cancel flow | FR-17 |

**Demo Coverage:** These 3 journeys cover the complete MVP scope and provide clear use cases for the D2 video demonstration.

## Technical Requirements Summary

### Platform Architecture (Reference: D1B Section 2)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Mobile App** | React Native + Expo | Cross-platform iOS/Android, team JS familiarity |
| **Web Dashboard** | Next.js | SSR performance, React ecosystem, Vercel hosting |
| **Backend API** | FastAPI (Python) | Async support, Pydantic validation, type hints |
| **Database** | Supabase (PostgreSQL) | Managed hosting, built-in auth, free tier |
| **Cache** | Redis | Fast event query caching |
| **Maps** | Google Maps API | Familiar UX, comprehensive free tier |

### D2 Implementation Priorities

1. **Must Work for Demo:**
   - Google Maps integration with event markers
   - Location permission handling (iOS/Android)
   - Event filtering API (time, location radius)
   - RSVP create/cancel endpoints
   - Auth with @bath.ac.uk validation

2. **Must Have Tests (22.5% of marks):**
   - Unit tests for models (Event, RSVP, User)
   - Integration tests for API endpoints
   - Test naming convention: `test_FR01_display_events`, `test_FR16_create_rsvp`

3. **Version Control Evidence:**
   - Meaningful commit messages
   - Feature branches merged via PR
   - CI pipeline passing on main

## Implementation Status Assessment

### Current Codebase State (as of 2026-02-05)

| Feature | Backend | Frontend | Mobile | Overall | Priority |
|---------|---------|----------|--------|---------|----------|
| Event Display (FR-01) | 80% | 40% | 70% | **60%** | D2 MVP |
| Event Filtering (FR-02, FR-03) | 70% | 10% | 80% | **55%** | D2 MVP |
| RSVP Flow (FR-16, FR-17) | 5% | 5% | 5% | **5%** | D2 MVP - Critical |
| Event Creation (FR-09, FR-10) | 70% | 30% | N/A | **50%** | D2 MVP |
| Authentication (NFR-07, NFR-08) | 60% | 40% | 30% | **40%** | D2 MVP |

### Critical Gap: API Integration

The frontend and mobile apps currently use **hardcoded/mock data**. Backend endpoints exist but are not connected. This integration work represents the majority of remaining D2 effort.

### D2 Scope Finalization

**Must Complete (Demo-Critical):**
1. RSVP Create/Cancel - Build end-to-end (backend + frontend + mobile)
2. API Integration - Connect existing frontend to existing backend
3. Auth Flow - Wire up @bath.ac.uk validation

**Demonstrate As-Is (After API Integration):**
- Event list/map display
- Filtering by time/location
- Event creation form

**Deferred to D3:**
- Friend attendance visibility (FR-06)
- Push notifications (FR-19, FR-20)
- Mood/energy filtering (FR-04, FR-05)
- Post-event ratings (FR-22)

## Functional Requirements

*Reference: D1B Functional Requirements (FR-01 through FR-24)*

### Event Discovery

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | Students can view a list of upcoming events | D2 MVP |
| FR-02 | Students can filter events by location/radius | D2 MVP |
| FR-03 | Students can filter events by time window | D2 MVP |
| FR-04 | Students can filter events by mood preference | D3 Growth |
| FR-05 | Students can filter events by energy level | D3 Growth |
| FR-06 | Students can see which friends are attending events | D3 Growth |
| FR-07 | Students can search events by keyword | D2 MVP |
| FR-08 | Students can view events on an interactive map | D2 MVP |

### Event Management (Organiser)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-09 | Organisers can create new events with required details | D2 MVP |
| FR-10 | Organisers can publish events to the platform | D2 MVP |
| FR-11 | Organisers can set event capacity limits | D2 MVP |
| FR-12 | Organisers can edit event details after creation | D3 Growth |
| FR-13 | Organisers can cancel events | D3 Growth |
| FR-14 | Organisers can view RSVP list for their events | D2 MVP |
| FR-15 | Organisers can view event analytics dashboard | Vision |

### Event Engagement

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-16 | Students can RSVP to events | D2 MVP |
| FR-17 | Students can cancel their RSVP | D2 MVP |
| FR-18 | Students can add events to their calendar | D3 Growth |
| FR-19 | System sends push notifications for event reminders | D3 Growth |
| FR-20 | System sends push notifications for friend activity | D3 Growth |
| FR-21 | Students can view their upcoming RSVPs ("My Events") | D2 MVP |

### Feedback & Ratings

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-22 | Students can rate events after attending | D3 Growth |
| FR-23 | Students can write event reviews | D3 Growth |
| FR-24 | System displays aggregate ratings on event cards | D3 Growth |

### D2 MVP Functional Requirements

**12 FRs in scope:** FR-01, FR-02, FR-03, FR-07, FR-08, FR-09, FR-10, FR-11, FR-14, FR-16, FR-17, FR-21

## Non-Functional Requirements

*Reference: D1B Non-Functional Requirements (NFR-01 through NFR-20)*

### Security & Authentication

| ID | Requirement | Priority | Testable Criteria |
|----|-------------|----------|-------------------|
| NFR-07 | System validates @bath.ac.uk email addresses | D2 MVP | Regex validation rejects non-Bath emails |
| NFR-08 | User sessions are securely managed | D2 MVP | JWT tokens expire, refresh flow works |
| NFR-09 | Personal data is encrypted at rest | D2 MVP | Supabase encryption enabled |
| NFR-10 | API endpoints require authentication | D2 MVP | Unauthorized requests return 401 |

### Performance

| ID | Requirement | Priority | Testable Criteria |
|----|-------------|----------|-------------------|
| NFR-01 | Event list loads within 2 seconds | D2 MVP | API response time < 2000ms |
| NFR-02 | Map renders within 3 seconds | D2 MVP | Google Maps loads with markers |
| NFR-03 | RSVP action completes within 1 second | D2 MVP | POST /rsvp returns < 1000ms |

### Scalability

| ID | Requirement | Priority | Testable Criteria |
|----|-------------|----------|-------------------|
| NFR-04 | System supports 100 concurrent users | D3 Growth | Load testing validates |
| NFR-05 | Database handles 10,000 events | D3 Growth | Query performance stable |

### Accessibility

| ID | Requirement | Priority | Testable Criteria |
|----|-------------|----------|-------------------|
| NFR-11 | WCAG 2.1 AA compliance for web dashboard | D3 Growth | Automated a11y scan passes |
| NFR-12 | Screen reader compatibility | D3 Growth | VoiceOver/TalkBack tested |

### Integration

| ID | Requirement | Priority | Testable Criteria |
|----|-------------|----------|-------------------|
| NFR-13 | Google Maps API integration | D2 MVP | Map displays, markers render |
| NFR-14 | Supabase database connectivity | D2 MVP | CRUD operations succeed |
| NFR-15 | Redis cache integration | D2 MVP | Cache hit/miss logging works |

### Reliability

| ID | Requirement | Priority | Testable Criteria |
|----|-------------|----------|-------------------|
| NFR-16 | System handles API errors gracefully | D2 MVP | Error states display to user |
| NFR-17 | Offline mode shows cached data | D3 Growth | Mobile works without network |

### D2 MVP Non-Functional Requirements

**10 NFRs in scope:** NFR-01, NFR-02, NFR-03, NFR-07, NFR-08, NFR-09, NFR-10, NFR-13, NFR-14, NFR-15, NFR-16

## Requirements Traceability

### Test Naming Convention

All tests must map to D1B requirements for marking traceability:
- **Functional:** `test_FR01_display_events`, `test_FR16_create_rsvp`
- **Non-Functional:** `test_NFR07_bath_email_validation`, `test_NFR01_event_list_performance`

### D2 Coverage Matrix

| User Journey | Requirements Covered | Test Files Needed |
|--------------|---------------------|-------------------|
| Event Discovery | FR-01, FR-02, FR-03, FR-07, FR-08 | test_events.py, test_filters.py |
| RSVP Flow | FR-16, FR-17, FR-21 | test_rsvp.py |
| Event Creation | FR-09, FR-10, FR-11, FR-14 | test_organizer.py |
| Authentication | NFR-07, NFR-08, NFR-10 | test_auth.py |
| Performance | NFR-01, NFR-02, NFR-03 | test_performance.py |
| Integration | NFR-13, NFR-14, NFR-15 | test_integration.py |

### Document References

- **D1A:** Project Proposal - Problem definition, stakeholder analysis
- **D1B:** Requirements & Design Spec - Full FR/NFR definitions, 4+1 architecture views
- **D2 Spec:** Testing and Implementation marking criteria


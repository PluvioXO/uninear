# Story 2.3: Interactive Map View

Status: ready-for-dev

## Story

As a **student**,
I want **to view events on a map**,
so that **I can see what's happening near my current location**.

## Acceptance Criteria

1. **Given** a student is on the events page, **When** they select the map view toggle, **Then** Google Maps displays centered on campus (Bath coordinates) **And** event markers appear at each event location **And** the map renders within 3 seconds (NFR-02)
2. **Given** a student taps/clicks an event marker, **When** the marker is selected, **Then** an info card displays event title, time, and attendee count **And** a "View Details" button is shown

**Test:** `test_FR08_map_view`, `test_NFR13_google_maps_integration`

## Tasks / Subtasks

- [ ] Task 1: Frontend — add map view to dashboard (AC: 1, 2)
  - [ ] 1.1 Install @react-google-maps/api package in frontend/
  - [ ] 1.2 Create MapView component in frontend/components/MapView.tsx that renders Google Maps centered on Bath (51.3758, -2.3599)
  - [ ] 1.3 Add list/map view toggle to frontend/app/dashboard/page.tsx (similar to mobile's viewMode toggle)
  - [ ] 1.4 Render event markers on map using event latitude/longitude from API response
  - [ ] 1.5 On marker click, show InfoWindow with event title, formatted time, attendee count, and "View Details" button
  - [ ] 1.6 Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY env variable
- [ ] Task 2: Backend — ensure lat/long in event response (AC: 1)
  - [ ] 2.1 Verify GET /events response includes latitude and longitude fields
  - [ ] 2.2 If not present, add latitude/longitude to the select query in src/main.py
- [ ] Task 3: Mobile — verify existing map implementation (AC: 1, 2)
  - [ ] 3.1 Confirm mobile/App.js MapView renders event markers correctly with real API data
  - [ ] 3.2 Verify marker callout shows event info (title, time, attendees)
- [ ] Task 4: Map tests (AC: 1, 2)
  - [ ] 4.1 Add test test_FR08_map_view in frontend/__tests__/ testing: map renders, markers display, info window on click
  - [ ] 4.2 Add test test_NFR13_google_maps_integration verifying map component loads within timeout

## Dev Notes

- **EXISTING CODE:** Mobile has full MapView implementation with react-native-maps — use as reference pattern. Frontend has NO map view — this is net new.
- **Google Maps:** Use @react-google-maps/api (React wrapper). Requires API key in env vars.
- **Bath campus center:** lat: 51.3758, lng: -2.3599 (same as mobile USER_LOCATION)
- **Event coordinates:** Database has latitude/longitude columns on events table. Ensure backend includes them in response.
- **DO NOT** use react-native-maps in frontend — that's mobile only. Use @react-google-maps/api for Next.js.

### Project Structure Notes

- New component: frontend/components/MapView.tsx
- Frontend page: frontend/app/dashboard/page.tsx (add toggle)
- Mobile reference: mobile/App.js (MapView section)
- Env: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

### References

- [Source: mobile/App.js - MapView with markers and callouts]
- [Source: supabase/schema.sql - events table latitude/longitude columns]
- [Source: PRD#FR-08, NFR-02, NFR-13]

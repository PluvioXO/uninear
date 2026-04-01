# Story 2.4: Filter by Location/Radius

Status: ready-for-dev

## Story

As a **student**,
I want **to filter events within a certain distance**,
so that **I only see events I can easily walk to**.

## Acceptance Criteria

1. **Given** a student is viewing events, **When** they set the radius filter to 500m, **Then** only events within 500m of their location (or campus center) display **And** the event count updates to reflect filtered results
2. **Given** a student clears the location filter, **When** the filter is removed, **Then** all events display again

**Test:** `test_FR02_location_filter`

## Tasks / Subtasks

- [ ] Task 1: Backend — add radius filter parameter to GET /events (AC: 1, 2)
  - [ ] 1.1 Add optional query params to GET /events: lat, lng, radius_m (meters)
  - [ ] 1.2 When radius params provided, filter events using Haversine distance calculation in SQL or post-query Python filter
  - [ ] 1.3 When radius params absent, return all events (no filter)
  - [ ] 1.4 Add test test_FR02_location_filter in tests/integration/test_api.py testing: with radius returns only nearby events, without radius returns all
- [ ] Task 2: Frontend — add radius filter UI (AC: 1, 2)
  - [ ] 2.1 Add radius filter dropdown/slider to dashboard event list (options: 100m, 500m, 1km, All)
  - [ ] 2.2 Pass radius params to fetchEvents() API call when filter is active
  - [ ] 2.3 Update event count display when filter changes
  - [ ] 2.4 "All" or clear filter removes radius params from API call
- [ ] Task 3: Frontend filter tests (AC: 1, 2)
  - [ ] 3.1 Add test test_FR02_location_filter in frontend/__tests__/ testing: selecting radius filters event list, clearing filter shows all

## Dev Notes

- **EXISTING CODE:** Mobile already implements client-side Haversine filtering in mobile/App.js (getDistance function). Backend has NO location filtering.
- **Haversine formula:** Already implemented in mobile — port to backend or use PostGIS. Simplest approach: client-side filtering (like mobile) or backend Python filter using math.
- **User location:** Default to Bath campus center (51.3758, -2.3599) if geolocation unavailable. Can use browser geolocation API for actual position.
- **Database:** events table has latitude/longitude columns. No PostGIS extension needed for simple distance calc.
- **Mobile pattern reference:** mobile/App.js getDistance(lat1, lon1, lat2, lon2) returns meters.

### Project Structure Notes

- Backend: src/main.py (GET /events — add query params)
- Frontend: frontend/app/dashboard/page.tsx (add filter UI)
- Mobile reference: mobile/App.js (getDistance function, radius filter state)

### References

- [Source: mobile/App.js - getDistance Haversine function]
- [Source: supabase/schema.sql - events latitude/longitude]
- [Source: PRD#FR-02]

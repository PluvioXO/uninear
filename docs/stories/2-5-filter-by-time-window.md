# Story 2.5: Filter by Time Window

Status: ready-for-dev

## Story

As a **student**,
I want **to filter events by time (e.g., "Next 2 hours", "Today", "This week")**,
so that **I find events that fit my current schedule**.

## Acceptance Criteria

1. **Given** a student is viewing events, **When** they select "Next 2 hours" filter, **Then** only events starting within the next 2 hours display
2. **Given** a student selects "Today" filter, **When** the filter is applied, **Then** only events happening today display
3. **Given** multiple filters are applied (location + time), **When** both filters are active, **Then** events matching BOTH criteria display

**Test:** `test_FR03_time_filter`

## Tasks / Subtasks

- [ ] Task 1: Backend — add time filter parameter to GET /events (AC: 1, 2, 3)
  - [ ] 1.1 Add optional query param time_filter to GET /events with values: "2hr", "today", "week", or omit for all
  - [ ] 1.2 Implement time filtering logic: "2hr" → start_time between now and now+2h, "today" → start_time within today, "week" → start_time within 7 days
  - [ ] 1.3 Ensure time filter works in combination with radius filter (both applied)
  - [ ] 1.4 Add test test_FR03_time_filter in tests/integration/test_api.py
- [ ] Task 2: Frontend — add time filter UI (AC: 1, 2, 3)
  - [ ] 2.1 Add time filter buttons/chips to dashboard: "Next 2 hours", "Today", "This week", "All"
  - [ ] 2.2 Pass time_filter param to fetchEvents() API call
  - [ ] 2.3 Ensure time filter and radius filter can be active simultaneously
  - [ ] 2.4 Active filter should be visually highlighted
- [ ] Task 3: Frontend time filter tests (AC: 1, 2)
  - [ ] 3.1 Add test test_FR03_time_filter in frontend/__tests__/ testing: time filter updates event list, combines with radius filter

## Dev Notes

- **EXISTING CODE:** Mobile has client-side time filtering in mobile/App.js with options: 'now', '1hr', '2hr', 'today', 'week'. Backend has NO time filtering.
- **Backend approach:** Filter in Supabase query using .gte('start_time', start).lte('start_time', end) for the time window.
- **Timezone:** Use UTC for backend queries. Frontend converts to local display time.
- **Combination with location filter:** Both are query params on GET /events — backend applies both when present.

### Project Structure Notes

- Backend: src/main.py (GET /events — add time_filter param)
- Frontend: frontend/app/dashboard/page.tsx (add time filter UI)
- Mobile reference: mobile/App.js (timeRange filter logic)

### References

- [Source: mobile/App.js - timeRange filter options and logic]
- [Source: PRD#FR-03]

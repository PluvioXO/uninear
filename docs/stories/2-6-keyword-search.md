# Story 2.6: Keyword Search

Status: ready-for-dev

## Story

As a **student**,
I want **to search events by keyword**,
so that **I can find specific types of events (e.g., "coding", "sports")**.

## Acceptance Criteria

1. **Given** a student enters "coffee" in the search box, **When** the search is submitted, **Then** events with "coffee" in title or description display
2. **Given** a search returns no results, **When** the results load, **Then** a message displays "No events match your search"
3. **Given** a student clears the search, **When** the search box is emptied, **Then** all events display again

**Test:** `test_FR07_keyword_search`

## Tasks / Subtasks

- [ ] Task 1: Backend — add search parameter to GET /events (AC: 1, 2, 3)
  - [ ] 1.1 Add optional query param search to GET /events
  - [ ] 1.2 When search provided, filter events where title or description contains search term (case-insensitive). Use Supabase .ilike() or .or() with ilike patterns
  - [ ] 1.3 When search cleared/absent, return all events
  - [ ] 1.4 Ensure search works in combination with radius and time filters
  - [ ] 1.5 Add test test_FR07_keyword_search in tests/integration/test_api.py
- [ ] Task 2: Frontend — add search bar (AC: 1, 2, 3)
  - [ ] 2.1 Add search input to dashboard above event list
  - [ ] 2.2 On search submit (Enter or button), pass search param to fetchEvents()
  - [ ] 2.3 Show "No events match your search" when results empty
  - [ ] 2.4 Clear search restores full event list
  - [ ] 2.5 Add debounce (300ms) for search-as-you-type
- [ ] Task 3: Frontend search tests (AC: 1, 2, 3)
  - [ ] 3.1 Add test test_FR07_keyword_search in frontend/__tests__/ testing: search filters results, empty results message, clear restores

## Dev Notes

- **EXISTING CODE:** Mobile has client-side search filtering by title (searchQuery state in mobile/App.js). Backend has NO search.
- **Supabase search:** Use `.or('title.ilike.%${search}%,description.ilike.%${search}%')` for case-insensitive search across title and description.
- **Debounce:** Use setTimeout pattern or a lightweight debounce. Don't add lodash just for this.
- **All filters together:** GET /events?search=coffee&time_filter=today&radius_m=500&lat=51.37&lng=-2.35 — backend applies all.

### Project Structure Notes

- Backend: src/main.py (GET /events — add search param)
- Frontend: frontend/app/dashboard/page.tsx (add search bar)
- Mobile reference: mobile/App.js (searchQuery filter)

### References

- [Source: mobile/App.js - searchQuery state and filtering]
- [Source: PRD#FR-07]

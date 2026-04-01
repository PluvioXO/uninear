# Story 1.4: API Authentication Middleware

Status: ready-for-dev

## Story

As a **system**,
I want **all protected API endpoints to require valid authentication**,
so that **unauthorised users cannot access user data**.

## Acceptance Criteria

1. **Given** a request to a protected endpoint (e.g., /api/events), **When** the request has no Authorization header, **Then** the API returns 401 Unauthorized
2. **Given** a request with a valid JWT token, **When** the token is not expired, **Then** the request proceeds to the endpoint handler
3. **Given** a request with an expired JWT token, **When** the endpoint is called, **Then** the API returns 401 with "Token expired"

**Test:** `test_NFR10_api_authentication`

## Tasks / Subtasks

- [ ] Task 1: Create JWT verification dependency (AC: 1, 2, 3)
  - [ ] 1.1 Create a FastAPI dependency function `verify_token` in src/main.py (or src/auth.py) that: extracts Bearer token from Authorization header, verifies JWT using Supabase client (supabase.auth.get_user(token)), returns user data on success, raises HTTPException(401) on missing/invalid/expired token
  - [ ] 1.2 Distinguish between missing token ("Authorization required"), invalid token ("Invalid token"), and expired token ("Token expired") in error responses
- [ ] Task 2: Apply middleware to protected endpoints (AC: 1, 2, 3)
  - [ ] 2.1 Add `verify_token` dependency to: POST /events, PATCH /events/{id}, DELETE /events/{id}, POST /api/rsvp, DELETE /events/{id}/rsvp, GET /api/rsvp, GET /api/events/{id}/rsvps
  - [ ] 2.2 Keep GET /events public (read-only event listing)
  - [ ] 2.3 Keep POST /auth/signup and POST /auth/login unprotected
  - [ ] 2.4 Pass verified user_id from token to endpoint handlers (replace hardcoded user_id params)
- [ ] Task 3: Update frontend API calls to include auth headers (AC: 2)
  - [ ] 3.1 Create/update an API utility in frontend/lib/ that attaches Authorization: Bearer {token} header using getToken() from auth.ts
  - [ ] 3.2 Ensure all frontend API calls to protected endpoints use this utility
- [ ] Task 4: Comprehensive auth middleware tests (AC: 1, 2, 3)
  - [ ] 4.1 Add test test_NFR10_api_authentication in tests/integration/test_api.py covering: request without token → 401, request with valid token → 200, request with expired token → 401 "Token expired", request with malformed token → 401
  - [ ] 4.2 Update existing integration tests to include auth headers in requests to protected endpoints

## Dev Notes

- **EXISTING CODE:** No auth middleware currently exists. Backend endpoints are unprotected. Supabase RLS provides database-level security but API endpoints need application-level JWT verification.
- **Pattern:** Use FastAPI Depends() for clean dependency injection. Supabase Python client can verify tokens via supabase.auth.get_user(access_token).
- **CRITICAL:** Do NOT break existing tests — update them to mock the auth dependency or provide valid test tokens.
- **Supabase JWT:** Tokens are issued by Supabase Auth. Verify using the Supabase client, NOT manual JWT decoding (Supabase handles key rotation).
- **Keep it simple:** Single verify_token function as a FastAPI dependency. No complex middleware classes needed.

### Project Structure Notes

- Auth dependency: src/main.py (add verify_token function or create src/auth.py)
- Protected endpoints: src/main.py (all write endpoints + RSVP endpoints)
- Frontend API utility: frontend/lib/ (new or extend auth.ts)
- Tests: tests/integration/test_api.py (update all tests)

### References

- [Source: src/main.py - all endpoint definitions]
- [Source: src/database.py - Supabase client initialization]
- [Source: frontend/lib/auth.ts - getToken function]
- [Source: PRD#NFR-10]

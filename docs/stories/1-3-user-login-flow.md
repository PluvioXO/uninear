# Story 1.3: User Login Flow

Status: ready-for-dev

## Story

As a **registered user**,
I want **to log in with my email and password**,
so that **I can access my personalised UniNear experience**.

## Acceptance Criteria

1. **Given** a user is on the login page with valid credentials, **When** they submit the form, **Then** a JWT token is generated and stored **And** the user is redirected to the dashboard
2. **Given** a user enters incorrect credentials, **When** the form is submitted, **Then** an error message displays "Invalid email or password" **And** the user remains on the login page

**Test:** `test_NFR08_user_login`

## Tasks / Subtasks

- [ ] Task 1: Verify backend login endpoint (AC: 1, 2)
  - [ ] 1.1 Confirm POST /auth/login in src/main.py calls supabase.auth.sign_in_with_password and returns session/token data
  - [ ] 1.2 Ensure invalid credentials return clear error (not 500)
  - [ ] 1.3 Add/verify test test_NFR08_user_login in tests/integration/test_api.py covering: valid login returns token, invalid password returns error, non-existent email returns error
- [ ] Task 2: Connect frontend login form to backend (AC: 1, 2)
  - [ ] 2.1 In frontend/app/login/page.tsx, replace mock OTP flow with direct email+password login using frontend/lib/auth.ts login()
  - [ ] 2.2 Simplify login to 2 steps: email+password entry → submit (remove OTP steps)
  - [ ] 2.3 On successful login, store JWT in Supabase session (automatic) and redirect to /dashboard
  - [ ] 2.4 On failed login, display "Invalid email or password" error and remain on login page
  - [ ] 2.5 Add loading state on submit button to prevent double-submission
- [ ] Task 3: Add frontend login tests (AC: 1, 2)
  - [ ] 3.1 Create test test_NFR08_user_login in frontend/__tests__/ testing: successful login redirects, failed login shows error, JWT stored

## Dev Notes

- **EXISTING CODE:** Backend POST /auth/login works — calls sign_in_with_password. Frontend login page exists with multi-step form but uses mock OTP. Frontend auth.ts has login() function.
- **KEY CHANGE:** Simplify login page from 4 steps (email → OTP → password → confirm) to a simple email+password form. Supabase handles JWT automatically via its client library.
- **JWT Storage:** Supabase JS client automatically stores session in localStorage. Use getToken() from auth.ts to retrieve when needed for API calls.
- **DO NOT** implement custom token storage — Supabase client handles this.

### Project Structure Notes

- Frontend login: frontend/app/login/page.tsx
- Auth service: frontend/lib/auth.ts (login, getToken)
- Backend: src/main.py (POST /auth/login)

### References

- [Source: src/main.py - login endpoint]
- [Source: frontend/lib/auth.ts - login function]
- [Source: frontend/app/login/page.tsx - current multi-step form]
- [Source: PRD#NFR-08]

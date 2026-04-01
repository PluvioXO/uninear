# Story 1.2: User Registration Flow

Status: done

## Story

As a **new user**,
I want **to create an account with my Bath email and password**,
so that **I can access UniNear features**.

## Acceptance Criteria

1. **Given** a user is on the signup page, **When** they submit valid @bath.ac.uk email, password (min 8 chars), and name, **Then** the account is created in Supabase **And** the user is redirected to the dashboard
2. **Given** a user submits an email that already exists, **When** the form is submitted, **Then** an error message displays "An account with this email already exists"

**Test:** `test_NFR08_user_registration`

## Tasks / Subtasks

- [x] Task 1: Verify backend signup endpoint (AC: 1, 2)
  - [x] 1.1 Confirm POST /auth/signup in src/main.py creates user via supabase.auth.sign_up with email, password, and metadata (full_name)
  - [x] 1.2 Ensure duplicate email returns appropriate error response (not 500)
  - [x] 1.3 Add/verify test test_NFR08_user_registration in tests/integration/test_api.py covering: successful signup, duplicate email (409 or error), invalid email, weak password
- [x] Task 2: Connect frontend signup form to backend API (AC: 1, 2)
  - [x] 2.1 In frontend/app/signup/page.tsx, replace mock OTP flow with real Supabase signup call using frontend/lib/auth.ts signup()
  - [x] 2.2 On successful signup, redirect to /dashboard using next/navigation router.push
  - [x] 2.3 Handle duplicate email error — display "An account with this email already exists" in the form
  - [x] 2.4 Handle network/server errors with generic error message
  - [x] 2.5 Add password minimum length validation (8 chars) on the password step with inline error
- [x] Task 3: Add frontend registration tests (AC: 1, 2)
  - [x] 3.1 Create test test_NFR08_user_registration in frontend/__tests__/ testing: form submission calls auth.signup, redirect on success, error display on duplicate, password validation

## Dev Notes

- **EXISTING CODE:** Backend POST /auth/signup already works — calls supabase.auth.sign_up with user_metadata containing full_name. Frontend signup page has 5-step Stepper form already built. Frontend auth.ts has signup() function that calls Supabase directly.
- **KEY CHANGE:** Remove mock OTP steps. The signup flow should be: name+society → email (bath validation) → password → review+submit. OTP is Supabase's built-in email confirmation (not custom).
- **DO NOT** implement custom OTP — Supabase handles email verification natively if configured.
- **Supabase client:** Frontend uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env vars.
- **Error handling:** Supabase auth.signUp returns { data, error } — check error.message for "User already registered" pattern.

### Project Structure Notes

- Frontend signup: frontend/app/signup/page.tsx
- Auth service: frontend/lib/auth.ts (signup function)
- Backend endpoint: src/main.py (POST /auth/signup)
- Supabase client: frontend/lib/auth.ts (getSupabaseClient)

### References

- [Source: src/main.py - signup endpoint]
- [Source: frontend/lib/auth.ts - signup function]
- [Source: frontend/app/signup/page.tsx - multi-step form]
- [Source: PRD#NFR-08]

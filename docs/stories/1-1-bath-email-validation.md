# Story 1.1: Bath Email Validation

Status: done

## Story

As a **student or organiser**,
I want **the system to only accept @bath.ac.uk email addresses**,
so that **only University of Bath members can access the platform**.

## Acceptance Criteria

1. **Given** a user is on the registration form, **When** they enter an email that doesn't end with @bath.ac.uk, **Then** the form displays "Only @bath.ac.uk emails are allowed" **And** the submit button remains disabled
2. **Given** a user enters a valid @bath.ac.uk email, **When** they complete other required fields, **Then** the submit button becomes enabled

**Test:** `test_NFR07_bath_email_validation`

## Tasks / Subtasks

- [x] Task 1: Verify backend email validation (AC: 1, 2)
  - [x] 1.1 Confirm UserSignupSchema in src/models.py rejects non-@bath.ac.uk emails with clear error message
  - [x] 1.2 Add/verify unit test test_NFR07_bath_email_validation in tests/unit/test_models.py covering: valid bath email, non-bath email, empty email, malformed email
- [x] Task 2: Wire frontend signup form validation (AC: 1, 2)
  - [x] 2.1 In frontend/app/signup/page.tsx, ensure step 3 (@bath.ac.uk email input) shows inline error "Only @bath.ac.uk emails are allowed" for non-bath emails
  - [x] 2.2 Ensure the "Next" button on step 3 remains disabled until a valid @bath.ac.uk email is entered
  - [x] 2.3 Add frontend test test_NFR07_bath_email_validation in frontend/__tests__/ validating error display and button disable behavior
- [x] Task 3: Wire frontend login form validation (AC: 1)
  - [x] 3.1 In frontend/app/login/page.tsx, add @bath.ac.uk validation on email input step with same error message
  - [x] 3.2 Disable proceed button until valid @bath.ac.uk email entered
- [x] Task 4: Mobile email validation (AC: 1, 2)
  - [x] 4.1 In mobile/App.js profile edit section, validate email field for @bath.ac.uk domain
  - [x] 4.2 Show validation error for non-bath emails

## Dev Notes

- **EXISTING CODE:** Backend validation already exists in src/models.py UserSignupSchema — has a Pydantic validator checking @bath.ac.uk. Frontend signup page already validates on step 3. Main gap is consistent error messaging and login page validation.
- **Pattern:** Use same regex/validation logic across all platforms: `/^[^@]+@bath\.ac\.uk$/i`
- **DO NOT** create new validation utilities — reuse existing patterns in models.py and signup page
- **Testing:** pytest for backend, Jest + Testing Library for frontend. Follow test_NFR07_ naming convention.

### Project Structure Notes

- Backend validation: src/models.py (UserSignupSchema.validate_email)
- Frontend signup: frontend/app/signup/page.tsx (step 3 validation)
- Frontend login: frontend/app/login/page.tsx (needs validation added)
- Mobile: mobile/App.js (profile email validation)
- Backend tests: tests/unit/test_models.py
- Frontend tests: frontend/__tests__/

### References

- [Source: src/models.py - UserSignupSchema validator]
- [Source: frontend/app/signup/page.tsx - step 3 email verification]
- [Source: PRD#NFR-07]
- [Source: Epics Document#Story 1.1]

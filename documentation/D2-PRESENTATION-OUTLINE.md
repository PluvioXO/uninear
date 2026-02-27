# UniNear D2 Presentation Outline

**Target: 18 minutes talk + 2 min buffer + 5 min Q&A = 25 min total**
**All members must present (1-2 slides each)**

---

## SLIDE 1: Title Slide (30 sec)
**Speaker: [Assign]**

- **UniNear** — Discover What's Happening Around You
- Group number, member names, CM22007 Software Engineering
- Date of presentation

---

## SLIDE 2: Introduction — The Problem (1 min)
**Speaker: [Assign]**

**Talking Points:**
- University students miss out on campus events — scattered across Instagram stories, WhatsApp groups, society pages, notice boards
- No single place to discover what's happening nearby *right now*
- Students (especially freshers) struggle with social engagement and event awareness
- Problem validated through stakeholder interviews (reference D1 findings)

**Key stats to include (if you have them from interviews):**
- How many students said they miss events
- Pain points identified in stakeholder engagement

---

## SLIDE 3: Our Solution & Stakeholders (1 min)
**Speaker: Same as Slide 2**

**Talking Points:**
- UniNear: A cross-platform event discovery app for university students
- **Primary stakeholders:** Students (attendees), Event Organisers (societies, SU)
- **Key value proposition:** Real-time, location-based event discovery with RSVP
- Brief mention of 3-tier architecture: Web app + Mobile app + REST API

**Visual:** System overview diagram (you have one in documentation/)

---

## SLIDE 4: System Demo (2.5 min)
**Speaker: [Assign — ideally someone confident with live/video demo]**

**Option A: Live Demo** (higher risk, higher reward)
**Option B: Pre-recorded clips** (safer)
**Option C: Slide walkthrough with screenshots** (safest)

**Demo Flow (pick key user journeys):**
1. **Signup & Login** — Bath email validation, registration stepper, login
2. **Event Discovery** — Dashboard with event cards, sorted by date
3. **RSVP Flow** — Click RSVP, see confirmation, attendee count updates
4. **Organiser View** — Create event form, publish, view RSVPs
5. **Mobile App** — Map view with event markers, filters (time, distance, mood)

**What to emphasise:**
- Real API integration (not mock data)
- Protected endpoints (JWT auth)
- Multi-platform (web + mobile)

---

## SLIDE 5: Task Distribution & Teamwork (1.5 min)
**Speaker: [Assign]**

**Talking Points:**
- Agile methodology: Scrum with 2-week sprints, daily standups
- Jira for task tracking — Epics → Stories → Subtasks with story points
- Mixed-ability pair programming (mention specific examples)
- Code reviews on every PR before merge

**Show a visual (pick one or two):**
- Jira board screenshot (you have Jira.png)
- Sprint plan overview (3 sprints)
- Workload distribution table

**Team Structure:**
| Focus Area | Members |
|---|---|
| Backend (FastAPI, Auth, RSVP) | [Names] |
| Frontend Web (Next.js, Dashboard) | [Names] |
| Mobile (React Native, Maps) | [Names] |
| Testing & QA | [Names] |

**Key point to make:** Everyone contributed across areas — not siloed. Mention peer learning.

---

## SLIDE 6: Test Plan — Strategy & Approach (2 min) ⭐ HIGHEST WEIGHTED SECTION
**Speaker: [Assign — your strongest presenter for this]**

**Talking Points:**
- **Test strategy driven by requirements:** Each FR/NFR mapped to specific tests
- **Testing pyramid approach:**
  - Unit tests (bottom): Pydantic schema validation, component tests
  - Integration tests (middle): API endpoint testing, user flow testing
  - Service tests: Auth, Supabase client, Redis, notifications
  - Performance tests (top): Response time assertions < 1 second

**Show this table:**

| Test Level | Framework | What's Tested | Count |
|---|---|---|---|
| Backend Unit | Pytest | Pydantic schemas, validation | 15 tests |
| Backend Integration | Pytest + TestClient | API endpoints, auth, RSVP | 34 tests |
| Frontend Unit | Jest | API utils, components | 8 tests |
| Frontend Integration | Jest + RTL | Login, signup, dashboard flows | 7 suites |
| Frontend Services | Jest | Auth, Supabase, Redis, notifications | 4 suites |
| Mobile | Jest | App rendering, email validation | 2 suites |
| **Total** | | | **~98 test functions** |

**How requirements informed testing:**
- FR-01 (event display) → test_FR01_display_events_sorted_by_date
- FR-16 (RSVP) → test_FR16_create_rsvp, duplicate check, capacity check
- NFR-07 (Bath email) → 5 dedicated validation tests
- NFR-10 (auth middleware) → 6 tests for token handling
- NFR-03 (performance) → response time assertions

---

## SLIDE 7: Test Plan — Evidence & Results (2 min) ⭐
**Speaker: Same as Slide 6 or another member**

**Talking Points:**
- Show actual test output (screenshot of pytest/jest passing)
- Highlight edge cases tested:
  - Duplicate RSVP returns 409 Conflict
  - Full event returns 400 Bad Request
  - Expired JWT returns 401 Unauthorized
  - Non-Bath email rejected with clear error message
  - Weak password rejected during signup
- How testing fed back into development:
  - Story 1.3 code review: "login hardening and test improvements" (commit message)
  - Story 2.1 code review: "schema consistency, dead code removal, broken UI cleanup"
  - Tests caught issues before merge via CI/CD

**Show:** CI/CD pipeline diagram or screenshot of GitHub Actions passing
- 7 CI jobs: backend-unit, backend-integration, frontend, services, react-native, security-audit, CodeQL SAST
- Runs on every push to main and every PR
- Flake8 linting (max-complexity=10) + ESLint

**DevSecOps in our pipeline (reference Week 22 lectures):**
- **Security Vulnerability Scan job:** `pip-audit` scans Python deps, `npm audit` scans Node deps against known CVE databases
- **CodeQL SAST (Static Application Security Testing):** GitHub's semantic code analysis scans both Python and JavaScript/TypeScript for vulnerabilities (SQL injection, XSS, command injection, etc.) — runs on every PR and weekly on a schedule
- **Dependabot:** Automated weekly dependency scanning across all 4 ecosystems (pip, npm frontend, npm mobile, GitHub Actions). Opens PRs automatically when vulnerable dependencies are found
- These align with the **DevSecOps pipeline stages** shown in the lecture (build → test → security analysis → architectural analysis), using GitHub-native equivalents of the enterprise tools discussed (Parasoft OWASP/CERT/CWE, WhiteSource/Mend.io, Snyk)

**How to present this (linking to lecture content):**
- "We implemented a **DevSecOps** approach as discussed in the Week 22 lectures"
- "Our pipeline includes automated vulnerability scanning using pip-audit and npm audit, similar to the **Snyk/Mend.io** tools referenced in lectures"
- "CodeQL provides **SAST (Static Application Security Testing)**, scanning our Python and TypeScript code for OWASP Top 10 vulnerabilities like SQL injection and XSS — this maps to the **Parasoft OWASP/CERT/CWE** checks shown in the lecture's DevSecOps pipeline example"
- "Dependabot provides **continuous OSS compliance monitoring**, addressing the SBOM concerns raised in the lecture's coverage of **Software of Unknown Provenance (SOUP)**"
- To be transparent about sourcing: cite the lecture slides for the DevSecOps concept and security taxonomy (OWASP/CERT/CWE), then explain you implemented it with GitHub-native tooling (Dependabot, CodeQL, audit commands) as your equivalent of the enterprise tools shown

**Appendix material (submit separately):**
- Full test output logs
- CI/CD workflow YAML (ci.yml + codeql.yml)
- Dependabot configuration
- Test coverage reports (if available)
- Screenshots of GitHub Security tab showing CodeQL results and Dependabot alerts

---

## SLIDE 8: Implementation — Architecture (2 min)
**Speaker: [Assign]**

**Show architecture diagram with these components:**

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Next.js     │     │ React Native│     │  External    │
│  Web App     │     │ Mobile App  │     │  Event APIs  │
│  (Port 3000) │     │ (Expo)      │     │              │
└──────┬───────┘     └──────┬──────┘     └──────┬───────┘
       │                    │                    │
       └────────┬───────────┘                    │
                │                                │
         ┌──────▼───────┐                        │
         │   FastAPI     │◄───────────────────────┘
         │   Backend     │
         │  (Port 8000)  │
         └──────┬────────┘
                │
         ┌──────▼────────┐
         │   Supabase     │
         │  (PostgreSQL   │
         │   + Auth)      │
         └────────────────┘
```

**Tech Stack Rationale (brief — why these choices):**
- **FastAPI:** Fast, type-safe, auto-docs, Python team familiarity
- **Next.js + React:** SSR capability, component ecosystem, TypeScript safety
- **React Native (Expo):** Code sharing with web team, fast prototyping, native maps
- **Supabase:** Managed PostgreSQL + built-in auth, free tier, real-time capabilities
- **GitHub Actions CI/CD:** Free for repos, native GitHub integration

---

## SLIDE 9: Implementation — Process & Stories (2 min)
**Speaker: [Assign]**

**Talking Points:**
- **Epic-driven development** — 4 feature epics mapped to sprints:
  1. Epic 1: Authentication (Stories 1.1–1.4) → Sprint 1 ✅
  2. Epic 4: RSVP & Engagement (Stories 4.1–4.2) → Sprint 1 ✅
  3. Epic 2: Event Discovery (Stories 2.1–2.3) → Sprint 2 (in progress)
  4. Epic 3: Event Management (Stories 3.1–3.2) → Sprint 2 (in progress)

- **Version control workflow:**
  - Feature branches per epic (e.g., `epic-2/event-discovery`)
  - PRs with code review before merge to main
  - CI runs all tests on every PR

- **Key implementation decisions:**
  - JWT-based auth over session cookies (stateless, mobile-friendly)
  - Pydantic schemas for request validation (catches bad data at the boundary)
  - CORS middleware for cross-origin web/mobile access
  - Database-level capacity enforcement for RSVP (not just UI)

- **Challenges faced:**
  - [Add your real challenges here — e.g., Supabase RLS configuration, CORS issues, state management across platforms]

---

## SLIDE 10: Critical Reflection (1.5 min)
**Speaker: [Assign]**

**What went well:**
- Agile workflow kept us on track — Jira, standups, sprints
- Test-first approach caught bugs early (e.g., auth middleware edge cases)
- Code reviews improved code quality (commit messages show iterations)
- CI/CD prevented broken code from reaching main

**What we'd do differently:**
- Start frontend-backend integration earlier (avoid mock data phase)
- More consistent test coverage across mobile (currently lighter)
- Better estimation of story points — some stories took longer than expected
- [Add honest reflections — markers reward genuine critical thinking]

**Lessons learned:**
- Requirements traceability (FR → test) made testing much more focused
- Mixed-ability pairing helped less experienced members ramp up
- Automated CI/CD is worth the upfront setup cost

---

## SLIDE 11: Conclusion & Next Steps (1 min)
**Speaker: [Assign]**

**Current state:**
- Core auth + RSVP flows working end-to-end (web + API)
- Event discovery with real API integration
- 98 tests across all platforms, CI/CD enforced
- Mobile app with map view and filters

**Next steps toward D3 (Evaluation):**
- Complete remaining event discovery features (map on web, filters, search)
- **Heuristic evaluation** of the interface using Nielsen's 10 heuristics
- **Cognitive walkthrough** of key user tasks (e.g., discovering and RSVPing to an event)
- **User study** with 10+ participants:
  - A/B test: e.g., list view vs. map view for event discovery
  - Metrics: task completion time, number of interactions, SUS score
  - Statistical analysis of results

**Visual:** Timeline/Gantt showing D3 milestones

---

## SLIDE 12: Thank You & Q&A (buffer)
**Speaker: All**

- "Thank you — we're happy to take questions"
- Be prepared for questions about:
  - Testing approach and coverage
  - Architecture decisions
  - How you handled team coordination
  - What you'd change
  - Security considerations (JWT, email validation)

---

# TIMING SUMMARY

| Slide | Topic | Time | Cumulative |
|---|---|---|---|
| 1 | Title | 0:30 | 0:30 |
| 2 | Problem | 1:00 | 1:30 |
| 3 | Solution & Stakeholders | 1:00 | 2:30 |
| 4 | Demo | 2:30 | 5:00 |
| 5 | Teamwork | 1:30 | 6:30 |
| 6 | Test Plan — Strategy | 2:00 | 8:30 |
| 7 | Test Plan — Evidence | 2:00 | 10:30 |
| 8 | Implementation — Arch | 2:00 | 12:30 |
| 9 | Implementation — Process | 2:00 | 14:30 |
| 10 | Critical Reflection | 1:30 | 16:00 |
| 11 | Conclusion & Next Steps | 1:00 | 17:00 |
| 12 | Q&A | 1:00 | 18:00 |
| | **Buffer** | **2:00** | **20:00** |

---

# SPEAKER ASSIGNMENT TEMPLATE

| Member | Slides | Topic | Time |
|---|---|---|---|
| Member 1 | 2-3 | Introduction & Problem | 2 min |
| Member 2 | 4 | System Demo | 2.5 min |
| Member 3 | 5 | Teamwork & Task Distribution | 1.5 min |
| Member 4 | 6 | Test Strategy | 2 min |
| Member 5 | 7 | Test Evidence & CI/CD | 2 min |
| Member 6 | 8 | Architecture & Tech Stack | 2 min |
| Member 7 | 9 | Implementation Process | 2 min |
| Member 8 | 10-11 | Reflection & Next Steps | 2.5 min |

Adjust based on team size (7-9 members). Some slides can be split further.

---

# MARK-MAXIMISING TIPS

1. **Testing (22.5%)** — This is your biggest section. Show the requirement-to-test traceability clearly. Include a table mapping FRs/NFRs to specific test names. Show CI/CD as evidence of continuous testing.

2. **Implementation (17.5%)** — Don't just list tech. Explain *why* you chose it. Show the architecture diagram. Reference specific stories/epics.

3. **Presentation skills (12.5%)** — Rehearse. Time yourselves. Use consistent slide design. No walls of text.

4. **Demo (12.5%)** — Keep it focused on 2-3 key user journeys. Don't try to show everything. Make sure it works.

5. **Time management (10%)** — Stay under 20 minutes. This is free marks if you rehearse.

6. **Q&A (part of 10%)** — Prepare answers for obvious questions. Everyone should be able to answer about their section.

7. **Critical Reflection (7.5%)** — Be honest. Markers reward genuine reflection over "everything was perfect." Mention what you'd improve.

8. **Introduction (7.5%)** — Keep it brief. Don't spend 3 minutes on background. Get to the demo quickly.

9. **Appendices** — Put detailed test outputs, full CI/CD config, and extra screenshots in appendices. Reference them during the talk ("full test logs are in Appendix A").

---

# EVIDENCE FROM CODEBASE (Reference Material)

## Test Count by Category
- Backend unit tests (Pydantic schemas): 15 functions in tests/unit/test_models.py
- Backend integration tests (API): 34 functions in tests/integration/test_api.py
- Frontend integration tests: 7 suites (dashboard, login, signup, analytics, settings)
- Frontend unit tests: 1 suite (api.test.ts)
- Frontend service tests: 4 suites (auth, supabase, redis, notifications)
- Frontend component tests: 2 suites (SpotlightCard, Stepper)
- Mobile tests: 2 suites (App render, email validation)

## API Endpoints (10 total)
- GET / — Health check
- GET /events — List published events (public)
- POST /events — Create event (protected)
- PATCH /events/{id} — Update event (protected)
- DELETE /events/{id} — Delete event (protected)
- POST /auth/signup — Register user
- POST /auth/login — Login user
- POST /api/rsvp — Create RSVP (protected)
- DELETE /events/{id}/rsvp — Cancel RSVP (protected)
- GET /api/rsvp — Get user's RSVPs (protected)
- GET /api/events/{id}/rsvps — Get event RSVPs (protected)

## CI/CD Pipeline (7 jobs + Dependabot)

### ci.yml (runs on every push/PR to main)
1. test-backend-unit (Python 3.10, flake8 + pytest)
2. test-backend-integration (Python 3.10, Supabase secrets)
3. test-frontend (Node 20, build + lint + test)
4. test-services (Jest service tests)
5. test-react-native (conditional mobile tests)
6. security-audit — DevSecOps: pip-audit (Python CVEs) + npm audit (Node CVEs)

### codeql.yml (SAST — runs on push/PR + weekly schedule)
7. CodeQL analysis — scans Python and JavaScript/TypeScript for OWASP vulnerabilities (SQL injection, XSS, command injection, etc.)

### dependabot.yml (continuous OSS monitoring)
- Weekly scans of pip, npm (frontend), npm (mobile), and GitHub Actions dependencies
- Auto-opens PRs when vulnerable dependencies are detected
- Equivalent to Snyk/Mend.io/Black Duck tools discussed in Week 22 lectures

### Pipeline mapped to lecture's DevOps model
```
Build        → Static Analysis  → Unit Tests    → Integration Tests → Security Scan         → SAST
npm build      flake8, ESLint     pytest, Jest     pytest, Jest       pip-audit, npm audit    CodeQL (OWASP)
```
This maps to the lecture's T(x) pipeline: Build → Static Code Analysis → Unit Testing → Functional Tests → Non-Functional Tests, with the addition of a DevSecOps security analysis stage.

## Key Commits Showing Testing Process
- "Story 1.3 code review fixes: login hardening and test improvements"
- "Story 2.1 code review fixes: schema consistency, dead code removal, broken UI cleanup"
- "Story 1.4: API authentication middleware with JWT verification and code review fixes"
- "Story 2.1: Event list display with API integration"

## Requirement-to-Test Traceability Table
| Requirement | Test(s) | Status |
|---|---|---|
| FR-01: Display events sorted | test_FR01_display_events_sorted_by_date | ✅ |
| FR-01: Empty state | test_FR01_display_events_empty | ✅ |
| FR-16: Create RSVP | test_FR16_create_rsvp | ✅ |
| FR-16: No duplicates | test_FR16_duplicate_rsvp_returns_409 | ✅ |
| FR-16: Capacity check | test_FR16_rsvp_at_capacity_returns_400 | ✅ |
| FR-17: Cancel RSVP | test_FR17_cancel_rsvp_decrements_count | ✅ |
| FR-21: View my RSVPs | test_FR21_get_user_rsvps_with_event_data | ✅ |
| FR-14: Organiser RSVPs | test_FR14_get_event_rsvps | ✅ |
| NFR-01: Performance | test_NFR01_event_list_performance (< 1s) | ✅ |
| NFR-03: RSVP performance | test_NFR03_rsvp_performance (< 1s) | ✅ |
| NFR-07: Bath email | test_NFR07_* (5 tests) | ✅ |
| NFR-08: Auth flows | test_NFR08_* (8 tests) | ✅ |
| NFR-10: JWT middleware | test_NFR10_* (6 tests) | ✅ |
| NFR-14: API integration | test_NFR14_* (2 tests) | ✅ |

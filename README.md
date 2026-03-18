# UniNear

**UniNear** is a university event discovery platform that helps students find and attend campus events, and gives society organisers the tools to create, publish, and manage events with real-time RSVP tracking. Built as part of CM22007 Software Engineering at the University of Bath.

## Project Overview

This is a **monorepo** containing three applications:

1. **Web Dashboard (`/frontend`)** — Next.js app for both attendees (event discovery, RSVP, map view) and organisers (event creation, RSVP management, settings).
2. **Mobile App (`/mobile`)** — React Native (Expo) app for on-the-go event discovery with map view, filtering, and RSVP.
3. **Backend API (`/src`)** — FastAPI service handling authentication, event CRUD, RSVP management, and user profiles.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Web Frontend | Next.js 15, TypeScript, Tailwind CSS | Attendee + organiser dashboard |
| Mobile | React Native, Expo | Cross-platform attendee app |
| Backend | FastAPI, Python | REST API, business logic |
| Database | Supabase (PostgreSQL) | Data persistence, Row-Level Security |
| Auth | Supabase Auth (JWT) | @bath.ac.uk email validation, sessions |
| Storage | Supabase Storage | Avatar/logo uploads |
| Maps | Leaflet (web), Google Maps (mobile) | Event location display + selection |
| CI/CD | GitHub Actions | Automated testing, CodeQL analysis |

## Getting Started

### Prerequisites
- **Node.js** v18+
- **Python** 3.9+
- A **Supabase** project with the required tables (see `supabase/schema.sql`)

### 1. Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables (copy .env.example or create .env)
# Required: SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_ROLE_KEY

# Run the server
uvicorn src.main:app --host 127.0.0.1 --port 8000
```

The API will be available at `http://localhost:8000`.

### 2. Web Frontend

```bash
cd frontend
npm install

# Set environment variables in .env.local
# Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

npm run dev
```

The web app will be available at `http://localhost:3000`.

### 3. Mobile App

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

## Features

### For Attendees
- **Event Discovery** — browse upcoming events in list or interactive map view
- **Filtering** — filter by time window (next 2 hours, today, this week), distance radius, and keyword search
- **RSVP** — register for events with real-time capacity tracking, cancel anytime
- **My RSVPs** — view all events you've registered for in one place
- **Profile Settings** — update your name, bio, avatar, and notification preferences

### For Organisers
- **Event Creation** — create events with title, location (map picker), capacity, date/time, mood tags, and energy level
- **Publish/Draft** — save events as drafts and publish when ready
- **RSVP Management** — view attendee lists with names and emails for your events
- **Society Settings** — manage society name, description, contact details, and logo
- **Real-time Activity** — see recent RSVPs and event activity on your dashboard

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/events` | No | List published events (with filtering) |
| POST | `/events` | Yes | Create event |
| PATCH | `/events/{id}` | Yes | Update event (owner only) |
| DELETE | `/events/{id}` | Yes | Delete event |
| POST | `/api/rsvp` | Yes | RSVP to an event |
| GET | `/api/rsvp` | Yes | Get user's RSVPs |
| DELETE | `/events/{id}/rsvp` | Yes | Cancel RSVP |
| GET | `/api/organizer/events` | Yes | Get organiser's events |
| GET | `/api/events/{id}/rsvps` | Yes | Get attendee list (owner only) |
| GET | `/api/activity` | No | Recent platform activity |
| GET | `/auth/profile` | Yes | Get user profile |
| PATCH | `/auth/profile` | Yes | Update user profile |
| POST | `/auth/avatar` | Yes | Upload avatar image |
| POST | `/auth/signup` | No | Register (@bath.ac.uk only) |
| POST | `/auth/login` | No | Sign in |
| POST | `/auth/forgot-password` | No | Request password reset |
| DELETE | `/auth/account` | Yes | Delete account |

## Testing

```bash
# Backend tests (83 tests)
python -m pytest tests/ -q

# Frontend tests
cd frontend && npx jest
```

## Team

University of Bath — CM22007 Software Engineering, 2025-26

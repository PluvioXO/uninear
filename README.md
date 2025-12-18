# Uninear

**Uninear** is a comprehensive community event management platform designed to foster engagement and social connection. It provides organizers with powerful tools to create, manage, and analyze events based on mood, energy, and attendance trends, moving beyond simple ticketing to true community building.

## Project Overview

This repository is a **monorepo** containing the three core components of the Uninear ecosystem:

1.  **Web Dashboard (`/frontend`)**: A Next.js application for event organizers to create events, view analytics, and manage their community.
2.  **Mobile App (`/mobile`)**: A React Native (Expo) application for attendees to discover events, view details, and check in.
3.  **Backend API (`/src`)**: A robust FastAPI (Python) service that powers data persistence, authentication, and business logic.

---

## Tech Stack

### **Frontend (Web Dashboard)**
-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Language**: TypeScript
-   **Visuals**: React Three Fiber / Drei (3D Elements), Framer Motion
-   **Key Features**:
    -   Historical Attendance Analytics
    -   Event Creation with Mood & Energy tagging
    -   Interactive Landing Page

### **Mobile (Attendee App)**
-   **Framework**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
-   **Maps**: Google Maps Integration
-   **Language**: TypeScript / JavaScript

### **Backend (API)**
-   **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
-   **Language**: Python 3.x
-   **Database**: SQLite (Development) / PostgreSQL (Production ready)
-   **Testing**: Pytest

---

## Getting Started

### Prerequisites
-   **Node.js** (v18+ recommended)
-   **Python** (v3.9+)
-   **npm** or **yarn**

### 1. Backend Setup
The backend serves as the foundation for both the web and mobile apps.

```bash
# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python run.py
```
*The API will be available at `http://localhost:8000`*

### 2. Frontend (Web) Setup
The organizer dashboard.

```bash
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
*The web app will be available at `http://localhost:3000`*

### 3. Mobile Setup
The attendee experience.

```bash
cd mobile

# Install dependencies
npm install

# Start the Expo server
npx expo start
```
*Scan the QR code with the Expo Go app on your phone.*

---

## Key Features

### For Organizers (Web)
-   **Event Creation**: Detailed event setup including location, time, and specific "Mood" and "Energy" tags to set expectations.
-   **Analytics Dashboard**: Visualize historical attendance trends to understand community growth.
-   **Community Focus**: Tools designed for engagement rather than just transaction/sales.

### For Attendees (Mobile)
-   **Discovery**: Find events based on location and vibe.
-   **Real-time Updates**: Get the latest information on event status.

---

## Testing

To run the backend test suite:

```bash
# Ensure venv is active
pytest
```

## License

This project is proprietary software. All rights reserved.

# E2E Testing Report

**Date:** 2026-05-03
**Status:** BLOCKED (Environment Issue)

## Overview
This report covers the end-to-end testing scenarios for the Dexa Attendance System. The testing suite covers both Employee and HRD Admin Application workflows.

## Environment Status
- **Frontend (Employee App):** Running (Tested via Unit Tests: 15/15 passed)
- **Frontend (HRD Admin App):** Running (Tested via Unit Tests: 4/4 passed)
- **Backend (API):** 🔴 **DOWN** (Crash on startup)
- **Database (PostgreSQL / Redis / MinIO):** 🔴 **DOWN** (Docker daemon is not running)

> **Note on CORS Error:** The reported CORS error during manual login testing is a direct result of the Backend API being down. Because the API process crashed, it could not return the `Access-Control-Allow-Origin` headers, resulting in a network failure that the browser interprets as a CORS error.

## Test Scenarios

### 1. Employee Flow
| ID | Scenario | Expected Result | Status |
|---|---|---|---|
| E-01 | Login with valid employee credentials | Redirects to `/profile` | ⏳ Pending (Backend Down) |
| E-02 | View Profile Data | Shows name, position, email, phone | ⏳ Pending (Backend Down) |
| E-03 | Update Phone Number | Saves new phone number | ⏳ Pending (Backend Down) |
| E-04 | Check-in via Attendance Page | Records check-in, disables button | ⏳ Pending (Backend Down) |
| E-05 | Check-out via Attendance Page | Records check-out, marks complete | ⏳ Pending (Backend Down) |
| E-06 | View Attendance Summary | Shows today's record accurately | ⏳ Pending (Backend Down) |

### 2. HRD Admin Flow
| ID | Scenario | Expected Result | Status |
|---|---|---|---|
| A-01 | Login with valid admin credentials | Redirects to `/employees` | ⏳ Pending (Backend Down) |
| A-02 | Create New Employee | Employee is created, list refreshes | ⏳ Pending (Backend Down) |
| A-03 | View Attendance Table | Shows all employee check-in/out | ⏳ Pending (Backend Down) |
| A-04 | Receive FCM Notification | Toast appears when profile updated | ⏳ Pending (Backend Down) |

## Next Steps
1. **Start Docker Daemon:** Please open Docker Desktop on your Mac to start the Docker engine.
2. **Start Infrastructure:** Run `docker compose up -d` to spin up PostgreSQL (main & audit), RabbitMQ, MinIO, and GlitchTip.
3. **Restart API:** The backend API will automatically connect and the CORS/login issues will be resolved.

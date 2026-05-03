# Technical Development Plan
## Employee Attendance & HR Monitoring System

**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** 2025-01-01

---

## Table of Contents

1. [Repository Structure](#repository-structure)
2. [Database Schema](#database-schema)
3. [API Contract](#api-contract)
4. [Infrastructure & Docker](#infrastructure--docker)
5. [Environment Variables](#environment-variables)
6. [Implementation Phases](#implementation-phases)
7. [Phase Checklists](#phase-checklists)
8. [Documentation Rules](#documentation-rules)
9. [Document Change Log](#document-change-log)

---

## Repository Structure

```
attendance-system/
├── apps/
│   ├── employee-app/              # React + Vite — Employee-facing UI
│   │   ├── src/
│   │   │   ├── components/        # Reusable UI components
│   │   │   ├── pages/             # Route-level pages
│   │   │   ├── hooks/             # Custom React hooks
│   │   │   ├── lib/               # API client, utils
│   │   │   └── main.tsx
│   │   ├── public/
│   │   │   └── firebase-messaging-sw.js   # FCM service worker
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── hrd-admin-app/             # React + Vite — HR Admin UI
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   └── lib/
│   │   └── package.json
│   │
│   └── api/                       # NestJS — API Gateway + All Service Modules
│       ├── src/
│       │   ├── main.ts
│       │   ├── app.module.ts
│       │   ├── modules/
│       │   │   ├── auth/           # Auth module (login, JWT)
│       │   │   ├── employee/       # Employee CRUD + profile update
│       │   │   ├── attendance/     # Check-in/check-out + summary
│       │   │   ├── notification/   # Firebase FCM dispatcher
│       │   │   └── audit/          # RabbitMQ consumer → audit DB
│       │   ├── common/
│       │   │   ├── guards/         # JwtAuthGuard, RolesGuard
│       │   │   ├── decorators/     # @CurrentUser, @Roles
│       │   │   ├── filters/        # GlobalExceptionFilter → Sentry
│       │   │   ├── interceptors/   # LoggingInterceptor
│       │   │   └── dto/            # Shared DTOs
│       │   └── prisma/             # PrismaService
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts
│       ├── Dockerfile
│       └── package.json
│
├── packages/
│   ├── types/                     # Shared TypeScript interfaces & enums
│   │   ├── src/
│   │   │   ├── employee.ts
│   │   │   ├── attendance.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── ui/                        # Shared shadcn/ui base components
│       ├── src/
│       │   ├── button.tsx
│       │   ├── input.tsx
│       │   └── index.ts
│       └── package.json
│
├── docs/
│   ├── PRD.md
│   ├── USER_STORIES.md
│   ├── TECHNICAL_PLAN.md          # This file
│   └── API_CONTRACT.md            # Auto-updated on every API change
│
├── docker/
│   ├── docker-compose.yml         # Production
│   ├── docker-compose.dev.yml     # Development overrides
│   ├── postgres/
│   │   └── init.sql               # Create main + audit databases
│   └── sentry/
│       └── sentry.conf.py
│
├── turbo.json
├── package.json                   # Root workspace
├── .env.example
└── README.md
```

---

## Database Schema

### Main Database (`attendance_db`)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum AttendanceStatus {
  CHECK_IN
  CHECK_OUT
}

enum UserRole {
  EMPLOYEE
  ADMIN
}

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  name        String
  position    String
  phone       String?
  photoUrl    String?
  role        UserRole @default(EMPLOYEE)
  fcmToken    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  attendances Attendance[]

  @@map("users")
}

model Attendance {
  id        String           @id @default(uuid())
  userId    String
  status    AttendanceStatus
  timestamp DateTime         @default(now())
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id])

  @@map("attendances")
}
```

### Audit Database (`audit_db`)

```prisma
// Second Prisma schema (separate datasource URL)

model AuditLog {
  id           String   @id @default(uuid())
  employeeId   String
  employeeName String
  fieldChanged String
  oldValue     String?
  newValue     String?
  changedAt    DateTime @default(now())

  @@map("audit_logs")
}
```

> **Note:** The audit database uses a separate `PrismaClient` instance initialized with `AUDIT_DATABASE_URL`.

---

## API Contract

> **Rule:** This section is the living API contract. Every new endpoint or change to request/response shape **must** be reflected here before the PR is merged.

### Base URL
```
Development:  http://localhost:3000/api
Production:   https://<your-domain>/api
```

### Authentication Header
All protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

### Auth

#### `POST /auth/login`
Login with email and password.

**Request:**
```json
{
  "email": "john@company.com",
  "password": "secret123"
}
```

**Response `200`:**
```json
{
  "accessToken": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@company.com",
    "role": "EMPLOYEE",
    "position": "Software Engineer",
    "phone": "08123456789",
    "photoUrl": "https://minio.../photo.jpg"
  }
}
```

**Response `401`:**
```json
{ "statusCode": 401, "message": "Invalid email or password" }
```

---

### Employee

#### `GET /employees/me` 🔒
Get the logged-in employee's profile.

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@company.com",
  "position": "Software Engineer",
  "phone": "08123456789",
  "photoUrl": "https://minio.../photo.jpg"
}
```

---

#### `PATCH /employees/me/phone` 🔒
Update phone number.

**Request:**
```json
{ "phone": "08199998888" }
```

**Response `200`:**
```json
{ "message": "Phone number updated successfully" }
```

---

#### `PATCH /employees/me/password` 🔒
Change password.

**Request:**
```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass123"
}
```

**Response `200`:**
```json
{ "message": "Password changed successfully" }
```

**Response `400`:**
```json
{ "statusCode": 400, "message": "Current password is incorrect" }
```

---

#### `GET /employees/me/upload-url` 🔒
Get a MinIO pre-signed PUT URL for photo upload.

**Query:** `?filename=photo.jpg&contentType=image/jpeg`

**Response `200`:**
```json
{
  "uploadUrl": "https://minio.../bucket/path/photo.jpg?X-Amz-...",
  "fileUrl": "https://minio.../bucket/path/photo.jpg"
}
```

---

#### `PATCH /employees/me/photo` 🔒
Confirm photo upload — saves the `fileUrl` to the user record after the browser has already uploaded to MinIO.

**Request:**
```json
{ "photoUrl": "https://minio.../bucket/path/photo.jpg" }
```

**Response `200`:**
```json
{ "message": "Photo updated successfully", "photoUrl": "https://..." }
```

---

#### `GET /employees` 🔒 `[ADMIN]`
Get paginated list of all employees.

**Query:** `?page=1&limit=10&search=john`

**Response `200`:**
```json
{
  "data": [
    { "id": "uuid", "name": "John Doe", "email": "...", "position": "...", "phone": "..." }
  ],
  "total": 42,
  "page": 1,
  "limit": 10
}
```

---

#### `POST /employees` 🔒 `[ADMIN]`
Create a new employee account.

**Request:**
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "position": "Designer",
  "phone": "08111222333",
  "password": "initialPass123"
}
```

**Response `201`:**
```json
{ "id": "uuid", "name": "Jane Smith", "email": "jane@company.com" }
```

---

#### `PATCH /employees/:id` 🔒 `[ADMIN]`
Update employee data (name, position, phone).

**Request:**
```json
{ "name": "Jane A. Smith", "position": "Senior Designer" }
```

**Response `200`:**
```json
{ "id": "uuid", "name": "Jane A. Smith", "position": "Senior Designer" }
```

---

#### `GET /employees/:id` 🔒 `[ADMIN]`
Get single employee detail.

**Response `200`:** Same shape as `GET /employees/me`.

---

### Attendance

#### `POST /attendances/check-in` 🔒
Submit a check-in record.

**Response `201`:**
```json
{
  "id": "uuid",
  "status": "CHECK_IN",
  "timestamp": "2025-01-15T08:32:00.000Z"
}
```

**Response `409`:**
```json
{ "statusCode": 409, "message": "You have already checked in today" }
```

---

#### `POST /attendances/check-out` 🔒
Submit a check-out record.

**Response `201`:**
```json
{
  "id": "uuid",
  "status": "CHECK_OUT",
  "timestamp": "2025-01-15T17:05:00.000Z"
}
```

**Response `409`:**
```json
{ "statusCode": 409, "message": "You must check in before checking out" }
```

---

#### `GET /attendances/me` 🔒
Get the logged-in employee's attendance summary.

**Query:** `?from=2025-01-01&to=2025-01-31`

**Response `200`:**
```json
{
  "data": [
    {
      "date": "2025-01-15",
      "checkIn": "2025-01-15T08:32:00.000Z",
      "checkOut": "2025-01-15T17:05:00.000Z"
    },
    {
      "date": "2025-01-14",
      "checkIn": "2025-01-14T08:45:00.000Z",
      "checkOut": null
    }
  ]
}
```

---

#### `GET /attendances` 🔒 `[ADMIN]`
Get all employees' attendance (admin only).

**Query:** `?page=1&limit=10&employeeName=john&from=2025-01-01&to=2025-01-31`

**Response `200`:**
```json
{
  "data": [
    {
      "employeeId": "uuid",
      "employeeName": "John Doe",
      "date": "2025-01-15",
      "checkIn": "2025-01-15T08:32:00.000Z",
      "checkOut": "2025-01-15T17:05:00.000Z"
    }
  ],
  "total": 85,
  "page": 1,
  "limit": 10
}
```

---

### Notification

#### `POST /notifications/fcm-token` 🔒
Register or update the FCM device token for the current admin user.

**Request:**
```json
{ "token": "fcm_device_token_string" }
```

**Response `200`:**
```json
{ "message": "FCM token registered" }
```

---

## Infrastructure & Docker

### Services (docker-compose.yml)

| Service | Image | Port | Description |
|---|---|---|---|
| `api` | Custom Dockerfile | 3000 | NestJS API |
| `employee-app` | Custom Dockerfile | 3001 | Employee React App |
| `hrd-admin-app` | Custom Dockerfile | 3002 | HRD Admin React App |
| `postgres` | `postgres:16-alpine` | 5432 | Main PostgreSQL DB |
| `postgres-audit` | `postgres:16-alpine` | 5433 | Audit PostgreSQL DB |
| `rabbitmq` | `rabbitmq:3-management` | 5672 / 15672 | Message broker |
| `minio` | `minio/minio` | 9000 / 9001 | Object storage |
| `sentry` | `sentry:latest` + Redis + Worker | 9000 | Error tracking |

### Key Docker Compose Snippets

```yaml
# docker-compose.yml (abbreviated)
version: "3.9"

services:
  api:
    build: ./apps/api
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/attendance_db
      - AUDIT_DATABASE_URL=postgresql://user:pass@postgres-audit:5433/audit_db
      - RABBITMQ_URL=amqp://user:pass@rabbitmq:5672
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - SENTRY_DSN=${SENTRY_DSN}
    depends_on:
      - postgres
      - postgres-audit
      - rabbitmq
      - minio

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: attendance_db

  rabbitmq:
    image: rabbitmq:3-management
    ports: ["5672:5672", "15672:15672"]
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports: ["9000:9000", "9001:9001"]
    volumes:
      - minio_data:/data
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin

volumes:
  postgres_data:
  rabbitmq_data:
  minio_data:
```

---

## Environment Variables

```bash
# .env.example — copy to .env and fill in values

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/attendance_db
AUDIT_DATABASE_URL=postgresql://user:pass@localhost:5433/audit_db

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=8h

# RabbitMQ
RABBITMQ_URL=amqp://user:pass@localhost:5672
RABBITMQ_QUEUE_PROFILE_UPDATE=employee.profile.updated

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=attendance-photos

# Sentry
SENTRY_DSN=https://xxx@sentry.your-domain.com/1

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# Frontend (Vite)
VITE_API_BASE_URL=http://localhost:3000/api
VITE_FIREBASE_API_KEY=your-web-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

---

## Implementation Phases

### Phase Overview

| Phase | Focus | Estimated Duration |
|---|---|---|
| Phase 0 | Project Setup & Infrastructure | 2–3 days |
| Phase 1 | Auth Service | 2 days |
| Phase 2 | Employee Service | 3 days |
| Phase 3 | MinIO Upload Integration | 1 day |
| Phase 4 | Attendance Service | 2 days |
| Phase 5 | RabbitMQ Audit Logging | 1–2 days |
| Phase 6 | Firebase FCM Notification | 1–2 days |
| Phase 7 | Employee App (Frontend) | 5–7 days |
| Phase 8 | HRD Admin App (Frontend) | 4–5 days |
| Phase 9 | Sentry Integration | 1 day |
| Phase 10 | Final Testing & Docs | 2 days |

---

## Phase Checklists

### Phase 0 — Project Setup & Infrastructure

**Repository & Monorepo**
- [x] Initialize Turborepo workspace (`npx create-turbo@latest`)
- [x] Configure `turbo.json` with `build`, `dev`, `lint`, `test` pipelines
- [x] Create `apps/api`, `apps/employee-app`, `apps/hrd-admin-app` workspaces
- [x] Create `packages/types` and `packages/ui` shared packages
- [x] Add root `.eslintrc`, `tsconfig.base.json`, `.prettierrc`
- [x] Add `.env.example` to repo root
- [x] Add `.gitignore` (include `.env`, `node_modules`, `dist`)

**Docker Infrastructure**
- [x] Write `docker/postgres/init.sql` to create `attendance_db` and `audit_db`
- [x] Write `docker-compose.yml` with all services: api, postgres, postgres-audit, rabbitmq, minio, sentry
- [x] Write `docker-compose.dev.yml` with volume mounts for hot reload
- [x] Write `apps/api/Dockerfile` (multi-stage: builder + runner)
- [x] Write `apps/employee-app/Dockerfile`
- [x] Write `apps/hrd-admin-app/Dockerfile`
- [x] Test: `docker compose up` brings up all infra services successfully
- [x] Verify MinIO console accessible at `http://localhost:9001`
- [x] Verify RabbitMQ management at `http://localhost:15672`

**NestJS API — Base Setup**
- [x] Scaffold NestJS project in `apps/api`
- [x] Install and configure Prisma (`prisma init`)
- [x] Write `prisma/schema.prisma` with `User` and `Attendance` models
- [x] Run `prisma migrate dev --name init` to create migration
- [x] Create `PrismaService` as a global injectable module
- [x] Create second Prisma client instance for audit DB (`AuditPrismaService`)
- [x] Configure global `ValidationPipe` in `main.ts`
- [x] Configure global `HttpExceptionFilter`
- [x] Add `helmet`, `cors`, `compression` middleware to `main.ts`
- [x] Write `prisma/seed.ts` with at least one admin and one employee account
- [x] Update `README.md` with setup instructions

**Frontend — Base Setup**
- [x] Scaffold `apps/employee-app` with Vite + React + TypeScript
- [x] Scaffold `apps/hrd-admin-app` with Vite + React + TypeScript
- [x] Install and configure `shadcn/ui` in both apps
- [x] Install TanStack Query (`@tanstack/react-query`) in both apps
- [x] Install TanStack Router or React Router in both apps
- [x] Create shared `packages/types/src/index.ts` with base interfaces
- [x] Create `packages/ui/src` with at least `Button`, `Input`, `Card` from shadcn
- [x] Verify both apps start with `turbo dev`

---

### Phase 1 — Auth Service

**Backend**
- [x] Create `apps/api/src/modules/auth/auth.module.ts`
- [x] Create `POST /auth/login` endpoint in `AuthController`
- [x] Implement `AuthService.login()`: find user by email, compare bcrypt password, sign JWT
- [x] Create `JwtStrategy` (Passport) and `JwtAuthGuard`
- [x] Create `@CurrentUser()` decorator to extract user from JWT payload
- [x] Create `UserRole` enum; add `@Roles()` decorator and `RolesGuard`
- [x] Write unit test for `AuthService.login()` (valid + invalid credentials)
- [x] Update `API_CONTRACT.md` with `POST /auth/login` spec

---

### Phase 2 — Employee Service

**Backend**
- [x] Create `apps/api/src/modules/employee/employee.module.ts`
- [x] Implement `GET /employees/me` — return logged-in user profile
- [x] Implement `PATCH /employees/me/phone` — validate + update phone
- [x] Implement `PATCH /employees/me/password` — verify current, hash new, update
- [x] Implement `PATCH /employees/me/photo` — update `photoUrl` field
- [x] Implement `GET /employees` (admin only) — paginated list with search
- [x] Implement `POST /employees` (admin only) — create new employee, hash password
- [x] Implement `PATCH /employees/:id` (admin only) — update name/position/phone
- [x] Implement `GET /employees/:id` (admin only) — single employee detail
- [x] Add class-validator DTOs for all request bodies
- [x] Write unit tests for `EmployeeService`
- [x] Update `API_CONTRACT.md` with all employee endpoints

---

### Phase 3 — MinIO Upload Integration

**Backend**
- [ ] Install `minio` npm package
- [ ] Create `MinioModule` and `MinioService`
- [ ] Implement `MinioService.getPresignedPutUrl(filename, contentType)` returning a signed PUT URL
- [ ] Configure bucket creation on app startup (if bucket doesn't exist)
- [ ] Implement `GET /employees/me/upload-url` endpoint returning `{ uploadUrl, fileUrl }`
- [ ] Update `API_CONTRACT.md` with upload-url endpoint

**Frontend (Employee App)**
- [ ] Implement photo upload flow:
  1. Call `GET /employees/me/upload-url`
  2. PUT file directly to MinIO signed URL using `fetch`
  3. Call `PATCH /employees/me/photo` with the returned `fileUrl`
- [ ] Show upload progress indicator
- [ ] Handle file type and size validation on the client

---

### Phase 4 — Attendance Service

**Backend**
- [ ] Create `apps/api/src/modules/attendance/attendance.module.ts`
- [ ] Implement `POST /attendances/check-in`:
  - Query today's check-in; if exists → return `409`
  - Create attendance record with `status: CHECK_IN`
- [ ] Implement `POST /attendances/check-out`:
  - Query today's check-in; if not found → return `409`
  - Query today's check-out; if exists → return `409`
  - Create attendance record with `status: CHECK_OUT`
- [ ] Implement `GET /attendances/me` with date range filter; pair CHECK_IN and CHECK_OUT by date
- [ ] Implement `GET /attendances` (admin only) — paginated, filter by name and date range
- [ ] Write unit tests for `AttendanceService` (check-in/check-out validation logic)
- [ ] Update `API_CONTRACT.md` with all attendance endpoints

---

### Phase 5 — RabbitMQ Audit Logging

**Backend**
- [ ] Install `@nestjs/microservices` and `amqplib`
- [ ] Configure RabbitMQ client module in `AppModule`
- [ ] In `EmployeeService`, after successful profile update, publish event to `employee.profile.updated` queue with payload: `{ employeeId, employeeName, fieldChanged, oldValue, newValue }`
- [ ] Create `apps/api/src/modules/audit/audit.module.ts`
- [ ] Create `AuditConsumer` (NestJS microservice message handler) subscribed to `employee.profile.updated`
- [ ] `AuditConsumer` writes to `audit_db` via `AuditPrismaService`
- [ ] Mask `oldValue` and `newValue` as `[REDACTED]` for password change events
- [ ] Test: update phone → verify record appears in `audit_db`
- [ ] Test: RabbitMQ management UI shows queue activity

---

### Phase 6 — Firebase FCM Notification

**Backend**
- [ ] Create Firebase Admin SDK service account and download credentials JSON
- [ ] Install `firebase-admin` package
- [ ] Create `NotificationModule` and `NotificationService`
- [ ] Implement `NotificationService.sendToAdmins(title, body)` — find all admin users with FCM token, send FCM message
- [ ] Implement `POST /notifications/fcm-token` endpoint — save/update FCM token for current user
- [ ] In `EmployeeService`, after profile update, call `NotificationService.sendToAdmins()`
- [ ] Update `API_CONTRACT.md` with FCM token endpoint

**Frontend (HRD Admin App)**
- [ ] Add `firebase` npm package
- [ ] Add `public/firebase-messaging-sw.js` service worker
- [ ] On admin app load, request notification permission, get FCM token, call `POST /notifications/fcm-token`
- [ ] Set up `onMessage` listener to display in-app toast notification
- [ ] Test: employee updates profile → admin sees popup within 3 seconds

---

### Phase 7 — Employee App (Frontend)

**Routing & Layout**
- [ ] Set up React Router with routes: `/login`, `/profile`, `/attendance`, `/summary`
- [ ] Create `PrivateRoute` wrapper that redirects to `/login` if no valid token
- [ ] Create main layout with sidebar/bottom-nav for navigation between 3 menus

**Login Page (`/login`)**
- [ ] Email + password form with validation
- [ ] Call `POST /auth/login`; store token; redirect to `/profile`
- [ ] Display error toast on failed login

**Profile Page (`/profile`)**
- [ ] Display employee data from `GET /employees/me`
- [ ] Photo upload component (file picker → signed URL → PUT → confirm)
- [ ] Inline edit phone number with save button
- [ ] Change password modal/drawer with 3-field form
- [ ] Optimistic UI update after successful changes

**Attendance Page (`/attendance`)**
- [ ] Show today's date prominently
- [ ] Conditional "Check In" / "Check Out" button based on today's attendance state
- [ ] Confirmation dialog before submit
- [ ] Disable button after action is complete

**Attendance Summary Page (`/summary`)**
- [ ] Date range filter (From / To datepickers) + Search button
- [ ] Table / card list of paired check-in / check-out records
- [ ] Default range = current month start to today
- [ ] Responsive layout — horizontal scroll table on mobile or card view

**General**
- [ ] Configure TanStack Query with `QueryClient` and default error handling
- [ ] Create typed API client wrapper in `packages/api-client` or `apps/employee-app/src/lib/api.ts`
- [ ] Handle global 401 → redirect to login
- [ ] All pages must render correctly on 375px mobile width

---

### Phase 8 — HRD Admin App (Frontend)

**Routing & Layout**
- [ ] Set up React Router: `/login`, `/employees`, `/employees/:id`, `/attendance`
- [ ] Admin login page (same API, different role check)
- [ ] Main layout with sidebar navigation

**Employee Management (`/employees`)**
- [ ] Paginated table with search by name/email
- [ ] Add Employee button → modal form (name, email, position, phone, initial password)
- [ ] Edit button per row → modal form (name, position, phone only)
- [ ] Click row → navigate to detail page

**Employee Detail (`/employees/:id`)**
- [ ] Display full profile including photo
- [ ] Edit button opens update modal

**Attendance Monitoring (`/attendance`)**
- [ ] Paginated table: Employee Name, Check-in, Check-out
- [ ] Filter: employee name search + date range
- [ ] Read-only — no edit/delete actions

**FCM Notification**
- [ ] Service worker registration
- [ ] Permission request on first visit
- [ ] FCM token saved to backend
- [ ] In-app toast/popup on profile change event received

---

### Phase 9 — Sentry Integration

- [ ] Deploy self-hosted Sentry via `docker-compose.yml` (or use GlitchTip as lighter alternative)
- [ ] Create Sentry project and obtain DSN
- [ ] Install `@sentry/nestjs` in `apps/api`
- [ ] Initialize Sentry in `apps/api/src/main.ts` with DSN from env
- [ ] Wrap global exception filter to capture unhandled errors to Sentry
- [ ] Install `@sentry/react` and `@sentry/vite-plugin` in both frontend apps
- [ ] Initialize Sentry in both `main.tsx` files
- [ ] Add `ErrorBoundary` component from Sentry in both apps
- [ ] Test: throw intentional error → verify it appears in Sentry dashboard

---

### Phase 10 — Final Testing & Documentation

**Testing**
- [ ] Run all unit tests: `turbo test`
- [ ] Manually test full employee flow: login → profile → check-in → check-out → summary
- [ ] Manually test admin flow: create employee → view attendance → receive notification
- [ ] Test responsive layout on 375px (iPhone SE) and 768px (tablet)
- [ ] Test `docker compose up` from a clean environment (no existing volumes)
- [ ] Test RabbitMQ: stop audit consumer → make profile change → restart consumer → verify audit log written

**Documentation**
- [ ] Verify all endpoints in `API_CONTRACT.md` match actual implementation
- [ ] Update `README.md` with:
  - Prerequisites (Docker, Node.js version)
  - Local setup steps
  - `docker compose up` instructions
  - Seed script instructions (`prisma db seed`)
  - Environment variables reference (link to `.env.example`)
  - Architecture overview diagram link
- [ ] Verify `PRD.md` and `USER_STORIES.md` reflect any scope changes
- [ ] Tag release `v1.0.0` in git

---

## Documentation Rules

These rules are **mandatory** and must be followed on every pull request:

| Rule | Detail |
|---|---|
| API Contract update | Any new endpoint or change to request/response shape must update `docs/API_CONTRACT.md` in the same PR |
| README update | Any change to setup steps, env vars, or architecture must update `README.md` |
| PRD sync | Any change to functional scope must be reflected in `PRD.md` |
| User Story sync | Any change to feature behavior must update acceptance criteria in `USER_STORIES.md` |
| Checklist tick-off | When a checklist item is completed, mark it `[x]` in this file and commit the update |
| Env example sync | Any new environment variable must be added to `.env.example` with a comment |

---

## Document Change Log

| Version | Date | Author | Change Description |
|---|---|---|---|
| 1.0.0 | 2025-01-01 | — | Initial draft |

> **Rule:** Update this log on every meaningful revision to this document.

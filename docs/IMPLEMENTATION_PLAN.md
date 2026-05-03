# Implementation Plan — TDD Approach
## Employee Attendance & HR Monitoring System

**Version:** 1.0.0  
**Method:** Test-Driven Development (Red → Green → Refactor)  
**Base Documents:** PRD v1.0.0 · USER_STORIES v1.0.0 · TECHNICAL_PLAN v1.0.0

---

## TDD Ground Rules

| Cycle | Action |
|---|---|
| 🔴 RED | Write a **failing** test that describes the expected behavior |
| 🟢 GREEN | Write the **minimum** code to make the test pass |
| 🔵 REFACTOR | Clean up code without breaking tests |

**Test layers:**
- **Unit tests** — NestJS services/guards (Jest + `@nestjs/testing`)
- **Integration tests** — API endpoints (Supertest + test DB)
- **Component tests** — React UI (Vitest + React Testing Library)
- **E2E tests** — Full flows (Playwright) — Phase 10

> All test files live alongside source: `*.spec.ts` (backend), `*.test.tsx` (frontend).

---

## Phase 0 — Project Setup & Infrastructure

**Covers:** TECHNICAL_PLAN Phase 0 · NFR-03 · NFR-04 · NFR-09

### 0.1 Monorepo Bootstrap
- [x] Initialize Turborepo: `npx create-turbo@latest`
- [x] Configure `turbo.json` pipelines: `build`, `dev`, `lint`, `test`
- [x] Create workspaces: `apps/api`, `apps/employee-app`, `apps/hrd-admin-app`
- [x] Create shared packages: `packages/types`, `packages/ui`
- [x] Add root `tsconfig.base.json`, `.eslintrc`, `.prettierrc`
- [x] Add `.env.example` with all variables from TECHNICAL_PLAN §Environment Variables
- [x] Add `.gitignore` (`.env`, `node_modules`, `dist`, `.turbo`)

### 0.2 Docker Infrastructure
- [x] Write `docker/postgres/init.sql` — creates `attendance_db` and `audit_db`
- [x] Write `docker-compose.yml` — services: `api`, `employee-app`, `hrd-admin-app`, `postgres` (5432), `postgres-audit` (5433), `rabbitmq` (5672/15672), `minio` (9000/9001), `sentry`
- [x] Write `docker-compose.dev.yml` — volume mounts for hot reload
- [x] Write `apps/api/Dockerfile` — multi-stage: builder + runner
- [x] Write `apps/employee-app/Dockerfile`
- [x] Write `apps/hrd-admin-app/Dockerfile`
- [x] **Verify:** `docker compose up` — all infra services healthy
- [x] **Verify:** MinIO console at `http://localhost:9001`
- [x] **Verify:** RabbitMQ UI at `http://localhost:15672`

### 0.3 NestJS API Base
- [x] Scaffold NestJS in `apps/api`
- [x] `prisma init` → write `prisma/schema.prisma` with `User`, `Attendance`, enums `AttendanceStatus`, `UserRole`
- [x] `prisma migrate dev --name init`
- [x] Create `PrismaService` as global module
- [x] Create `AuditPrismaService` (separate client, `AUDIT_DATABASE_URL`)
- [x] Configure global `ValidationPipe` + `HttpExceptionFilter` in `main.ts`
- [x] Add `helmet`, `cors`, `compression` middleware
- [x] Write `prisma/seed.ts` — 1 ADMIN + 1 EMPLOYEE seed record
- [x] 🔴 **Test:** `prisma.$connect()` succeeds in both DB services

### 0.4 Frontend Base
- [x] Scaffold `apps/employee-app` — Vite + React + TypeScript
- [x] Scaffold `apps/hrd-admin-app` — Vite + React + TypeScript
- [x] Install `shadcn/ui` + Tailwind CSS in both apps
- [x] Install `@tanstack/react-query` in both apps
- [x] Install React Router v6 in both apps
- [x] Create `packages/types/src/index.ts` — base interfaces: `User`, `Attendance`, `AuditLog`
- [x] Create `packages/ui/src` — export `Button`, `Input`, `Card` from shadcn
- [x] **Verify:** `turbo dev` starts both apps

---

## Phase 1 — Auth Service

**Covers:** FR-01-1 to FR-01-4 · US-01 · US-02 · US-03 · NFR-06 · NFR-08

### 1.1 Backend — TDD Cycle

**🔴 Write failing tests first (`auth.service.spec.ts`):**
```
describe('AuthService.login()')
  ✗ returns accessToken + user on valid credentials
  ✗ throws UnauthorizedException on wrong password
  ✗ throws UnauthorizedException if user not found
  ✗ password compared with bcrypt (not plain text)
  ✗ JWT token expires in 8 hours (NFR-06)
```

**🟢 Implement:**
- [x] Create `auth.module.ts`, `auth.controller.ts`, `auth.service.ts`
- [x] `POST /auth/login` — find user by email, `bcrypt.compare`, sign JWT
- [x] Create `JwtStrategy` (Passport) + `JwtAuthGuard`
- [x] Create `@CurrentUser()` decorator
- [x] Create `UserRole` enum + `@Roles()` decorator + `RolesGuard`
- [x] `JWT_EXPIRES_IN=8h` from env (NFR-06)
- [x] Passwords stored as bcrypt hash, min 10 rounds (NFR-08, FR-01-4)

**🔵 Refactor + Integration test:**
- [x] Integration test `POST /auth/login` with Supertest + test DB
- [x] Verify 401 + `"Invalid email or password"` on bad credentials (AC US-01)
- [x] Update `docs/API_CONTRACT.md` — `POST /auth/login`

### 1.2 Frontend — Login Page & Session (US-01, US-02, US-03)

**🔴 Component tests (`LoginPage.test.tsx`):**
```
✗ renders email + password fields (AC US-01)
✗ shows error "Invalid email or password" on 401 (AC US-01)
✗ password field has show/hide toggle (AC US-01)
✗ validates email format before submit (AC US-01)
✗ redirects to /profile on success (AC US-01)
✗ session persists on page refresh (AC US-02)
✗ redirects to /login if token expired (AC US-02)
✗ logout clears token + redirects to /login (AC US-03)
✗ logout button accessible from main nav (AC US-03)
```

**🟢 Implement:**
- [x] Login page with email + password form
- [x] Show/hide password toggle
- [x] Email format validation
- [x] Call `POST /auth/login`; store token; redirect to `/profile`
- [x] Error toast on failed login
- [x] `PrivateRoute` — redirect to `/login` if token expired/missing
- [x] Logout action — clear token + redirect

---

## Phase 2 — Employee Service

**Covers:** FR-02 · FR-05 · US-04 · US-05 · US-06 · US-07 · US-15 to US-18 · NFR-10

### 2.1 Backend — TDD Cycle

**🔴 Write failing tests (`employee.service.spec.ts`):**
```
✗ findMe() returns name, email, photo, position, phone (AC US-04)
✗ updatePhone() validates 10-15 digit numeric (AC US-06)
✗ updatePhone() saves updated phone
✗ changePassword() throws if currentPassword wrong (AC US-07)
✗ changePassword() hashes new password with bcrypt
✗ updatePhoto() saves photoUrl to user record
✗ findAll() returns paginated list with search (AC US-15)
✗ create() throws ConflictException on duplicate email (AC US-16)
✗ create() hashes initial password
✗ update() does NOT allow email change (AC US-17)
✗ findById() returns single employee (AC US-18)
```

**🟢 Implement:**
- [x] `employee.module.ts`, `employee.controller.ts`, `employee.service.ts`
- [x] `GET /employees/me` — profile: name, email, photo, position, phone (FR-02-1)
- [x] `PATCH /employees/me/phone` — numeric 10–15 digits DTO (AC US-06)
- [x] `PATCH /employees/me/password` — verify current, hash new (AC US-07)
- [x] `PATCH /employees/me/photo` — save `photoUrl` (FR-02-2)
- [x] `GET /employees` [ADMIN] — paginated, `?page&limit&search` (FR-05-3, AC US-15)
- [x] `POST /employees` [ADMIN] — all fields required, unique email (FR-05-1, AC US-16)
- [x] `PATCH /employees/:id` [ADMIN] — name/position/phone; email read-only (FR-05-2, AC US-17)
- [x] `GET /employees/:id` [ADMIN] — full profile (FR-05-4, AC US-18)
- [x] class-validator DTOs for all request bodies
- [x] Update `docs/API_CONTRACT.md` — all employee endpoints

---

## Phase 3 — MinIO Upload Integration

**Covers:** FR-02-7 · US-05 · NFR-07

### 3.1 Backend — TDD Cycle

**🔴 Write failing tests (`minio.service.spec.ts`):**
```
✗ getPresignedPutUrl() returns uploadUrl + fileUrl
✗ uploadUrl contains the filename
✗ bucket is created on startup if not exists
```

**🟢 Implement:**
- [ ] Install `minio` npm package
- [ ] Create `MinioModule` + `MinioService`
- [ ] `getPresignedPutUrl(filename, contentType)` → `{ uploadUrl, fileUrl }`
- [ ] Auto-create bucket on app startup
- [ ] `GET /employees/me/upload-url?filename=&contentType=` endpoint
- [ ] Update `docs/API_CONTRACT.md` — upload-url endpoint

### 3.2 Frontend — Photo Upload Flow (US-05)

**🔴 Component tests (`PhotoUpload.test.tsx`):**
```
✗ only accepts JPEG, PNG, WebP (AC US-05)
✗ rejects files > 2MB (AC US-05)
✗ shows loading indicator during upload (AC US-05)
✗ displays new photo immediately on success (AC US-05)
✗ shows error message on upload failure (AC US-05)
```

**🟢 Implement:**
- [ ] File picker → validate type & size on client
- [ ] Call `GET /employees/me/upload-url`
- [ ] `fetch` PUT to MinIO signed URL
- [ ] Call `PATCH /employees/me/photo` with `fileUrl`
- [ ] Show progress indicator
- [ ] Optimistic UI: show new photo immediately

---

## Phase 4 — Attendance Service

**Covers:** FR-03 · FR-04 · FR-06 · US-09 to US-14 · US-19 to US-20

### 4.1 Backend — TDD Cycle

**🔴 Write failing tests (`attendance.service.spec.ts`):**
```
describe('checkIn()')
  ✗ creates CHECK_IN record with current timestamp (FR-03-1)
  ✗ throws 409 "You have already checked in today" (FR-03-3, AC US-11)

describe('checkOut()')
  ✗ creates CHECK_OUT record (FR-03-2)
  ✗ throws 409 "You must check in before checking out" (FR-03-4, AC US-11)
  ✗ throws 409 if already checked out today

describe('getMyAttendance()')
  ✗ returns paired check-in/check-out for date range (FR-04-2)
  ✗ default range = 1st of current month to today (FR-04-1, AC US-12)
  ✗ checkOut=null if not recorded (AC US-12)
  ✗ sorted descending by date (AC US-12)
  ✗ empty array if no records (AC US-12)

describe('getAllAttendance()') [ADMIN]
  ✗ returns paginated list (FR-06-1, AC US-19)
  ✗ filters by employeeName (FR-06-3, AC US-20)
  ✗ filters by date range (FR-06-3, AC US-20)
```

**🟢 Implement:**
- [ ] `attendance.module.ts`, `attendance.controller.ts`, `attendance.service.ts`
- [ ] `POST /attendances/check-in` — 409 if already checked in today
- [ ] `POST /attendances/check-out` — 409 if no check-in or already checked out
- [ ] `GET /attendances/me?from=&to=` — pair CHECK_IN+CHECK_OUT by date
- [ ] `GET /attendances` [ADMIN] — paginated + filters (read-only, FR-06-2)
- [ ] Update `docs/API_CONTRACT.md` — all attendance endpoints

### 4.2 Frontend — Attendance & Summary Pages

**🔴 Component tests:**
```
AttendancePage.test.tsx
  ✗ shows "Check In" if no check-in today (AC US-09)
  ✗ shows confirmation dialog before submitting (AC US-09)
  ✗ disables "Check In" after successful check-in (AC US-09)
  ✗ "Check Out" only visible after check-in (AC US-10)
  ✗ disables "Check Out" after success (AC US-10)
  ✗ shows error "You have already checked in today" (AC US-11)
  ✗ shows error "You must check in before checking out" (AC US-11)

SummaryPage.test.tsx
  ✗ defaults to current month range (AC US-12)
  ✗ shows "—" for null check-out (AC US-12)
  ✗ shows empty state message when no records (AC US-12)
  ✗ date filter updates table (AC US-13)
  ✗ "To" < "From" shows validation error (AC US-13)
  ✗ Reset clears filter to default (AC US-13)
  ✗ layout adapts on 375px (AC US-14)
  ✗ date format is YYYY-MM-DD HH:mm (AC US-14)
```

**🟢 Implement:**
- [ ] `/attendance` — today's date, conditional check-in/out buttons
- [ ] Confirmation dialog before submit
- [ ] `/summary` — date range picker + table/card list
- [ ] Default range = 1st of month to today
- [ ] Responsive: horizontal scroll or card view on mobile

---

## Phase 5 — RabbitMQ Audit Logging

**Covers:** FR-02-5 · FR-08 · US-23 · NFR-04

### 5.1 Backend — TDD Cycle

**🔴 Write failing tests:**
```
employee.service.spec.ts (extended)
  ✗ updatePhone() publishes event to "employee.profile.updated"
  ✗ updatePhoto() publishes event
  ✗ changePassword() publishes event with [REDACTED] values (AC US-23)

audit.consumer.spec.ts
  ✗ on message, writes AuditLog to audit_db (FR-08-2)
  ✗ AuditLog contains: employeeId, fieldChanged, oldValue, newValue, changedAt (FR-08-3)
  ✗ password events: oldValue and newValue = "[REDACTED]" (AC US-23)
```

**🟢 Implement:**
- [ ] Install `@nestjs/microservices` + `amqplib`
- [ ] Configure RabbitMQ client in `AppModule`
- [ ] `EmployeeService` — publish to `employee.profile.updated` after phone/photo/password update (FR-02-5, FR-08-1)
- [ ] `audit.module.ts` + `AuditConsumer` — subscribe, write to `audit_db` (FR-08-2)
- [ ] Mask `[REDACTED]` for password events (FR-08-3, AC US-23)
- [ ] **Verify:** Phone update → `audit_db` has record
- [ ] **Verify:** Stop consumer → change → restart → record written (queue durability, AC US-23)

---

## Phase 6 — Firebase FCM Notification

**Covers:** FR-02-6 · FR-07 · US-08 · US-22

### 6.1 Backend — TDD Cycle

**🔴 Write failing tests (`notification.service.spec.ts`):**
```
✗ sendToAdmins() calls FCM for each admin with fcmToken (FR-07-1, FR-07-2)
✗ sendToAdmins() skips admins without fcmToken
✗ message includes employee name + change type (FR-07-3, AC US-08)
✗ saveFcmToken() updates user.fcmToken in DB
```

**🟢 Implement:**
- [ ] Install `firebase-admin`
- [ ] Create `NotificationModule` + `NotificationService`
- [ ] `sendToAdmins(title, body)` — find admins with fcmToken, send FCM
- [ ] `POST /notifications/fcm-token` — save/update FCM token
- [ ] `EmployeeService` — call `sendToAdmins()` after profile update (FR-02-6)
- [ ] Update `docs/API_CONTRACT.md` — FCM token endpoint

### 6.2 Frontend — HRD Admin FCM (US-22)

**🔴 Tests:**
```
✗ registers firebase-messaging-sw.js on load (AC US-22)
✗ requests notification permission on first visit
✗ POSTs FCM token to /notifications/fcm-token
✗ shows toast on onMessage event (AC US-22)
✗ notification works with tab in background (AC US-22)
```

**🟢 Implement:**
- [ ] Add `firebase` package + `public/firebase-messaging-sw.js`
- [ ] On load: request permission → get FCM token → POST to backend
- [ ] `onMessage` listener → display toast with employee name + change type
- [ ] **Verify:** Profile update → admin popup within 3 seconds (PRD Success Metric)

---

## Phase 7 — Employee App (Frontend)

**Covers:** US-01 to US-14 · FR-01 to FR-04 · NFR-01

### 7.1 Routing & Layout
- [ ] Routes: `/login`, `/profile`, `/attendance`, `/summary`
- [ ] `PrivateRoute` — redirect to `/login` if no valid token
- [ ] Main layout: sidebar (desktop) / bottom-nav (mobile)
- [ ] 🔴 Test: unauthenticated access redirects to `/login`

### 7.2 Profile Page (`/profile`) — US-04 to US-07
- [ ] Display `GET /employees/me` data: name, email, photo, position, phone
- [ ] Default avatar if `photoUrl` null (AC US-04)
- [ ] Photo upload component (Phase 3 integration)
- [ ] Inline phone edit + save (AC US-06)
- [ ] Change password modal — 3 fields, all validations (AC US-07)
- [ ] Success toast on password change
- [ ] Optimistic UI update after changes

### 7.3 General
- [ ] Configure TanStack Query `QueryClient` with global error handling
- [ ] Typed API client in `src/lib/api.ts`
- [ ] Global 401 interceptor → redirect to login
- [ ] 🔴 Test: all pages render correctly at 375px width (NFR-01, AC US-14)

---

## Phase 8 — HRD Admin App (Frontend)

**Covers:** US-15 to US-22 · FR-05 · FR-06 · FR-07 · NFR-01

### 8.1 Routing & Layout
- [ ] Routes: `/login`, `/employees`, `/employees/:id`, `/attendance`
- [ ] Admin login — same API, check `role === ADMIN`
- [ ] Main layout with sidebar
- [ ] 🔴 Test: EMPLOYEE role redirected away from admin routes

### 8.2 Employee Management (US-15 to US-18)
- [ ] Paginated table: name, email, position, phone, actions
- [ ] Search by name/email; default page size = 10
- [ ] Add Employee modal — all fields required; show email duplicate error
- [ ] Edit modal — name/position/phone; email read-only
- [ ] Row click → `/employees/:id` detail page
- [ ] Detail page: full profile including photo; preserve list state on back

### 8.3 Attendance Monitoring (US-19, US-20)
- [ ] Paginated read-only table: employee name, check-in, check-out
- [ ] Default view = current month (AC US-19)
- [ ] No edit/delete actions (FR-06-2, AC US-19)
- [ ] Filter: employee name + date range; Reset button (AC US-20)

### 8.4 FCM Notification (US-22) — integrated from Phase 6

---

## Phase 9 — Sentry Integration

**Covers:** NFR-05 · NFR-04

- [ ] Deploy self-hosted Sentry in `docker-compose.yml`
- [ ] Create project → get DSN
- [ ] Install `@sentry/nestjs` → initialize in `main.ts` with `SENTRY_DSN`
- [ ] Global exception filter captures errors to Sentry (NFR-05)
- [ ] Install `@sentry/react` + `@sentry/vite-plugin` in both frontend apps
- [ ] Initialize Sentry in both `main.tsx`
- [ ] Add `<ErrorBoundary>` in both apps
- [ ] 🔴 **Test:** Throw intentional error → verify in Sentry dashboard

---

## Phase 10 — Final Testing & Documentation

**Covers:** TECHNICAL_PLAN Phase 10 · NFR-09 · NFR-10 · All PRD Success Metrics

### 10.1 Automated Tests
- [ ] `turbo test` — all unit + integration tests pass
- [ ] 🔴 Playwright E2E — **Employee Flow:**
  1. Login → redirect to `/profile`
  2. View profile data correctly
  3. Update phone → verify saved
  4. Check In (confirmation → success → button disabled)
  5. Navigate to Summary → see today's check-in record
  6. Check Out → paired record appears in summary
- [ ] 🔴 Playwright E2E — **Admin Flow:**
  1. Admin login
  2. Create employee → employee can log in immediately
  3. View attendance list → see employee records
  4. Employee updates profile → admin receives FCM notification within 3s

### 10.2 Manual Verification

| Check | Ref | Expected |
|---|---|---|
| Check-in flow under 30 seconds | PRD Success Metric | Pass |
| Admin views full month without pagination issue | US-19 | Pass |
| Notification reaches admin within 3s | US-08, US-22 | 95% of cases |
| Responsive on 375px | US-14, NFR-01 | Pass |
| Responsive on 768px | NFR-01 | Pass |
| `docker compose up` from clean env | NFR-09 | Pass |

### 10.3 Infrastructure
- [ ] `docker compose up` from zero — all services start (NFR-09)
- [ ] `prisma db seed` — admin + employee seeded
- [ ] RabbitMQ durability: stop consumer → update → restart → audit log written (AC US-23)
- [ ] MinIO pre-signed URL flow end-to-end (NFR-07)

### 10.4 Documentation
- [ ] `docs/API_CONTRACT.md` — all endpoints match implementation (NFR-10)
- [ ] `README.md` — prerequisites, setup, `docker compose up`, seed, env vars, architecture
- [ ] `PRD.md` — reflects any scope changes
- [ ] `USER_STORIES.md` — acceptance criteria aligned with implementation
- [ ] All completed items marked `[x]` in `TECHNICAL_PLAN.md`
- [ ] Tag release `v1.0.0`

---

## Coverage Matrix

| PRD Requirement | User Story | Phase |
|---|---|---|
| FR-01-1 to FR-01-4 | US-01, US-02, US-03 | 1 |
| FR-02-1 | US-04 | 2, 7 |
| FR-02-2 | US-05 | 2, 3, 7 |
| FR-02-3 | US-06 | 2, 7 |
| FR-02-4 | US-07 | 2, 7 |
| FR-02-5 | US-23 | 5 |
| FR-02-6 | US-08, US-22 | 6 |
| FR-02-7 | US-05 | 3 |
| FR-03-1 to FR-03-4 | US-09, US-10, US-11 | 4 |
| FR-04-1 to FR-04-3 | US-12, US-13, US-14 | 4, 7 |
| FR-05-1 to FR-05-4 | US-15, US-16, US-17, US-18 | 2, 8 |
| FR-06-1 to FR-06-3 | US-19, US-20 | 4, 8 |
| FR-07-1 to FR-07-3 | US-08, US-22 | 6, 8 |
| FR-08-1 to FR-08-3 | US-23 | 5 |
| NFR-01 (responsive) | US-14 | 7, 8 |
| NFR-03, NFR-04 (Docker) | — | 0 |
| NFR-05 (Sentry) | — | 9 |
| NFR-06 (JWT 8h) | US-02 | 1 |
| NFR-07 (MinIO pre-signed) | US-05 | 3 |
| NFR-08 (bcrypt min 10) | US-01, US-07 | 1, 2 |
| NFR-09 (single compose up) | — | 0, 10 |
| NFR-10 (API Contract docs) | — | All phases |

---

## Out of Scope (v1.0)

Per PRD and USER_STORIES — **not implemented:**
- US-21 Attendance Export
- US-24 Audit Log View UI
- Mobile native app, OAuth/SSO, payroll, shift scheduling, multi-tenant

---

*Last updated: 2026-05-03 · Method: TDD (Red → Green → Refactor)*

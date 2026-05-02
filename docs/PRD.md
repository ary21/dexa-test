# Product Requirements Document (PRD)
## Employee Attendance & HR Monitoring System

**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** 2025-01-01  
**Owner:** Product Team

---

## Table of Contents

1. [Overview](#overview)
2. [Goals & Objectives](#goals--objectives)
3. [Target Users](#target-users)
4. [System Architecture Overview](#system-architecture-overview)
5. [Functional Requirements](#functional-requirements)
6. [Non-Functional Requirements](#non-functional-requirements)
7. [Tech Stack](#tech-stack)
8. [Constraints & Assumptions](#constraints--assumptions)
9. [Out of Scope](#out-of-scope)
10. [Success Metrics](#success-metrics)
11. [Document Change Log](#document-change-log)

---

## Overview

This document defines the product requirements for two web applications:

1. **Employee App** — A responsive web application for company employees to manage their profile, submit daily attendance (check-in/check-out), and view their attendance summary.
2. **HRD Admin App** — A web application for HR administrators to manage employee data and monitor submitted attendance records.

Both applications are powered by a single backend system built with a **microservices REST API** architecture, deployed entirely via Docker.

---

## Goals & Objectives

### Backend
- Design a proper, normalized relational database structure
- Connect and manage a PostgreSQL database via Prisma ORM
- Build RESTful APIs following microservices principles
- Support full CRUD operations per domain service
- Implement an event-driven messaging layer using RabbitMQ

### Frontend
- Build responsive, mobile-friendly web pages
- Implement a consistent CSS component library (shadcn/ui)
- Consume backend APIs with a clean, typed API client
- Build reusable, custom UI components

---

## Target Users

| Persona | Role | Primary App |
|---|---|---|
| Employee | Regular company staff | Employee App |
| HR Admin | HR team member | HRD Admin App |

---

## System Architecture Overview

```
[Employee App]         [HRD Admin App]
      |                      |
      └──────────┬───────────┘
                 ↓
         [API Gateway] ← NestJS, JWT Auth, Rate Limiting
                 |
    ┌────────────┼────────────┐
    ↓            ↓            ↓
[Auth       [Employee    [Attendance
 Service]    Service]     Service]
    |            |            |
    └────────────┴────────────┘
                 ↓
          [PostgreSQL - Main DB]
                 |
          [RabbitMQ] → [Audit Consumer] → [PostgreSQL - Audit DB]
                 |
          [Firebase FCM] → Admin browser notification
                 |
          [MinIO] ← Signed URL photo upload
                 |
          [Sentry] ← Error tracking (all services)
```

All services and infrastructure components are **containerized using Docker Compose**.

---

## Functional Requirements

### FR-01: Authentication

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01-1 | Employee must be able to log in using company email and password | High |
| FR-01-2 | System must return a JWT access token upon successful login | High |
| FR-01-3 | Token must be validated on every protected API request | High |
| FR-01-4 | Password must be stored as a bcrypt hash | High |

---

### FR-02: Employee Profile (Employee App)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-02-1 | Display logged-in employee's name, company email, profile photo, position, and phone number | High |
| FR-02-2 | Employee can update their profile photo | High |
| FR-02-3 | Employee can update their phone number | High |
| FR-02-4 | Employee can change their password | High |
| FR-02-5 | On any profile data change, publish an event to RabbitMQ for audit logging to a separate database | High |
| FR-02-6 | On any profile data change, send a real-time push notification to the admin via Firebase FCM | High |
| FR-02-7 | Photo upload must use MinIO pre-signed PUT URL — the file is uploaded directly from the browser | High |

---

### FR-03: Attendance (Employee App)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-03-1 | Employee can submit a check-in record capturing date, time, and status = `CHECK_IN` | High |
| FR-03-2 | Employee can submit a check-out record capturing date, time, and status = `CHECK_OUT` | High |
| FR-03-3 | An employee may not check in more than once per day | High |
| FR-03-4 | An employee may not check out without first checking in | High |

---

### FR-04: Attendance Summary (Employee App)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-04-1 | Display attendance records for the current month by default (from 1st to today) | High |
| FR-04-2 | Each record must display: check-in date/time and check-out date/time in a paired row | High |
| FR-04-3 | Employee can filter attendance by custom date range (From – To) | High |

---

### FR-05: Employee Management (HRD Admin App)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-05-1 | Admin can add a new employee record (name, email, position, phone number) | High |
| FR-05-2 | Admin can update an existing employee record | High |
| FR-05-3 | Admin can view a paginated list of all employees | High |
| FR-05-4 | Admin can view the detail of a single employee | Medium |

---

### FR-06: Attendance Monitoring (HRD Admin App)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-06-1 | Admin can view a paginated list of all submitted attendance records across all employees | High |
| FR-06-2 | Attendance data is read-only for the admin | High |
| FR-06-3 | Admin can filter attendance by employee name and/or date range | Medium |

---

### FR-07: Admin Notification

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-07-1 | When an employee updates their profile, the HR Admin app must display a real-time popup/alert notification | High |
| FR-07-2 | Notification must be delivered via Firebase Cloud Messaging (FCM) | High |
| FR-07-3 | Notification must include the employee name and the type of change made | Medium |

---

### FR-08: Audit Logging

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-08-1 | All profile change events must be streamed via RabbitMQ to an Audit Consumer | High |
| FR-08-2 | Audit Consumer must persist each event to a separate PostgreSQL audit database | High |
| FR-08-3 | Audit record must include: employee ID, field changed, old value, new value, timestamp | High |

---

## Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-01 | All web pages must be responsive and usable on mobile browsers |
| NFR-02 | API response time for standard CRUD operations must be under 500ms (p95) |
| NFR-03 | All services must be fully containerized with Docker |
| NFR-04 | All infrastructure (DB, MinIO, Sentry, RabbitMQ) must be self-hosted via Docker Compose |
| NFR-05 | All API errors must be reported to self-hosted Sentry |
| NFR-06 | JWT tokens must expire (e.g. 8 hours), no infinite sessions |
| NFR-07 | File upload via MinIO must use pre-signed PUT URL — no binary data through the backend API |
| NFR-08 | All passwords must be hashed with bcrypt (min rounds: 10) |
| NFR-09 | The system must be deployable from scratch with a single `docker compose up` command |
| NFR-10 | Every API endpoint must be documented in an API Contract file, updated on every change |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo |
| Frontend Framework | React.js + Vite |
| Frontend UI | shadcn/ui + Tailwind CSS |
| Frontend Data Fetching | TanStack Query |
| Backend Framework | NestJS (TypeScript) |
| API Style | REST (microservices modules) |
| ORM | Prisma |
| Database | PostgreSQL (main + audit) |
| Message Broker | RabbitMQ |
| Object Storage | MinIO (self-hosted) |
| Error Tracking | Sentry (self-hosted) |
| Push Notification | Firebase Cloud Messaging (FCM) |
| Containerization | Docker + Docker Compose |

---

## Constraints & Assumptions

- All services run on a single server (Docker Compose), not Kubernetes.
- A company email is unique per employee — it serves as the login username.
- The initial dataset (employees) is seeded by the admin or via a database seed script.
- There is no self-registration — accounts are created by the HR admin.
- Mobile responsiveness applies to the Employee App; the HRD Admin App is desktop-first but keep on mind for mobile responsive (use landscape mode for mobile).
- Notification delivery to admin depends on the admin having the FCM service worker registered in their browser.

---

## Out of Scope

- Mobile native app (iOS / Android)
- Leave request management
- Payroll integration
- Shift scheduling
- Multi-company / multi-tenant support
- OAuth / SSO login
- Role-based access beyond "employee" and "admin"

---

## Success Metrics

| Metric | Target |
|---|---|
| Employee can complete check-in flow in under 30 seconds | 100% of test sessions |
| Admin can view full attendance report for a month without pagination issues | Pass |
| Profile update notification reaches admin browser within 3 seconds | 95% of cases |
| System starts from zero with single `docker compose up` | Pass |
| All API endpoints covered in API Contract document | 100% |

---

## Document Change Log

| Version | Date | Author | Change Description |
|---|---|---|---|
| 1.0.0 | 2025-01-01 | — | Initial draft |

> **Rule:** Every functional or technical change to the system **must** result in an update to this document and the relevant API Contract file before the pull request is merged.

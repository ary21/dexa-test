# User Stories
## Employee Attendance & HR Monitoring System

**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** 2025-01-01

---

## Table of Contents

1. [Story Map Overview](#story-map-overview)
2. [Epic 01 — Authentication](#epic-01--authentication)
3. [Epic 02 — Employee Profile](#epic-02--employee-profile)
4. [Epic 03 — Attendance](#epic-03--attendance)
5. [Epic 04 — Attendance Summary](#epic-04--attendance-summary)
6. [Epic 05 — HR Admin: Employee Management](#epic-05--hr-admin-employee-management)
7. [Epic 06 — HR Admin: Attendance Monitoring](#epic-06--hr-admin-attendance-monitoring)
8. [Epic 07 — Notifications & Audit Log](#epic-07--notifications--audit-log)
9. [Document Change Log](#document-change-log)

---

## Story Map Overview

| Epic | Stories | App |
|------|---------|-----|
| 01 — Authentication | US-01 to US-03 | Both |
| 02 — Employee Profile | US-04 to US-08 | Employee App |
| 03 — Attendance | US-09 to US-11 | Employee App |
| 04 — Attendance Summary | US-12 to US-14 | Employee App |
| 05 — HR Admin: Employee Management | US-15 to US-18 | HRD Admin App |
| 06 — HR Admin: Attendance Monitoring | US-19 to US-21 | HRD Admin App |
| 07 — Notifications & Audit Log | US-22 to US-24 | HRD Admin App |

---

## Epic 01 — Authentication

---

### US-01 — Employee Login

**As an** employee,  
**I want to** log in with my company email and password,  
**so that** I can access the attendance application securely.

**Acceptance Criteria:**
- [ ] A login page is shown at the app root when the user is not authenticated
- [ ] The form has an email field and a password field
- [ ] On successful login, a JWT access token is stored in memory (or `httpOnly` cookie)
- [ ] The user is redirected to the dashboard / home page after login
- [ ] On failed login (wrong credentials), an error message is shown: `"Invalid email or password"`
- [ ] The email field validates proper email format before submission
- [ ] Password field has a toggle to show/hide characters

**Notes:**
- There is no self-registration — accounts are created by the HR admin.

---

### US-02 — Session Persistence

**As an** employee,  
**I want to** stay logged in when I refresh the page,  
**so that** I don't have to log in repeatedly during my work session.

**Acceptance Criteria:**
- [ ] A valid token persists the session across page refreshes
- [ ] If the token is expired, the user is redirected to the login page
- [ ] The session expires after 8 hours of inactivity

---

### US-03 — Logout

**As an** employee,  
**I want to** log out from the application,  
**so that** my session is securely ended on shared devices.

**Acceptance Criteria:**
- [ ] A logout button/option is accessible from the main navigation
- [ ] On logout, the stored token is cleared
- [ ] The user is redirected to the login page immediately after logout

---

## Epic 02 — Employee Profile

---

### US-04 — View My Profile

**As an** employee,  
**I want to** view my profile information,  
**so that** I can verify my data is correct.

**Acceptance Criteria:**
- [ ] Profile page displays: Full Name, Company Email, Profile Photo, Position, Phone Number
- [ ] If no photo has been uploaded, a default avatar placeholder is shown
- [ ] The page is accessible from the main navigation menu

---

### US-05 — Update Profile Photo

**As an** employee,  
**I want to** upload a new profile photo,  
**so that** my profile is personalized and identifiable.

**Acceptance Criteria:**
- [ ] A button or click area triggers a file picker dialog
- [ ] Only image files are accepted (JPEG, PNG, WebP), max 2MB
- [ ] The upload uses a pre-signed PUT URL from MinIO — the file goes directly from browser to MinIO
- [ ] A loading indicator is shown during upload
- [ ] On success, the new photo is immediately reflected on the profile page
- [ ] On failure, a clear error message is displayed
- [ ] A RabbitMQ event is published after a successful photo update
- [ ] A Firebase FCM notification is sent to the HR Admin

---

### US-06 — Update Phone Number

**As an** employee,  
**I want to** update my phone number,  
**so that** my contact information is always current.

**Acceptance Criteria:**
- [ ] Phone number field is editable on the profile page
- [ ] Only numeric characters are accepted (10–15 digits)
- [ ] A save/confirm action is required to persist the change
- [ ] On success, the updated phone number is displayed immediately
- [ ] A RabbitMQ event is published after a successful update
- [ ] A Firebase FCM notification is sent to the HR Admin

---

### US-07 — Change Password

**As an** employee,  
**I want to** change my account password,  
**so that** I can keep my account secure.

**Acceptance Criteria:**
- [ ] Form requires: current password, new password, confirm new password
- [ ] If current password is wrong, show error: `"Current password is incorrect"`
- [ ] New password must be at least 8 characters
- [ ] New password and confirm password must match; otherwise show error
- [ ] On success, show a success toast/alert
- [ ] A RabbitMQ event is published after a successful password change (log only, no old/new value stored in audit)
- [ ] A Firebase FCM notification is sent to the HR Admin

---

### US-08 — Profile Change Triggers Admin Notification

**As an** HR admin,  
**I want to** receive a real-time notification when an employee updates their profile,  
**so that** I am aware of any changes to employee data.

**Acceptance Criteria:**
- [ ] A popup/toast notification appears in the HR Admin App when any employee updates profile photo, phone number, or password
- [ ] The notification includes the employee's name and the type of change (e.g., `"John Doe updated their phone number"`)
- [ ] Notification is delivered within 3 seconds of the change
- [ ] If the admin browser tab is not open, the notification is queued and shown on next open (FCM web push)

---

## Epic 03 — Attendance

---

### US-09 — Check In

**As an** employee,  
**I want to** record my check-in when I start working,  
**so that** my work start time is officially logged.

**Acceptance Criteria:**
- [ ] An "Attendance" page is accessible from the main navigation
- [ ] A "Check In" button is visible if the employee has not checked in today
- [ ] On click, the current date and time are captured automatically
- [ ] A confirmation dialog appears before submitting (e.g., `"Check in at 08:32? Confirm"`)
- [ ] On success, a success message is shown and the button state changes (check-in is recorded)
- [ ] The "Check In" button is disabled/hidden after a successful check-in for that day

---

### US-10 — Check Out

**As an** employee,  
**I want to** record my check-out when I finish working,  
**so that** my work end time is officially logged.

**Acceptance Criteria:**
- [ ] A "Check Out" button is visible only after a successful check-in for that day
- [ ] On click, the current date and time are captured automatically
- [ ] A confirmation dialog appears before submitting
- [ ] On success, a success message is shown and the check-out time is recorded
- [ ] The "Check Out" button is disabled after a successful check-out for that day

---

### US-11 — Attendance Validation

**As an** employee,  
**I want** the system to prevent duplicate or invalid attendance entries,  
**so that** my records remain accurate.

**Acceptance Criteria:**
- [ ] If the employee tries to check in when already checked in today, the API returns an error and the UI displays: `"You have already checked in today"`
- [ ] If the employee tries to check out without having checked in, the API returns an error and the UI displays: `"You must check in before checking out"`

---

## Epic 04 — Attendance Summary

---

### US-12 — View My Attendance Summary (Default)

**As an** employee,  
**I want to** see my attendance records for the current month,  
**so that** I can review how many days I have worked.

**Acceptance Criteria:**
- [ ] The default date range is from the 1st of the current month to today
- [ ] Each row shows: Check-in date/time and Check-out date/time (paired)
- [ ] If check-out has not been recorded, show `"—"` in the check-out column
- [ ] Records are sorted by date, most recent first
- [ ] Empty state message is shown if no records exist: `"No attendance records found"`

---

### US-13 — Filter Attendance by Date Range

**As an** employee,  
**I want to** filter my attendance summary by a custom date range,  
**so that** I can review specific periods.

**Acceptance Criteria:**
- [ ] A date range filter is available with a "From" date picker and a "To" date picker
- [ ] A "Search" button triggers the filter
- [ ] The table updates to show only records within the selected range
- [ ] If "To" date is earlier than "From" date, show a validation error: `"End date must be after start date"`
- [ ] Clearing the filter resets to the default current-month view

---

### US-14 — Attendance Summary Table Layout

**As an** employee,  
**I want** the attendance table to be readable on both desktop and mobile,  
**so that** I can check it easily from any device.

**Acceptance Criteria:**
- [ ] Table layout adapts to mobile screen size (horizontal scroll or stacked card layout)
- [ ] Date and time are formatted clearly: `YYYY-MM-DD HH:mm`

---

## Epic 05 — HR Admin: Employee Management

---

### US-15 — View Employee List

**As an** HR admin,  
**I want to** view a list of all employees,  
**so that** I have a complete overview of the workforce.

**Acceptance Criteria:**
- [ ] A paginated table displays: Name, Email, Position, Phone Number, and action buttons
- [ ] Default page size is 10 records per page
- [ ] A search input to filter by name or email is available

---

### US-16 — Add New Employee

**As an** HR admin,  
**I want to** add a new employee record,  
**so that** the new hire can access the system.

**Acceptance Criteria:**
- [ ] A form/modal is available to input: Full Name, Company Email, Position, Phone Number, and initial Password
- [ ] All fields are required
- [ ] Email must be unique — if duplicate, show error: `"This email is already registered"`
- [ ] On success, the new employee appears in the list and can log in immediately

---

### US-17 — Edit Employee Record

**As an** HR admin,  
**I want to** update an employee's record,  
**so that** employee data stays accurate over time.

**Acceptance Criteria:**
- [ ] An edit button is available per employee row
- [ ] Admin can update: Full Name, Position, Phone Number
- [ ] Email is read-only (cannot be changed after creation)
- [ ] On success, the table row reflects the updated data

---

### US-18 — View Employee Detail

**As an** HR admin,  
**I want to** view the full profile of a specific employee,  
**so that** I can access all their information in one place.

**Acceptance Criteria:**
- [ ] A detail view shows all employee fields including profile photo
- [ ] Navigating to the detail view does not lose the list's filter/pagination state

---

## Epic 06 — HR Admin: Attendance Monitoring

---

### US-19 — View All Attendance Records

**As an** HR admin,  
**I want to** view all attendance submissions from all employees,  
**so that** I can monitor punctuality and compliance.

**Acceptance Criteria:**
- [ ] A paginated table shows: Employee Name, Check-in date/time, Check-out date/time
- [ ] Default view shows the current month's records
- [ ] Data is read-only — no edit or delete actions

---

### US-20 — Filter Attendance by Employee & Date Range

**As an** HR admin,  
**I want to** filter the attendance table by employee name and/or date range,  
**so that** I can investigate a specific employee's attendance.

**Acceptance Criteria:**
- [ ] Filter includes: employee name (text search), From date, To date
- [ ] Filters can be combined
- [ ] A "Reset" button clears all filters and returns to default view

---

### US-21 — Attendance Export (Future)

**As an** HR admin,  
**I want to** export attendance data,  
**so that** I can use it in payroll or reporting tools.

> **Note:** This story is **out of scope for v1.0**. Tracked here for future consideration.

---

## Epic 07 — Notifications & Audit Log

---

### US-22 — Real-Time Notification via Firebase FCM

**As an** HR admin,  
**I want to** receive a browser notification when an employee updates their profile,  
**so that** I am immediately aware of changes.

**Acceptance Criteria:**
- [ ] Admin browser registers a Firebase FCM service worker on first load
- [ ] Notification appears as a browser popup/toast with employee name and change type
- [ ] Notifications work even if the admin app tab is in the background

---

### US-23 — Audit Log via RabbitMQ

**As a** system architect,  
**I want** every profile change to be published as an event to RabbitMQ and persisted in a separate audit database,  
**so that** a complete immutable change history is maintained.

**Acceptance Criteria:**
- [ ] Employee Service publishes a message to the `employee.profile.updated` exchange on every profile change
- [ ] Audit Consumer service subscribes and writes to the `audit_db`
- [ ] Each audit record includes: `employee_id`, `field_changed`, `old_value`, `new_value`, `changed_at`
- [ ] Password changes are logged but `old_value` and `new_value` are stored as `[REDACTED]`
- [ ] If the audit consumer is down, messages queue in RabbitMQ and are processed when it recovers

---

### US-24 — Audit Log View (Future)

**As an** HR admin,  
**I want to** view the audit log of employee profile changes,  
**so that** I have visibility into the full change history.

> **Note:** This story is **out of scope for v1.0**. Tracked here for future consideration.

---

## Document Change Log

| Version | Date | Author | Change Description |
|---|---|---|---|
| 1.0.0 | 2025-01-01 | — | Initial draft |

> **Rule:** Any new feature or change to behavior **must** result in a new or updated user story with revised acceptance criteria before development begins.

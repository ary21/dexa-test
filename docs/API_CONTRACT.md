# API Contract

> **Interactive API Documentation:** An interactive Swagger UI is available at `/api/docs` when the backend server is running (`http://localhost:3000/api/docs`). It includes detailed schema definitions and live testing capabilities.
## Base URL
```
Development:  http://localhost:3000/api
Production:   https://<your-domain>/api
```

## Authentication Header
All protected routes require:
```
Authorization: Bearer <jwt_token>
```

---

## Auth

### `POST /auth/login`
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

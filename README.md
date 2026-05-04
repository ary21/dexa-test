# Dexa Attendance System

An enterprise-grade **Employee Attendance and Monitoring System** built with modern web technologies. This monorepo contains the Employee Frontend, HRD Admin Frontend, and the NestJS Backend API, fully dockerized and integrated with MinIO, RabbitMQ, PostgreSQL, and GlitchTip (Sentry alternative).

## 🚀 Features

- **Employee App**:
  - Secure login and profile management.
  - Real-time Check-In / Check-Out.
  - Profile photo upload (via MinIO S3-compatible storage).
  - View monthly attendance summary.
- **HRD Admin App**:
  - Dashboard to monitor all employee attendances in real-time.
  - Manage employee data (Create, Read, Update).
  - Real-time push notifications via Firebase Cloud Messaging (FCM) when an employee updates their profile.
- **Backend API**:
  - Built with NestJS and Prisma ORM.
  - Event-driven architecture with RabbitMQ for Audit Logging (`audit_db`).
  - Comprehensive Error Tracking via GlitchTip (Sentry SDK).

## 🏗️ Architecture Stack

- **Frontend**: React 18, Vite, TailwindCSS, TanStack Query, React Router v6, Lucide React.
- **Backend**: NestJS, TypeScript, Prisma (PostgreSQL), Firebase Admin SDK.
- **Infrastructure** (Docker Compose):
  - **PostgreSQL**: Main `attendance_db` and separate `audit_db`.
  - **MinIO**: Local S3-compatible object storage for profile photos.
  - **RabbitMQ**: Message broker for asynchronous audit logging.
  - **Redis & GlitchTip**: Self-hosted error tracking and performance monitoring.

---

## 💻 Local Development Setup

### 1. Prerequisites
- **Node.js** (v20.0.0 or higher)
- **pnpm** (v9.0.0 or higher) - `npm install -g pnpm`
- **Docker Desktop** (must be running)

### 2. Installation
Clone the repository and install dependencies from the root directory:
```bash
pnpm install
```

### 3. Environment Variables
Copy the example environment variables to the root and API folder:
```bash
cp .env.example .env
cp .env.example apps/api/.env
```
> **Note:** Fill in the Firebase credentials inside `.env` to enable Push Notifications.

### 4. Start Infrastructure (Docker)
Ensure Docker Desktop is running, then spin up the databases and services:
```bash
docker compose up -d
```
*If you encounter a download error (e.g., EOF on glitchtip), try re-running the command.*

### 5. Database Setup (Prisma)
Once PostgreSQL is running, run migrations and seed the database with initial data:
```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
npx prisma generate --schema=prisma/schema.audit.prisma
npx prisma db seed
cd ../..
```
*The seed script will create a default admin user: `admin@dexa.com` / `password`.*

### 6. Run the Application
Start the development servers for all apps simultaneously:
```bash
pnpm run dev
```
- **Employee App**: http://localhost:3001
- **HRD Admin App**: http://localhost:3002
- **Backend API**: http://localhost:3000/api
- **Swagger API Docs**: http://localhost:3000/api/docs

---

## 🌐 Production / Live Server Setup

For deploying to a live server (VPS / Cloud VM), follow these best practices:

### 1. Production Environment Variables
Set all variables in a secure `.env` file on your server. Ensure that `VITE_API_BASE_URL` points to your public domain (e.g., `https://api.yourdomain.com`).

### 2. SSL/TLS Configuration
Use **Nginx Reverse Proxy** combined with **Certbot (Let's Encrypt)** to secure your endpoints with HTTPS. This is required for Firebase Service Workers (FCM Notifications) to function correctly on the browser.

### 3. Deployment using Docker
It is recommended to containerize the Node.js API and serve the React frontends via Nginx.
1. Build the frontend assets:
   ```bash
   pnpm run build
   ```
2. The outputs will be located in `apps/employee-app/dist` and `apps/hrd-admin-app/dist`. Mount these static files to your Nginx web server.
3. Start the production backend API:
   ```bash
   cd apps/api
   pnpm run start:prod
   ```

### 4. Securing MinIO
Expose MinIO through Nginx and ensure the bucket policies are configured correctly so that profile photos can be publicly read, while write operations remain restricted via pre-signed URLs.

---

## 🧪 Testing

The repository uses **Vitest** and **React Testing Library** for frontend components, and **Jest** for backend services.

To run all unit tests:
```bash
pnpm run test
```

For E2E Testing scenarios, refer to the `docs/E2E_TEST_REPORT.md`.

---

## 📂 Documentation Reference
- `docs/PRD.md` - Product Requirements Document
- `docs/TECHNICAL_PLAN.md` - Technical Implementation Steps
- `docs/IMPLEMENTATION_PLAN.md` - Progress & Checklist
- `docs/API_CONTRACT.md` - Endpoints Reference
- `docs/USER_STORIES.md` - Detailed User Stories and Acceptance Criteria

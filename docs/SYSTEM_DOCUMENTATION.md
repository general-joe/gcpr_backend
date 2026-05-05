# GCPR Backend — Full System Documentation

> Version: 1.1 · Stack: Node.js · Express 5 · Prisma 7 · PostgreSQL · Socket.IO · Firebase · OpenAI

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture & Stack](#2-architecture--stack)
3. [Repository Structure](#3-repository-structure)
4. [Environment Variables](#4-environment-variables)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [User Roles & Admin Model](#6-user-roles--admin-model)
7. [Service Provider Verification Flow](#7-service-provider-verification-flow)
8. [Module Reference (API)](#8-module-reference-api)
   - 8.1 Auth
   - 8.2 ServiceProvider
   - 8.3 CareGiver
   - 8.4 CpPatient
   - 8.5 Assessment
   - 8.6 FunctionalClassification
   - 8.7 ScheduleAppointment
   - 8.8 Metrics
   - 8.9 Notification
   - 8.10 **Caregiver Chatbot** *(new)*
   - 8.11 Community
   - 8.12 Direct Message
   - 8.13 Resource
   - 8.14 User
9. [Clinical Workflow End-to-End](#9-clinical-workflow-end-to-end)
10. [Automation & Background Jobs](#10-automation--background-jobs)
11. [Metrics & Adherence System](#11-metrics--adherence-system)
12. [Real-time Events (Socket.IO)](#12-real-time-events-socketio)
13. [Notifications](#13-notifications)
14. [Data Models Glossary](#14-data-models-glossary)
15. [AI Feature Blueprint (Future)](#15-ai-feature-blueprint-future)
16. [Voice Assistant Blueprint (Future)](#16-voice-assistant-blueprint-future)
17. [Deployment & Production Checklist](#17-deployment--production-checklist)

---

## 1. System Overview

GCPR (**Ghana Cerebral Palsy Rehabilitation**) is a digital health platform connecting:

- **Caregivers** (parents / guardians / group organisations) who manage CP children's care journey.
- **Service Providers** (physiotherapists, OTs, speech therapists, dietitians, pharmacists, and paediatricians) who deliver clinical assessments, referrals, and rehab tasks.
- **Admins** who verify service provider credentials and monitor platform health.

The platform supports:
- CP patient registration and enrollment tracking
- Multi-tool clinical assessments (GMFM-88, SLT, OT, Physiotherapy, etc.)
- Functional classification with trend monitoring (GMFCS, MACS, CFCS, EDACS, VIKING)
- Clinical referral pathways with automated profession-matching
- Rehab task assignment with caregiver-side progress tracking
- Appointment scheduling between caregivers and service providers
- Metrics dashboards (provider-level, patient-level, system-wide)
- Real-time notifications via in-app, Socket.IO, and Firebase push
- Community groups, direct messaging, and resource sharing
- Ghana Post GPS digital address lookup and geocoding

---

## 2. Architecture & Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Mobile / Web)                 │
│         REST API  ·  WebSocket (Socket.IO)              │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────▼─────────────────────────────┐
│            Express 5 API Server (Node.js ESM)           │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Middlewares│  │   Modules    │  │ Cron Services │  │
│  │  auth / zod │  │ 14 feature   │  │ licenseSync   │  │
│  │  rateLimit  │  │   modules    │  │ metricsSnap   │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
└───────────────────────────┬─────────────────────────────┘
                            │ Prisma ORM (pg adapter)
┌───────────────────────────▼─────────────────────────────┐
│               PostgreSQL Database                        │
│  50+ models: Users, ServiceProviders, Patients,         │
│  Assessments, Referrals, Tasks, FunctionalClassif.,     │
│  Metrics snapshots, Community, Telehealth, Games, …     │
└─────────────────────────────────────────────────────────┘
         │ Firebase Admin         │ Ghana Post GPS API
         ▼                        ▼
  Push notifications       Digital address lookup
  (FCM, iOS/Android)       (coordinates, district)
```

**Key dependencies:**

| Package | Purpose |
|---|---|
| `express` v5 | HTTP framework |
| `@prisma/client` v7 | ORM |
| `@prisma/adapter-pg` | Native pg pool adapter |
| `zod` v4 | Request validation |
| `jsonwebtoken` | JWT auth |
| `socket.io` v4 | Real-time bidirectional events |
| `firebase-admin` | Push notifications (FCM) |
| `node-cron` v4 | Background scheduled jobs |
| `multer` | File upload handling |
| `axios` | Outbound HTTP (Ghana GPS, Nominatim) |
| `bcryptjs` | Password hashing |

---

## 3. Repository Structure

```
gcpr_backend/
├── index.js                      # Entry: starts server + cron jobs
├── package.json
├── prisma/
│   ├── schema.prisma             # Single schema (50+ models)
│   └── migrations/               # 32 SQL migration files
├── src/
│   ├── server.js                 # Express app, Socket.IO, global middleware
│   ├── routes/
│   │   └── index.route.js        # Central router mount points
│   ├── config/
│   │   ├── database.js           # Shared PrismaClient with pg pool
│   │   ├── swagger.js
│   │   └── tools/                # Assessment tool JSON configs (7 tools)
│   ├── middlewares/
│   │   ├── auth.js               # Auth() + authorize([roles])
│   │   ├── catchAsync.js
│   │   ├── validation.js         # validate(zodSchema) middleware
│   │   └── upload.js / videoUpload.js
│   ├── modules/
│   │   ├── auth/
│   │   ├── assessment/           # Assessments + referrals + rehab tasks
│   │   ├── careGiver/
│   │   ├── community/            # Community + groups + announcements
│   │   ├── cpPatient/
│   │   ├── directMessage/
│   │   ├── functionalClassification/   ← NEW
│   │   ├── metrics/                    ← NEW
│   │   ├── notification/
│   │   ├── resource/
│   │   ├── scheduleAppointment/
│   │   ├── serviceProvider/
│   │   └── user/
│   ├── services/
│   │   ├── assessment/           # Scoring engine + referral engine
│   │   └── cron/                 ← NEW (licenseSync + metricsSnapshot)
│   ├── socket.io.js              # Socket.IO singleton
│   └── utils/
│       ├── constants.js, logger.js, http-status.js, http-error.js
│       ├── UtilFunctions.js, password.js, responseCodes.js
│       ├── emailSmtp.js, hubtel-sms.js, firebaseService.js
│       └── uploadService.js, youtube-api.js
└── docs/
    └── SYSTEM_DOCUMENTATION.md  ← This file
```

---

## 4. Environment Variables

Create a `.env` file at the project root:

```env
# ─── Core ────────────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@host:5432/gcpr_db
PORT=3000
NODE_ENV=production

# ─── JWT ─────────────────────────────────────────────────
JWT=your_super_secret_jwt_key_here

# ─── API Docs ─────────────────────────────────────────────
DOCS_URL=https://api.yourdomain.com
GCPR_API_URL=http://localhost:3000

# ─── OTP / SMS (Hubtel Ghana) ─────────────────────────────
HUBTEL_CLIENT_ID=your_hubtel_client_id
HUBTEL_CLIENT_SECRET=your_hubtel_secret
HUBTEL_FROM=GCPR
HUBTEL_CALLBACK_URL=https://api.yourdomain.com/auth/otp-callback

# ─── Email (SMTP / SendGrid) ──────────────────────────────
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=no-reply@yourdomain.com

# ─── Firebase (push notifications) ───────────────────────
FIREBASE_PROJECT_ID=your_firebase_project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...

# ─── File Storage (cloud / MinIO / S3) ───────────────────
STORAGE_ENDPOINT=https://your-storage.com
STORAGE_ACCESS_KEY=key
STORAGE_SECRET_KEY=secret

# ─── OpenAI / Caregiver Chatbot ──────────────────────────────────
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini   # optional — defaults to gpt-4o-mini

# ─── X-API-KEY guard (optional) ──────────────────────────
API_KEY=your_x_api_key_for_client_auth
```

### Required for production

| Variable | Where |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT` | Any long random secret |
| `FIREBASE_*` | Firebase Admin SDK credentials |
| `HUBTEL_*` | Hubtel Ghana SMS/OTP credentials |

### Optional but recommended

| Variable | Effect if missing |
|---|---|
| `SENDGRID_API_KEY` | Email OTP and reset-password won't send |

---

## 5. Authentication & Authorization

All routes are protected by two middleware layers:

### `Auth(req, res, next)` — permissive
Attempts to decode the Bearer JWT from the `Authorization` header. If valid, sets `res.locals.user = { id, role, ... }`. If missing or invalid, sets `res.locals.user = { role: "guest", is_guest: true }` — **does not block the request**.

Used on public-ish routes where the user identity enriches the response but isn't required.

### `authorize(allowedRoles)` — strict
Requires a valid JWT. Checks `decoded.role` against `allowedRoles`. Returns:
- `401 Unauthorized` — no or invalid token
- `403 Forbidden` — wrong role

**Example:**
```js
router.get("/admin/pending-verification", authorize(["ADMIN"]), handler);
router.post("/submit", authorize(["SERVICE_PROVIDER"]), handler);
```

### Token format
```json
{ "id": "uuid", "role": "SERVICE_PROVIDER" }
```
Signed with `HS256`, expires in **4 hours**. A refresh token (256-char random) is stored and used to re-issue access tokens.

---

## 6. User Roles & Admin Model

| Role | Description |
|---|---|
| `SERVICE_PROVIDER` | Licensed clinician (physiotherapist, OT, speech therapist, etc.) |
| `CAREGIVER` | Parent/guardian or group organisation managing a CP child |
| `ADMIN` | Platform administrator — a service provider with superuser access |

### Admin = Service Provider with ADMIN Role

An Admin **is** a service provider. They:
1. Register via `POST /auth/register` with `role: ADMIN`
2. Complete their service provider profile with their professional licence details (same as any SP)
3. Are automatically **VERIFIED** for clinical actions (they don't need to verify themselves)
4. Have access to **all** endpoints across **all** roles — the `authorize()` middleware treats `ADMIN` as a superuser that bypasses any role restriction

This means a single admin account can:
- Verify / reject / suspend other service providers
- View all patient data, metrics, assessments
- Access caregiver chatbot
- Perform any clinical action a service provider can do
- View system-wide metrics dashboard

### Creating an Admin Account

```json
POST /auth/register
{
  "fullName": "Dr. Admin User",
  "password": "SecurePass123!",
  "phoneNumber": "0244000001",
  "gender": "MALE",
  "role": "ADMIN",
  "otpChannel": "sms"
}
```

After OTP verification, they can immediately complete their SP profile and start managing the platform.

### How `authorize()` works for ADMIN

```
authorize(["SERVICE_PROVIDER"])   →  ADMIN passes ✓
authorize(["CAREGIVER"])          →  ADMIN passes ✓
authorize(["ADMIN"])              →  ADMIN passes ✓
authorize(["SERVICE_PROVIDER",
           "CAREGIVER"])          →  ADMIN passes ✓
```

The JWT payload for all roles is: `{ id, email, role }`. For admins, `role` is `"ADMIN"`.


---

## 7. Service Provider Verification Flow

All service providers start with `verificationStatus = PENDING_REVIEW` when they complete their profile. They are **blocked from clinical write actions** (submit assessment, create referral, assign rehab tasks, create functional classifications) until an admin verifies them.

```
[SP registers] ──► verificationStatus: PENDING_REVIEW
                          │
               Admin reviews license + credentials
                          │
             ┌────────────▼────────────┐
             │  PATCH /:id/verify      │ ──► verificationStatus: VERIFIED
             │  PATCH /:id/reject      │ ──► verificationStatus: REJECTED + notified
             │  PATCH /:id/suspend     │ ──► verificationStatus: SUSPENDED
             └─────────────────────────┘
```

### Admin endpoints

| Method | Endpoint | Body |
|---|---|---|
| `GET` | `/service-provider/admin/pending-verification` | — |
| `GET` | `/service-provider/:id/verification-status` | — |
| `PATCH` | `/service-provider/:id/verify` | `{ note?: string }` |
| `PATCH` | `/service-provider/:id/reject` | `{ reason: string }` |
| `PATCH` | `/service-provider/:id/suspend` | `{ reason?: string }` |

On verify/reject/suspend, the SP receives an **in-app + Socket.IO notification** automatically.

---

## 8. Module Reference (API)

All endpoints require `Authorization: Bearer <token>` unless marked public.

---

### 8.1 Auth — `/auth`

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/register` | public | Register user (CAREGIVER or SERVICE_PROVIDER). Sends OTP via SMS or email. |
| POST | `/verify-otp` | public | Verify OTP code sent after registration |
| POST | `/resend-otp` | public | Resend OTP |
| POST | `/login` | public | Login with email/phone + password. Returns `{ accessToken, refreshToken }` |
| POST | `/forgot-password` | public | Send password reset link/code |
| POST | `/reset-password` | public | Complete password reset |
| POST | `/refresh-token` | public | Exchange refresh token for new access token |

**Register request body:**
```json
{
  "fullName": "Kwame Mensah",
  "password": "SecurePass123",
  "phoneNumber": "0244123456",
  "gender": "MALE",
  "role": "SERVICE_PROVIDER",
  "otpChannel": "sms"
}
```

**Login response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "a8f3...",
    "user": { "id": "uuid", "role": "SERVICE_PROVIDER", "fullName": "Kwame Mensah" }
  }
}
```

---

### 8.2 ServiceProvider — `/service-provider`

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/complete-profile` | SERVICE_PROVIDER | Complete SP profile (license, profession, facility). Requires `licenseImage` multipart |
| GET | `/` | SP \| CAREGIVER | List all service providers (paginated) |
| GET | `/search?search=…` | SP \| CAREGIVER | Search by name, facility, profession |
| GET | `/:id` | SP \| CAREGIVER | Get SP by ID |
| PUT | `/:id` | SERVICE_PROVIDER | Update own profile |
| PUT | `/:id/availability` | SERVICE_PROVIDER | Set weekly availability slots |
| DELETE | `/:id` | SERVICE_PROVIDER | Delete own profile |
| **GET** | **/admin/pending-verification** | **ADMIN** | **List SPs awaiting verification** |
| **GET** | **/:id/verification-status** | **ADMIN \| SP** | **Get verification status** |
| **PATCH** | **/:id/verify** | **ADMIN** | **Verify a service provider** |
| **PATCH** | **/:id/reject** | **ADMIN** | **Reject a service provider** |
| **PATCH** | **/:id/suspend** | **ADMIN** | **Suspend a service provider** |

**Complete profile body:**
```json
{
  "licensePin": "12345678",
  "licenseNumber": "AHPC-12345",
  "licenseExpiry": "2027-12-31",
  "licenseIssuedDate": "2022-01-01",
  "licenseType": "AHPC",
  "profession": "PHYSIOTHERAPIST",
  "facilityType": "REGIONAL_HOSPITAL",
  "facilityName": "Korle Bu Teaching Hospital",
  "facilityAddress": "Accra, Ghana",
  "experience": 5
}
```

**Availability body:**
```json
{
  "availability": [
    { "dayOfWeek": 1, "startTime": "08:00", "endTime": "17:00" },
    { "dayOfWeek": 3, "startTime": "08:00", "endTime": "14:00" }
  ]
}
```

---

### 8.3 CareGiver — `/caregiver`

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/complete-profile` | CAREGIVER | Complete caregiver profile (individual or group) |
| GET | `/` | CAREGIVER | Get own caregiver profile |

**Individual caregiver body:**
```json
{
  "type": "INDIVIDUAL",
  "occupation": "Teacher",
  "educationLevel": "TERTIARY",
  "idType": "NATIONAL_ID",
  "idNumber": "GHA-12345678-0"
}
```

---

### 8.4 CpPatient — `/cp-patient`

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/` | CAREGIVER | Register a CP patient. Auto-creates enrollment record. |
| GET | `/` | CAREGIVER | List own patients |
| GET | `/:patientId/assigned-tasks` | CAREGIVER | List tasks assigned to a patient |
| PATCH | `/:patientId/assigned-tasks/:taskId/days/done` | CAREGIVER | Mark a task day complete. Auto-logs TaskAdherenceLog. |

**Create patient body:**
```json
{
  "fullName": "Ama Owusu",
  "dateOfBirth": "2018-05-15",
  "gender": "FEMALE",
  "address": "Kumasi, Ghana",
  "placeOfBirth": "Kumasi",
  "relationToCaregiver": "PARENT",
  "householdSize": 4,
  "schoolEnrollmentStatus": true
}
```

**Mark task day done body:**
```json
{
  "completionDate": "2026-05-05"
}
```
This automatically:
1. Adds the date to `RehabTask.completedDates`
2. Recalculates `RehabTask.progress` (%)
3. Sets `status = "COMPLETED"` if all days are done
4. Creates / updates a `TaskAdherenceLog` entry for that date

---

### 8.5 Assessment — `/assessment`

> ⚠️ **Write actions require VERIFIED service provider status.**

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/tools` | SERVICE_PROVIDER | List all available assessment tools |
| GET | `/tools/:toolCode/form` | SERVICE_PROVIDER | Get assessment form for a specific tool |
| POST | `/submit` | SERVICE_PROVIDER ✓ | Submit/save an assessment with responses |
| GET | `/:id/report` | SERVICE_PROVIDER | Get scored report for an assessment |
| GET | `/:id/referral-recommendations` | SERVICE_PROVIDER | AI-style referral recommendations from assessment scores |
| GET | `/patient/:patientId/reports` | SERVICE_PROVIDER | All assessment reports for a patient |
| GET | `/referrals/incoming` | SERVICE_PROVIDER | Referrals directed to this provider |
| GET | `/referrals/outgoing` | SERVICE_PROVIDER | Referrals this provider sent |
| POST | `/referrals` | SERVICE_PROVIDER ✓ | Create a clinical referral |
| PATCH | `/referrals/:id/status` | SERVICE_PROVIDER | Update referral status (ACCEPTED/DECLINED/COMPLETED) |
| POST | `/referrals/:id/tasks` | SERVICE_PROVIDER ✓ | Create rehab task from accepted referral |
| GET | `/tasks/my` | SERVICE_PROVIDER | My assigned rehab tasks |

**Submit assessment body:**
```json
{
  "patientId": "uuid",
  "toolCode": "GMFM_88",
  "toolVersion": "1.0",
  "status": "COMPLETED",
  "responses": {
    "A1": "1", "A2": "2", "A3": "NT",
    "B1": "3", "B2": "2"
  }
}
```

**Supported tool codes:**
- `GMFM_88` — Gross Motor Function Measure 88
- `SLT_CP_BASELINE` — Speech-Language Therapy baseline
- `PAEDIATRIC_PHYSIOTHERAPY_ASSESSMENT`
- `OT_CP_CLINICAL_ASSESSMENT`
- `CP_PROGRAM_INTAKE`
- `HOME_REHAB_PHARMACY_PRESCRIPTION`
- `DIETITIAN_NUTRITION_CONSULTATION`

**Create referral body:**
```json
{
  "patientId": "uuid",
  "assessmentId": "uuid",
  "toProfession": "OCCUPATIONAL_THERAPIST",
  "reason": "Moderate fine motor limitation observed in GMFM-88 Dimension B"
}
```

**Create rehab task from referral body:**
```json
{
  "title": "Upper Limb Strengthening",
  "instructions": "Perform seated arm exercises using resistance bands as demonstrated",
  "instructionSteps": [
    "Sit upright in chair",
    "Hold resistance band at chest level",
    "Push arms forward slowly – hold 3 seconds",
    "Return to start – repeat 10 times"
  ],
  "frequencyPerDay": 2,
  "durationDays": 21,
  "startDate": "2026-05-10"
}
```

---

### 8.6 FunctionalClassification — `/functional-classification` *(NEW)*

> ⚠️ **Write actions require VERIFIED service provider status.**

Records standardised functional classification levels for CP patients across multiple classification systems. Automatically tracks trends and generates `MotorFunctionOutcome` records when a new classification is compared to a prior baseline.

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/` | SERVICE_PROVIDER ✓ | Record a new classification |
| GET | `/patient/:patientId` | SERVICE_PROVIDER | List all classifications for a patient |
| GET | `/patient/:patientId/summary` | SERVICE_PROVIDER | Progress summary with trends per classifier |
| GET | `/:id` | SERVICE_PROVIDER | Get single classification record |
| PATCH | `/:id` | SERVICE_PROVIDER ✓ | Update own classification record |
| DELETE | `/:id` | SERVICE_PROVIDER ✓ | Delete own classification record |

**Supported classifier types:**
- `GMFCS` — Gross Motor Function Classification System (levels 1–5)
- `MACS` — Manual Ability Classification System (levels 1–5)
- `CFCS` — Communication Function Classification System (levels 1–5)
- `EDACS` — Eating and Drinking Ability Classification System (levels 1–5)
- `VIKING_SPEECH_SCALE` — Viking Speech Scale (levels 1–4; use 1–4 and cap at 4)
- `OTHER`

**Create body:**
```json
{
  "patientId": "uuid",
  "classifier": "GMFCS",
  "level": 3,
  "assessedAt": "2026-05-05",
  "notes": "Child can walk with walking aids. Some limitations on uneven surfaces."
}
```

**Progress summary response:**
```json
{
  "patient": { "id": "uuid", "fullName": "Ama Owusu" },
  "classifierSummary": {
    "GMFCS": {
      "latestLevel": 3,
      "assessedAt": "2026-05-05T00:00:00.000Z",
      "trend": "IMPROVING",
      "totalAssessments": 4
    },
    "MACS": {
      "latestLevel": 2,
      "assessedAt": "2026-04-01T00:00:00.000Z",
      "trend": "STABLE",
      "totalAssessments": 2
    }
  },
  "latestMotorOutcome": {
    "outcomeDirection": "IMPROVED",
    "percentageChange": 33.33,
    "baselineLevel": 4,
    "currentLevel": 3
  }
}
```

**Automation on create:**
- If a prior classification for the same patient and classifier exists, a `MotorFunctionOutcome` is automatically created:
  - `level < prior` → `IMPROVED`
  - `level > prior` → `REGRESSED`
  - `level = prior` → `STABLE`
- The patient's caregiver receives an in-app notification.

---

### 8.7 ScheduleAppointment — `/schedule-appointment`

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/available-providers` | CAREGIVER | Providers available at a given date/time |
| GET | `/provider-availability` | SP \| CAREGIVER | Get a provider's weekly availability |
| POST | `/` | CAREGIVER | Book an appointment |
| PATCH | `/approve` | SERVICE_PROVIDER | Approve a pending appointment |
| PATCH | `/reschedule` | SERVICE_PROVIDER | Reschedule an appointment |
| GET | `/provider` | SERVICE_PROVIDER | Own appointments |
| GET | `/caregiver` | CAREGIVER | Caregiver's appointments |

---

### 8.8 Metrics — `/metrics` *(NEW)*

Provides access to pre-computed and on-demand performance snapshots.

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/provider` | SERVICE_PROVIDER | Own provider metrics for a period |
| GET | `/patient/:patientId` | SP \| CAREGIVER | Patient-level metrics |
| GET | `/system` | ADMIN | System-wide platform metrics |
| POST | `/compute/provider` | ADMIN | Trigger provider snapshot computation |
| POST | `/compute/system` | ADMIN | Trigger system snapshot |
| POST | `/compute/all` | ADMIN | Full batch compute (all providers + system) |

**Query parameters for GET endpoints:**
- `period` — `DAILY` | `WEEKLY` | `MONTHLY` | `QUARTERLY` | `YEARLY` (default: `DAILY` for provider, `WEEKLY` for patient)
- `date` — ISO date string. Defaults to today. The snapshot for the period containing this date is returned.

**Example: Get own metrics for current week**
```
GET /metrics/provider?period=WEEKLY
```

**Response (provider metrics):**
```json
{
  "source": "snapshot",
  "snapshot": {
    "providerId": "uuid",
    "snapshotDate": "2026-05-05",
    "period": "WEEKLY",
    "totalChildrenAttended": 12,
    "averageAdherenceRate": 76.4,
    "totalAdheringPatients": 9,
    "totalNonAdheringPatients": 3,
    "totalImprovedOutcomes": 5,
    "totalStableOutcomes": 4,
    "totalRegressedOutcomes": 2,
    "appointmentsScheduled": 8,
    "appointmentsCompleted": 7,
    "assessmentsCompleted": 3,
    "referralsMade": 4
  }
}
```

**Response (patient metrics):**
```json
{
  "source": "computed",
  "snapshot": {
    "patientId": "uuid",
    "period": "WEEKLY",
    "tasksAssigned": 3,
    "tasksCompleted": 2,
    "adherenceRate": 66.67,
    "currentGmfcsLevel": 3,
    "appointmentsAttended": 1,
    "assessmentsCompleted": 0
  }
}
```

Snapshots are computed once by the cron job and cached. Subsequent requests for the same date+period return the cached snapshot instantly. On-demand computation via `/compute/*` forces a recalculation and updates the cache.

---

### 8.9 Notification — `/notification`

In-app notifications are automatically created by service methods (assessment, tasks, appointments, verification). Clients connect via Socket.IO to receive them in real-time.

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/` | any | Own notifications (paginated) |
| GET | `/unread-count` | any | Count of unread notifications |
| PATCH | `/:id/read` | any | Mark one notification as read |
| PATCH | `/read-all` | any | Mark all notifications as read |
| PATCH | `/:id/archive` | any | Archive a notification |
| DELETE | `/:id` | any | Delete a notification |
| POST | `/register-push-token` | any | Register device push token (FCM) |
| DELETE | `/push-token` | any | Deactivate push token on logout |

---

### 8.10 Caregiver Chatbot — `/chat` *(NEW)*

An AI-powered support chatbot backed by OpenAI GPT-4o-mini, designed to assist caregivers of children with Cerebral Palsy. The chatbot maintains **per-session conversation history** stored in the database, so conversations can be resumed.

**Roles:** CAREGIVER, SERVICE_PROVIDER, ADMIN (all authenticated users)

| Method | Path | Description |
|---|---|---|
| POST | `/chat/quick` | **Quickstart** — create a new session AND send the first message in one call |
| POST | `/chat/sessions` | Create an empty chat session |
| GET | `/chat/sessions` | List all sessions for current user (paginated) |
| GET | `/chat/sessions/:sessionId` | Get session metadata + message count |
| GET | `/chat/sessions/:sessionId/messages` | Paginated message history for a session |
| POST | `/chat/sessions/:sessionId/messages` | Send a message in an existing session |
| DELETE | `/chat/sessions/:sessionId` | Delete a session and all its messages |

**Rate limits:**
- 20 messages per minute per IP (prevents LLM API abuse)
- 100 requests per 15 minutes for session management endpoints

**Quickstart example:**
```
POST /chat/quick
Authorization: Bearer xxxxxxx
Content-Type: application/json

{ "message": "My child is 6 and has GMFCS Level 3. What exercises can help?" }
```

**Response:**
```json
{
  "status": "SUCCESS",
  "data": {
    "userMessage": {
      "id": "uuid",
      "role": "USER",
      "content": "My child is 6 and has GMFCS Level 3. What exercises can help?",
      "createdAt": "2026-05-05T17:30:00.000Z"
    },
    "response": {
      "id": "uuid",
      "role": "ASSISTANT",
      "content": "At GMFCS Level III, your child can walk with assistive devices... Here are some exercises your physiotherapist might include:\n\n- **Trunk strengthening**: ...\n- **Gait training**: ...\n- **Balance activities**: ...\n\nAlways check with your assigned physiotherapist before starting any new exercises. 😊",
      "createdAt": "2026-05-05T17:30:01.500Z",
      "model": "gpt-4o-mini",
      "tokensUsed": { "prompt": 540, "completion": 180, "total": 720 }
    }
  }
}
```

**Send a follow-up message in the same session:**
```
POST /chat/sessions/:sessionId/messages
{ "message": "How many times a day should we do these?" }
```

The chatbot remembers the full conversation context and gives a contextually relevant answer.

**What the chatbot knows:**
- Cerebral Palsy types, causes, and management
- GMFCS, MACS, CFCS, EDACS, VIKING classification levels (all levels explained simply)
- Physiotherapy, OT, and SLT rehab approaches for CP
- How to use the GCPR app features (tasks, appointments, notifications, metrics)
- Emotional support and caregiver coping strategies
- Ghana context (regional care, resource constraints)
- Can understand and respond in Ghanaian languages (Twi, Ga, Ewe) in addition to English

**What the chatbot will NOT do:**
- Prescribe medication or suggest dosages
- Replace clinical judgment
- Discuss unrelated topics (entertainment, politics)
- Provide crisis intervention (redirects to emergency services)

**Model used:** `gpt-4o-mini` by default. Override with `OPENAI_MODEL` env var (e.g. `gpt-4o`).

**Required env variable:** `OPENAI_API_KEY=sk-...`

---

### 8.11 Community, Groups, Announcements

```
GET/POST  /community                        — create / list communities
GET/PUT/DELETE /community/:id               — single community
POST /community/:id/join                    — join a community
POST /community/:id/messages                — send a community message
GET  /community/:id/messages                — read messages

GET/POST  /community/:id/groups             — community sub-groups
GET/POST  /community/:id/announcements      — community announcements
```

---

### 8.12 Direct Message — `/direct-message`

```
POST /direct-message/:receiverId            — send a DM
GET  /direct-message                        — conversation list
GET  /direct-message/:userId                — messages with a specific user
```

---

### 8.13 Resource — `/resource`

```
POST /resource                              — upload PDF/resource (SERVICE_PROVIDER)
GET  /resource                              — list resources
GET  /resource/:id                          — get single resource
DELETE /resource/:id                        — delete own resource
```

---

### 8.14 User — `/user`

```
GET    /user/profile                        — own profile
PATCH  /user/profile                        — update profile
DELETE /user/account                        — deactivate account
POST   /user/change-password                — change password
```

---

## 9. Clinical Workflow End-to-End

```
1. CAREGIVER registers   ──────────────────────────────────────────────┐
   • POST /auth/register                                               │
   • POST /auth/verify-otp                                             │
   • POST /caregiver/complete-profile                                  │
   • POST /cp-patient   ──► PatientEnrollmentRecord auto-created       │
                                                                       │
2. SERVICE_PROVIDER registers & awaits verification ──────────────────►│
   • POST /auth/register                                               │
   • POST /service-provider/complete-profile                           │
   • ── verificationStatus: PENDING_REVIEW ──────────────────────────►│
   • ADMIN: PATCH /service-provider/:id/verify                        │
   • ── verificationStatus: VERIFIED ──────────────────────────────── │
                                                                       │
3. CAREGIVER books appointment ─────────────────────────────────────  │
   • GET /schedule-appointment/available-providers?date=&time=        │
   • POST /schedule-appointment                                        │
   • SP: PATCH /schedule-appointment/approve                          │
                                                                       │
4. SP performs assessment ─────────────────────────────────────────── │
   • GET /assessment/tools                                             │
   • GET /assessment/tools/GMFM_88/form                               │
   • POST /assessment/submit  ──► ClinicalAssessmentReport created    │
   • GET /assessment/:id/report                                        │
   • GET /assessment/:id/referral-recommendations                     │
                                                                       │
5. SP records functional classification ──────────────────────────── │
   • POST /functional-classification  ──► MotorFunctionOutcome auto   │
   • GET /functional-classification/patient/:id/summary               │
                                                                       │
6. SP creates referral ─────────────────────────────────────────────  │
   • POST /assessment/referrals                                        │
   • Target SP: PATCH /assessment/referrals/:id/status (ACCEPTED)     │
                                                                       │
7. Target SP assigns rehab tasks ───────────────────────────────────  │
   • POST /assessment/referrals/:id/tasks                             │
                                                                       │
8. CAREGIVER tracks daily task completion ──────────────────────────  │
   • GET /cp-patient/:id/assigned-tasks                               │
   • PATCH /cp-patient/:id/assigned-tasks/:taskId/days/done          │
     ──► TaskAdherenceLog entry created for the day                   │
     ──► RehabTask.progress recalculated                              │
     ──► SP notified                                                   │
                                                                       │
9. Review metrics ──────────────────────────────────────────────────  │
   • GET /metrics/provider?period=WEEKLY                              │
   • GET /metrics/patient/:patientId?period=MONTHLY                  │
   • GET /metrics/system (ADMIN only)                                 │
```

---

## 10. Automation & Background Jobs

### Cron schedule

| Time | Job | Description |
|---|---|---|
| Daily 01:00 | License Sync | Updates `licenseStatus` (ACTIVE/INACTIVE) for all service providers based on `licenseExpiry` and `licenseIssuedDate` |
| Daily 02:00 | Metrics Snapshot | Computes `DAILY` provider + system snapshots for yesterday. Also computes `WEEKLY` on Mondays, `MONTHLY` on 1st of month |

Jobs are started automatically in `index.js` after the server starts via `startCronJobs()`.

### Inline automations (triggered by API actions)

| Trigger | Automation |
|---|---|
| Caregiver creates CP patient | Auto-creates `PatientEnrollmentRecord` (status: ACTIVE, programme: "GCPR CP Rehab Programme") |
| Caregiver marks task day done | Upserts `TaskAdherenceLog` for the day (status: COMPLETED). Notifies the SP. |
| SP creates FunctionalClassification | If a prior classification for same patient + classifier exists, auto-creates `MotorFunctionOutcome` with direction IMPROVED/STABLE/REGRESSED and percentage change |
| SP completes profile | Notification sent to SP. `verificationStatus: PENDING_REVIEW` set. |
| Admin verifies/rejects SP | Notification + Socket.IO event sent to SP's user |
| Any clinical referral created | Notification sent to referred provider (if direct) |
| Rehab task assigned from referral | Notification sent to caregiver |

---

## 11. Metrics & Adherence System

### Data models

| Model | Description |
|---|---|
| `TaskAdherenceLog` | One row per task per day. Statuses: PENDING / COMPLETED / MISSED / EXCUSED / PARTIAL |
| `PatientEnrollmentRecord` | One per patient (unique). Tracks enrollment start/end and programme |
| `MotorFunctionOutcome` | Auto-created from FunctionalClassification comparisons. Tracks IMPROVED/STABLE/REGRESSED |
| `ActivityParticipationLog` | Manual log of activity participation sessions |
| `ProviderMetricsSnapshot` | KPI snapshot for one provider for one period |
| `PatientMetricsSnapshot` | KPI snapshot for one patient for one period |
| `SystemMetricsSnapshot` | Platform-wide KPI snapshot |

### Adherence calculation

```
adherenceRate (%) = (completed log entries / total log entries) × 100
A provider is "adhering" if ≥ 80% of their patients have adherenceRate ≥ 80%
```

### Outcome tracking

Motor function outcomes flow:
```
FunctionalClassification (new level)
        │
        ▼ compare with prior classification (same patient + classifier)
MotorFunctionOutcome
├── outcomeDirection: IMPROVED | STABLE | REGRESSED
├── percentageChange: number
├── baselineLevel / currentLevel
└── baselineDate / reviewDate
```

---

## 12. Real-time Events (Socket.IO)

The server initialises Socket.IO on the same HTTP server. Clients join a room `user-{userId}` after authentication.

### Connection

```js
const socket = io("https://api.yourdomain.com", {
  auth: { token: "Bearer eyJ..." }
});
socket.emit("join-room", { userId: "uuid" });
```

### Events emitted by the server

| Event | Trigger | Payload |
|---|---|---|
| `new-notification` | Any `NotificationService.createNotification()` | `{ id, title, content, category, ... }` |
| `notification-badge-update` | Same as above | `{ userId, count: unreadCount }` |
| `notification-update` | Mark read / archive / delete | `{ type: 'MARK_AS_READ', notificationId }` |
| `service-provider-profile-updated` | SP profile created or updated | `{ type: 'PROFILE_COMPLETED', serviceProviderId }` |
| `service-provider-profile-deleted` | SP profile deleted | `{ type: 'PROFILE_DELETED', serviceProviderId }` |
| `account-verified` | Admin verifies/rejects SP | `{ verificationStatus, reason? }` |
| `account-status-changed` | Account deactivated | `{ userId, accountStatus }` |

---

## 13. Notifications

Every major action sends an in-app notification via `NotificationService.createNotification()`. The service:
1. Persists the notification to `Notification` table
2. Emits `new-notification` over Socket.IO for real-time delivery
3. Sends Firebase FCM push notification if the user has an active push token

**Categories:** `SYSTEM`, `TASK_REMINDER`, `DIRECT_MESSAGE`, `COMMUNITY_MESSAGE`, `COMMUNITY_ANNOUNCEMENT`

**Types:** `IN_APP`, `PUSH`

**Automatic notification triggers:**
- User registration → "Welcome" notification
- Patient created → caregiver notified
- Appointment booked → caregiver + SP notified
- Referral created → referred SP notified
- Rehab task assigned → caregiver notified
- Task progress updated → SP notified
- Functional classification recorded → caregiver notified
- SP verified / rejected / suspended → SP notified
- Community messages / announcements → all members notified

---

## 14. Data Models Glossary

| Model | Key fields |
|---|---|
| `User` | id, fullName, email, phoneNumber, role, verified, accountStatus |
| `ServiceProvider` | id, userId, profession, licenseStatus, **verificationStatus** |
| `CareGiver` | id, userId, type (INDIVIDUAL/GROUP) |
| `CpPatient` | id, fullName, dateOfBirth, caregiverId |
| `ClinicalAssessment` | id, patientId, providerId, toolCode, status, responses, reports[] |
| `ClinicalAssessmentReport` | id, assessmentId, scores (JSON), summary, interpretation |
| `ClinicalReferral` | id, patientId, fromProviderId, toProviderId?, toProfession, status |
| `RehabTask` | id, patientId, providerId, durationDays, completedDates[], progress, status |
| `FunctionalClassification` | id, patientId, assessorId, **classifier** (enum), level, assessedAt |
| `Appointment` | id, patientId, providerId, appointmentDate, status |
| `TaskAdherenceLog` | id, taskId, patientId, providerId, logDate, status |
| `PatientEnrollmentRecord` | id, patientId (unique), enrolledAt, status, programName |
| `MotorFunctionOutcome` | id, patientId, assessorId, baselineLevel, currentLevel, outcomeDirection |
| `ProviderMetricsSnapshot` | id, providerId, snapshotDate, period, 20+ KPI fields |
| `PatientMetricsSnapshot` | id, patientId, snapshotDate, period, adherenceRate, gmfcsLevel |
| `SystemMetricsSnapshot` | id, snapshotDate, period, platform-wide KPIs |
| `Notification` | id, userId, type, category, title, content, status, relatedId |

---

## 15. AI Feature Blueprint

> **Status (updated v1.1):**
> - ✅ **16.4 Caregiver Chatbot** — **IMPLEMENTED** (see section 8.11)
> - 📋 16.1, 16.2, 16.3 — Designed but not yet implemented

### 16.1 AI-Powered Assessment Analysis

**Goal:** After a clinical assessment is submitted, an LLM analyses the scored report and generates natural-language clinical insights beyond the current rule-based output.

**Proposed implementation:**
- Add `aiInsights` field to `ClinicalAssessmentReport` (JSON)
- After `processAssessment()`, call an LLM API (OpenAI GPT-4o / Google Gemini) with the structured scores + tool context
- Store and serve insights alongside existing recommendations
- Include "confidence level" and "suggested follow-up actions"

**Input to LLM:**
```json
{
  "tool": "GMFM_88",
  "patientAge": 6,
  "scores": { "totalScore": 42.5, "dimensionProfiles": {...} },
  "classificationHistory": [{ "classifier": "GMFCS", "level": 3, "trend": "IMPROVING" }]
}
```

**Output:**
```json
{
  "clinicalNarrative": "This 6-year-old patient demonstrates moderate-to-severe gross motor function limitations...",
  "priorityInterventions": ["Trunk strengthening", "Gait training with walker"],
  "progressProjection": "Based on current trajectory, GMFCS level 2 is achievable within 18-24 months with consistent physiotherapy.",
  "confidence": 0.82
}
```

### 16.2 Smart Referral Matching

**Goal:** Instead of profession-based referral routing, match to the best available provider based on:
- Provider's historic outcomes for similar patients (GMFCS level, age group)
- Provider availability
- Geographic proximity (Ghana GPS)

**Proposed flow:**
```
POST /assessment/:id/smart-referral-match
→ Returns ranked list of providers with match scores
→ SP selects from suggestions → creates referral
```

### 16.3 Predictive Adherence Alerts

**Goal:** Predict which patients are at risk of poor adherence based on patterns (task completion history, appointment attendance, caregiver engagement) and proactively alert the assigned SP.

**Proposed model:** Gradient boosting or simple threshold model trained on `TaskAdherenceLog` patterns. Runs as part of the nightly cron job.

### 16.4 Caregiver Support Chatbot ✅ IMPLEMENTED

> **See section 8.11** for full API reference and usage examples.

**Implementation summary:**
- Backed by OpenAI GPT-4o-mini (configurable via `OPENAI_MODEL`)
- Full conversation history stored per session in `ChatSession` + `ChatMessage` tables
- GCPR-specific system prompt covering CP types, GMFCS/MACS/CFCS/EDACS/VIKING, rehab tasks, Ghana context
- Emotional support + app navigation guidance built in
- Supports Twi, Ga, Ewe + English
- Rate limited (20 messages/min) to control OpenAI costs

---

## 16. Voice Assistant Blueprint (Future)

> **Status:** Design only. Not implemented.

### 17.1 Provider-side voice input

**Goal:** Service providers can speak assessment responses or notes, which are transcribed and auto-filled into the assessment form.

**Proposed implementation:**
- Client (mobile): Web Speech API or `@react-native-voice/voice`
- Transcription: Google Cloud Speech-to-Text or OpenAI Whisper
- Backend endpoint: `POST /assessment/transcribe` (accepts audio blob → returns transcription)
- The transcribed text is parsed against the tool's question vocabulary and mapped to form fields

**Example voice command:**
> "Dimension A item 3: score 2. Item 4: not tested."

→ Parsed to: `{ A3: "2", A4: "NT" }`

### 17.2 Caregiver voice interaction

**Goal:** Caregivers (who may have limited literacy) can interact with the app using voice commands for common actions:
- "Mark today's exercise as done for Ama"
- "Book an appointment with physiotherapy for next Tuesday"
- "How is Ama doing this week?"

**Architecture:**
```
User speaks ──► Device STT ──► Intent classifier ──► API action
                                                   ──► TTS response
```

**Intent examples:**
| Utterance | Intent | API call |
|---|---|---|
| "Mark exercise done" | `MARK_TASK_DONE` | `PATCH /cp-patient/:id/assigned-tasks/:taskId/days/done` |
| "Book appointment" | `BOOK_APPOINTMENT` | flow → `POST /schedule-appointment` |
| "How is my child doing" | `PATIENT_SUMMARY` | `GET /metrics/patient/:id` |

**Required dependencies:** Text-to-speech SDK (say.js / AWS Polly), intent classifier (Dialogflow or fine-tuned small LLM)

---

## 17. Deployment & Production Checklist

### Database

```bash
# Apply all migrations
pnpm migrate:deploy
# or
npx prisma migrate deploy
```

### Start server

```bash
pnpm start
# which runs: prisma migrate deploy && node ./index.js
```

### Creating an admin user

There is no self-signup for admins. Create one directly in the database:

```sql
INSERT INTO "User" (id, "fullName", email, password, role, verified, "profileCompleted", gender, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'System Admin',
  'admin@gcpr.gov.gh',
  '$2a$12$...',  -- bcrypt hash of desired password
  'ADMIN',
  true,
  true,
  'MALE',
  NOW(),
  NOW()
);
```

Or use the Node.js seed helper:
```js
import { hash } from './src/utils/password.js';
const hashed = await hash('YourAdminPassword123');
// then INSERT with hashed value
```

### Production health checklist

- [ ] `DATABASE_URL` set and database is reachable
- [ ] `JWT` secret is at least 32 random characters
- [ ] Firebase Admin credentials configured
- [ ] Hubtel SMS credentials configured for OTP
- [ ] File storage (S3/MinIO) configured for license images and PDFs
- [ ] Rate limiting reviewed for your expected load (default: 50 req/15min per IP)
- [ ] At least one ADMIN user created in the database
- [ ] All cron jobs running (check server logs at 01:00 and 02:00)
- [ ] Socket.IO CORS origins configured in `src/server.js`
- [ ] HTTPS enforced on the load balancer / reverse proxy level

### Running locally

```bash
cp .env.example .env     # fill in values
pnpm install
pnpm generate            # generate Prisma client
pnpm dev                 # starts with nodemon
```

Access the Swagger docs at: `http://localhost:3000/api-docs`

# GCPR Full System Workflow And Swagger Guide

This guide explains how the Cerebral Palsy rehabilitation platform works end to end and how the Swagger documentation is arranged for testing the system flow.

Swagger UI:

```text
GET /docs
```

Raw OpenAPI JSON:

```text
GET /docs.json
```

Use this auth format in Swagger/Postman:

```text
Authorization: Bearer <accessToken>
```

---

## 1. System Purpose

The system connects caregivers of children with Cerebral Palsy to verified multidisciplinary service providers. It supports onboarding, patient registration, appointments, clinical assessments, clinical reports, referrals, care plans, home rehab tasks, adherence tracking, resources, telehealth, chat, community support, notifications, metrics, and admin oversight.

Primary users:

- Caregiver mobile app user.
- Service provider clinical user.
- Admin or clinical reviewer.
- Support/admin operations staff.

Core backend dependencies:

- PostgreSQL through Prisma.
- JWT authentication.
- Firebase for mobile push notifications.
- Socket.IO for realtime events.
- Redis/BullMQ for queues when `REDIS_URL` is configured.
- Hubtel SMS and SendGrid/email for OTP delivery.
- Gemini for AI chat when `GEMINI_API_KEY` is configured.
- Cron jobs for license sync, metrics, telehealth reminders, adherence, and referral SLA checks.

---

## 2. Swagger Order

Swagger is ordered by the real product workflow:

1. Auth
2. Caregiver
3. Service Providers
4. CP Patient
5. Enrollment
6. Notification
7. Dashboard
8. Consent
9. Schedule Appointment
10. Assessment
11. Functional Classification
12. Outcomes
13. Care Plan
14. Adherence
15. Resources
16. Telehealth
17. Chat
18. Community
19. Community Groups
20. Community Announcements
21. Direct Messages
22. Metrics
23. Analytics
24. Report
25. Support
26. FAQ
27. Files
28. User
29. Videos
30. Games
31. RBAC Check
32. RBAC
33. Admin
34. Admin Reports

---

## 3. App Startup

Who: backend/system.

Flow:

1. Server loads `.env`.
2. Express starts.
3. Prisma connects to PostgreSQL.
4. Firebase Admin initializes.
5. Socket.IO initializes.
6. Queue workers start if `REDIS_URL` exists.
7. Cron jobs start.
8. FAQ seed check runs cheaply unless `FAQ_AUTO_SEED=false`.

Relevant files:

- `index.js`
- `src/server.js`
- `src/config/database.js`
- `src/socket.io.js`
- `src/services/queue/queue.service.js`
- `src/services/cron/index.js`
- `src/utils/faqSeed.js`

Test:

```bash
pnpm dev
```

Expected:

```text
Server is started at : 0.0.0.0:<PORT>
Firebase Admin SDK initialized successfully
[Cron] All background jobs scheduled
```

---

## 4. Auth And User Identity

Swagger group: `Auth`

Purpose:

- Register users.
- Verify OTP.
- Login.
- Refresh token.
- Get current user.

Main endpoints:

- `POST /auth/register`
- `POST /auth/verify-otp`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `GET /auth/me`

Caregiver flow:

1. Mobile sends registration details with role/userType `CAREGIVER`.
2. Backend creates `User`.
3. OTP is sent by email or SMS.
4. Caregiver verifies OTP.
5. Caregiver logs in and receives access token and refresh token.

Provider flow:

1. Provider registers with role/userType `SERVICE_PROVIDER`.
2. Provider verifies OTP.
3. Provider logs in.
4. Provider later completes professional profile.

Important behavior:

- Auth middleware stores authenticated user in `res.locals.user`.
- Protected routes require `Authorization: Bearer <token>`.
- Some admin routes require RBAC roles through `UserRole` and `AppRole`.

---

## 5. Caregiver Profile

Swagger group: `Caregiver`

Purpose:

- Complete caregiver profile after registration.
- Allow caregiver to manage CP patients.

Main endpoints:

- `POST /caregiver/complete-profile`
- `GET /caregiver`
- `GET /caregiver/{id}`
- `PUT /caregiver/{id}`
- `DELETE /caregiver/{id}`

Who does what:

- Caregiver completes their profile from the mobile app.
- Service providers can list/view caregivers where allowed.
- Caregiver/admin can update or delete depending route permission.

Data created:

- `CareGiver`
- optional verification document uploads for group caregivers
- profile completion notification

Important:

- A caregiver must complete profile before creating CP patients.
- Individual caregivers link to `User` through `CareGiver.userId`.

---

## 6. Service Provider Profile And Verification

Swagger group: `Service Providers`

Purpose:

- Complete professional profile.
- Upload license.
- Admin verifies provider.
- Caregivers discover verified providers.

Main endpoints:

- `POST /service-provider/complete-profile`
- `GET /service-provider`
- `GET /service-provider/search`
- `GET /service-provider/{id}`
- `PUT /service-provider/{id}`
- `PUT /service-provider/{id}/availability`
- `GET /service-provider/{id}/verification-status`
- `GET /service-provider/admin/pending-verification`
- `PATCH /service-provider/{id}/verify`
- `PATCH /service-provider/{id}/reject`
- `PATCH /service-provider/{id}/suspend`

Who does what:

- Provider submits professional details and license image.
- Admin reviews and verifies/rejects/suspends.
- Caregiver searches only verified providers.

Important:

- Clinical write actions require `verificationStatus = VERIFIED`.
- License status is synced by cron.

---

## 7. CP Patient And Enrollment

Swagger groups: `CP Patient`, `Enrollment`

Purpose:

- Caregiver creates CP patient profile.
- System tracks programme enrollment.
- Patient timeline gives a full clinical journey.

Main endpoints:

- `POST /cp-patient`
- `GET /cp-patient`
- `GET /cp-patient/{patientId}/timeline`
- `GET /cp-patient/{patientId}/assigned-tasks`
- `PATCH /cp-patient/{patientId}/assigned-tasks/{taskId}/days/done`
- `GET /enrollment/...`

Who does what:

- Caregiver creates patient from mobile app.
- Backend creates `CpPatient` and enrollment record.
- Caregiver sees own children.
- Providers see patients connected through appointment, assessment, referral, task, consent, or admin role.

Patient timeline includes:

- patient profile
- assessments and reports
- referrals
- rehab tasks
- appointments
- functional classifications
- care plans
- prescribed resources

Important:

- Patient links to caregiver through `caregiverId`, then caregiver links to user through `CareGiver.userId`.
- Notifications to caregivers must resolve `CpPatient -> CareGiver -> User`.

---

## 8. Notifications

Swagger group: `Notification`

Purpose:

- In-app notification list.
- Push token registration for mobile.
- Read/archive/delete notification actions.

Main endpoints:

- `GET /notification`
- `GET /notification/unread-count`
- `POST /notification/push-token`
- `GET /notification/push-token`
- `DELETE /notification/push-token`
- `PUT /notification/read-all`
- `PUT /notification/{id}/read`
- `PUT /notification/{id}/archive`
- `DELETE /notification/{id}`

Who does what:

- Mobile app registers FCM token.
- Backend creates notifications after clinical and operational events.
- Socket.IO emits realtime updates to `user-{userId}` rooms.
- Firebase sends mobile push notifications when tokens exist.

Notification examples:

- profile completed
- assessment submitted
- referral received
- task assigned
- care plan generated
- resource prescribed
- task reminder
- adherence summary

---

## 9. Dashboards

Swagger group: `Dashboard`

Purpose:

- Provide mobile/provider home-screen data in one request.

Main endpoints:

- `GET /dashboard/caregiver`
- `GET /dashboard/provider`

Caregiver dashboard returns:

- patients
- today’s rehab tasks
- upcoming appointments
- prescribed resources

Provider dashboard returns:

- provider profile
- today’s appointments
- pending referrals
- active tasks

Important:

- Notification counts were removed from both caregiver and provider dashboard responses.
- Notification counts remain available through `GET /notification/unread-count`.

---

## 10. Consent And Clinical Access

Swagger group: `Consent`

Purpose:

- Allow caregiver to grant/revoke consent for clinical access.
- Support safe provider access to patient data.

Main endpoints:

- `POST /consent`
- `GET /consent?patientId={patientId}`
- `PATCH /consent/{consentId}/revoke`

Who does what:

- Caregiver grants consent for their child.
- Admin can also grant where operationally required.
- Provider access can be allowed through active consent.

Provider access is allowed through:

- appointment relationship
- assessment relationship
- referral relationship
- rehab task relationship
- active `TREATMENT` or `DATA_SHARING` consent
- admin/clinical reviewer/tester role

Consent example:

```json
{
  "patientId": "{{patientId}}",
  "consentType": "DATA_SHARING",
  "scope": "ALL_PROVIDERS",
  "method": "DIGITAL_SIGNATURE"
}
```

---

## 11. Appointment Scheduling

Swagger group: `Schedule Appointment`

Purpose:

- Caregiver books appointment with verified provider.
- Provider approves or reschedules.
- Appointment can be linked to assessment.

Main endpoints:

- `GET /schedule-appointment/available-providers`
- `POST /schedule-appointment`
- `GET /schedule-appointment/provider-availability`
- `PATCH /schedule-appointment/approve`
- `PATCH /schedule-appointment/reschedule`
- `GET /schedule-appointment/provider`
- `GET /schedule-appointment/caregiver`
- `GET /schedule-appointment/admin`

Who does what:

- Caregiver selects patient, provider, date/time, reason.
- Provider approves/reschedules.
- Admin can monitor appointments.

Important:

- `ClinicalAssessment.appointmentId` can link assessment to appointment.
- Backend validates that appointment belongs to same patient and provider before linking.

---

## 12. Clinical Assessment And Clinical Reports

Swagger group: `Assessment`

Purpose:

- Providers conduct clinical assessments.
- Backend scores responses.
- Backend creates clinical reports.
- Backend generates referral recommendations.

Main endpoints:

- `GET /assessment/tools`
- `GET /assessment/tools/{toolCode}/form`
- `POST /assessment/submit`
- `GET /assessment/{assessmentId}/report`
- `GET /assessment/patient/{patientId}/reports`
- `GET /assessment/{assessmentId}/referral-recommendations`
- `POST /assessment/referrals`
- `GET /assessment/referrals/incoming`
- `GET /assessment/referrals/outgoing`
- `PATCH /assessment/referrals/{referralId}/status`
- `POST /assessment/referrals/{referralId}/tasks`
- `GET /assessment/tasks/my`

Who does what:

- Verified provider opens allowed tools.
- Backend filters tools by provider profession.
- Provider submits assessment.
- Backend validates provider, patient, tool, and optional appointment.
- Backend creates `ClinicalAssessment` and `ClinicalAssessmentReport`.
- Provider views report and referral recommendations.

Assessment submit example:

```json
{
  "patientId": "{{patientId}}",
  "appointmentId": "{{appointmentId}}",
  "toolCode": "SLT_CP_BASELINE",
  "status": "COMPLETED",
  "responses": {
    "communicationMode": "Speech and gestures",
    "clinicalNotes": "Baseline review"
  }
}
```

Clinical report endpoints are different from `/report`:

- Clinical reports live under `Assessment`, `CP Patient Timeline`, and `Care Plan`.
- `/report` is for complaints/system issue reports.

---

## 13. Functional Classification

Swagger group: `Functional Classification`

Purpose:

- Record functional ability levels over time.
- Show patient progression summaries.

Main endpoints:

- `POST /functional-classification`
- `GET /functional-classification/patient/{patientId}`
- `GET /functional-classification/patient/{patientId}/summary`
- `GET /functional-classification/{id}`
- `PATCH /functional-classification/{id}`
- `DELETE /functional-classification/{id}`

Classifiers:

- `GMFCS`
- `MACS`
- `CFCS`
- `EDACS`
- `VIKING_SPEECH_SCALE`
- `OTHER`

Example:

```json
{
  "patientId": "{{patientId}}",
  "classifier": "GMFCS",
  "level": 3,
  "assessedAt": "2026-07-22",
  "notes": "Walks using handheld mobility support."
}
```

Important:

- Verified providers create/update/delete.
- If a prior record exists for the same patient/classifier, the system can auto-create a motor outcome comparison.

---

## 14. Outcomes

Swagger group: `Outcomes`

Purpose:

- Track whether function improved, stayed stable, or regressed.

Main endpoints:

- `POST /outcomes`
- `GET /outcomes/provider/summary`
- `GET /outcomes/patient/{patientId}`
- `GET /outcomes/patient/{patientId}/latest`
- `GET /outcomes/{id}`
- `PATCH /outcomes/{id}`
- `DELETE /outcomes/{id}`

Example:

```json
{
  "patientId": "{{patientId}}",
  "baselineLevel": 4,
  "currentLevel": 3,
  "baselineDate": "2026-01-01",
  "reviewDate": "2026-07-22",
  "assessmentToolUsed": "GMFCS",
  "notes": "Improved walking ability after therapy block."
}
```

Outcome logic:

- lower current level than baseline = `IMPROVED`
- higher current level than baseline = `REGRESSED`
- same level = `STABLE`

Who sees it:

- Provider creates/updates/deletes own outcomes.
- Caregiver/provider can read patient outcomes.

---

## 15. Care Plan

Swagger group: `Care Plan`

Purpose:

- Turn approved assessment findings into an active plan of care.

Main endpoints:

- `POST /care-plan/generate/{assessmentId}`
- `GET /care-plan?patientId={patientId}`
- `GET /care-plan/list?patientId={patientId}`
- `PATCH /care-plan/{carePlanId}`

Who does what:

- Provider/admin generates care plan from approved assessment.
- Caregiver views active care plan read-only.
- Provider/admin updates status, goals, interventions, and review date through one PATCH endpoint.

Important:

- Assessment must be `APPROVED` before generating care plan.
- Active plan uses latest report recommendations as initial goals/interventions.
- Caregiver is notified.
- Reads are audit logged.

---

## 16. Adherence

Swagger group: `Adherence`

Purpose:

- Track whether caregiver completes rehab tasks.

Main endpoints:

- `GET /adherence/tasks/{taskId}/logs`
- `POST /adherence/tasks/{taskId}/logs`
- `PATCH /adherence/tasks/{taskId}/logs/{logId}`
- `GET /adherence/patients/{patientId}/summary`
- `GET /adherence/tasks/{taskId}/calendar`

Who does what:

- Caregiver marks daily log as completed.
- Provider reviews and can update logs.
- Caregiver/provider view summaries and calendars.

Completion example:

```json
{
  "logDate": "2026-07-22",
  "notes": "Completed morning and evening session."
}
```

Provider update example:

```json
{
  "status": "PARTIAL",
  "notes": "Completed one of two sessions."
}
```

Cron behavior:

- missed logs are auto-marked
- daily task reminders are sent
- missed-adherence summaries are sent

---

## 17. Resources And Prescriptions

Swagger group: `Resources`

Purpose:

- Store educational documents/videos/links.
- Prescribe resources to a specific patient.

Main endpoints:

- `POST /resource`
- `GET /resource`
- `GET /resource/{id}`
- `PUT /resource/{id}`
- `DELETE /resource/{id}`
- `GET /resource/{id}/download`
- `POST /resource/{id}/prescribe`
- `GET /resource/prescriptions/patient/{patientId}`

Who does what:

- Provider/admin creates resources.
- Provider/admin prescribes resource to patient.
- Caregiver views prescribed resources.

Prescription example:

```json
{
  "patientId": "{{patientId}}",
  "note": "Review this before practicing today's home programme."
}
```

---

## 18. Telehealth

Swagger group: `Telehealth`

Purpose:

- Create and join virtual consultation rooms.
- Invite participants.
- Track room status and countdown.

Main endpoints:

- `POST /telehealth/rooms`
- `GET /telehealth/rooms`
- `GET /telehealth/rooms/{id}`
- `PATCH /telehealth/rooms/{id}`
- `DELETE /telehealth/rooms/{id}`
- `POST /telehealth/rooms/{id}/invite`
- `GET /telehealth/rooms/{id}/participants`
- `POST /telehealth/rooms/{id}/join`
- `GET /telehealth/rooms/{id}/countdown`
- `PATCH /telehealth/rooms/{id}/status`

Who does what:

- Provider/admin creates room.
- Provider/admin invites caregiver/patient participants.
- Caregiver/provider joins room.
- Cron sends reminders.

---

## 19. Chat

Swagger group: `Chat`

Purpose:

- AI-supported caregiver/provider guidance.
- Store chat sessions and messages.

Main endpoints:

- `POST /chat/quick`
- `POST /chat/sessions`
- `GET /chat/sessions`
- `GET /chat/sessions/{sessionId}`
- `GET /chat/sessions/{sessionId}/messages`
- `POST /chat/sessions/{sessionId}/messages`
- `DELETE /chat/sessions/{sessionId}`

Important:

- Requires `GEMINI_API_KEY`.
- Chat concurrency is limited through `GEMINI_MAX_CONCURRENT`.
- AI guidance should not replace clinician advice.

---

## 20. Community, Groups, Announcements, Direct Messages

Swagger groups:

- `Community`
- `Community Groups`
- `Community Announcements`
- `Direct Messages`

Purpose:

- Peer support.
- Provider/caregiver community spaces.
- Announcements.
- Direct messaging.

Socket.IO behavior:

- Users authenticate socket connection with JWT.
- Users join `user-{userId}` room.
- Community membership is checked before joining community rooms.

Rooms:

```text
user-{userId}
community-{communityId}
community-group-{groupId}
```

---

## 21. Metrics And Analytics

Swagger groups:

- `Metrics`
- `Analytics`

Purpose:

- Provider KPI snapshots.
- Patient adherence/progress metrics.
- Admin system analytics.

Main metrics endpoints:

- `GET /metrics/provider`
- `GET /metrics/patient/{patientId}`
- `GET /metrics/system`
- `POST /metrics/compute/provider`
- `POST /metrics/compute/system`
- `POST /metrics/compute/all`

Cron behavior:

- metrics snapshot job runs daily.

---

## 22. Operational Reports, Support, FAQ

Swagger groups:

- `Report`
- `Admin Reports`
- `Support`
- `FAQ`

Important distinction:

- Clinical reports are under `Assessment`, `Patient Timeline`, and `Care Plan`.
- `/report` is for complaints, provider reports, bug reports, content reports, and system issues.

Report endpoints:

- `POST /report`
- `GET /report/my`
- `GET /report/{id}`
- `GET /admin/reports`
- `GET /admin/reports/{id}`
- `PATCH /admin/reports/{id}`

FAQ startup note:

- FAQ seed check now uses an existence query instead of full `count()`.
- Disable startup seed check with `FAQ_AUTO_SEED=false`.

---

## 23. Files, User, Videos, Games

Swagger groups:

- `Files`
- `User`
- `Videos`
- `Games`

Purpose:

- Protected profile/license/audio file access.
- User account/profile utilities.
- Video/resource utility operations.
- Game content management, assignment, participation logging, and improvement tracking.

Important:

- Protected file routes require auth.
- License files are restricted to provider ownership.

Game, Cboard, and Cerebral Palsy Center workflow:

- Providers can upload or link games with `POST /game`, then publish them for caregiver use.
- Clients should use `GET /game/selectable` when showing a picker. It includes published game resources plus built-in external options.
- Mobile apps should render the selected game's `embedUrl` or `metadata.launchUrl` inside an in-app WebView screen. Do not redirect the user to the external browser unless the WebView fails or the user explicitly chooses to open externally.
- Built-in games return `metadata.launchMode: IN_APP_WEBVIEW` and `metadata.shouldOpenExternally: false` to make the mobile behavior explicit.
- Cboard is treated as a selectable external AAC activity, not a deep API integration. Launch URL: `https://app.cboard.io/`; website: `https://www.cboard.io/en/`.
- Cerebral Palsy Center games are treated as selectable external accessible-game activities, not a deep API integration. The hub ID is `builtin-cpc-accessible-games`; individual game IDs include `builtin-cpc-touch-anywhere`, `builtin-cpc-bubble-pop`, `builtin-cpc-music-pads`, `builtin-cpc-count-it`, `builtin-cpc-memory-match`, `builtin-cpc-shape-sorter`, `builtin-cpc-odd-one-out`, `builtin-cpc-pattern-echo`, `builtin-cpc-star-light`, and `builtin-cpc-paint-grid`.
- Cerebral Palsy Center game features from the source page: switch, keyboard, touch, and mouse support; no timers; no losing; no sign-up; no ads; no tracking; caregiver-adjustable controls such as input method, target size, scan speed, contrast, motion, and sound.
- Providers assign a selected game to a patient with `POST /game/{id}/assign` and can include goals, frequency, due date, and notes.
- Caregivers and providers log each session with `POST /game/{id}/participation`. For Cboard, recommended metrics are `communicationAttempts`, `successfulSelections`, `promptedSelections`, `symbolsUsed`, and `frustrationEvents`. For accessible games, recommended metrics are `attempts`, `successfulRounds`, `independentActivations`, `promptsNeeded`, `engagementRating`, and `frustrationEvents`.
- Caregivers and providers can fetch assigned games with `GET /game/patients/{patientId}/assignments`.
- Providers and caregivers can track improvement with `GET /game/patients/{patientId}/improvement`; the backend compares the first and latest numeric metrics per game and returns session counts and duration totals.

Mobile integration order for games:

- Provider opens game picker with `GET /game/selectable`.
- Provider assigns selected game to patient with `POST /game/{id}/assign`.
- Caregiver app reads assigned games with `GET /game/patients/{patientId}/assignments`.
- Caregiver taps Play; app opens a WebView using assignment `metadata.launchUrl`, game `embedUrl`, or game `metadata.launchUrl`.
- After the session, app submits metrics with `POST /game/{id}/participation`.
- Progress screen reads `GET /game/patients/{patientId}/improvement?gameId={gameId}`.

---

## 24. RBAC And Admin

Swagger groups:

- `RBAC Check`
- `RBAC`
- `Admin`
- `Admin Reports`

Purpose:

- Admin permission management.
- Role assignment.
- Provider verification.
- System oversight.
- Logs and operational controls.

Who does what:

- Admin verifies providers.
- Admin monitors system metrics, support, reports, logs, analytics.
- Admin manages RBAC roles and permissions.

---

## 25. End-To-End Manual Test Order

Use Swagger or Postman in this order:

1. Register caregiver.
2. Verify caregiver OTP.
3. Login caregiver.
4. Complete caregiver profile.
5. Register caregiver push token.
6. Create CP patient.
7. Register provider.
8. Verify provider OTP.
9. Login provider.
10. Complete provider profile.
11. Admin verifies provider.
12. Caregiver grants consent.
13. Caregiver searches providers.
14. Caregiver books appointment.
15. Provider approves appointment.
16. Provider gets assessment tools.
17. Provider submits assessment with optional `appointmentId`.
18. Provider/caregiver views clinical reports.
19. Provider views referral recommendations.
20. Physiotherapist/admin creates referral.
21. Target provider accepts referral.
22. Provider assigns rehab task.
23. Caregiver marks task adherence completed.
24. Provider records functional classification.
25. Provider/caregiver views outcomes.
26. Provider generates care plan from approved assessment.
27. Caregiver views care plan.
28. Provider creates resource.
29. Provider prescribes resource to patient.
30. Caregiver views dashboard.
31. Provider views dashboard.
32. Admin reviews metrics, analytics, support, reports, logs.

---

## 26. Postman Collections

Available collections:

```text
docs/postman/gcpr-bootstrap-full-flow.postman_collection.json
docs/postman/gcpr-assessment-flow.postman_collection.json
docs/postman/gcpr-clinical-mobile-provider-flow.postman_collection.json
```

Available environments:

```text
docs/postman/gcpr-bootstrap-full-flow.postman_environment.json
docs/postman/gcpr-assessment-flow.postman_environment.json
```

Recommended Postman run order:

1. Bootstrap full flow.
2. Assessment/referral/task flow.
3. Clinical mobile/provider flow.

Set:

```text
baseUrl=http://localhost:<PORT>
```

---

## 27. Automated Testing

Unit tests:

```bash
npm test
```

Integration tests require a dedicated test database:

```bash
DATABASE_URL_TEST="postgresql://user:pass@localhost:5432/gcpr_test" DATABASE_SSL=false npm run test:integration
```

Load tests:

```bash
npm run load:test -- auth
npm run load:test -- patients
npm run load:test -- assessment
npm run load:test -- chat
npm run load:test -- socket
```

Never point `DATABASE_URL_TEST` at production because integration tests reset the database.

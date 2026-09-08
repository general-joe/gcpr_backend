
import swaggerJsdoc from "swagger-jsdoc";
import '../modules/auth/auth.swagger.js';
import '../modules/community/community.swagger.js';
import '../modules/community/communityGroup.swagger.js';
import '../modules/community/communityAnnouncement.swagger.js';
import '../modules/files/files.swagger.js';
import '../modules/scheduleAppointment/scheduleAppointment.swagger.js';
import '../modules/cpPatient/cpPatient.swagger.js';
import '../modules/careGiver/careGiver.swagger.js';
import '../modules/assessment/assessment.swagger.js';
import '../modules/assessment/definitions/toolDefinition.swagger.js';
import '../modules/functionalClassification/functionalClassification.swagger.js';
import '../modules/sync/sync.swagger.js';
import '../modules/directMessage/directMessage.swagger.js';
import '../modules/resource/resource.swagger.js';
import '../modules/user/user.swagger.js';
import '../modules/serviceProvider/serviceProvider.swagger.js';
import '../modules/notification/notification.swagger.js';
import '../modules/chat/chat.swagger.js';
import '../modules/metrics/metrics.swagger.js';
import '../modules/telehealth/telehealth.swagger.js';
import '../modules/game/game.swagger.js';
import '../modules/report/report.swagger.js';
import '../modules/support/support.swagger.js';
import '../modules/support/faq.swagger.js';
import '../modules/assessment/outcomes.swagger.js';
import '../modules/admin/admin.swagger.js';
import '../modules/admin/rbac.swagger.js';
import '../modules/analytics/analytics.swagger.js';
import '../modules/dashboard/dashboard.swagger.js';
import '../modules/carePlan/carePlan.swagger.js';

const getServerUrls = () => {
	return [
		{
			url: "http://localhost:3000",
			description: "Local Development Server",
		},
		{
			url: process.env.GCPR_API_URL || "",
			description: "GMNC Production Server",
		},
	];
};

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GMNC API",
      version: "1.0.0",
      description: "GMNC - API documentation",
    },
    tags: [
      {
        name: "Auth & Onboarding",
        description:
          "Step 1 — identity and consent to the platform itself. Register captures explicit acceptedTerms/acceptedPrivacyPolicy plus server-pinned document versions (Group 3); verify-OTP activates the account; login returns the 7-day access / 30-day refresh pair plus a terms re-acceptance flag the app must honor. Every later section assumes a valid Bearer token from here, and offline mode depends on refresh succeeding before sync/push.",
      },
      {
        name: "Profile Completion",
        description:
          "Step 2 — role onboarding after auth. Caregivers complete their profile (type, documents); service providers submit licence details and availability, then wait for admin verification. Downstream clinical writes require a VERIFIED provider profile, so this gate directly enables the assessment and referral sections below.",
      },
      {
        name: "Patient Enrollment",
        description:
          "Step 3 — the single enrollment path: POST /cp-patient/ registers the child and auto-creates the ACTIVE PatientEnrollmentRecord (the standalone enrollment route is deprecated and unmounted — do not look for it). Registration-time terms acceptance covers enrollment by construction. All clinical reads/writes key off the patient id created here.",
      },
      {
        name: "Clinical Assessment",
        description:
          "Step 4 — the clinical core. Forms are rendered from the latest published tool-definition version (Group 5), so the client never hardcodes questions; submissions validate server-side against that same frozen snapshot and record its version. Functional classification (GMFCS/MACS/CFCS/EDACS) feeds this flow: the form flags which scales apply and whether re-assessment is stale, and outcome direction is recomputed whenever a classification changes.",
      },
      {
        name: "Referrals & Care Plans",
        description:
          "Step 5 — acting on assessment output. Referrals move patient data across providers/orgs, so creation is physiotherapist-only with a cross-org caregiver confirmation, and status transitions re-enforce the same rule (Group 6). Care-plan generation branches review intensity on classification level; re-generating for a new assessment explicitly supersedes the old ACTIVE plan so exactly one ACTIVE plan exists per patient (Group 6).",
      },
      {
        name: "Tasks & Adherence",
        description:
          "Step 6 — daily therapy execution. Providers assign rehab tasks (often from accepted referrals); caregivers mark days done, which also writes adherence logs. Every adherence write appends to an immutable history table, so provider corrections and late-arriving offline syncs never silently erase prior entries (Group 6). Progress here rolls up into dashboards and metrics.",
      },
      {
        name: "Appointments & Telehealth",
        description:
          "Step 7 — scheduled and virtual care. Caregivers discover providers by availability and book; providers approve/reschedule. Telehealth rooms carry the full lifecycle (create, invite, join credentials, countdown, status) for remote consultations, including rural follow-ups that could not happen in person.",
      },
      {
        name: "Ongoing Platform",
        description:
          "Step 8 — everything that keeps families and teams engaged between visits: community groups and announcements, direct and group messaging, prescribed educational resources, notifications and push tokens, the AI support chat, therapeutic games, user reports, support tickets with their reply threads, and the FAQ/offline bundle (including the public CP intro the app caches before login). None of these drive the clinical pipeline, but tickets and FAQs are the front door for help.",
      },
      {
        name: "Sync",
        description:
          "Step 9 — the offline reconciliation layer for rural use. The app queues support tickets, ticket replies, adherence marks, and direct messages while offline, then POSTs them as one ordered batch when connectivity returns. Operations are idempotent per (user, clientId) via a 90-day idempotency record, processed sequentially in client order, with per-op success/failure so the client retries only what failed. Positioned next to Tasks & Adherence because that is its primary payload.",
      },
      {
        name: "Admin & RBAC",
        description:
          "Step 10 — platform governance. User/provider/patient moderation (including provider licence verification and enrollment-aware patient reads), role and permission management with runtime permission checks, the read-only SQL query endpoint (row-capped and audit-logged) and log inspection, system metrics and analytics dashboards, platform settings, and the assessment-tool builder (draft, version, publish, preview) that owns the schemas the Clinical Assessment section renders.",
      },
    ],
    servers: getServerUrls(),

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      parameters: {
        Page: {
          name: "page",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            default: 1,
          },
          description: "Page number for pagination",
        },
        Limit: {
          name: "limit",
          in: "query",
          required: false,
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 10,
          },
          description: "Number of items per page",
        },
      },
      schemas: {
        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 10,
            },
            total: {
              type: "integer",
              example: 100,
            },
            totalPages: {
              type: "integer",
              example: 10,
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: "Bad request - Invalid input data",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                    example: false,
                  },
                  message: {
                    type: "string",
                    example: "Validation failed",
                  },
                  errors: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: {
                          type: "string",
                        },
                        message: {
                          type: "string",
                        },
                        code: {
                          type: "string",
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        Unauthorized: {
          description: "Unauthorized - Authentication required",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                    example: false,
                  },
                  message: {
                    type: "string",
                    example: "Authentication required",
                  },
                },
              },
            },
          },
        },
        Forbidden: {
          description: "Forbidden - Insufficient permissions",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                    example: false,
                  },
                  message: {
                    type: "string",
                    example: "You do not have permission to perform this action",
                  },
                },
              },
            },
          },
        },
        NotFound: {
          description: "Not found - Resource does not exist",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: {
                    type: "boolean",
                    example: false,
                  },
                  message: {
                    type: "string",
                    example: "Resource not found",
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  apis: [
    "./src/routes/*.js",
    "./src/modules/*/routes.js",
    "./src/modules/*/*.route.js",
    "./src/modules/**/*.swagger.js",
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;

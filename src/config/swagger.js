
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
        name: "Auth",
        description: "1. Registration, OTP verification, login, token refresh, and current user profile.",
      },
      {
        name: "Caregiver",
        description: "2. Caregiver profile onboarding and caregiver account management.",
      },
      {
        name: "Service Providers",
        description: "3. Service provider onboarding, verification status, discovery, search, and availability setup.",
      },
      {
        name: "CP Patient",
        description: "4. CP patient registration, patient listing, assigned tasks, and full patient timeline.",
      },
      {
        name: "Notification",
        description: "5. In-app notifications, unread counts, and mobile push-token registration.",
      },
      {
        name: "Dashboard",
        description: "6. Mobile-optimized caregiver and service-provider home dashboards.",
      },
      {
        name: "Schedule Appointment",
        description: "7. Provider discovery by availability, appointment booking, approval, rescheduling, and appointment lists.",
      },
      {
        name: "Assessment",
        description: "8. Clinical assessment tools, forms, submissions, reports, referrals, and rehab task assignment.",
      },
      {
        name: "Outcomes",
        description: "9. Motor/function outcome tracking and patient outcome history.",
      },
      {
        name: "Care Plan",
        description: "10. Care plans generated from approved assessments, caregiver reads, and provider updates.",
      },
      {
        name: "Adherence",
        description: "11. Rehab task adherence logs, completion marking, calendars, and summaries.",
      },
      {
        name: "Resources",
        description: "12. Educational resources and personalized resource prescriptions for patients.",
      },
      {
        name: "Telehealth",
        description: "13. Virtual consultation rooms, invitations, participants, joins, and status updates.",
      },
      {
        name: "Chat",
        description: "17. AI-supported caregiver/provider chat sessions and message history.",
      },
      {
        name: "Community",
        description: "18. Community creation, discovery, membership, invite codes, and moderation.",
      },
      {
        name: "Community Groups",
        description: "19. Community group creation, membership, and group messages.",
      },
      {
        name: "Community Announcements",
        description: "20. Community announcements for caregivers and providers.",
      },
      {
        name: "Direct Messages",
        description: "21. User-to-user messaging and conversation support.",
      },
      {
        name: "Metrics",
        description: "22. Patient, provider, and system KPI snapshots.",
      },
      {
        name: "Analytics",
        description: "23. Admin analytics and operational dashboards.",
      },
      {
        name: "Report",
        description: "24. User-submitted operational reports, complaints, and system issue reports.",
      },
      {
        name: "Support",
        description: "25. Support tickets and user support conversations.",
      },
      {
        name: "FAQ",
        description: "26. Public and role-targeted frequently asked questions.",
      },
      {
        name: "Files",
        description: "27. Protected file retrieval and uploads.",
      },
      {
        name: "User",
        description: "28. User profile, account, and utility endpoints.",
      },
      {
        name: "Videos",
        description: "29. Video-related user/resource endpoints.",
      },
      {
        name: "Games",
        description: "30. Game resource endpoints.",
      },
      {
        name: "RBAC Check",
        description: "31. Runtime RBAC permission checks.",
      },
      {
        name: "RBAC",
        description: "32. Admin role and permission management.",
      },
      {
        name: "Admin",
        description: "33. Admin platform operations and oversight.",
      },
      {
        name: "Admin Reports",
        description: "34. Admin review and resolution of submitted reports.",
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

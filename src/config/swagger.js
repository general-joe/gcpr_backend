
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

const getServerUrls = () => {
	return [
		{
			url: "http://localhost:3000",
			description: "Local Development Server",
		},
		{
			url: process.env.GCPR_API_URL || "",
			description: "GCPR Production Server",
		},
	];
};

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "GCPR API",
      version: "1.0.0",
      description: "GCPR - API documentation",
    },
    servers: getServerUrls(),

    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
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

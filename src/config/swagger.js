
import swaggerJsdoc from "swagger-jsdoc";
import '../modules/auth/auth.swagger.js';

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

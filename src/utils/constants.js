import dotenv from "dotenv";
dotenv.config();

export default {
  LOG_LEVEL: "debug",
  MAX_FILE_UPLOAD: 51000000,
  BUCKET: "files",
  BUS_DOC_BUCKET: "business-docs",
  VERIFY_BUCKET: "verifications",
  PROFILE_BUCKET: "profiles",
  LICENSES_BUCKET: "licenses",

  MSG: {
    NO_PASS:
      "Please login with with the same platform you created the account with",
    INVALID_PASSWORD: "The password you entered is not valid",
    PASSWORD_LOGIN: "Please login with your password",
    VERIFY_ML_SENT:
      "We have sent a verification code to your email address. Please enter the code to continue",
    USER_UNIDENTIFIED:
      "Your account does not exist. Please register first before attempting to log in",
    INVALID_MAIL_PASSWORD:
      "The email address / password is incorrect. Please enter correct details to continue.",
    INVALID_MAIL:
      "The email address is probably not registered. Please enter correct details to continue.",
    ACCOUNT_EXISTS: "Account already exists. Please login",
    WITHDRAWAL_EXISTS:
      "A pending withdrawal request already exists. Please login",
    ACCOUNT_NOT_FOUND: "No account found with those details",
    NO_MOBILE: "No mobile number found",
  },
  ORDER_STATUS: {
    ENUM: [
      "pending",
      "accepted",
      "declined",
      "delivering",
      "cancelled",
      "completed",
    ],
    PENDING: "pending",
    ACCEPTED: "accepted",
    PAID: "paid",
    DECLINED: "declined",
    DELIVERING: "delivering",
    CANCELLED: "cancelled",
    COMPLETED: "completed",
  },
  DOCUMENT_TYPES: {
    ENUM: [
      "passport",
      "drivers_license",
      "national_id",
      "utility_bill",
      "other",
    ],
    PASSPORT: "passport",
    DRIVERS_LICENSE: "drivers_license",
    NATIONAL_ID: "national_id",
    UTILITY_BILL: "utility_bill",
    OTHER: "other",
  },
  COMPANY_DOCUMENT_TYPES: {
    ENUM: [
      "incorporation",
      "license",
      "bank_statement",
      "vat",
      "tax",
      "hygiene",
      "other",
    ],
    STRIPE_ENUM: ["incorporation", "tax"],
    CERTIFICATE_OF_INCORPORATION: "incorporation",
    BUSINESS_LICENSE: "license",
    BANK_STATEMENT: "bank_statement",
    VAT_CERTIFICATE: "vat",
    TAX_CERTIFICATE: "tax",
    HYGIENE_CERTIFICATE: "hygiene",
    OTHER: "other",
  },
  OTP_MODES: {
    SMS: "sms",
    EMAIL: "email",
    WHATSAPP: "whatsapp",
  },
  DOCS: {
    openapi: "3.0.0",
    info: {
      title: "GCPR API",
      description:
        "GCPR API Documentation. `x-api-key` is always needed in the headers. Bearer" +
        " authentication (`Authorization`) is required only for authenticated routes.",
      contact: {
        email: "samuelmanueljnr@gmail.com",
      },
      version: "1.0.0",
    },
    servers: [
      {
        url: process.env.DOCS_URL,
        description: "Production Server",
      },

      {
        url: process.env.BASE_URL,
        description: "Local Server",
      },
    ],
    paths: {},
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-KEY",
        },
      },
      schemas: {
        Success: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "SUCCESS",
            },
            data: {
              type: "object",
            },
            message: {
              type: "string",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "FAILED",
            },
            data: {
              type: "object",
            },
            message: {
              type: "string",
            },
          },
        },
      },
      security: [
        {
          apiKeyAuth: [],
        },
      ],
    },
  },
  REGEX: {
    EMAIL: /^[\w-.]+@([\w-]+\.)+[\w-]{2,7}$/,
    PHONE: /^[0-9]{10}$/,
    SORT_CODE: /^[0-9]{6}$/,
    ACCOUNT_NUMBER: /^[0-9]{8}$/,
  },


};

// src/utils/emailSmtp.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";

dotenv.config();

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sendgridApiKey = process.env.SENDGRID_API_KEY;
if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

// Template mapping
const templateMap = {
  reset: "password.reset.html",
  otp: "verification.otp.html",
  success: "success.operation.html",
};

const subjectMap = {
  reset: "Reset Your Password",
  otp: "Your OTP Code",
  success: "Operation Successful",
};

/**
 * Send email using a mapped template
 */
export async function sendEmail(to, templateName, variables = {}) {
  const fileName = templateMap[templateName];
  if (!fileName) {
    throw new Error(`Template "${templateName}" not found`);
  }

  // src/utils → src/templates
  const templatePath = path.join(__dirname, "..", "templates", fileName);

  let html = fs.readFileSync(templatePath, "utf-8");

  const mergedVariables = { ...variables };
  if (!mergedVariables.name) {
    mergedVariables.name = mergedVariables.fullName || "there";
  }

  // Replace {{variables}}
  for (const key in mergedVariables) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), mergedVariables[key]);
  }

  try {
    if (!sendgridApiKey) {
      throw new Error("SENDGRID_API_KEY is not configured");
    }

    const fromEmail = process.env.SENDGRID_FROM_EMAIL;
    if (!fromEmail) {
      throw new Error("SENDGRID_FROM_EMAIL is not configured");
    }

    const fromName = process.env.SENDGRID_FROM_NAME || "NeuroCare";

    const [response] = await sgMail.send({
      from: { email: fromEmail, name: fromName },
      to,
      subject: subjectMap[templateName],
      html,
    });

    const messageId =
      response?.headers?.["x-message-id"] ||
      response?.headers?.["X-Message-Id"] ||
      null;

    return { success: true, messageId };
  } catch (error) {
    console.error("EMAIL SEND FAILED:", error.message);
    return { success: false, error: error.message };
  }
}

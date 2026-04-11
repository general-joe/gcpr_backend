// src/utils/emailSmtp.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// HostAfrica HMailPlus SMTP transporter (port 587, STARTTLS)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  requireTLS: true,
  connectionTimeout: 10000,  // fail fast if SMTP is unreachable (10s)
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

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
export async function sendEmail(to, templateName, variables) {
  const fileName = templateMap[templateName];
  if (!fileName) {
    throw new Error(`Template "${templateName}" not found`);
  }

  // src/utils → src/templates
  const templatePath = path.join(__dirname, "..", "templates", fileName);

  let html = fs.readFileSync(templatePath, "utf-8");

  // Replace {{variables}}
  for (const key in variables) {
    html = html.replace(new RegExp(`{{${key}}}`, "g"), variables[key]);
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || "NeuroCare"}" <${process.env.SMTP_USER}>`,
      to,
      subject: subjectMap[templateName],
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("EMAIL SEND FAILED:", error.message);
    return { success: false, error: error.message };
  }
}

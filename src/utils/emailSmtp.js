// src/utils/emailSmtp.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
console.log("RESEND KEY LOADED:", !!process.env.RESEND_API_KEY);

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    return await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "NeuroCare <onboarding@resend.dev>",
      to,
      subject: subjectMap[templateName],
      html,
    });
  } catch (error) {
    console.error("EMAIL SEND FAILED:", error);
    return { success: false, error: error.message };
  }
}

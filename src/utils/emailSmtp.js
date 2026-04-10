// src/utils/emailSmtp.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import dotenv from "dotenv";

dotenv.config();

const mailerSend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });
console.log("MAILERSEND KEY LOADED:", !!process.env.MAILERSEND_API_KEY);

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Template mapping
const templateMap = {
  reset: "password.reset.html",
  otp: "verification.otp.html",
  success: "success.operation.html",
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

  let htmlContent = fs.readFileSync(templatePath, "utf-8");

  // Replace {{variables}}
  for (const key in variables) {
    htmlContent = htmlContent.replace(
      new RegExp(`{{${key}}}`, "g"),
      variables[key]
    );
  }

  const subjectMap = {
    reset: "Reset Your Password",
    otp: "Your OTP Code",
    success: "Operation Successful",
  };

  const sentFrom = new Sender("MS_wGd8Fb@test-eqvygm07968l0p7w.mlsender.net", "NeuroCare");
  const recipients = [new Recipient(to)];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(subjectMap[templateName])
    .setHtml(htmlContent);

  try {
    return await mailerSend.email.send(emailParams);
  } catch (error) {
    console.error("EMAIL SEND FAILED:", error);

    return {
      success: false,
      error: error.message,
    }; 
  }
}

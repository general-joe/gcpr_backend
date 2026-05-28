import fs from "fs";
import path from "path";

const SENSITIVE_KEYS = new Set([
  "password",
  "newPassword",
  "confirmPassword",
  "token",
  "refreshToken",
  "authorization",
  "otp",
  "codeHash",
  "accessToken",
]);

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => {
      if (SENSITIVE_KEYS.has(key)) {
        return [key, "[REDACTED]"];
      }
      return [key, sanitizeValue(nestedValue)];
    }),
  );
}

class AuditService {
  constructor() {
    this.logDir = path.join(process.cwd(), "logs");
  }

  async write(event) {
    const logFile = path.join(
      this.logDir,
      `audit-${new Date().toISOString().split("T")[0]}.log`,
    );

    const payload = {
      ...event,
      params: sanitizeValue(event.params),
    };

    await fs.promises.mkdir(this.logDir, { recursive: true });
    await fs.promises.appendFile(logFile, `${JSON.stringify(payload)}\n`);
  }
}

export default new AuditService();
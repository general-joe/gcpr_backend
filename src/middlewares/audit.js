import auditService from "../services/audit/audit.service.js";
import WRITE from "../utils/logger.js";

const AUDIT_ROUTE_PATTERNS = [
  "/assessment",
  "/functional-classification",
  "/outcomes",
  "/schedule-appointment",
  "/telehealth",
  "/report",
  "/cp-patient",
  "/metrics",
  "/adherence",
  "/notification",
  "/chat",
];

function shouldAuditRequest(req, userId) {
  if (userId) {
    return true;
  }

  return AUDIT_ROUTE_PATTERNS.some((pattern) => req.path.startsWith(pattern));
}

export function auditRequest() {
  return (req, res, next) => {
    const startedAt = Date.now();

    res.on("finish", () => {
      const user = res.locals?.user ?? null;
      if (!shouldAuditRequest(req, user?.id)) {
        return;
      }

      const event = {
        timestamp: new Date().toISOString(),
        requestId: req.headers["x-request-id"] || `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        userId: user?.id ?? null,
        userRole: user?.role ?? null,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
        ipAddress: req.ip,
        userAgent: req.get("user-agent") || null,
        eventType: ["GET", "HEAD"].includes(req.method) ? "ACCESS" : "MUTATION",
        params: req.params,
      };

      auditService.write(event).catch((error) => {
        WRITE.error("[Audit] Failed to write audit log", {
          error: error.message,
          path: req.originalUrl,
          method: req.method,
        });
      });
    });

    next();
  };
}
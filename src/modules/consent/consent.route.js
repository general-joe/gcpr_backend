import { Router } from "express";
import { createConsent, revokeConsent, listConsents } from "./consent.controller.js";
import { authorize, requireRbacRole } from "../../middlewares/auth.js";

const router = Router();

router.use(authorize(["SERVICE_PROVIDER", "ADMIN", "CAREGIVER"]));

router.post(
  "/consent",
  requireRbacRole(["ADMIN", "PROVIDER", "CAREGIVER"]),
  createConsent,
);

router.patch(
  "/consent/:consentId/revoke",
  requireRbacRole(["ADMIN", "PROVIDER", "CAREGIVER"]),
  revokeConsent,
);

router.get(
  "/consent",
  requireRbacRole(["ADMIN", "PROVIDER", "CAREGIVER"]),
  listConsents,
);

export default router;

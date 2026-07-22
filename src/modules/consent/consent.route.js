import { Router } from "express";
import { createConsent, revokeConsent, listConsents } from "./consent.controller.js";
import { authorize } from "../../middlewares/auth.js";

const router = Router();

router.use(authorize(["SERVICE_PROVIDER", "ADMIN", "CAREGIVER"]));

router.post("/", createConsent);

router.patch("/:consentId/revoke", revokeConsent);

router.get("/", listConsents);

export default router;

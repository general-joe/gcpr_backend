/**
 * @deprecated DO NOT MOUNT. Superseded by registration-time terms/privacy
 * acceptance (Group 3): `POST /cp-patient/` is the sole enrollment path for
 * authenticated (hence registered) caregivers, versioned re-acceptance is
 * `PATCH /user/accept-terms`, and cross-org referral disclosure is the
 * `crossOrgConfirmed` flag. This router is kept unmounted for reference only.
 */
import { Router } from "express";
import { createConsent, revokeConsent, listConsents } from "./consent.controller.js";
import { authorize } from "../../middlewares/auth.js";

const router = Router();

router.use(authorize(["SERVICE_PROVIDER", "ADMIN", "CAREGIVER"]));

router.post("/", createConsent);

router.patch("/:consentId/revoke", revokeConsent);

router.get("/", listConsents);

export default router;

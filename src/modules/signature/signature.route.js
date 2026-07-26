import express from "express";
import { authorizeOrRbacRole } from "../../middlewares/auth.js";
import { imageUpload } from "../../middlewares/upload.js";
import SignatureController from "./signature.controller.js";

const router = express.Router();
const portalSignatureAuth = authorizeOrRbacRole(
  ["SERVICE_PROVIDER", "ADMIN"],
  ["ADMIN", "SUPPORT", "SERVICE_PROVIDER"],
);

// Upload or create a signature (multipart or base64)
router.post("/", portalSignatureAuth, imageUpload().single("signature"), SignatureController.upload);

// List signatures for a user
router.get("/:userId", portalSignatureAuth, SignatureController.list);

// Attach a signature to a document (uses stored default or multipart file)
router.post("/attach", portalSignatureAuth, imageUpload().single("signature"), SignatureController.attach);

export default router;

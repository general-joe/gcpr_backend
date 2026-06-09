import express from "express";
import { authorize } from "../../middlewares/auth.js";
import upload, { imageUpload } from "../../middlewares/upload.js";
import SignatureController from "./signature.controller.js";

const router = express.Router();

// Upload or create a signature (multipart or base64)
router.post("/", authorize(["SERVICE_PROVIDER", "CAREGIVER"]), imageUpload().single("signature"), SignatureController.upload);

// List signatures for a user
router.get("/:userId", authorize(["SERVICE_PROVIDER", "CAREGIVER"]), SignatureController.list);

// Attach a signature to a document (uses stored default or multipart file)
router.post("/attach", authorize(["SERVICE_PROVIDER", "CAREGIVER"]), imageUpload().single("signature"), SignatureController.attach);

export default router;

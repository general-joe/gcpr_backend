import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../../config/database.js";
import { authorize } from "../../middlewares/auth.js";
import UtilFunctions from "../../utils/UtilFunctions.js";

const filesRouter = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filesBasePath = path.resolve(__dirname, "../../files");

const isSafeFileName = (value) => /^[A-Za-z0-9._-]+$/.test(value);

const sendProtectedFile = (res, bucket, fileName) => {
  const filePath = path.resolve(filesBasePath, bucket, fileName);
  const expectedDir = path.resolve(filesBasePath, bucket);

  if (!filePath.startsWith(expectedDir)) {
    return UtilFunctions.outputError(res, "Invalid file path", {}, "FORBIDDEN", 403);
  }

  if (!fs.existsSync(filePath)) {
    return UtilFunctions.outputError(res, "File not found", {}, "NOT_FOUND", 404);
  }

  return res.sendFile(filePath);
};

filesRouter.get(
  "/profiles/:fileName",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  async (req, res) => {
    const { fileName } = req.params;

    if (!isSafeFileName(fileName)) {
      return UtilFunctions.outputError(res, "Invalid filename", {}, "FORBIDDEN", 403);
    }

    return sendProtectedFile(res, "profiles", fileName);
  }
);

filesRouter.get(
  "/licenses/:fileName",
  authorize(["SERVICE_PROVIDER"]),
  async (req, res) => {
    const { fileName } = req.params;
    if (!isSafeFileName(fileName)) {
      return UtilFunctions.outputError(res, "Invalid filename", {}, "FORBIDDEN", 403);
    }

    const requesterId = res.locals.user.id;
    const provider = await prisma.serviceProvider.findUnique({
      where: { userId: requesterId },
      select: { id: true }
    });

    if (!provider) {
      return UtilFunctions.outputError(
        res,
        "Service provider profile not found",
        {},
        "NOT_FOUND",
        404
      );
    }

    const allowedNames = new Set([`${requesterId}.jpg`, `${provider.id}.jpg`]);
    if (!allowedNames.has(fileName)) {
      return UtilFunctions.outputError(
        res,
        "You can only access your own license file",
        {},
        "FORBIDDEN",
        403
      );
    }

    return sendProtectedFile(res, "licenses", fileName);
  }
);

export default filesRouter;

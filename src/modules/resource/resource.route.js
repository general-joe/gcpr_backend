import express from "express";
import { authorize } from "../../middlewares/auth.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import prisma from "../../config/database.js";
import upload from "../../middlewares/upload.js";
import UploadService from "../../utils/uploadService.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const resourceRouter = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resourcesBasePath = path.resolve(__dirname, "../..", "src", "files");
const pdfBucket = "pdfs";
const allowedPdfTypes = new Set([
  "application/pdf",
]);

const isSafeFileName = (value) => /^[A-Za-z0-9._-]+$/.test(value);

const sendProtectedFile = (res, bucket, fileName) => {
  const filePath = path.resolve(resourcesBasePath, bucket, fileName);
  const expectedDir = path.resolve(resourcesBasePath, bucket);

  if (!filePath.startsWith(expectedDir)) {
    return UtilFunctions.outputError(res, "Invalid file path", {}, "FORBIDDEN", 403);
  }

  if (!fs.existsSync(filePath)) {
    return UtilFunctions.outputError(res, "File not found", {}, "NOT_FOUND", 404);
  }

  return res.sendFile(filePath);
};

// Upload PDF resource (Service Provider only)
resourceRouter.post(
  "/",
  authorize(["SERVICE_PROVIDER"]),
  upload.single("pdfFile"),
  async (req, res) => {
    const file = req.file;
    if (!file) {
      return UtilFunctions.outputError(
        res,
        "PDF file is required",
        {},
        "BAD_REQUEST",
        400
      );
    }

    if (!allowedPdfTypes.has(file.mimetype)) {
      return UtilFunctions.outputError(
        res,
        "Unsupported file type. Only PDF files are allowed",
        {},
        "UNPROCESSABLE_ENTITY",
        422
      );
    }

    // Validate required fields
    const { title, description } = req.body;
    if (!title) {
      return UtilFunctions.outputError(
        res,
        "Title is required",
        {},
        "BAD_REQUEST",
        400
      );
    }

    const safeName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}${path.extname(file.originalname) || ".pdf"}`;

    // Ensure resources directory exists
    fs.mkdirSync(path.resolve(resourcesBasePath, pdfBucket), { recursive: true });

    // Save file to storage
    const fileUrl = await UploadService.saveFile(file.buffer, safeName, pdfBucket);

    // Look up the service provider by user ID
    const serviceProvider = await prisma.serviceProvider.findUnique({
      where: { userId: res.locals.user.id },
      select: { id: true },
    });

    if (!serviceProvider) {
      return UtilFunctions.outputError(
        res,
        "Service provider profile not found",
        {},
        "NOT_FOUND",
        404
      );
    }

    // Create pdfResource record in database
    const pdfResource = await prisma.pdfResource.create({
      data: {
        title,
        description: description || null,
        pdfFile: [fileUrl], // Storing as array as per schema
        serviceProviderId: serviceProvider.id,
      },
    });

    return UtilFunctions.outputSuccess(
      res,
      pdfResource,
      "PDF resource uploaded successfully"
    );
  }
);

// Get all PDF resources (Caregiver and Service Provider)
resourceRouter.get(
  "/",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  async (req, res) => {
    const pdfResources = await prisma.pdfResource.findMany({
      include: {
        serviceProvider: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                profileImage: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return UtilFunctions.outputSuccess(
      res,
      pdfResources,
      "PDF resources retrieved successfully"
    );
  }
);

// Get specific PDF resource by ID
resourceRouter.get(
  "/:id",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  async (req, res) => {
    const { id } = req.params;
    
    const pdfResource = await prisma.pdfResource.findUnique({
      where: { id },
      include: {
        serviceProvider: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                profileImage: true,
              }
            }
          }
        }
      }
    });

    if (!pdfResource) {
      return UtilFunctions.outputError(
        res,
        "PDF resource not found",
        {},
        "NOT_FOUND",
        404
      );
    }

    return UtilFunctions.outputSuccess(
      res,
      pdfResource,
      "PDF resource retrieved successfully"
    );
  }
);

// Download PDF file (Caregiver and Service Provider)
resourceRouter.get(
  "/:id/download",
  authorize(["SERVICE_PROVIDER", "CAREGIVER"]),
  async (req, res) => {
    const { id } = req.params;
    
    const pdfResource = await prisma.pdfResource.findUnique({
      where: { id }
    });

    if (!pdfResource) {
      return UtilFunctions.outputError(
        res,
        "PDF resource not found",
        {},
        "NOT_FOUND",
        404
      );
    }

    // Return the first PDF file URL (assuming single file per resource for simplicity)
    if (!pdfResource.pdfFile || pdfResource.pdfFile.length === 0) {
      return UtilFunctions.outputError(
        res,
        "No PDF file associated with this resource",
        {},
        "NOT_FOUND",
        404
      );
    }

    const fileUrl = pdfResource.pdfFile[0];
    // Extract filename from URL for serving
    const fileName = path.basename(fileUrl);
    
    return sendProtectedFile(res, pdfBucket, fileName);
  }
);

// Update PDF resource (Service Provider only - owner only)
resourceRouter.put(
  "/:id",
  authorize(["SERVICE_PROVIDER"]),
  upload.single("pdfFile"),
  async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    
    // Check if resource exists and belongs to the service provider
    const existingResource = await prisma.pdfResource.findUnique({
      where: { id },
      include: {
        serviceProvider: true
      }
    });

    if (!existingResource) {
      return UtilFunctions.outputError(
        res,
        "PDF resource not found",
        {},
        "NOT_FOUND",
        404
      );
    }

    // Check ownership - compare against the provider's userId
    if (existingResource.serviceProvider.userId !== res.locals.user.id) {
      return UtilFunctions.outputError(
        res,
        "You can only update your own PDF resources",
        {},
        "FORBIDDEN",
        403
      );
    }

    // Prepare update data
    const updateData = {
      title: title || existingResource.title,
      description: description !== undefined ? description : existingResource.description,
    };

    // Handle file update if provided
    if (req.file) {
      const file = req.file;
      if (!allowedPdfTypes.has(file.mimetype)) {
        return UtilFunctions.outputError(
          res,
          "Unsupported file type. Only PDF files are allowed",
          {},
          "UNPROCESSABLE_ENTITY",
          422
        );
      }

      const safeName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}${path.extname(file.originalname) || ".pdf"}`;

      // Ensure resources directory exists
      fs.mkdirSync(path.resolve(resourcesBasePath, pdfBucket), { recursive: true });

      // Save new file
      const fileUrl = await UploadService.saveFile(file.buffer, safeName, pdfBucket);
      updateData.pdfFile = [fileUrl];
    }

    // Update resource
    const updatedResource = await prisma.pdfResource.update({
      where: { id },
      data: updateData,
      include: {
        serviceProvider: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                profileImage: true,
              }
            }
          }
        }
      }
    });

    return UtilFunctions.outputSuccess(
      res,
      updatedResource,
      "PDF resource updated successfully"
    );
  }
);

// Delete PDF resource (Service Provider only - owner only)
resourceRouter.delete(
  "/:id",
  authorize(["SERVICE_PROVIDER"]),
  async (req, res) => {
    const { id } = req.params;
    
    // Check if resource exists and belongs to the service provider
    const existingResource = await prisma.pdfResource.findUnique({
      where: { id },
      include: {
        serviceProvider: true
      }
    });

    if (!existingResource) {
      return UtilFunctions.outputError(
        res,
        "PDF resource not found",
        {},
        "NOT_FOUND",
        404
      );
    }

    // Check ownership - compare against the provider's userId
    if (existingResource.serviceProvider.userId !== res.locals.user.id) {
      return UtilFunctions.outputError(
        res,
        "You can only delete your own PDF resources",
        {},
        "FORBIDDEN",
        403
      );
    }

    // Delete resource
    await prisma.pdfResource.delete({
      where: { id }
    });

    return UtilFunctions.outputSuccess(
      res,
      {},
      "PDF resource deleted successfully"
    );
  }
);

export default resourceRouter;
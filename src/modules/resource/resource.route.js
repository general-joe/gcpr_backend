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

const allowedFileTypes = new Set([
  "application/pdf",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const allowedPdfTypes = new Set(["application/pdf"]);

const getFileBucket = (type) => {
  switch (type.toLowerCase()) {
    case "video":
      return "videos";
    case "document":
    case "pdf":
    default:
      return pdfBucket;
  }
};

const uploadNone = upload.fields([{ name: "file", maxCount: 1 }]);

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

// Upload resource (Service Provider only, or ADMIN with role)
resourceRouter.post(
  "/",
  authorize(["SERVICE_PROVIDER", "ADMIN"]),
  uploadNone,
  async (req, res) => {
    const file = req.files?.file?.[0];
    
    const body = req.body;
    const resourceTitle = body?.name || body?.title;
    if (!resourceTitle) {
      return UtilFunctions.outputError(
        res,
        "Name or title is required",
        {},
        "BAD_REQUEST",
        400
      );
    }

    const resourceType = (body?.type || "document").toLowerCase();

    // If file is provided, validate it based on type
    if (file) {
      if (!allowedFileTypes.has(file.mimetype)) {
        return UtilFunctions.outputError(
          res,
          `Unsupported file type. Allowed types: PDF, video`,
          {},
          "UNPROCESSABLE_ENTITY",
          422
        );
      }
    }

    let fileUrl = null;
    const bucket = getFileBucket(resourceType);
    
    // Process file if provided
    if (file) {
      const safeName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}${path.extname(file.originalname) || ".pdf"}`;

      // Ensure resources directory exists
      fs.mkdirSync(path.resolve(resourcesBasePath, bucket), { recursive: true });

      // Save file to storage
      fileUrl = await UploadService.saveFile(file.buffer, safeName, bucket);
    }

    // Look up the service provider by user ID
    let serviceProvider = await prisma.serviceProvider.findUnique({
      where: { userId: res.locals.user.id },
      select: { id: true },
    });

    // If not a service provider, check if user is ADMIN (for admin-created resources)
    const isUserAdmin = res.locals.user.userType === "ADMIN" || res.locals.user.roles?.includes("admin");
    if (!serviceProvider && !isUserAdmin) {
      return UtilFunctions.outputError(
        res,
        "Service provider profile not found",
        {},
        "NOT_FOUND",
        404
      );
    }

    // Create resource record in database
    const resource = await prisma.pdfResource.create({
      data: {
        title: resourceTitle,
        description: body?.description || null,
        pdfFile: fileUrl ? [fileUrl] : [],
        ...(serviceProvider && { serviceProviderId: serviceProvider.id }),
      },
    });

    return UtilFunctions.outputSuccess(
      res,
      { ...resource, name: resource.title },
      `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} resource uploaded successfully`
    );
  }
);

// Get all PDF resources (Service Provider, Caregiver, and ADMIN with appropriate role)
resourceRouter.get(
  "/",
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
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

    const resources = pdfResources.map(r => ({
      ...r,
      name: r.title,
    }));

    return UtilFunctions.outputSuccess(
      res,
      resources,
      "PDF resources retrieved successfully"
    );
  }
);

// Get specific PDF resource by ID
resourceRouter.get(
  "/:id",
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
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
      { ...pdfResource, name: pdfResource.title },
      "PDF resource retrieved successfully"
    );
  }
);

// Download PDF file (Caregiver, Service Provider, and ADMIN)
resourceRouter.get(
  "/:id/download",
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
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

// Update PDF resource (Service Provider only - owner only, or ADMIN with role)
resourceRouter.put(
  "/:id",
  authorize(["SERVICE_PROVIDER", "ADMIN"]),
  upload.single("pdfFile"),
  async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const resourceTitle = body.title || body.name;
    
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

    const isServiceProvider = res.locals.user.userType === "SERVICE_PROVIDER";
    const isOwner = existingResource.serviceProvider?.userId === res.locals.user.id;
    
    if (isServiceProvider && !isOwner) {
      return UtilFunctions.outputError(
        res,
        "You can only update your own PDF resources",
        {},
        "FORBIDDEN",
        403
      );
    }

    const updateData = {
      title: resourceTitle || existingResource.title,
      description: body.description !== undefined ? body.description : existingResource.description,
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
      { ...updatedResource, name: updatedResource.title },
      "PDF resource updated successfully"
    );
  }
);

// Delete PDF resource (Service Provider only - owner only, or ADMIN with role)
resourceRouter.delete(
  "/:id",
  authorize(["SERVICE_PROVIDER", "ADMIN"]),
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

    const isServiceProvider = res.locals.user.userType === "SERVICE_PROVIDER";
    const isOwner = existingResource.serviceProvider?.userId === res.locals.user.id;
    
    if (isServiceProvider && !isOwner) {
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
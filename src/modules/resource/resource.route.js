import express from "express";
import { authorize } from "../../middlewares/auth.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import prisma from "../../config/database.js";
import upload from "../../middlewares/upload.js";
import UploadService from "../../utils/uploadService.js";
import path from "path";

const resourceRouter = express.Router();

const documentBucket = "pdfs";

const allowedFileTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const getFileBucket = (type) => {
  switch (type.toUpperCase()) {
    case "VIDEO":
      return "videos";
    case "DOCUMENT":
    default:
      return documentBucket;
  }
};

const uploadFile = upload.fields([{ name: "file", maxCount: 1 }]);

// Upload resource (Service Provider only, or ADMIN with role)
resourceRouter.post(
  "/",
  authorize(["SERVICE_PROVIDER", "ADMIN"]),
  uploadFile,
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

    const resourceType = (body?.type || "DOCUMENT").toUpperCase();
    if (!["DOCUMENT", "VIDEO", "LINK"].includes(resourceType)) {
      return UtilFunctions.outputError(
        res,
        "Invalid resource type. Must be DOCUMENT, VIDEO, or LINK",
        {},
        "BAD_REQUEST",
        400
      );
    }

    let fileUrl = null;
    
    // Process based on type
    if (resourceType === "LINK") {
      fileUrl = body?.resourceUrl || body?.link;
      if (!fileUrl) {
        return UtilFunctions.outputError(
          res,
          "resourceUrl is required for LINK type",
          {},
          "BAD_REQUEST",
          400
        );
      }
    } else {
      if (!file) {
        return UtilFunctions.outputError(
          res,
          "File is required for DOCUMENT and VIDEO types",
          {},
          "BAD_REQUEST",
          400
        );
      }

      if (!allowedFileTypes.has(file.mimetype)) {
        return UtilFunctions.outputError(
          res,
          `Unsupported file type. Allowed types: PDF, Word, Images, video`,
          {},
          "UNPROCESSABLE_ENTITY",
          422
        );
      }

      const bucket = getFileBucket(resourceType);
      const safeName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}${path.extname(file.originalname) || (resourceType === "VIDEO" ? ".mp4" : ".pdf")}`;

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
    const resource = await prisma.resource.create({
      data: {
        title: resourceTitle,
        description: body?.description || null,
        type: resourceType,
        resourceUrl: fileUrl,
        ...(serviceProvider && { serviceProviderId: serviceProvider.id }),
      },
    });

    return UtilFunctions.outputSuccess(
      res,
      { ...resource, name: resource.title },
      `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1).toLowerCase()} resource uploaded successfully`
    );
  }
);

// Get all resources (Service Provider, Caregiver, and ADMIN with appropriate role)
resourceRouter.get(
  "/",
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
  async (req, res) => {
    const resourcesList = await prisma.resource.findMany({
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

    const resources = resourcesList.map(r => ({
      ...r,
      name: r.title,
    }));

    return UtilFunctions.outputSuccess(
      res,
      resources,
      "Resources retrieved successfully"
    );
  }
);

// Get specific resource by ID
resourceRouter.get(
  "/:id",
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
  async (req, res) => {
    const { id } = req.params;
    
    const resource = await prisma.resource.findUnique({
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

    if (!resource) {
      return UtilFunctions.outputError(
        res,
        "Resource not found",
        {},
        "NOT_FOUND",
        404
      );
    }

    return UtilFunctions.outputSuccess(
      res,
      { ...resource, name: resource.title },
      "Resource retrieved successfully"
    );
  }
);

// Download resource file (Caregiver, Service Provider, and ADMIN)
resourceRouter.get(
  "/:id/download",
  authorize(["SERVICE_PROVIDER", "CAREGIVER", "ADMIN"]),
  async (req, res) => {
    const { id } = req.params;
    
    const resource = await prisma.resource.findUnique({
      where: { id }
    });

    if (!resource) {
      return UtilFunctions.outputError(
        res,
        "Resource not found",
        {},
        "NOT_FOUND",
        404
      );
    }

    if (resource.type === "LINK") {
      return UtilFunctions.outputError(
        res,
        "External links cannot be downloaded",
        {},
        "BAD_REQUEST",
        400
      );
    }

    if (!resource.resourceUrl) {
      return UtilFunctions.outputError(
        res,
        "No file associated with this resource",
        {},
        "NOT_FOUND",
        404
      );
    }

    return res.redirect(302, resource.resourceUrl);
  }
);

// Update resource (Service Provider only - owner only, or ADMIN with role)
resourceRouter.put(
  "/:id",
  authorize(["SERVICE_PROVIDER", "ADMIN"]),
  upload.single("file"),
  async (req, res) => {
    const { id } = req.params;
    const body = req.body || {};
    const resourceTitle = body.title || body.name;
    
    const existingResource = await prisma.resource.findUnique({
      where: { id },
      include: {
        serviceProvider: true
      }
    });

    if (!existingResource) {
      return UtilFunctions.outputError(
        res,
        "Resource not found",
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
        "You can only update your own resources",
        {},
        "FORBIDDEN",
        403
      );
    }

    const updateData = {
      title: resourceTitle || existingResource.title,
      description: body.description !== undefined ? body.description : existingResource.description,
    };

    // If changing type or updating file
    if (body.type) {
      const newType = body.type.toUpperCase();
      if (!["DOCUMENT", "VIDEO", "LINK"].includes(newType)) {
        return UtilFunctions.outputError(
          res,
          "Invalid resource type. Must be DOCUMENT, VIDEO, or LINK",
          {},
          "BAD_REQUEST",
          400
        );
      }
      updateData.type = newType;
    }
    const currentType = updateData.type || existingResource.type;

    if (currentType === "LINK" && body.resourceUrl) {
       updateData.resourceUrl = body.resourceUrl;
    } else if (req.file && currentType !== "LINK") {
      const file = req.file;
      if (!allowedFileTypes.has(file.mimetype)) {
        return UtilFunctions.outputError(
          res,
          "Unsupported file type",
          {},
          "UNPROCESSABLE_ENTITY",
          422
        );
      }

      const bucket = getFileBucket(currentType);
      const safeName = `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 10)}${path.extname(file.originalname) || (currentType === "VIDEO" ? ".mp4" : ".pdf")}`;

      // Save new file
      const fileUrl = await UploadService.saveFile(file.buffer, safeName, bucket);
      updateData.resourceUrl = fileUrl;
    }

    // Update resource
    const updatedResource = await prisma.resource.update({
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
      "Resource updated successfully"
    );
  }
);

// Delete resource (Service Provider only - owner only, or ADMIN with role)
resourceRouter.delete(
  "/:id",
  authorize(["SERVICE_PROVIDER", "ADMIN"]),
  async (req, res) => {
    const { id } = req.params;
    
    // Check if resource exists and belongs to the service provider
    const existingResource = await prisma.resource.findUnique({
      where: { id },
      include: {
        serviceProvider: true
      }
    });

    if (!existingResource) {
      return UtilFunctions.outputError(
        res,
        "Resource not found",
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
        "You can only delete your own resources",
        {},
        "FORBIDDEN",
        403
      );
    }

    // Delete resource
    await prisma.resource.delete({
      where: { id }
    });

    return UtilFunctions.outputSuccess(
      res,
      {},
      "Resource deleted successfully"
    );
  }
);

export default resourceRouter;

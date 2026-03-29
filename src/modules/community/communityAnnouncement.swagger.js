export const communityAnnouncementSwagger = {
  "/community/{communityId}/announcements": {
    post: {
      tags: ["Community Announcements"],
      summary: "Create announcement",
      description: "Create a new announcement in a community (admin/owner only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "communityId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Community ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              required: ["title", "content"],
              properties: {
                title: {
                  type: "string",
                  minLength: 3,
                  maxLength: 200,
                  description: "Announcement title",
                },
                content: {
                  type: "string",
                  minLength: 10,
                  maxLength: 5000,
                  description: "Announcement content",
                },
                media: {
                  type: "string",
                  format: "binary",
                  description: "Announcement media",
                },
                isPinned: {
                  type: "boolean",
                  default: false,
                  description: "Pin announcement to top",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Announcement created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/CommunityAnnouncement" },
                  message: { type: "string", example: "Announcement created successfully" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
        403: { $ref: "#/components/responses/Forbidden" },
      },
    },
    get: {
      tags: ["Community Announcements"],
      summary: "Get community announcements",
      description: "Get all announcements in a community",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "communityId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Community ID",
        },
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
      ],
      responses: {
        200: {
          description: "Announcements retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/CommunityAnnouncement" },
                  },
                  pagination: { $ref: "#/components/schemas/Pagination" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        403: { $ref: "#/components/responses/Forbidden" },
      },
    },
  },
  "/community/{communityId}/announcements/{announcementId}": {
    get: {
      tags: ["Community Announcements"],
      summary: "Get announcement by ID",
      description: "Get announcement details by ID",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "communityId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Community ID",
        },
        {
          name: "announcementId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Announcement ID",
        },
      ],
      responses: {
        200: {
          description: "Announcement retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/CommunityAnnouncement" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
      },
    },
    put: {
      tags: ["Community Announcements"],
      summary: "Update announcement",
      description: "Update an announcement (admin/owner only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "communityId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Community ID",
        },
        {
          name: "announcementId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Announcement ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  minLength: 3,
                  maxLength: 200,
                  description: "Announcement title",
                },
                content: {
                  type: "string",
                  minLength: 10,
                  maxLength: 5000,
                  description: "Announcement content",
                },
                media: {
                  type: "string",
                  format: "binary",
                  description: "Announcement media",
                },
                isPinned: {
                  type: "boolean",
                  description: "Pin announcement to top",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Announcement updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/CommunityAnnouncement" },
                  message: { type: "string", example: "Announcement updated successfully" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
        403: { $ref: "#/components/responses/Forbidden" },
        404: { $ref: "#/components/responses/NotFound" },
      },
    },
    delete: {
      tags: ["Community Announcements"],
      summary: "Delete announcement",
      description: "Delete an announcement (admin/owner only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "communityId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Community ID",
        },
        {
          name: "announcementId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Announcement ID",
        },
      ],
      responses: {
        200: {
          description: "Announcement deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  message: { type: "string", example: "Announcement deleted successfully" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        403: { $ref: "#/components/responses/Forbidden" },
        404: { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/community/{communityId}/announcements/{announcementId}/pin": {
    post: {
      tags: ["Community Announcements"],
      summary: "Toggle pin announcement",
      description: "Pin or unpin an announcement (admin/owner only)",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "communityId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Community ID",
        },
        {
          name: "announcementId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Announcement ID",
        },
      ],
      responses: {
        200: {
          description: "Announcement pin toggled successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/CommunityAnnouncement" },
                  message: { type: "string", example: "Announcement pinned/unpinned successfully" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
        403: { $ref: "#/components/responses/Forbidden" },
        404: { $ref: "#/components/responses/NotFound" },
      },
    },
  },
};

export const communityAnnouncementSchemas = {
  CommunityAnnouncement: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      communityId: { type: "string", format: "uuid" },
      title: { type: "string" },
      content: { type: "string" },
      mediaUrl: { type: "string", nullable: true },
      createdBy: { type: "string", format: "uuid" },
      isPinned: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      creator: { $ref: "#/components/schemas/User" },
    },
  },
};

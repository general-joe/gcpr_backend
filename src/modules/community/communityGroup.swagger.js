export const communityGroupSwagger = {
  "/community/{communityId}/groups": {
    post: {
      tags: ["Community Groups"],
      summary: "Create a new group",
      description: "Create a new group in a community",
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
              required: ["name"],
              properties: {
                name: {
                  type: "string",
                  minLength: 2,
                  maxLength: 100,
                  description: "Group name",
                },
                description: {
                  type: "string",
                  maxLength: 500,
                  description: "Group description",
                },
                image: {
                  type: "string",
                  format: "binary",
                  description: "Group image",
                },
                isAnnouncementOnly: {
                  type: "boolean",
                  default: false,
                  description: "Only admins can send messages",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Group created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/CommunityGroup" },
                  message: { type: "string", example: "Group created successfully" },
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
      tags: ["Community Groups"],
      summary: "Get community groups",
      description: "Get all groups in a community",
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
          description: "Groups retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/CommunityGroup" },
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
  "/community/{communityId}/groups/{groupId}": {
    get: {
      tags: ["Community Groups"],
      summary: "Get group by ID",
      description: "Get group details by ID",
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
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Group ID",
        },
      ],
      responses: {
        200: {
          description: "Group retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/CommunityGroup" },
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
      tags: ["Community Groups"],
      summary: "Update group",
      description: "Update group details (admin only)",
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
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Group ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  minLength: 2,
                  maxLength: 100,
                  description: "Group name",
                },
                description: {
                  type: "string",
                  maxLength: 500,
                  description: "Group description",
                },
                image: {
                  type: "string",
                  format: "binary",
                  description: "Group image",
                },
                isAnnouncementOnly: {
                  type: "boolean",
                  description: "Only admins can send messages",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Group updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/CommunityGroup" },
                  message: { type: "string", example: "Group updated successfully" },
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
      tags: ["Community Groups"],
      summary: "Delete group",
      description: "Delete a group (admin only, cannot delete default group)",
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
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Group ID",
        },
      ],
      responses: {
        200: {
          description: "Group deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  message: { type: "string", example: "Group deleted successfully" },
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
  },
  "/community/{communityId}/groups/{groupId}/join": {
    post: {
      tags: ["Community Groups"],
      summary: "Join group",
      description: "Join a group in the community",
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
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Group ID",
        },
      ],
      responses: {
        200: {
          description: "Successfully joined group",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/CommunityGroupMember" },
                  message: { type: "string", example: "Successfully joined the group" },
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
  },
  "/community/{communityId}/groups/{groupId}/leave": {
    post: {
      tags: ["Community Groups"],
      summary: "Leave group",
      description: "Leave a group (cannot leave default group)",
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
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Group ID",
        },
      ],
      responses: {
        200: {
          description: "Successfully left group",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  message: { type: "string", example: "Successfully left the group" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/community/{communityId}/groups/{groupId}/messages": {
    get: {
      tags: ["Community Groups"],
      summary: "Get group messages",
      description: "Get messages from a group",
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
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Group ID",
        },
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
      ],
      responses: {
        200: {
          description: "Messages retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/CommunityMessage" },
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
    post: {
      tags: ["Community Groups"],
      summary: "Send message",
      description: "Send a message to a group",
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
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Group ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                content: {
                  type: "string",
                  maxLength: 5000,
                  description: "Message content",
                },
                type: {
                  type: "string",
                  enum: ["TEXT", "IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "LOCATION"],
                  default: "TEXT",
                  description: "Message type",
                },
                mediaUrl: {
                  type: "string",
                  format: "uri",
                  description: "Media URL",
                },
                metadata: {
                  type: "object",
                  description: "Additional metadata",
                },
                replyToId: {
                  type: "string",
                  format: "uuid",
                  description: "ID of message being replied to",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Message sent successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/CommunityMessage" },
                  message: { type: "string", example: "Message sent successfully" },
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
  },
  "/community/{communityId}/groups/{groupId}/messages/{messageId}": {
    delete: {
      tags: ["Community Groups"],
      summary: "Delete message",
      description: "Delete a message from a group",
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
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Group ID",
        },
        {
          name: "messageId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Message ID",
        },
      ],
      responses: {
        200: {
          description: "Message deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  message: { type: "string", example: "Message deleted successfully" },
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

export const communityGroupSchemas = {
  CommunityGroup: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      communityId: { type: "string", format: "uuid" },
      name: { type: "string" },
      description: { type: "string", nullable: true },
      image: { type: "string", nullable: true },
      createdBy: { type: "string", format: "uuid" },
      isDefault: { type: "boolean" },
      isAnnouncementOnly: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      _count: {
        type: "object",
        properties: {
          members: { type: "integer" },
          messages: { type: "integer" },
        },
      },
    },
  },
  CommunityGroupMember: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      groupId: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid" },
      role: { type: "string", enum: ["ADMIN", "MEMBER"] },
      joinedAt: { type: "string", format: "date-time" },
      user: { $ref: "#/components/schemas/User" },
    },
  },
  CommunityMessage: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      groupId: { type: "string", format: "uuid" },
      senderId: { type: "string", format: "uuid" },
      content: { type: "string", nullable: true },
      type: { type: "string", enum: ["TEXT", "IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "LOCATION"] },
      mediaUrl: { type: "string", nullable: true },
      metadata: { type: "object", nullable: true },
      status: { type: "string", enum: ["SENT", "DELIVERED", "READ"] },
      replyToId: { type: "string", format: "uuid", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      sender: { $ref: "#/components/schemas/User" },
      replyTo: {
        type: "object",
        nullable: true,
        properties: {
          id: { type: "string", format: "uuid" },
          content: { type: "string", nullable: true },
          sender: { $ref: "#/components/schemas/User" },
        },
      },
    },
  },
};

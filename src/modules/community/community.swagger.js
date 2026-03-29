export const communitySwagger = {
  "/community": {
    post: {
      tags: ["Community"],
      summary: "Create a new community",
      description: "Create a new community with the authenticated user as owner",
      security: [{ bearerAuth: [] }],
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
                  minLength: 3,
                  maxLength: 100,
                  description: "Community name",
                },
                description: {
                  type: "string",
                  maxLength: 500,
                  description: "Community description",
                },
                image: {
                  type: "string",
                  format: "binary",
                  description: "Community image",
                },
                isPublic: {
                  type: "boolean",
                  default: false,
                  description: "Whether the community is public",
                },
                maxMembers: {
                  type: "integer",
                  minimum: 2,
                  maximum: 10000,
                  default: 1000,
                  description: "Maximum number of members",
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: "Community created successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/Community" },
                  message: { type: "string", example: "Community created successfully" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
    get: {
      tags: ["Community"],
      summary: "Get user communities",
      description: "Get all communities the authenticated user is a member of",
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
      ],
      responses: {
        200: {
          description: "Communities retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Community" },
                  },
                  pagination: { $ref: "#/components/schemas/Pagination" },
                },
              },
            },
          },
        },
        401: { $ref: "#/components/responses/Unauthorized" },
      },
    },
  },
  "/community/search": {
    get: {
      tags: ["Community"],
      summary: "Search public communities",
      description: "Search for public communities by name or description",
      parameters: [
        {
          name: "search",
          in: "query",
          required: true,
          schema: { type: "string" },
          description: "Search term",
        },
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/Limit" },
      ],
      responses: {
        200: {
          description: "Communities found",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/Community" },
                  },
                  pagination: { $ref: "#/components/schemas/Pagination" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/community/join": {
    post: {
      tags: ["Community"],
      summary: "Join community by invite code",
      description: "Join a community using an invite code",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["inviteCode"],
              properties: {
                inviteCode: {
                  type: "string",
                  minLength: 6,
                  maxLength: 20,
                  description: "Community invite code",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Successfully joined community",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/Community" },
                  message: { type: "string", example: "Successfully joined the community" },
                },
              },
            },
          },
        },
        400: { $ref: "#/components/responses/BadRequest" },
        401: { $ref: "#/components/responses/Unauthorized" },
        404: { $ref: "#/components/responses/NotFound" },
      },
    },
  },
  "/community/{communityId}": {
    get: {
      tags: ["Community"],
      summary: "Get community by ID",
      description: "Get community details by ID",
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
      responses: {
        200: {
          description: "Community retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/Community" },
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
      tags: ["Community"],
      summary: "Update community",
      description: "Update community details (admin/owner only)",
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
              properties: {
                name: {
                  type: "string",
                  minLength: 3,
                  maxLength: 100,
                  description: "Community name",
                },
                description: {
                  type: "string",
                  maxLength: 500,
                  description: "Community description",
                },
                image: {
                  type: "string",
                  format: "binary",
                  description: "Community image",
                },
                isPublic: {
                  type: "boolean",
                  description: "Whether the community is public",
                },
                maxMembers: {
                  type: "integer",
                  minimum: 2,
                  maximum: 10000,
                  description: "Maximum number of members",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Community updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/Community" },
                  message: { type: "string", example: "Community updated successfully" },
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
      tags: ["Community"],
      summary: "Delete community",
      description: "Delete a community (creator only)",
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
      responses: {
        200: {
          description: "Community deleted successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  message: { type: "string", example: "Community deleted successfully" },
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
  "/community/{communityId}/leave": {
    post: {
      tags: ["Community"],
      summary: "Leave community",
      description: "Leave a community",
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
      responses: {
        200: {
          description: "Successfully left community",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  message: { type: "string", example: "Successfully left the community" },
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
  "/community/{communityId}/members": {
    get: {
      tags: ["Community"],
      summary: "Get community members",
      description: "Get all members of a community",
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
          description: "Members retrieved successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: {
                    type: "array",
                    items: { $ref: "#/components/schemas/CommunityMember" },
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
  "/community/{communityId}/members/{memberId}/role": {
    put: {
      tags: ["Community"],
      summary: "Update member role",
      description: "Update a member's role in the community (admin/owner only)",
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
          name: "memberId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Member user ID",
        },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["role"],
              properties: {
                role: {
                  type: "string",
                  enum: ["ADMIN", "MEMBER"],
                  description: "New role for the member",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: "Member role updated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: { $ref: "#/components/schemas/CommunityMember" },
                  message: { type: "string", example: "Member role updated successfully" },
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
  "/community/{communityId}/members/{memberId}/ban": {
    post: {
      tags: ["Community"],
      summary: "Ban member",
      description: "Ban a member from the community (admin/owner only)",
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
          name: "memberId",
          in: "path",
          required: true,
          schema: { type: "string", format: "uuid" },
          description: "Member user ID",
        },
      ],
      responses: {
        200: {
          description: "Member banned successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  message: { type: "string", example: "Member banned successfully" },
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
  "/community/{communityId}/invite-code": {
    post: {
      tags: ["Community"],
      summary: "Generate invite code",
      description: "Generate a new invite code for the community (admin/owner only)",
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
      responses: {
        200: {
          description: "Invite code generated successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", example: "SUCCESS" },
                  data: {
                    type: "object",
                    properties: {
                      inviteCode: { type: "string" },
                    },
                  },
                  message: { type: "string", example: "Invite code generated successfully" },
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
};

export const communitySchemas = {
  Community: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      name: { type: "string" },
      description: { type: "string", nullable: true },
      image: { type: "string", nullable: true },
      createdBy: { type: "string", format: "uuid" },
      inviteCode: { type: "string", nullable: true },
      inviteEnabled: { type: "boolean" },
      maxMembers: { type: "integer" },
      isPublic: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      creator: { $ref: "#/components/schemas/User" },
      _count: {
        type: "object",
        properties: {
          members: { type: "integer" },
          groups: { type: "integer" },
        },
      },
    },
  },
  CommunityMember: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      communityId: { type: "string", format: "uuid" },
      userId: { type: "string", format: "uuid" },
      role: { type: "string", enum: ["OWNER", "ADMIN", "MEMBER"] },
      status: { type: "string", enum: ["ACTIVE", "PENDING", "BANNED", "LEFT"] },
      joinedAt: { type: "string", format: "date-time" },
      user: { $ref: "#/components/schemas/User" },
    },
  },
};

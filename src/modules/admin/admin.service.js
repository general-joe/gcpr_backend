import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import NotificationService from "../notification/notification.service.js";
import MetricsService from "../metrics/metrics.service.js";
import { seedRbac } from "../../utils/rbacSeed.js";

class AdminService {
  // ── Bootstrap ────────────────────────────────────────────────────────────────

  /**
   * Seeds default RBAC roles/permissions and optionally assigns the ADMIN role
   * to a specified user. Protected by BOOTSTRAP_SECRET env var.
   *
   * Body: { secret: string, userId?: string }
   */
  static async bootstrap(body) {
    const { secret, userId } = body ?? {};
    const expected = process.env.BOOTSTRAP_SECRET;
    const bootstrapDisabled =
      process.env.BOOTSTRAP_DISABLED === "true" ||
      (process.env.NODE_ENV === "production" &&
        process.env.ALLOW_BOOTSTRAP_IN_PRODUCTION !== "true");

    if (bootstrapDisabled) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Bootstrap is disabled in this environment",
      );
    }

    if (!expected || secret !== expected) {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Invalid or missing bootstrap secret",
      );
    }

    const seedResult = await seedRbac({ timeout: 30000 });

    let roleAssignment = null;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new gcprError(HttpStatus.NOT_FOUND, "User not found");

      if (user.userType === "CAREGIVER") {
        throw new gcprError(
          HttpStatus.FORBIDDEN,
          "ADMIN role cannot be assigned to a CAREGIVER user. Use a SERVICE_PROVIDER or ADMIN user.",
        );
      }

      const adminRole = await prisma.appRole.findUnique({
        where: { slug: "ADMIN" },
      });
      if (adminRole) {
        roleAssignment = await prisma.userRole.upsert({
          where: {
            userId_roleId_scopeType_scopeId: {
              userId,
              roleId: adminRole.id,
              scopeType: "GLOBAL",
              scopeId: null,
            },
          },
          update: { active: true },
          create: {
            userId,
            roleId: adminRole.id,
            scopeType: "GLOBAL",
            active: true,
          },
        });
      }
    }

    return { seed: seedResult, roleAssignment };
  }

  /**
   * Re-seeds the default RBAC roles and permissions (idempotent).
   * Safe to call multiple times.
   */
  static async seedRbac() {
    return seedRbac({ timeout: 30000 });
  }

  // ── User Management ──────────────────────────────────────────────────────────

  static async listUsers(query = {}) {
    const { userType, status, page = 1, limit = 20, search } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (userType) where.userType = userType;
    if (status) where.accountStatus = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phoneNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          userType: true,
          accountStatus: true,
          verified: true,
          profileCompleted: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  static async getUserById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        serviceProvider: true,
        caregiver: true,
      },
    });
    if (!user) throw new gcprError(HttpStatus.NOT_FOUND, "User not found");
    return user;
  }

  static async updateUserStatus(userId, status) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new gcprError(HttpStatus.NOT_FOUND, "User not found");

    return prisma.user.update({
      where: { id: userId },
      data: { accountStatus: status },
    });
  }

  static async deleteUser(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new gcprError(HttpStatus.NOT_FOUND, "User not found");
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: "DELETED",
        email: { set: null },
        phoneNumber: { set: "DELETED_ACCOUNT" },
        password: { set: "DELETED_ACCOUNT" },
      },
    });
  }

  // ── Service Provider Management ──────────────────────────────────────────────

  static async listProviders(query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [providers, total] = await Promise.all([
      prisma.serviceProvider.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              accountStatus: true,
            },
          },
        },
      }),
      prisma.serviceProvider.count(),
    ]);

    return {
      data: providers,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  static async verifyProvider(providerId, data) {
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: { user: { select: { id: true } } },
    });
    if (!provider)
      throw new gcprError(HttpStatus.NOT_FOUND, "Service provider not found");

    const updated = await prisma.serviceProvider.update({
      where: { id: providerId },
      data: {
        licenseStatus: data.licenseStatus || "ACTIVE",
        verificationStatus: "VERIFIED",
        verifiedAt: new Date(),
      },
    });

    // Send notification
    try {
      await NotificationService.createNotification({
        userId: provider.user.id,
        type: "IN_APP",
        category: "SYSTEM",
        title: "License Verified",
        content: "Your license has been verified by an administrator.",
        relatedId: providerId,
        relatedModel: "ServiceProvider",
      });
    } catch (e) {
      WRITE.warn("[Admin] Verification notification failed", {
        error: e.message,
      });
    }

    return updated;
  }

  /**
   * Comprehensive provider verification management
   * Allows admins to approve, reject, request changes, or suspend provider verification
   *
   * @param {string} providerId - The ID of the service provider
   * @param {object} data - Verification data
   * @param {string} data.action - APPROVE, REJECT, REQUEST_CHANGES, or SUSPEND
   * @param {string} data.verificationNote - Reason/note for the action
   * @param {string} data.licenseStatus - ACTIVE or INACTIVE (for approval)
   * @param {string} adminId - The ID of the admin performing the action
   * @returns {object} Updated service provider record
   */
  static async updateProviderVerification(providerId, data, adminId) {
    const { action, verificationNote, licenseStatus } = data;

    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });

    if (!provider) {
      throw new gcprError(HttpStatus.NOT_FOUND, "Service provider not found");
    }

    // Determine the new verification status based on action
    let newVerificationStatus;
    let notificationTitle;
    let notificationContent;

    switch (action) {
      case "APPROVE":
        newVerificationStatus = "VERIFIED";
        notificationTitle = "Verification Approved";
        notificationContent =
          verificationNote ||
          "Your verification has been approved by an administrator. You can now complete your profile.";
        break;
      case "REJECT":
        newVerificationStatus = "REJECTED";
        notificationTitle = "Verification Rejected";
        notificationContent = `Your verification has been rejected. Reason: ${verificationNote}`;
        break;
      case "REQUEST_CHANGES":
        newVerificationStatus = "PENDING_REVIEW";
        notificationTitle = "Changes Requested";
        notificationContent = `Changes have been requested for your verification. Please review: ${verificationNote}`;
        break;
      case "SUSPEND":
        newVerificationStatus = "SUSPENDED";
        notificationTitle = "Verification Suspended";
        notificationContent = `Your verification has been suspended. Reason: ${verificationNote}`;
        break;
      default:
        throw new gcprError(
          HttpStatus.BAD_REQUEST,
          "Invalid verification action",
        );
    }

    // Update the service provider with verification details
    const updateData = {
      verificationStatus: newVerificationStatus,
      verificationNote,
    };

    // Only update license status and verifiedAt for approval
    if (action === "APPROVE") {
      updateData.licenseStatus = licenseStatus || "ACTIVE";
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = adminId;
    }

    const updated = await prisma.serviceProvider.update({
      where: { id: providerId },
      data: updateData,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    // Send notification to the service provider
    try {
      await NotificationService.createNotification({
        userId: provider.user.id,
        type: "IN_APP",
        category: "SYSTEM",
        title: notificationTitle,
        content: notificationContent,
        relatedId: providerId,
        relatedModel: "ServiceProvider",
      });
    } catch (e) {
      WRITE.warn("[Admin] Provider verification notification failed", {
        error: e.message,
        providerId,
      });
    }

    return updated;
  }

  static async getProviderById(providerId) {
    const provider = await prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        user: true,
        clinicalAssessments: { take: 5, orderBy: { createdAt: "desc" } },
        rehabTasks: { take: 5, orderBy: { createdAt: "desc" } },
      },
    });
    if (!provider)
      throw new gcprError(HttpStatus.NOT_FOUND, "Service provider not found");
    return provider;
  }

  // ── Patient Management ────────────────────────────────────────────────────────

  static async listPatients(query = {}) {
    const { page = 1, limit = 20, search } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};
    if (search) {
      where.fullName = { contains: search, mode: "insensitive" };
    }

    const [patients, total] = await Promise.all([
      prisma.cpPatient.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          caregiver: {
            select: { id: true, user: { select: { fullName: true } } },
          },
        },
      }),
      prisma.cpPatient.count({ where }),
    ]);

    return {
      data: patients,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  static async getPatientById(patientId) {
    const patient = await prisma.cpPatient.findUnique({
      where: { id: patientId },
      include: {
        caregiver: true,
        clinicalAssessments: { take: 5, orderBy: { createdAt: "desc" } },
        rehabTasks: { take: 5, orderBy: { createdAt: "desc" } },
        enrollmentRecord: true,
        motorFunctionOutcomes: { take: 5, orderBy: { reviewDate: "desc" } },
      },
    });
    if (!patient)
      throw new gcprError(HttpStatus.NOT_FOUND, "Patient not found");
    return patient;
  }

  // ── System Metrics ────────────────────────────────────────────────────────────

  static async getSystemMetrics() {
    return MetricsService.getSystemMetrics();
  }

  static async getProviderMetricsComparison(query = {}) {
    const { page = 1, limit = 20 } = query;
    const providers = await prisma.serviceProvider.findMany({
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit),
      select: {
        id: true,
        profession: true,
        user: { select: { fullName: true } },
      },
    });

    const snapshots = await Promise.all(
      providers.map(async (sp) => {
        try {
          const snapshot = await MetricsService.computeProviderSnapshot(
            sp.id,
            new Date(),
            "MONTHLY",
          );
          return { provider: sp, metrics: snapshot };
        } catch (e) {
          return { provider: sp, metrics: null };
        }
      }),
    );

    return snapshots;
  }

  // ── Community Moderation ──────────────────────────────────────────────────────

  static async listCommunities(query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { members: true } },
          creator: { select: { id: true, fullName: true } },
        },
      }),
      prisma.community.count(),
    ]);

    return {
      data: communities,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  static async deleteCommunity(communityId) {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });
    if (!community)
      throw new gcprError(HttpStatus.NOT_FOUND, "Community not found");
    await prisma.community.delete({ where: { id: communityId } });
  }

  static async removeCommunityMember(communityId, userId) {
    const member = await prisma.communityMember.findFirst({
      where: { communityId, userId },
    });
    if (!member)
      throw new gcprError(
        HttpStatus.NOT_FOUND,
        "Member not found in community",
      );
    await prisma.communityMember.delete({ where: { id: member.id } });
  }

  // ── Assessment Tools ──────────────────────────────────────────────────────────

  static async listAssessmentTools(query = {}) {
    const { page = 1, limit = 20 } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [tools, total] = await Promise.all([
      prisma.assessmentTool.findMany({
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: { professions: true },
      }),
      prisma.assessmentTool.count(),
    ]);

    return {
      data: tools,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  static async createAssessmentTool(data) {
    const existing = await prisma.assessmentTool.findUnique({
      where: { toolCode: data.toolCode },
    });
    if (existing)
      throw new gcprError(HttpStatus.CONFLICT, "Tool code already exists");

    const tool = await prisma.assessmentTool.create({
      data: {
        toolCode: data.toolCode,
        toolName: data.toolName,
        version: data.version || "1.0",
        description: data.description || null,
        schema: data.schema || null,
        isActive: true,
        ...(data.professions &&
          data.professions.length > 0 && {
            professions: {
              create: data.professions.map((profession) => ({ profession })),
            },
          }),
      },
      include: { professions: true },
    });

    return tool;
  }

  static async updateAssessmentTool(toolId, data) {
    const tool = await prisma.assessmentTool.findUnique({
      where: { id: toolId },
    });
    if (!tool)
      throw new gcprError(HttpStatus.NOT_FOUND, "Assessment tool not found");

    const updateData = {};
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.schema !== undefined) updateData.schema = data.schema;

    return prisma.assessmentTool.update({
      where: { id: toolId },
      data: updateData,
      include: { professions: true },
    });
  }
}

export default AdminService;

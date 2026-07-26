import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";

export default class RbacService {
  // ─── Roles ────────────────────────────────────────────────────────────────

  static async listRoles({ lite = false } = {}) {
    if (lite) {
      return prisma.appRole.findMany({
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
        },
        orderBy: { name: "asc" },
      });
    }

    return prisma.appRole.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: { select: { id: true, code: true, name: true } }
          }
        }
      },
      orderBy: { name: "asc" }
    }).then(roles =>
      roles.map(r => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        description: r.description,
        permissions: r.rolePermissions.map(rp => rp.permission)
      }))
    );
  }

  static async createRole(data) {
    const exists = await prisma.appRole.findUnique({ where: { slug: data.slug } });
    if (exists) {
      throw new gcprError(HttpStatus.CONFLICT, "A role with this slug already exists");
    }
    return prisma.appRole.create({
      data: { slug: data.slug, name: data.name, description: data.description ?? null }
    });
  }

  static async getRole(roleId) {
    const role = await prisma.appRole.findUnique({
      where: { id: roleId },
      include: {
        rolePermissions: {
          include: {
            permission: { select: { id: true, code: true, name: true, description: true } }
          }
        }
      }
    });
    if (!role) throw new gcprError(HttpStatus.NOT_FOUND, "Role not found");
    return {
      id: role.id,
      slug: role.slug,
      name: role.name,
      description: role.description,
      permissions: role.rolePermissions.map(rp => rp.permission)
    };
  }

  static async updateRole(roleId, data) {
    const role = await prisma.appRole.findUnique({ where: { id: roleId } });
    if (!role) throw new gcprError(HttpStatus.NOT_FOUND, "Role not found");
    return prisma.appRole.update({
      where: { id: roleId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description })
      }
    });
  }

  static async deleteRole(roleId) {
    const role = await prisma.appRole.findUnique({ where: { id: roleId } });
    if (!role) throw new gcprError(HttpStatus.NOT_FOUND, "Role not found");
    await prisma.appRole.delete({ where: { id: roleId } });
    return { deleted: true };
  }

  // ─── Permissions ──────────────────────────────────────────────────────────

  static async listPermissions() {
    return prisma.permission.findMany({ orderBy: { code: "asc" } });
  }

  static async createPermission(data) {
    const exists = await prisma.permission.findUnique({ where: { code: data.code } });
    if (exists) {
      throw new gcprError(HttpStatus.CONFLICT, "A permission with this code already exists");
    }
    return prisma.permission.create({
      data: {
        code: data.code,
        name: data.name ?? null,
        description: data.description ?? null
      }
    });
  }

  static async updatePermission(permissionId, data) {
    const perm = await prisma.permission.findUnique({ where: { id: permissionId } });
    if (!perm) throw new gcprError(HttpStatus.NOT_FOUND, "Permission not found");
    return prisma.permission.update({
      where: { id: permissionId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description })
      }
    });
  }

  static async deletePermission(permissionId) {
    const perm = await prisma.permission.findUnique({ where: { id: permissionId } });
    if (!perm) throw new gcprError(HttpStatus.NOT_FOUND, "Permission not found");
    await prisma.permission.delete({ where: { id: permissionId } });
    return { deleted: true };
  }

  // ─── Role ↔ Permission ────────────────────────────────────────────────────

  static async assignPermissionToRole(roleId, permissionId) {
    const [role, perm] = await Promise.all([
      prisma.appRole.findUnique({ where: { id: roleId } }),
      prisma.permission.findUnique({ where: { id: permissionId } })
    ]);
    if (!role) throw new gcprError(HttpStatus.NOT_FOUND, "Role not found");
    if (!perm) throw new gcprError(HttpStatus.NOT_FOUND, "Permission not found");

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId, permissionId } },
      update: {},
      create: { roleId, permissionId }
    });
    return { assigned: true };
  }

  static async removePermissionFromRole(roleId, permissionId) {
    const existing = await prisma.rolePermission.findUnique({
      where: { roleId_permissionId: { roleId, permissionId } }
    });
    if (!existing) throw new gcprError(HttpStatus.NOT_FOUND, "Permission not assigned to this role");
    await prisma.rolePermission.delete({
      where: { roleId_permissionId: { roleId, permissionId } }
    });
    return { removed: true };
  }

  static async setRolePermissions(roleId, permissionIds) {
    const role = await prisma.appRole.findUnique({ where: { id: roleId } });
    if (!role) throw new gcprError(HttpStatus.NOT_FOUND, "Role not found");

    await prisma.$transaction(async tx => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (permissionIds && permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map(permissionId => ({ roleId, permissionId })),
          skipDuplicates: true
        });
      }
    });

    return RbacService.getRole(roleId);
  }

  // ─── User Roles ───────────────────────────────────────────────────────────

  static async getUserRoles(userId) {
    return prisma.userRole.findMany({
      where: { userId, active: true },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: { select: { id: true, code: true, name: true } } }
            }
          }
        }
      }
    });
  }

  /**
   * Get roles for multiple users in a single lightweight query. Returns an
   * object mapping userId -> array of assignment records used by admin screens.
   */
  static async getUsersRoles(userIds = []) {
    if (!Array.isArray(userIds) || userIds.length === 0) return {};
    const userRoles = await prisma.userRole.findMany({
      where: { userId: { in: userIds }, active: true },
      select: {
        id: true,
        userId: true,
        roleId: true,
        scopeType: true,
        scopeId: true,
        grantedAt: true,
        expiresAt: true,
        active: true,
        role: {
          select: {
            id: true,
            slug: true,
            name: true,
          },
        }
      },
      orderBy: { grantedAt: "desc" },
    });

    const map = {};
    for (const ur of userRoles) {
      map[ur.userId] = map[ur.userId] || [];
      map[ur.userId].push(ur);
    }
    return map;
  }

  static async assignRoleToUser(userId, data) {
    const [user, role] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.appRole.findUnique({ where: { id: data.roleId } })
    ]);
    if (!user) throw new gcprError(HttpStatus.NOT_FOUND, "User not found");
    if (!role) throw new gcprError(HttpStatus.NOT_FOUND, "Role not found");

    if (user.userType === "CAREGIVER") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "RBAC roles cannot be assigned to caregivers. Only SERVICE_PROVIDER users and staff may receive operational roles."
      );
    }

    return prisma.userRole.upsert({
      where: {
        userId_roleId_scopeType_scopeId: {
          userId,
          roleId: data.roleId,
          scopeType: data.scopeType ?? "GLOBAL",
          scopeId: data.scopeId ?? null
        }
      },
      update: {
        active: true,
        expiresAt: data.expiresAt ?? null
      },
      create: {
        userId,
        roleId: data.roleId,
        scopeType: data.scopeType ?? "GLOBAL",
        scopeId: data.scopeId ?? null,
        expiresAt: data.expiresAt ?? null,
        active: true
      }
    });
  }

  static async revokeRoleFromUser(userId, roleId) {
    const userRole = await prisma.userRole.findFirst({
      where: { userId, roleId, active: true }
    });
    if (!userRole) throw new gcprError(HttpStatus.NOT_FOUND, "Role assignment not found");
    await prisma.userRole.update({
      where: { id: userRole.id },
      data: { active: false }
    });
    return { revoked: true };
  }

  // ─── User Permissions ─────────────────────────────────────────────────────

  static async getUserEffectivePermissions(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new gcprError(HttpStatus.NOT_FOUND, "User not found");

    const [directPerms, userRoles] = await Promise.all([
      prisma.userPermission.findMany({
        where: { userId },
        include: { permission: { select: { id: true, code: true, name: true } } }
      }),
      prisma.userRole.findMany({
        where: { userId, active: true },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: { permission: { select: { id: true, code: true, name: true } } }
              }
            }
          }
        }
      })
    ]);

    const effectiveMap = new Map();

    // Add role-based permissions first
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        const p = rp.permission;
        if (!effectiveMap.has(p.code)) {
          effectiveMap.set(p.code, { ...p, source: "role", roleSlug: ur.role.slug, allowed: true });
        }
      }
    }

    // Apply direct overrides (denies take priority)
    for (const dp of directPerms) {
      const p = dp.permission;
      effectiveMap.set(p.code, { ...p, source: "direct", allowed: dp.allowed });
    }

    return {
      userId,
      permissions: Array.from(effectiveMap.values())
    };
  }

  static async grantUserPermission(userId, data) {
    const [user, perm] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.permission.findUnique({ where: { id: data.permissionId } })
    ]);
    if (!user) throw new gcprError(HttpStatus.NOT_FOUND, "User not found");
    if (!perm) throw new gcprError(HttpStatus.NOT_FOUND, "Permission not found");

    if (user.userType === "CAREGIVER") {
      throw new gcprError(
        HttpStatus.FORBIDDEN,
        "Permissions cannot be granted directly to caregivers. Only SERVICE_PROVIDER users and staff may receive permission overrides."
      );
    }

    return prisma.userPermission.upsert({
      where: {
        userId_permissionId_scopeType_scopeId: {
          userId,
          permissionId: data.permissionId,
          scopeType: data.scopeType ?? "GLOBAL",
          scopeId: data.scopeId ?? null
        }
      },
      update: { allowed: data.allowed },
      create: {
        userId,
        permissionId: data.permissionId,
        allowed: data.allowed,
        scopeType: data.scopeType ?? "GLOBAL",
        scopeId: data.scopeId ?? null
      }
    });
  }

  static async removeUserPermission(userId, permissionId) {
    const record = await prisma.userPermission.findFirst({
      where: { userId, permissionId }
    });
    if (!record) throw new gcprError(HttpStatus.NOT_FOUND, "Permission override not found");
    await prisma.userPermission.delete({ where: { id: record.id } });
    return { removed: true };
  }

  // ─── Permission Check ─────────────────────────────────────────────────────

  static async checkPermission(userId, permissionCode) {
    const perm = await prisma.permission.findUnique({ where: { code: permissionCode } });
    if (!perm) return { allowed: false };

    // Denies take priority — check for an explicit deny first
    const deny = await prisma.userPermission.findFirst({
      where: { userId, permissionId: perm.id, allowed: false }
    });
    if (deny) return { allowed: false };

    // Check explicit grant
    const grant = await prisma.userPermission.findFirst({
      where: { userId, permissionId: perm.id, allowed: true }
    });
    if (grant) return { allowed: true };

    // Check via roles
    const rolePermission = await prisma.rolePermission.findFirst({
      where: {
        permissionId: perm.id,
        role: {
          userRoles: { some: { userId, active: true } }
        }
      }
    });

    return { allowed: !!rolePermission };
  }
}

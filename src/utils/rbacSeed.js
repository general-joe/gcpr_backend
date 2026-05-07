/**
 * RBAC Seed Utility
 *
 * Seeds the default AppRoles and Permissions into the database.
 * Run once during initial setup or call via POST /admin/rbac/seed (ADMIN only).
 *
 * Default Roles
 * ─────────────
 * ADMIN               – Full platform control
 * IT_SUPPORT          – Technical troubleshooting
 * SUPPORT_AGENT       – Ticket / customer support
 * EMERGENCY_RESPONSE  – Urgent intervention workflows
 * CLINICAL_REVIEWER   – Reviews assessments and referrals
 * COMMUNITY_MODERATOR – Community moderation
 * CONTENT_MANAGER     – FAQ / resources management
 * PROVIDER_VERIFIER   – License verification
 * ANALYTICS_MANAGER   – Metrics oversight
 * TELEHEALTH_COORDINATOR – Manage telehealth operations
 */

import prisma from "../config/database.js";

const DEFAULT_ROLES = [
  { slug: "ADMIN",                  name: "Administrator",            description: "Full platform control" },
  { slug: "IT_SUPPORT",             name: "IT Support",               description: "Technical troubleshooting" },
  { slug: "SUPPORT_AGENT",          name: "Support Agent",            description: "Ticket and customer support" },
  { slug: "EMERGENCY_RESPONSE",     name: "Emergency Response",       description: "Urgent intervention workflows" },
  { slug: "CLINICAL_REVIEWER",      name: "Clinical Reviewer",        description: "Reviews clinical assessments and referrals" },
  { slug: "COMMUNITY_MODERATOR",    name: "Community Moderator",      description: "Moderates community content and members" },
  { slug: "CONTENT_MANAGER",        name: "Content Manager",          description: "Manages FAQ and resource content" },
  { slug: "PROVIDER_VERIFIER",      name: "Provider Verifier",        description: "Verifies provider licenses" },
  { slug: "ANALYTICS_MANAGER",      name: "Analytics Manager",        description: "Metrics and analytics oversight" },
  { slug: "TELEHEALTH_COORDINATOR", name: "Telehealth Coordinator",   description: "Manages telehealth operations" },
];

const DEFAULT_PERMISSIONS = [
  // User management
  { code: "users.list",         name: "List Users",            description: "View all users" },
  { code: "users.read",         name: "Read User",             description: "View a user's details" },
  { code: "users.update",       name: "Update User",           description: "Update user account status" },
  { code: "users.delete",       name: "Delete User",           description: "Delete a user account" },

  // Provider management
  { code: "provider.list",      name: "List Providers",        description: "View all service providers" },
  { code: "provider.read",      name: "Read Provider",         description: "View provider details" },
  { code: "provider.verify",    name: "Verify Provider",       description: "Verify provider license" },

  // Patient management
  { code: "patient.list",       name: "List Patients",         description: "View all patients" },
  { code: "patient.read",       name: "Read Patient",          description: "View patient details" },

  // Community moderation
  { code: "community.list",     name: "List Communities",      description: "View all communities" },
  { code: "community.delete",   name: "Delete Community",      description: "Remove a community" },
  { code: "community.member.remove", name: "Remove Community Member", description: "Remove a member from a community" },

  // Content management
  { code: "faq.manage",         name: "Manage FAQs",           description: "Create, update, delete FAQs" },
  { code: "content.manage",     name: "Manage Content",        description: "Manage platform resources and content" },

  // Support
  { code: "support.list",       name: "List Support Tickets",  description: "View all support tickets" },
  { code: "support.manage",     name: "Manage Support Tickets", description: "Update and respond to support tickets" },

  // Reports
  { code: "report.list",        name: "List Reports",          description: "View all reports" },
  { code: "report.manage",      name: "Manage Reports",        description: "Update report status" },

  // Metrics
  { code: "metrics.system",     name: "View System Metrics",   description: "Access system-wide metrics" },
  { code: "metrics.providers",  name: "View Provider Metrics", description: "Access provider comparison metrics" },

  // Assessment tools
  { code: "assessment.tool.manage", name: "Manage Assessment Tools", description: "Create and configure assessment tools" },

  // Telehealth
  { code: "telehealth.manage",  name: "Manage Telehealth",     description: "Full telehealth administration" },

  // RBAC
  { code: "rbac.manage",        name: "Manage RBAC",           description: "Manage roles and permissions" },
];

// Default role -> permissions mapping
const ADMIN_PERMISSION_CODES = DEFAULT_PERMISSIONS.map(p => p.code);

const ROLE_PERMISSION_MAP = {
  ADMIN:                  ADMIN_PERMISSION_CODES,
  IT_SUPPORT:             ["users.list", "users.read"],
  SUPPORT_AGENT:          ["support.list", "support.manage", "users.read"],
  EMERGENCY_RESPONSE:     ["users.read", "patient.read", "patient.list"],
  CLINICAL_REVIEWER:      ["patient.list", "patient.read", "provider.read"],
  COMMUNITY_MODERATOR:    ["community.list", "community.delete", "community.member.remove"],
  CONTENT_MANAGER:        ["faq.manage", "content.manage"],
  PROVIDER_VERIFIER:      ["provider.list", "provider.read", "provider.verify"],
  ANALYTICS_MANAGER:      ["metrics.system", "metrics.providers"],
  TELEHEALTH_COORDINATOR: ["telehealth.manage"],
};

export async function seedRbac() {
  const results = { roles: 0, permissions: 0, rolePermissions: 0 };

  await prisma.$transaction(async (tx) => {
    // Upsert permissions
    for (const perm of DEFAULT_PERMISSIONS) {
      await tx.permission.upsert({
        where: { code: perm.code },
        update: { name: perm.name, description: perm.description },
        create: perm,
      });
      results.permissions++;
    }

    // Upsert roles
    for (const role of DEFAULT_ROLES) {
      await tx.appRole.upsert({
        where: { slug: role.slug },
        update: { name: role.name, description: role.description },
        create: role,
      });
      results.roles++;
    }
  });

  // Assign permissions to roles (separate transaction per role for clarity)
  for (const [slug, permCodes] of Object.entries(ROLE_PERMISSION_MAP)) {
    const role = await prisma.appRole.findUnique({ where: { slug } });
    if (!role) continue;

    const perms = await prisma.permission.findMany({
      where: { code: { in: permCodes } },
      select: { id: true, code: true },
    });

    await prisma.$transaction(
      perms.map((perm) =>
        prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        })
      )
    );

    results.rolePermissions += perms.length;
  }

  return results;
}

export default seedRbac;

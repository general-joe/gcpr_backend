import prisma from "../config/database.js";

const DEFAULT_ROLES = [
  { slug: "ADMIN",                  name: "Administrator",            description: "Full platform control" },
  { slug: "IT_SUPPORT",             name: "IT Support",               description: "Technical troubleshooting" },
  { slug: "SUPPORT",          name: "Support Agent",            description: "Ticket and customer support" },
];

const DEFAULT_PERMISSIONS = [
    // Appointment management
    { code: "appointment.read", name: "Read Appointments", description: "View all appointments and details" },
    { code: "appointment.write", name: "Manage Appointments", description: "Create, update, or delete appointments" },
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
  SUPPORT:          ["support.list", "support.manage", "users.read"],
 
};


export async function seedRbac({ timeout = 30000 } = {}) {
  const results = { roles: 0, permissions: 0, rolePermissions: 0 };

  // Use the provided timeout for all transactions
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
  }, { timeout });

  // Assign permissions to roles (no transaction, to avoid timeouts)
  for (const [slug, permCodes] of Object.entries(ROLE_PERMISSION_MAP)) {
    const role = await prisma.appRole.findUnique({ where: { slug } });
    if (!role) continue;

    const perms = await prisma.permission.findMany({
      where: { code: { in: permCodes } },
      select: { id: true, code: true },
    });

    for (const perm of perms) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }

    results.rolePermissions += perms.length;
  }

  return results;
}

export default seedRbac;

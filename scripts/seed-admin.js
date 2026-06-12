/**
 * Seed Admin User Script
 *
 * Creates an admin user with ADMIN userType and ADMIN role.
 * Run: node scripts/seed-admin.js
 */

import prisma from "../src/config/database.js";
import { hash } from "../src/utils/password.js";

// Inline RBAC seed without transactions (to avoid transaction timeout issues)
const DEFAULT_ROLES = [
  { slug: "ADMIN",              name: "Administrator",          description: "Full platform control" },
  { slug: "IT_SUPPORT",         name: "IT Support",             description: "Technical troubleshooting" },
  { slug: "SUPPORT",            name: "Support",                description: "Ticket and customer support" },
  { slug: "CLINICAL_REVIEWER",  name: "Clinical Reviewer",      description: "Reviews clinical assessments and referrals" },
  { slug: "PROVIDER",           name: "Provider",               description: "Default access for service providers without an assigned RBAC role" },
];

const DEFAULT_PERMISSIONS = [
  { code: "appointment.read", name: "Read Appointments", description: "View all appointments and details" },
  { code: "appointment.write", name: "Manage Appointments", description: "Create, update, or delete appointments" },
  { code: "users.list",         name: "List Users",            description: "View all users" },
  { code: "users.read",         name: "Read User",             description: "View a user's details" },
  { code: "users.update",       name: "Update User",           description: "Update user account status" },
  { code: "users.delete",       name: "Delete User",           description: "Delete a user account" },
  { code: "provider.list",      name: "List Providers",        description: "View all service providers" },
  { code: "provider.read",      name: "Read Provider",         description: "View provider details" },
  { code: "provider.verify",    name: "Verify Provider",       description: "Verify provider license" },
  { code: "patient.list",       name: "List Patients",         description: "View all patients" },
  { code: "patient.read",       name: "Read Patient",          description: "View patient details" },
  { code: "community.list",     name: "List Communities",      description: "View all communities" },
  { code: "community.delete",   name: "Delete Community",      description: "Remove a community" },
  { code: "community.member.remove", name: "Remove Community Member", description: "Remove a member from a community" },
  { code: "faq.manage",         name: "Manage FAQs",           description: "Create, update, delete FAQs" },
  { code: "content.manage",     name: "Manage Content",        description: "Manage platform resources and content" },
  { code: "support.list",       name: "List Support Tickets",  description: "View all support tickets" },
  { code: "support.manage",     name: "Manage Support Tickets", description: "Update and respond to support tickets" },
  { code: "report.list",        name: "List Reports",          description: "View all reports" },
  { code: "report.manage",      name: "Manage Reports",        description: "Update report status" },
  { code: "metrics.system",     name: "View System Metrics",   description: "Access system-wide metrics" },
  { code: "metrics.providers",  name: "View Provider Metrics", description: "Access provider comparison metrics" },
  { code: "assessment.tool.manage", name: "Manage Assessment Tools", description: "Create and configure assessment tools" },
  { code: "telehealth.manage",  name: "Manage Telehealth",     description: "Full telehealth administration" },
  { code: "rbac.manage",        name: "Manage RBAC",           description: "Manage roles and permissions" },
];

const ADMIN_PERMISSION_CODES = DEFAULT_PERMISSIONS.map(p => p.code);

const ROLE_PERMISSION_MAP = {
  ADMIN:             ADMIN_PERMISSION_CODES,
  IT_SUPPORT:        ["users.list", "users.read", "support.list", "support.manage", "report.list", "report.manage"],
  SUPPORT:           ["users.list", "users.read", "support.list", "support.manage", "report.list", "report.manage", "faq.manage", "content.manage"],
  CLINICAL_REVIEWER: ["patient.list", "patient.read", "provider.list", "provider.read", "appointment.read", "report.list", "report.manage", "assessment.tool.manage"],
  PROVIDER:          ["patient.list", "patient.read", "appointment.read", "appointment.write"],
};

async function seedInline() {
  let results = { roles: 0, permissions: 0, rolePermissions: 0 };

  // Upsert permissions (without transaction)
  for (const perm of DEFAULT_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, description: perm.description },
      create: perm,
    });
    results.permissions++;
  }

  // Upsert roles (without transaction)
  for (const role of DEFAULT_ROLES) {
    await prisma.appRole.upsert({
      where: { slug: role.slug },
      update: { name: role.name, description: role.description },
      create: role,
    });
    results.roles++;
  }

  // Assign permissions to roles
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

async function seedAdmin() {
  const email = "oklement3@gmail.com";
  const password = "Pass123$1";

  console.log("=== Seeding Admin User ===\n");

  // 1. Seed RBAC roles/permissions (idempotent) - no transaction
  console.log("Seeding RBAC roles and permissions...");
  const seedResult = await seedInline();
  console.log(`  Roles upserted: ${seedResult.roles}`);
  console.log(`  Permissions upserted: ${seedResult.permissions}`);
  console.log(`  Role-permissions linked: ${seedResult.rolePermissions}\n`);

  // 2. Hash password
  console.log("Hashing password...");
  const hashedPassword = await hash(password);
  console.log("  Password hashed successfully.\n");

  // 3. Check if user already exists
  console.log(`Checking if user ${email} already exists...`);
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { userRoles: true },
  });

  if (existingUser) {
    console.log("  User already exists, ensuring ADMIN role is assigned...\n");

    const adminRole = await prisma.appRole.findUnique({
      where: { slug: "ADMIN" },
    });

    if (adminRole) {
      const hasAdminRole = existingUser.userRoles.some(
        (ur) => ur.roleId === adminRole.id && ur.active
      );

      if (!hasAdminRole) {
        await prisma.userRole.create({
          data: {
            userId: existingUser.id,
            roleId: adminRole.id,
            scopeType: "GLOBAL",
            active: true,
          },
        });
        console.log("  ADMIN role assigned to existing user.\n");
      } else {
        console.log("  ADMIN role already assigned.\n");
      }
    }

    console.log("=== Done ===");
    console.log(`Email: ${email}`);
    console.log(`User ID: ${existingUser.id}`);
    return;
  }

  // 4. Create the admin user
  console.log("Creating admin user...");
  const user = await prisma.user.create({
    data: {
      fullName: "Admin User",
      email: email,
      password: hashedPassword,
      phoneNumber: "+233000000000",
      gender: "MALE",
      dateOfBirth: new Date("1990-01-01"),
      userType: "ADMIN",
      verified: true,
      profileCompleted: true,
      accountStatus: "ACTIVE",
    },
  });

  console.log(`  User created with ID: ${user.id}\n`);

  // 5. Assign ADMIN role
  console.log("Assigning ADMIN role...");
  const adminRole = await prisma.appRole.findUnique({
    where: { slug: "ADMIN" },
  });

  if (adminRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
        scopeType: "GLOBAL",
        active: true,
      },
    });
    console.log("  ADMIN role assigned successfully.\n");
  } else {
    console.log("  WARNING: ADMIN role not found in DB. Skipping role assignment.\n");
  }

  console.log("=== Admin User Created Successfully ===");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`User ID: ${user.id}`);
  console.log(`User Type: ADMIN`);
  console.log(`Role: ADMIN\n`);

  await prisma.$disconnect();
}

seedAdmin().catch((err) => {
  console.error("Failed to seed admin user:", err);
  process.exit(1);
});
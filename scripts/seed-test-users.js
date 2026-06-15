/**
 * Seed Test Users for E2E Testing
 *
 * Creates test provider and caregiver users directly in the database
 * Bypasses OTP verification for testing purposes
 */

import prisma from "../src/config/database.js";
import { hash } from "../src/utils/password.js";

const TEST_PASSWORD = 'Test@123Password';

async function seedTestUsers() {
  console.log('\n=== Seeding Test Users for E2E ===\n');

  // Ensure RBAC roles exist
  console.log('Ensuring RBAC roles exist...');
  await prisma.appRole.upsert({
    where: { slug: 'PROVIDER' },
    update: {},
    create: {
      slug: 'PROVIDER',
      name: 'Provider',
      description: 'Default access for service providers',
    },
  });

  // Create Physiotherapist Provider
  console.log('Creating Physiotherapist Provider...');
  const physioEmail = 'physio@test.gcpr';
  const physioPhone = '+2332000000001';
  
  const physioUser = await prisma.user.upsert({
    where: { email: physioEmail },
    update: {},
    create: {
      email: physioEmail,
      fullName: 'Dr. Test Physiotherapist',
      phoneNumber: physioPhone,
      password: await hash(TEST_PASSWORD),
      gender: 'MALE',
      dateOfBirth: new Date('1988-06-20'),
      userType: 'SERVICE_PROVIDER',
      verified: true,
      profileCompleted: true,
      accountStatus: 'ACTIVE',
    },
  });

  console.log(`  Created user: ${physioUser.id} (${physioEmail})`);

  // Create Service Provider record for Physio
  const physioProvider = await prisma.serviceProvider.upsert({
    where: { userId: physioUser.id },
    update: {},
    create: {
      userId: physioUser.id,
      profession: 'PHYSIOTHERAPIST',
      licenseNumber: `LIC-PHYSIO-${Date.now()}`,
      licenseStatus: 'ACTIVE',
      licenseIssuedDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      yearsOfExperience: 8,
      specializations: ['Paediatric Physiotherapy', 'Neurodevelopmental Therapy'],
      bio: 'Experienced paediatric physiotherapist specializing in CP care.',
      availableForTelehealth: true,
      verificationStatus: 'VERIFIED',
    },
  });

  console.log(`  Created service provider: ${physioProvider.id}`);

  // Assign PROVIDER role
  const providerRole = await prisma.appRole.findUnique({
    where: { slug: 'PROVIDER' },
  });

  if (providerRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId_scopeType_scopeId: {
          userId: physioUser.id,
          roleId: providerRole.id,
          scopeType: 'GLOBAL',
          scopeId: null,
        },
      },
      update: { active: true },
      create: {
        userId: physioUser.id,
        roleId: providerRole.id,
        scopeType: 'GLOBAL',
        active: true,
      },
    });
    console.log(`  Assigned PROVIDER role`);
  }

  // Create OT Provider
  console.log('Creating OT Provider...');
  const otEmail = 'ot@test.gcpr';
  const otPhone = '+2332000000002';

  const otUser = await prisma.user.upsert({
    where: { email: otEmail },
    update: {},
    create: {
      email: otEmail,
      fullName: 'Dr. OT Specialist',
      phoneNumber: otPhone,
      password: await hash(TEST_PASSWORD),
      gender: 'FEMALE',
      dateOfBirth: new Date('1990-03-10'),
      userType: 'SERVICE_PROVIDER',
      verified: true,
      profileCompleted: true,
      accountStatus: 'ACTIVE',
    },
  });

  console.log(`  Created user: ${otUser.id} (${otEmail})`);

  const otProvider = await prisma.serviceProvider.upsert({
    where: { userId: otUser.id },
    update: {},
    create: {
      userId: otUser.id,
      profession: 'OCCUPATIONAL_THERAPIST',
      licenseNumber: `OT-LIC-${Date.now()}`,
      licenseStatus: 'ACTIVE',
      licenseIssuedDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      yearsOfExperience: 5,
      specializations: ['Paediatric OT', 'Sensory Integration'],
      availableForTelehealth: true,
      verificationStatus: 'VERIFIED',
    },
  });

  console.log(`  Created service provider: ${otProvider.id}`);

  if (providerRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId_scopeType_scopeId: {
          userId: otUser.id,
          roleId: providerRole.id,
          scopeType: 'GLOBAL',
          scopeId: null,
        },
      },
      update: { active: true },
      create: {
        userId: otUser.id,
        roleId: providerRole.id,
        scopeType: 'GLOBAL',
        active: true,
      },
    });
    console.log(`  Assigned PROVIDER role`);
  }

  console.log('\n=== Test Users Seeded Successfully ===\n');
  console.log('Credentials:');
  console.log(`  Physio: ${physioEmail} / ${TEST_PASSWORD}`);
  console.log(`  OT: ${otEmail} / ${TEST_PASSWORD}`);
  console.log('');
}

seedTestUsers()
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

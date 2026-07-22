import test from "node:test";
import assert from "node:assert/strict";

import prisma from "../../src/config/database.js";

test("integration database is migrated and reachable", async () => {
  assert.ok(process.env.DATABASE_URL_TEST, "DATABASE_URL_TEST must be set");
  assert.notEqual(
    process.env.DATABASE_URL_TEST,
    process.env.DATABASE_URL_PRODUCTION,
    "DATABASE_URL_TEST must not point at production",
  );

  const result = await prisma.$queryRaw`SELECT 1::int AS ok`;
  assert.equal(result[0].ok, 1);
});

test("core Prisma tables exist after migration reset", async () => {
  const tables = await prisma.$queryRaw`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('user', 'cpPatient', 'ClinicalAssessment')
    ORDER BY table_name
  `;

  assert.deepEqual(
    tables.map((row) => row.table_name),
    ["ClinicalAssessment", "cpPatient", "user"],
  );
});

test.after(async () => {
  await prisma.$disconnect();
});

#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const databaseUrlTest = process.env.DATABASE_URL_TEST;

if (!databaseUrlTest) {
  console.error("DATABASE_URL_TEST is required for integration tests.");
  process.exit(1);
}

if (databaseUrlTest === process.env.DATABASE_URL) {
  console.error("DATABASE_URL_TEST must not equal DATABASE_URL.");
  process.exit(1);
}

const run = (command, args, env = {}) => {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: {
      ...process.env,
      ...env,
      NODE_ENV: "test",
      DATABASE_URL: databaseUrlTest,
    },
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

const integrationTestDir = join(process.cwd(), "tests", "integration");
const integrationTestFiles = readdirSync(integrationTestDir)
  .filter((fileName) => fileName.endsWith(".test.js"))
  .map((fileName) => join(integrationTestDir, fileName));

if (integrationTestFiles.length === 0) {
  console.error("No integration tests found in tests/integration.");
  process.exit(1);
}

run("npx", ["prisma", "migrate", "reset", "--force", "--skip-seed"]);
run("node", ["--test", ...integrationTestFiles]);

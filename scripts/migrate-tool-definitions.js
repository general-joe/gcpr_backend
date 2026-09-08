/**
 * One-time migration of the 7 legacy hardcoded tool configs into the
 * configurable definition tables (Group 5). Idempotent — skips codes that
 * already exist. The runtime also self-seeds on first use via
 * ToolDefinitionService.ensureToolsMigrated(), so this script is for
 * explicit pre-deployment migration and verification.
 *
 * Usage: node scripts/migrate-tool-definitions.js
 */
import ToolDefinitionService from "../src/modules/assessment/definitions/toolDefinition.service.js";

try {
  const result = await ToolDefinitionService.ensureToolsMigrated();
  const tools = await ToolDefinitionService.listDefinitions();
  console.log(
    result.migrated ? "Migration ran." : "Already migrated; nothing to do.",
    `Definitions present: ${tools.length}`,
  );
  for (const tool of tools) {
    console.log(` - ${tool.code} v${tool.currentVersion} [${tool.status}]`);
  }
  process.exit(0);
} catch (error) {
  console.error("Tool migration failed:", error.message);
  process.exit(1);
}

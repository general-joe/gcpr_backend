/**
 * Minimal secret scanner (Group 8) — blocks the historic leak class:
 * real credentials baked into source, plus common key patterns.
 *
 * Scans tracked, non-test text files. Exits non-zero with the offending
 * file/line when a pattern hits. Run: npm run secret:scan
 * (also wired into CI and the sample pre-commit hook).
 *
 * This is a backstop, not a replacement for rotation/review: any hit must
 * be treated as compromised (rotate outside the PR) per Group 8.
 */
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SELF = "scripts/secret-scan.js";
const PATTERNS = [
  // Historic leak signatures: only meaningful in shipped code, not in the
  // scanner itself or the regression test that asserts their absence.
  { name: "previously-leaked admin email", re: /oklement3@gmail\.com/, skip: ["tests/", SELF] },
  { name: "previously-leaked password", re: /Pass123\$1/, skip: ["tests/", SELF] },
  { name: "hardcoded seed password", re: /const\s+password\s*=\s*["'][^"']+["']/ },
  { name: "AWS access key", re: /AKIA[0-9A-Z]{16}/ },
  { name: "Google API key", re: /AIza[0-9A-Za-z_-]{35}/ },
  { name: "SendGrid key", re: /SG\.[0-9A-Za-z_-]{20,}/ },
  // The leading boundary avoids matching snake_case SQL identifiers such
  // as Signature_relatedModel_relatedId_idx (there "re_" follows a word char).
  { name: "Resend key", re: /(^|[^A-Za-z0-9_])re_[0-9A-Za-z_]{20,}/ },
  // Both markers on one line (env-style single-line keys); doc placeholders
  // that show only a BEGIN stub do not match.
  { name: "private key block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----.*-----END [A-Z ]*PRIVATE KEY-----/ },
];

const SKIP_DIRS = ["node_modules/", ".git/", "logs/"];
const SKIP_FILES = new Set(["package.json", "pnpm-lock.yaml"]);

function trackedFiles() {
  const out = execSync("git ls-files", { encoding: "utf8" });
  return out
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean)
    .filter((f) => !SKIP_DIRS.some((d) => f.startsWith(d)))
    .filter((f) => !SKIP_FILES.has(f.split("/").pop()));
}

let hits = 0;
for (const file of trackedFiles()) {
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue; // binary/unreadable — out of scope for this scanner
  }
  content.split("\n").forEach((line, index) => {
    for (const { name, re, skip = [] } of PATTERNS) {
      if (skip.some((s) => file === s || file.startsWith(s))) continue;
      if (re.test(line)) {
        console.error(`SECRET-SCAN HIT [${name}] ${file}:${index + 1}`);
        hits += 1;
      }
    }
  });
}

if (hits > 0) {
  console.error(`\nsecret:scan failed with ${hits} hit(s). Treat any real value as compromised and rotate it.`);
  process.exit(1);
}
console.log("secret:scan clean.");

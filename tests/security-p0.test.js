import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import GoogleService from "../src/modules/auth/google.service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readSrc = (rel) => readFileSync(path.join(__dirname, "..", rel), "utf8");

// Group 2 — Security P0s. Each test fails on current code, passes after fix.
describe("Group 2 — Security P0s", () => {
  it("logs/query caps rows and audit-logs admin identity + query", () => {
    const src = readSrc("src/modules/admin/logs.controller.js");
    assert.match(src, /MAX_QUERY_ROWS|MAX_ROWS|ROW_LIMIT/, "no row cap constant");
    assert.match(src, /slice\(0,\s*MAX/, "result not truncated to cap");
    assert.match(src, /WRITE\.(info|warn).*adminId|adminId.*WRITE\.(info|warn)/s, "no admin-identity audit log");
  });

  it("HTTP-triggered migrations are gated off by default (not an open admin route)", () => {
    const src = readSrc("src/modules/admin/logs.controller.js");
    assert.match(src, /ALLOW_HTTP_MIGRATIONS/, "migrate endpoint not env-gated");
  });

  it("profiles/audio file routes check ownership like licenses", () => {
    const src = readSrc("src/modules/files/files.route.js");
    const profilesBlock = src.slice(src.indexOf('"/profiles/:fileName"'), src.indexOf('"/audio"', src.indexOf('"/profiles/:fileName"')));
    const audioGetBlock = src.slice(src.indexOf('"/audio/:fileName"'), src.indexOf('"/licenses/:fileName"'));
    assert.match(profilesBlock, /res\.locals\.user|requesterId/, "profiles GET has no ownership check");
    assert.match(audioGetBlock, /res\.locals\.user|requesterId/, "audio GET has no ownership check");
  });

  it("Google OAuth generateAuthUrl supports state + PKCE", () => {
    // URL generation needs no real Google project: stub the three env vars
    // so this passes identically in CI (no .env) and locally.
    const saved = {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    };
    process.env.GOOGLE_CLIENT_ID ??= "test-client-id";
    process.env.GOOGLE_CLIENT_SECRET ??= "test-client-secret";
    process.env.GOOGLE_REDIRECT_URI ??= "http://localhost:3001/auth/google/callback";
    try {
      const url = GoogleService.generateAuthUrl({ state: "test-state-123" });
      assert.match(url, /[?&]state=test-state-123/, "state not in auth URL");
    } finally {
      for (const [key, value] of Object.entries(saved)) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
    const src = readSrc("src/modules/auth/google.service.js");
    assert.match(src, /code_challenge|codeVerifier/, "no PKCE support");
    assert.match(src, /state/, "no state handling in service");
  });

  it("tv revocation fails closed on DB error and Google JWTs carry tv", () => {
    const authSrc = readSrc("src/middlewares/auth.js");
    const tvFn = authSrc.slice(authSrc.indexOf("async function validateTokenVersion"), authSrc.indexOf("so that") !== -1 ? authSrc.indexOf("// for open routes") : authSrc.indexOf("// for open routes"));
    assert.doesNotMatch(tvFn, /fail-open|return true;\s*\n\s*\}\s*$/, "fail-open still present");
    const googleSrc = readSrc("src/modules/auth/google.service.js");
    assert.match(googleSrc, /tokenVersion/, "Google login does not carry tokenVersion");
  });
});

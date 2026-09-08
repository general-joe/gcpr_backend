import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import SyncService, {
  isIdempotencyRecordUsable,
  detectAdherenceConflict,
  isLogDateAcceptable,
} from "../src/modules/sync/sync.service.js";
import { syncPushSchema } from "../src/modules/sync/sync.validator.js";
import prisma from "../src/config/database.js";

// Group 9 — Offline sync reconciliation. Pure-rule unit tests plus
// integration tests of SyncService.push() against an in-memory fake DB
// (prisma models stubbed; no network). Scenarios: ordering, partial-batch
// retry, two-device conflict, TTL-boundary replay, future logDate, and
// referral/care-plan non-eligibility.
describe("Group 9 — Sync reconciliation rules (pure)", () => {
  it("expired idempotency records are unusable (TTL boundary is enforced)", () => {
    const past = new Date(Date.now() - 1000);
    const future = new Date(Date.now() + 1000);
    assert.equal(isIdempotencyRecordUsable(null), false);
    assert.equal(isIdempotencyRecordUsable({ expiresAt: past }), false);
    assert.equal(isIdempotencyRecordUsable({ expiresAt: future }), true);
  });

  it("conflicting offline writes are flagged, not silently merged", () => {
    assert.deepEqual(detectAdherenceConflict(null, "COMPLETED"), { conflicted: false });
    assert.deepEqual(detectAdherenceConflict({ status: "COMPLETED" }, "COMPLETED"), { conflicted: false });
    const flagged = detectAdherenceConflict({ status: "COMPLETED" }, "MISSED");
    assert.equal(flagged.conflicted, true);
    assert.ok(flagged.reason);
  });

  it("future logDates are rejected (client clock skew cannot win)", () => {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 5);
    assert.equal(isLogDateAcceptable("2024-01-01"), true);
    assert.equal(isLogDateAcceptable(tomorrow.toISOString()), false);
    assert.equal(isLogDateAcceptable("not-a-date"), false);
  });

  it("referral and care-plan transitions are not sync-eligible", () => {
    for (const type of ["referral_status", "care_plan", "assessment_submit"]) {
      assert.throws(() =>
        syncPushSchema.parse({ operations: [{ clientId: "x", type, data: {} }] }),
      );
    }
  });
});

describe("Group 9 — Sync push integration (fake DB)", () => {
  const user = { id: "user-1" };
  let logs;
  let history;
  let idempotency;
  let tasks;
  const originals = {};

  beforeEach(() => {
    logs = new Map();
    history = [];
    idempotency = new Map();
    tasks = new Map([["task-1", { id: "task-1", patientId: "p1", providerId: "sp1" }]]);
    for (const model of ["taskAdherenceLog", "taskAdherenceLogHistory", "telehealthIdempotencyKey", "rehabTask"]) {
      originals[model] = prisma[model];
    }
    prisma.rehabTask = {
      findUnique: async ({ where }) => tasks.get(where.id) ?? null,
    };
    prisma.taskAdherenceLog = {
      findUnique: async ({ where }) => logs.get(`${where.taskId_logDate.taskId}|${where.taskId_logDate.logDate.toISOString()}`) ?? null,
      upsert: async ({ where, create, update }) => {
        const key = `${where.taskId_logDate.taskId}|${where.taskId_logDate.logDate.toISOString()}`;
        const prior = logs.get(key);
        const next = { ...(prior ?? create), ...update, id: prior?.id ?? `log-${logs.size + 1}` };
        logs.set(key, next);
        return next;
      },
    };
    prisma.taskAdherenceLogHistory = {
      create: async ({ data }) => {
        history.push(data);
        return data;
      },
    };
    prisma.telehealthIdempotencyKey = {
      findUnique: async ({ where }) => idempotency.get(`${where.key_scope.scope}|${where.key_scope.key}`) ?? null,
      upsert: async ({ where, create, update }) => {
        const key = `${where.key_scope.scope}|${where.key_scope.key}`;
        const next = { ...(idempotency.get(key) ?? create), ...update };
        idempotency.set(key, next);
        return next;
      },
      delete: async ({ where }) => {
        idempotency.delete(`${where.key_scope.scope}|${where.key_scope.key}`);
      },
      deleteMany: async () => ({ count: 0 }),
    };
  });

  const op = (clientId, data) => ({ clientId, type: "adherence_log", data });

  it("processes a batch in client order with per-op results (partial failure)", async () => {
    const batch = [
      op("c1", { taskId: "task-1", logDate: "2024-05-01", status: "COMPLETED" }),
      op("c2", { taskId: "missing-task", logDate: "2024-05-01", status: "COMPLETED" }),
      op("c3", { taskId: "task-1", logDate: "2024-05-02", status: "COMPLETED" }),
    ];
    const result = await SyncService.push(user, batch);
    assert.equal(result.total, 3);
    assert.equal(result.succeeded, 2);
    assert.equal(result.failed, 1);
    assert.deepEqual(result.results.map((r) => r.success), [true, false, true]);
    assert.equal(result.results[1].statusCode, 404);
  });

  it("retry resubmits only the failed op (successes dedupe, failure recovers)", async () => {
    const batch = [
      op("c1", { taskId: "task-1", logDate: "2024-05-01", status: "COMPLETED" }),
      op("c2", { taskId: "missing-task", logDate: "2024-05-01", status: "COMPLETED" }),
    ];
    await SyncService.push(user, batch);
    tasks.set("missing-task", { id: "missing-task", patientId: "p1", providerId: "sp1" });
    const retry = await SyncService.push(user, batch);
    assert.equal(retry.results[0].duplicate, true);
    assert.equal(retry.results[1].success, true);
    assert.equal(retry.results[1].duplicate, false);
  });

  it("two-device same-day conflict keeps both attempts in history and flags the loser", async () => {
    const first = await SyncService.push({ id: "device-1-user" }, [
      { clientId: "d1", type: "adherence_log", data: { taskId: "task-1", logDate: "2024-05-01", status: "COMPLETED" } },
    ]);
    assert.equal(first.results[0].result.conflicted ?? false, false);
    const second = await SyncService.push({ id: "device-2-user" }, [
      { clientId: "d2", type: "adherence_log", data: { taskId: "task-1", logDate: "2024-05-01", status: "MISSED" } },
    ]);
    assert.equal(second.results[0].result.conflicted, true);
    const dayHistory = history.filter((h) => h.taskId === "task-1");
    assert.equal(dayHistory.length, 2);
    assert.deepEqual(
      dayHistory.map((h) => h.changedById).sort(),
      ["device-1-user", "device-2-user"],
    );
  });

  it("replay after TTL expiry re-executes instead of returning the stale result", async () => {
    const batch = [op("c1", { taskId: "task-1", logDate: "2024-05-01", status: "COMPLETED" })];
    const first = await SyncService.push(user, batch);
    assert.equal(first.results[0].duplicate, false);
    const second = await SyncService.push(user, batch);
    assert.equal(second.results[0].duplicate, true);
    // Age the idempotency record past its TTL, then replay the same key.
    const record = idempotency.get("sync:user-1|c1");
    record.expiresAt = new Date(Date.now() - 1000);
    const third = await SyncService.push(user, batch);
    assert.equal(third.results[0].duplicate, false);
    assert.equal(third.results[0].success, true);
  });

  it("future-dated logs are rejected, not stored", async () => {
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 5);
    const result = await SyncService.push(user, [
      op("c1", { taskId: "task-1", logDate: future.toISOString(), status: "COMPLETED" }),
    ]);
    assert.equal(result.results[0].success, false);
    assert.equal(logs.size, 0);
  });
});

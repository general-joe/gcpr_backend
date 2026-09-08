import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import SyncService from "../src/modules/sync/sync.service.js";
import { syncPushSchema, typedDataSchemas } from "../src/modules/sync/sync.validator.js";
import prisma from "../src/config/database.js";

// Offline-everywhere coverage: community messages, caregiver task day-done,
// and appointment requests sync alongside tickets/adherence/DMs. Existing
// op types are untouched (mobile additive-only).
describe("Sync everywhere coverage", () => {
  it("validator accepts the full offline operation set", () => {
    const ops = [
      { clientId: "a", type: "support_ticket", data: {} },
      { clientId: "b", type: "ticket_message", data: {} },
      { clientId: "c", type: "adherence_log", data: {} },
      { clientId: "d", type: "direct_message", data: {} },
      { clientId: "e", type: "community_message", data: {} },
      { clientId: "f", type: "task_day_done", data: {} },
      { clientId: "g", type: "appointment_request", data: {} },
    ];
    const parsed = syncPushSchema.parse({ operations: ops });
    assert.equal(parsed.operations.length, 7);
  });

  it("referral and care-plan transitions stay online-only", () => {
    for (const type of ["referral_status", "care_plan", "assessment_submit"]) {
      assert.throws(() =>
        syncPushSchema.parse({ operations: [{ clientId: "x", type, data: {} }] }),
      );
    }
  });

  it("legacy mobile payloads validate unchanged (no new required fields on old types)", () => {
    const parsed = syncPushSchema.parse({
      operations: [
        { clientId: "a", type: "support_ticket", data: { category: "OTHER", subject: "Help please", description: "Need help with exercises" } },
        { clientId: "b", type: "ticket_message", data: { ticketId: "t1", content: "Thanks" } },
        { clientId: "c", type: "adherence_log", data: { taskId: "t1", logDate: "2024-05-01" } },
        { clientId: "d", type: "direct_message", data: { receiverId: "u2", content: "Hello" } },
      ],
    });
    assert.equal(parsed.operations.length, 4);
    // Envelope passes data through untouched; per-type defaults still apply downstream.
    assert.equal(parsed.operations[2].data.status, undefined);
    assert.equal(typedDataSchemas.adherence_log.parse({ taskId: "t1", logDate: "2024-05-01" }).status, "COMPLETED");
  });
});

describe("Sync everywhere integration (fake DB)", () => {
  const user = { id: "user-1" };
  let idempotency;
  let communityMessages;
  let appointments;
  let rehabTasks;
  let adherenceLogs;

  beforeEach(() => {
    idempotency = new Map();
    communityMessages = [];
    appointments = [];
    rehabTasks = new Map([
      ["task-1", { id: "task-1", caregiverId: "cg-1", patientId: "p1", providerId: "sp1", status: "ASSIGNED", durationDays: 5, completedDates: [], completedAt: null, caregiverMarkedDoneAt: null }],
    ]);
    adherenceLogs = new Map();
    const keep = {};
    for (const model of [
      "telehealthIdempotencyKey", "communityGroup", "communityGroupMember", "communityMessage",
      "careGiver", "cpPatient", "rehabTask", "taskAdherenceLog", "taskAdherenceLogHistory",
      "serviceProvider", "appointmentSettings", "appointment", "providerAvailability", "notification",
    ]) {
      keep[model] = prisma[model];
    }

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
    prisma.communityGroup = {
      findUnique: async () => ({ id: "g1", isAnnouncementOnly: false }),
    };
    prisma.communityGroupMember = {
      findUnique: async () => ({ groupId: "g1", userId: "user-1", role: "MEMBER" }),
    };
    prisma.communityMessage = {
      create: async ({ data }) => {
        const row = { id: `cm-${communityMessages.length + 1}`, ...data };
        communityMessages.push(row);
        return row;
      },
    };
    prisma.careGiver = {
      findUnique: async () => ({ id: "cg-1", userId: "user-1" }),
    };
    prisma.cpPatient = {
      findUnique: async ({ where }) => ({
        id: where.id, caregiverId: "cg-1", fullName: "Test Child",
      }),
    };
    prisma.rehabTask = {
      findUnique: async ({ where }) => rehabTasks.get(where.id) ?? null,
      findFirst: async ({ where }) => {
        const row = rehabTasks.get(where.id);
        if (!row || (where.patientId && row.patientId !== where.patientId)) return null;
        return {
          ...row,
          provider: { id: "sp1", profession: "PHYSIOTHERAPIST", facilityName: "F1", user: { fullName: "Physio", phoneNumber: "+233000000000" } },
          referral: null,
        };
      },
      update: async ({ where, data }) => {
        const row = { ...rehabTasks.get(where.id), ...data };
        rehabTasks.set(where.id, row);
        return { ...row, provider: { user: { id: "sp-user-1" } } };
      },
    };
    prisma.taskAdherenceLog = {
      findUnique: async ({ where }) => adherenceLogs.get(`${where.taskId_logDate.taskId}|${where.taskId_logDate.logDate.toISOString()}`) ?? null,
      upsert: async ({ where, create, update }) => {
        const key = `${where.taskId_logDate.taskId}|${where.taskId_logDate.logDate.toISOString()}`;
        const prior = adherenceLogs.get(key);
        const next = { ...(prior ?? create), ...update, id: prior?.id ?? `log-${adherenceLogs.size + 1}` };
        adherenceLogs.set(key, next);
        return next;
      },
    };
    prisma.taskAdherenceLogHistory = {
      create: async ({ data }) => data,
    };
    prisma.serviceProvider = {
      findUnique: async () => ({
        id: "sp1", userId: "sp-user-1", profession: "PHYSIOTHERAPIST",
        verificationStatus: "VERIFIED", facilityName: "F1",
        user: { id: "sp-user-1", fullName: "Physio" },
      }),
    };
    prisma.appointmentSettings = { findFirst: async () => null };
    prisma.appointment = {
      count: async () => 0,
      findFirst: async () => null,
      create: async ({ data }) => {
        const row = { id: `appt-${appointments.length + 1}`, ...data };
        appointments.push(row);
        return row;
      },
    };
    prisma.providerAvailability = {
      findFirst: async () => ({ id: "av-1" }),
    };
    prisma.notification = {
      create: async ({ data }) => ({ id: "n-1", ...data }),
    };
    prisma.$transaction = async (fn) => fn(prisma);
  });

  it("syncs a community message for a group member", async () => {
    const result = await SyncService.push(user, [
      { clientId: "m1", type: "community_message", data: { groupId: "g1", content: "Hello from offline" } },
    ]);
    assert.equal(result.succeeded, 1);
    assert.equal(communityMessages.length, 1);
    assert.equal(communityMessages[0].content, "Hello from offline");
    assert.equal(result.results[0].result.serverId, "cm-1");
  });

  it("rejects community messages from non-members without failing the batch", async () => {
    prisma.communityGroupMember.findUnique = async () => null;
    const result = await SyncService.push(user, [
      { clientId: "m1", type: "community_message", data: { groupId: "g1", content: "Hi" } },
      { clientId: "c1", type: "adherence_log", data: { taskId: "task-1", logDate: "2024-05-01", status: "COMPLETED" } },
    ]);
    assert.equal(result.results[0].success, false);
    assert.equal(result.results[1].success, true);
    assert.equal(communityMessages.length, 0);
  });

  it("syncs a caregiver task day-done with ownership checks", async () => {
    const result = await SyncService.push(user, [
      { clientId: "t1", type: "task_day_done", data: { patientId: "p1", taskId: "task-1", date: "2024-05-01" } },
    ]);
    assert.equal(result.succeeded, 1);
    assert.equal(result.results[0].result.serverId, "task-1");
    assert.ok(rehabTasks.get("task-1").completedDates.includes("2024-05-01"));
  });

  it("syncs an appointment request through the same validation as online booking", async () => {
    const future = new Date();
    future.setUTCDate(future.getUTCDate() + 3);
    const result = await SyncService.push(user, [
      {
        clientId: "a1",
        type: "appointment_request",
        data: { patientId: "11111111-1111-4111-8111-111111111111", providerId: "22222222-2222-4222-8222-222222222222", appointmentDate: future.toISOString(), reasonText: "Follow-up" },
      },
    ]);
    assert.equal(result.succeeded, 1);
    assert.equal(appointments.length, 1);
    assert.equal(appointments[0].status, "PENDING");
  });

  it("past appointment requests fail per-op like the online endpoint", async () => {
    const result = await SyncService.push(user, [
      {
        clientId: "a1",
        type: "appointment_request",
        data: { patientId: "11111111-1111-4111-8111-111111111111", providerId: "22222222-2222-4222-8222-222222222222", appointmentDate: "2020-01-01T10:00:00.000Z" },
      },
    ]);
    assert.equal(result.results[0].success, false);
    assert.equal(appointments.length, 0);
  });
});

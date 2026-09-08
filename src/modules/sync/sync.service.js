import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import gcprError from "../../utils/http-error.js";
import WRITE from "../../utils/logger.js";
import SupportService from "../support/support.service.js";
import CommunityGroupService from "../community/communityGroup.service.js";
import CpPatientService from "../cpPatient/cpPatient.service.js";
import ScheduleAppointmentService from "../scheduleAppointment/scheduleAppointment.service.js";
import { typedDataSchemas } from "./sync.validator.js";

const IDEMPOTENCY_TTL_DAYS = 90;

// Adherence day-buckets more than this far ahead of server time are rejected:
// offline devices legitimately sync OLD dates, but a wrong-clock device must
// not plant future entries.
const MAX_FUTURE_LOG_DAYS = 1;

function expiryDate() {
  return new Date(Date.now() + IDEMPOTENCY_TTL_DAYS * 24 * 60 * 60 * 1000);
}

function scopeFor(userId) {
  return `sync:${userId}`;
}

/**
 * TTL boundary (Group 9): an idempotency record is usable only before its
 * expiresAt. A replay arriving after expiry must re-execute as a new op —
 * never silently return the stale result, and never drop a legitimate new
 * op that reuses a key.
 */
export function isIdempotencyRecordUsable(record, now = new Date()) {
  if (!record || !record.expiresAt) return false;
  return new Date(record.expiresAt).getTime() > now.getTime();
}

/**
 * Multi-device conflict rule (Group 9): server arrival order wins for the
 * current row (deterministic, no client-clock trust), both attempts stay
 * distinguishable in TaskAdherenceLogHistory, and the overwritten write is
 * flagged conflicted:true so a provider can review it. Same-status rewrites
 * are harmless repeats, not conflicts.
 */
export function detectAdherenceConflict(prior, newStatus) {
  if (!prior || prior.status === newStatus) return { conflicted: false };
  return {
    conflicted: true,
    reason: `Conflicting offline write: day was ${prior.status}, now ${newStatus}. Server arrival order wins; both attempts are preserved in history for provider review.`,
  };
}

/** Clock-skew guard: client logDate selects the day bucket only; future dates are rejected. */
export function isLogDateAcceptable(logDateStr, now = new Date()) {
  const logDate = new Date(logDateStr);
  if (Number.isNaN(logDate.getTime())) return false;
  const horizon = new Date(now);
  horizon.setUTCHours(0, 0, 0, 0);
  horizon.setUTCDate(horizon.getUTCDate() + MAX_FUTURE_LOG_DAYS + 1);
  return logDate.getTime() < horizon.getTime();
}

async function getCachedResult(userId, clientId) {
  const record = await prisma.telehealthIdempotencyKey.findUnique({
    where: { key_scope: { key: clientId, scope: scopeFor(userId) } },
  });
  if (record && !isIdempotencyRecordUsable(record)) {
    // TTL expired: drop the stale record so this replay re-executes.
    try {
      await prisma.telehealthIdempotencyKey.delete({
        where: { key_scope: { key: clientId, scope: scopeFor(userId) } },
      });
    } catch {
      // Best-effort; the miss below is what matters.
    }
    // Opportunistic cleanup of other expired rows in this scope.
    try {
      await prisma.telehealthIdempotencyKey.deleteMany({
        where: { scope: scopeFor(userId), expiresAt: { lt: new Date() } },
      });
    } catch {
      // Best-effort.
    }
    return null;
  }
  return record;
}

async function cacheResult(userId, clientId, response) {
  try {
    await prisma.telehealthIdempotencyKey.upsert({
      where: { key_scope: { key: clientId, scope: scopeFor(userId) } },
      create: {
        key: clientId,
        scope: scopeFor(userId),
        response,
        expiresAt: expiryDate(),
      },
      // Re-arm the TTL whenever a key is (re-)recorded after expiry.
      update: { response, expiresAt: expiryDate() },
    });
  } catch (e) {
    WRITE.warn("[Sync] Failed to cache idempotency result", { error: e.message });
  }
}

async function resolveTicketId(userId, data) {
  if (data.ticketId) {
    const ticket = await prisma.supportTicket.findFirst({
      where: { id: data.ticketId, userId },
      select: { id: true },
    });
    if (!ticket) throw new gcprError(HttpStatus.NOT_FOUND, "Ticket not found for sync");
    return ticket.id;
  }
  if (data.clientTicketId) {
    const cached = await getCachedResult(userId, data.clientTicketId);
    const serverId = cached?.response?.serverId;
    if (!serverId) {
      throw new gcprError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Referenced offline ticket has not synced yet. Put the support_ticket operation earlier in the batch.",
      );
    }
    return serverId;
  }
  throw new gcprError(HttpStatus.BAD_REQUEST, "ticketId or clientTicketId is required");
}

async function applyOperation(user, op) {
  const schema = typedDataSchemas[op.type];
  if (!schema) throw new gcprError(HttpStatus.BAD_REQUEST, `Unsupported sync type: ${op.type}`);
  const parsed = schema.safeParse(op.data);
  if (!parsed.success) {
    throw new gcprError(
      HttpStatus.UNPROCESSABLE_ENTITY,
      `Invalid data for ${op.type}: ${parsed.error.issues.map((i) => i.message).join("; ")}`,
    );
  }
  const data = parsed.data;

  switch (op.type) {
    case "support_ticket": {
      const ticket = await SupportService.createTicket(user.id, data);
      return { serverId: ticket.id, ticketNumber: ticket.ticketNumber };
    }
    case "ticket_message": {
      const ticketId = await resolveTicketId(user.id, data);
      const message = await SupportService.addMessage(user.id, ticketId, data.content);
      return { serverId: message.id, ticketId };
    }
    case "adherence_log": {
      const task = await prisma.rehabTask.findUnique({ where: { id: data.taskId } });
      if (!task) throw new gcprError(HttpStatus.NOT_FOUND, "Rehab task not found for sync");
      if (!isLogDateAcceptable(data.logDate)) {
        throw new gcprError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          "logDate is invalid or too far in the future; check the device clock and resubmit",
        );
      }
      const logDate = new Date(data.logDate);
      logDate.setUTCHours(0, 0, 0, 0);
      const prior = await prisma.taskAdherenceLog.findUnique({
        where: { taskId_logDate: { taskId: data.taskId, logDate } },
      });
      // Resolution rule (Group 9): server arrival order wins. A differing
      // prior status means another writer got here first — flag it instead
      // of silently merging.
      const { conflicted, reason } = detectAdherenceConflict(prior, data.status);
      const log = await prisma.taskAdherenceLog.upsert({
        where: { taskId_logDate: { taskId: data.taskId, logDate } },
        create: {
          taskId: data.taskId,
          patientId: task.patientId,
          providerId: task.providerId,
          logDate,
          status: data.status,
          markedById: user.id,
          markedAt: new Date(),
          notes: data.notes || null,
        },
        update: {
          status: data.status,
          markedById: user.id,
          markedAt: new Date(),
          ...(data.notes !== undefined && { notes: data.notes }),
        },
      });
      // Append-only history (Group 6): a late-arriving offline batch must
      // not silently erase a provider correction or a newer device's entry.
      try {
        const { default: AdherenceService } = await import("../assessment/adherence.service.js");
        await AdherenceService.recordHistory({
          logId: log.id,
          taskId: data.taskId,
          patientId: task.patientId,
          logDate,
          oldStatus: prior?.status ?? null,
          newStatus: log.status,
          changedById: user.id,
          changeSource: "SYNC",
          notes: data.notes || null,
        });
      } catch (e) {
        WRITE.warn("[Sync] Adherence history write failed", { error: e.message });
      }
      if (conflicted) {
        WRITE.warn("[Sync] Conflicting offline adherence write", {
          userId: user.id,
          taskId: data.taskId,
          logDate: logDate.toISOString(),
          reason,
        });
      }
      return { serverId: log.id, taskId: log.taskId, logDate: log.logDate, conflicted };
    }
    case "direct_message": {
      if (!data.content && !data.mediaUrl) {
        throw new gcprError(HttpStatus.BAD_REQUEST, "Message content or media is required");
      }
      if (data.receiverId === user.id) {
        throw new gcprError(HttpStatus.BAD_REQUEST, "Cannot send a message to yourself");
      }
      const receiver = await prisma.user.findUnique({
        where: { id: data.receiverId },
        select: { id: true },
      });
      if (!receiver) throw new gcprError(HttpStatus.NOT_FOUND, "Message receiver not found");
      const message = await prisma.directMessage.create({
        data: {
          senderId: user.id,
          receiverId: data.receiverId,
          content: data.content || null,
          mediaUrl: data.mediaUrl || null,
          type: data.type || "TEXT",
          caption: data.caption || null,
        },
      });
      return { serverId: message.id };
    }
    case "community_message": {
      // Same membership + announcement-only rules as the online endpoint.
      const message = await CommunityGroupService.sendMessage(data.groupId, user.id, data);
      return { serverId: message.id, groupId: data.groupId };
    }
    case "task_day_done": {
      // Same caregiver-ownership checks as PATCH
      // /cp-patient/:patientId/assigned-tasks/:taskId/days/done.
      const updatedTask = await CpPatientService.markTaskDayDone(
        user.id,
        data.patientId,
        data.taskId,
        data.date,
      );
      return { serverId: updatedTask.id, taskId: updatedTask.id, status: updatedTask.status };
    }
    case "appointment_request": {
      // Same slot/notice/availability validation as online booking — a taken
      // slot fails per-op (409) so the client picks a new time and retries.
      const appointment = await ScheduleAppointmentService.createAppointment(user.id, data);
      return { serverId: appointment.id, status: appointment.status ?? "PENDING" };
    }
    default:
      throw new gcprError(HttpStatus.BAD_REQUEST, `Unsupported sync type: ${op.type}`);
  }
}

export default class SyncService {
  // Push queued offline operations. Each operation is idempotent on
  // (userId, clientId): retries return the original result.
  // Ordering (Group 9): the batch is applied strictly sequentially in the
  // client-given array order (no parallelism), so an offline sequence
  // resolves deterministically. Per-op results let the client retry only
  // failures; successes replay as duplicate:true.
  // NOTE: referral status transitions and care-plan generation are
  // deliberately NOT sync-eligible (see sync.validator.js): replaying those
  // out of order could bypass the Group 6 enforcement, so they stay
  // online-only operations.
  static async push(user, operations) {
    const results = [];
    // In-batch mapping clientId -> serverId for offline-created tickets
    // referenced later in the same batch via clientTicketId.
    const batchTicketMap = new Map();

    for (const op of operations) {
      const cached = await getCachedResult(user.id, op.clientId);
      if (cached?.response) {
        if (op.type === "support_ticket" && cached.response?.serverId) {
          batchTicketMap.set(op.clientId, cached.response.serverId);
        }
        results.push({
          clientId: op.clientId,
          type: op.type,
          success: true,
          duplicate: true,
          result: cached.response,
        });
        continue;
      }

      // Allow ticket_message to reference a ticket created earlier
      // in THIS batch (common offline flow).
      let opData = op.data;
      if (
        op.type === "ticket_message" &&
        opData?.clientTicketId &&
        batchTicketMap.has(opData.clientTicketId) &&
        !opData.ticketId
      ) {
        opData = { ...opData, ticketId: batchTicketMap.get(opData.clientTicketId) };
      }

      try {
        const result = await applyOperation(user, { ...op, data: opData });
        await cacheResult(user.id, op.clientId, result);
        if (op.type === "support_ticket" && result?.serverId) {
          batchTicketMap.set(op.clientId, result.serverId);
        }
        results.push({ clientId: op.clientId, type: op.type, success: true, duplicate: false, result });
      } catch (e) {
        WRITE.warn("[Sync] Operation failed", {
          userId: user.id,
          clientId: op.clientId,
          type: op.type,
          error: e.message,
        });
        results.push({
          clientId: op.clientId,
          type: op.type,
          success: false,
          duplicate: false,
          error: e.message,
          statusCode: e.status || e.statusCode || 422,
        });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    return {
      total: results.length,
      succeeded,
      failed: results.length - succeeded,
      results,
    };
  }
}

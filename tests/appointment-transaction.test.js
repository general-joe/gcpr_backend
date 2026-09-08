import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const readSrc = (rel) => readFileSync(path.join(__dirname, "..", rel), "utf8");

// Regression: appointment booking held push-notification network I/O inside
// the Prisma transaction, blowing past the default 5s timeout (P2028) and
// returning 500 for appointments that were actually created (client then
// retried into double-book confusion).
describe("Appointment booking keeps I/O out of the transaction", () => {
  it("no notification fan-out inside the $transaction callback", () => {
    const src = readSrc("src/modules/scheduleAppointment/scheduleAppointment.service.js");
    const txStart = src.indexOf("await prisma.$transaction(async (tx) => {");
    assert.ok(txStart !== -1, "booking transaction not found");
    // Find the matching end of the transaction callback: the first
    // "}, { timeout:" that follows the transaction start.
    const txEnd = src.indexOf("}, { timeout:", txStart);
    assert.ok(txEnd !== -1, "transaction has no explicit timeout option");
    const txBody = src.slice(txStart, txEnd);
    assert.doesNotMatch(txBody, /createNotification/, "notification send inside transaction");
    assert.doesNotMatch(txBody, /tx\.cpPatient/, "caregiver lookup inside transaction");
    assert.doesNotMatch(txBody, /sendPushNotification|sendEmail|SendSMS/, "network I/O inside transaction");
  });

  it("notifications still fire post-commit and never fail the booking", () => {
    const src = readSrc("src/modules/scheduleAppointment/scheduleAppointment.service.js");
    const txEnd = src.indexOf("}, { timeout:");
    const afterTx = src.slice(txEnd);
    assert.match(afterTx, /createNotification/, "no post-commit notifications");
    assert.match(afterTx, /should not block appointment creation/, "notification failure must not fail booking");
  });
});

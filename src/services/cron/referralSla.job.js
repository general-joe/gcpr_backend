import prisma from "../../config/database.js";
import NotificationService from "../../modules/notification/notification.service.js";
import WRITE from "../../utils/logger.js";

export async function runReferralSlaJob() {
  try {
    const now = new Date();

    const expired = await prisma.clinicalReferral.updateMany({
      where: {
        status: "PENDING",
        slaDeadline: { lt: now },
        escalatedAt: null,
      },
      data: { status: "EXPIRED", escalatedAt: now },
    });

    WRITE.info(`[ReferralSLA] Expired ${expired.count} referrals`);

    const approaching = await prisma.clinicalReferral.findMany({
      where: {
        status: "PENDING",
        slaDeadline: {
          gt: now,
          lte: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        },
      },
      include: {
        fromProvider: { select: { userId: true } },
        patient: { select: { caregiverId: true } },
      },
    });

    for (const referral of approaching) {
      if (referral.escalatedAt) continue;
      try {
        if (referral.fromProvider?.userId) {
          await NotificationService.createNotification({
            userId: referral.fromProvider.userId,
            type: "IN_APP",
            category: "SYSTEM",
            title: "Referral response reminder",
            content: `Referral #${referral.id.slice(0, 8)} has not been accepted yet. Please follow up.`,
            relatedId: referral.id,
            relatedModel: "ClinicalReferral",
            expiresAt: referral.slaDeadline,
          });
        }
        await prisma.clinicalReferral.update({
          where: { id: referral.id },
          data: { escalatedAt: now },
        });
      } catch (e) {
        WRITE.warn("[ReferralSLA] Notification failed", {
          referralId: referral.id,
          error: e.message,
        });
      }
    }
  } catch (e) {
    WRITE.error("[ReferralSLA] Job failed", { error: e.message });
  }
}

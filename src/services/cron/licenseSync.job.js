import prisma from "../../config/database.js";

/**
 * Syncs licenseStatus for all ServiceProviders based on license dates.
 * Runs daily to keep statuses accurate without manual intervention.
 */
export async function runLicenseSync() {
  const now = new Date();

  const [activated, deactivated] = await Promise.all([
    prisma.serviceProvider.updateMany({
      where: {
        licenseIssuedDate: { lte: now },
        licenseExpiry: { gte: now },
        NOT: { licenseStatus: "ACTIVE" },
      },
      data: { licenseStatus: "ACTIVE" },
    }),
    prisma.serviceProvider.updateMany({
      where: {
        OR: [
          { licenseIssuedDate: { gt: now } },
          { licenseExpiry: { lt: now } },
        ],
        NOT: { licenseStatus: "INACTIVE" },
      },
      data: { licenseStatus: "INACTIVE" },
    }),
  ]);

  WRITE.info("[Cron] License sync complete", {
    activated: activated.count,
    deactivated: deactivated.count,
  });
}

import prisma from "../../config/database.js";
import UploadService from "../../utils/uploadService.js";
import path from "path";

const SIGNATURE_BUCKET = "signatures";

class SignatureService {
  static async saveUserSignature({ userId, buffer, originalName, mimeType, isDefault = false, data }) {
    if (isDefault) {
      await prisma.userSignature.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const ext = path.extname(originalName) || ".png";
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;

    const fileUrl = await UploadService.saveFile(buffer, safeName, SIGNATURE_BUCKET);

    const record = await prisma.userSignature.create({
      data: {
        userId,
        signatureUrl: fileUrl,
        mimeType: mimeType || "image/png",
        data: data ?? null,
        isDefault,
      },
    });

    return record;
  }

  static async listUserSignatures(userId) {
    return prisma.userSignature.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  static async getDefaultSignature(userId) {
    return prisma.userSignature.findFirst({ where: { userId, isDefault: true } });
  }

  static async attachSignatureAudit({ signerId, signatureUrl, relatedModel, relatedId, documentHash, hmac, ip, userAgent }) {
    return prisma.documentSignature.create({
      data: {
        signerId,
        signatureUrl,
        relatedModel,
        relatedId,
        documentHash,
        hmac,
        ip,
        userAgent,
      },
    });
  }
}

export default SignatureService;

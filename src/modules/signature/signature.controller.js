import UtilFunctions from "../../utils/UtilFunctions.js";
import SignatureService from "./signature.service.js";

class SignatureController {
  static async upload(req, res) {
    try {
      const requesterId = res.locals.user.id;
      // support multipart file or base64 payload
      let buffer;
      let originalName = `signature-${requesterId}.png`;
      let mimeType = "image/png";
      let data = null;

      if (req.file && req.file.buffer) {
        buffer = req.file.buffer;
        originalName = req.file.originalname || originalName;
        mimeType = req.file.mimetype || mimeType;
      } else if (req.body?.data) {
        // data URI: data:image/png;base64,....
        const matches = req.body.data.match(/^data:(.+);base64,(.+)$/);
        if (!matches) return UtilFunctions.outputError(res, "Invalid data payload", {}, "BAD_REQUEST", 400);
        mimeType = matches[1];
        buffer = Buffer.from(matches[2], "base64");
        data = req.body.data;
      } else {
        return UtilFunctions.outputError(res, "Signature file or data is required", {}, "BAD_REQUEST", 400);
      }

      const isDefault = req.body?.isDefault === "true" || req.body?.isDefault === true;

      const record = await SignatureService.saveUserSignature({
        userId: requesterId,
        buffer,
        originalName,
        mimeType,
        isDefault,
        data,
      });

      return UtilFunctions.outputSuccess(res, { signature: record }, "Signature uploaded");
    } catch (err) {
      console.error(err);
      return UtilFunctions.outputError(res, "Failed to upload signature", {}, "INTERNAL", 500);
    }
  }

  static async list(req, res) {
    try {
      const { userId } = req.params;
      const requesterId = res.locals.user.id;
      if (requesterId !== userId && !(res.locals.user.roles || []).includes("ADMIN")) {
        return UtilFunctions.outputError(res, "Forbidden", {}, "FORBIDDEN", 403);
      }

      const items = await SignatureService.listUserSignatures(userId);
      return UtilFunctions.outputSuccess(res, { signatures: items }, "Signatures fetched");
    } catch (err) {
      console.error(err);
      return UtilFunctions.outputError(res, "Failed to fetch signatures", {}, "INTERNAL", 500);
    }
  }

  static async attach(req, res) {
    try {
      const signerId = res.locals.user.id;
      const { relatedModel, relatedId } = req.body;
      if (!relatedModel || !relatedId) {
        return UtilFunctions.outputError(res, "relatedModel and relatedId are required", {}, "BAD_REQUEST", 400);
      }

      // use stored default signature unless file is provided
      let signatureUrl = null;
      if (req.file && req.file.buffer) {
        // save temporary signature file
        const saved = await SignatureService.saveUserSignature({
          userId: signerId,
          buffer: req.file.buffer,
          originalName: req.file.originalname || `signature-${signerId}.png`,
          mimeType: req.file.mimetype,
          isDefault: false,
        });
        signatureUrl = saved.signatureUrl;
      } else {
        const def = await SignatureService.getDefaultSignature(signerId);
        if (!def) return UtilFunctions.outputError(res, "No stored signature available", {}, "NOT_FOUND", 404);
        signatureUrl = def.signatureUrl;
      }

      const audit = await SignatureService.attachSignatureAudit({
        signerId,
        signatureUrl,
        relatedModel,
        relatedId,
        ip: req.ip,
        userAgent: req.get("User-Agent") || null,
      });

      return UtilFunctions.outputSuccess(res, { audit }, "Signature attached");
    } catch (err) {
      console.error(err);
      return UtilFunctions.outputError(res, "Failed to attach signature", {}, "INTERNAL", 500);
    }
  }
}

export default SignatureController;

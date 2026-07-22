import ConsentService from "../../services/clinical/consent.service.js";
import HttpStatus from "../../utils/http-status.js";
import catchAsync from "../../middlewares/catchAsync.js";

const createConsent = catchAsync(async (req, res) => {
  const record = await ConsentService.createConsent(res.locals.user, req.body);

  return res.status(HttpStatus.CREATED).json({ status: HttpStatus.CREATED, data: record });
});

const revokeConsent = catchAsync(async (req, res) => {
  const { consentId } = req.params;

  const record = await ConsentService.revokeConsent(res.locals.user, consentId);

  return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, data: record });
});

const listConsents = catchAsync(async (req, res) => {
  const { patientId } = req.query;

  const records = await ConsentService.listConsents(res.locals.user, patientId);

  return res.status(HttpStatus.OK).json({ status: HttpStatus.OK, data: records });
});

export { createConsent, revokeConsent, listConsents };

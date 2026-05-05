import catchAsync from "../../middlewares/catchAsync.js";
import UtilFunctions from "../../utils/UtilFunctions.js";
import FaqService from "./faq.service.js";

export default class FaqController {
  // Public / User
  static listFaqs = catchAsync(async (req, res) => {
    const userRole = res.locals.user?.role ?? null;
    const result = await FaqService.listFaqs(req.query, userRole);
    UtilFunctions.outputSuccess(res, result, "FAQs retrieved successfully");
  });

  static listFaqCategories = catchAsync(async (req, res) => {
    const result = await FaqService.listFaqCategories();
    UtilFunctions.outputSuccess(res, result, "FAQ categories retrieved successfully");
  });

  static getFaq = catchAsync(async (req, res) => {
    const result = await FaqService.getFaq(req.params.id);
    UtilFunctions.outputSuccess(res, result, "FAQ retrieved successfully");
  });

  static markHelpful = catchAsync(async (req, res) => {
    const result = await FaqService.markHelpful(req.params.id);
    UtilFunctions.outputSuccess(res, result, "Marked as helpful");
  });

  static searchFaqs = catchAsync(async (req, res) => {
    const result = await FaqService.searchFaqs(req.query.q);
    UtilFunctions.outputSuccess(res, result, "Search results retrieved");
  });

  // Admin
  static adminListFaqs = catchAsync(async (req, res) => {
    const result = await FaqService.adminListFaqs(req.query);
    UtilFunctions.outputSuccess(res, result, "FAQs retrieved successfully");
  });

  static createFaqCategory = catchAsync(async (req, res) => {
    const result = await FaqService.createFaqCategory(req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "FAQ category created successfully");
  });

  static updateFaqCategory = catchAsync(async (req, res) => {
    const result = await FaqService.updateFaqCategory(req.params.id, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "FAQ category updated successfully");
  });

  static deleteFaqCategory = catchAsync(async (req, res) => {
    await FaqService.deleteFaqCategory(req.params.id);
    UtilFunctions.outputSuccess(res, {}, "FAQ category deleted successfully");
  });

  static createFaq = catchAsync(async (req, res) => {
    const result = await FaqService.createFaq(req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "FAQ created successfully");
  });

  static updateFaq = catchAsync(async (req, res) => {
    const result = await FaqService.updateFaq(req.params.id, req.validatedData ?? req.body);
    UtilFunctions.outputSuccess(res, result, "FAQ updated successfully");
  });

  static deleteFaq = catchAsync(async (req, res) => {
    await FaqService.deleteFaq(req.params.id);
    UtilFunctions.outputSuccess(res, {}, "FAQ deleted successfully");
  });

  static publishFaq = catchAsync(async (req, res) => {
    const result = await FaqService.publishFaq(req.params.id);
    UtilFunctions.outputSuccess(res, result, "FAQ published successfully");
  });

  static unpublishFaq = catchAsync(async (req, res) => {
    const result = await FaqService.unpublishFaq(req.params.id);
    UtilFunctions.outputSuccess(res, result, "FAQ unpublished successfully");
  });
}

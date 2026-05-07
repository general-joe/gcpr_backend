import express from "express";
import rateLimit from "express-rate-limit";
import { Auth, authorize, requireRbacRole } from "../../middlewares/auth.js";
import FaqController from "./faq.controller.js";

const faqRouter = express.Router();
const adminFaqRouter = express.Router();

const faqLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests. Please try again later."
});

const helpfulLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many requests. Please try again later."
});

const adminFaqLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests. Please try again later."
});

// ─── Public / User FAQ Routes ──────────────────────────────────────────────────
faqRouter.get("/search", faqLimiter, Auth, FaqController.searchFaqs);
faqRouter.get("/categories", faqLimiter, Auth, FaqController.listFaqCategories);
faqRouter.get("/", faqLimiter, Auth, FaqController.listFaqs);
faqRouter.get("/:id", faqLimiter, Auth, FaqController.getFaq);
faqRouter.post("/:id/helpful", helpfulLimiter, authorize(["SERVICE_PROVIDER", "CAREGIVER"]), FaqController.markHelpful);

// ─── Admin FAQ Routes ──────────────────────────────────────────────────────────
adminFaqRouter.get("/", adminFaqLimiter, requireRbacRole(["ADMIN"]), FaqController.adminListFaqs);

adminFaqRouter.post("/categories", adminFaqLimiter, requireRbacRole(["ADMIN"]), FaqController.createFaqCategory);
adminFaqRouter.patch("/categories/:id", adminFaqLimiter, requireRbacRole(["ADMIN"]), FaqController.updateFaqCategory);
adminFaqRouter.delete("/categories/:id", adminFaqLimiter, requireRbacRole(["ADMIN"]), FaqController.deleteFaqCategory);

adminFaqRouter.post("/", adminFaqLimiter, requireRbacRole(["ADMIN"]), FaqController.createFaq);
adminFaqRouter.patch("/:id", adminFaqLimiter, requireRbacRole(["ADMIN"]), FaqController.updateFaq);
adminFaqRouter.delete("/:id", adminFaqLimiter, requireRbacRole(["ADMIN"]), FaqController.deleteFaq);
adminFaqRouter.post("/:id/publish", adminFaqLimiter, requireRbacRole(["ADMIN"]), FaqController.publishFaq);
adminFaqRouter.post("/:id/unpublish", adminFaqLimiter, requireRbacRole(["ADMIN"]), FaqController.unpublishFaq);

export default faqRouter;
export { adminFaqRouter };

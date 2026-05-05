import express from "express";
import rateLimit from "express-rate-limit";
import { Auth, authorize } from "../../middlewares/auth.js";
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

// ─── Public / User FAQ Routes ──────────────────────────────────────────────────
faqRouter.get("/search", faqLimiter, Auth, FaqController.searchFaqs);
faqRouter.get("/categories", faqLimiter, Auth, FaqController.listFaqCategories);
faqRouter.get("/", faqLimiter, Auth, FaqController.listFaqs);
faqRouter.get("/:id", faqLimiter, Auth, FaqController.getFaq);
faqRouter.post("/:id/helpful", helpfulLimiter, authorize(["SERVICE_PROVIDER", "CAREGIVER"]), FaqController.markHelpful);

// ─── Admin FAQ Routes ──────────────────────────────────────────────────────────
adminFaqRouter.get("/", authorize(["ADMIN"]), FaqController.adminListFaqs);

adminFaqRouter.post("/categories", authorize(["ADMIN"]), FaqController.createFaqCategory);
adminFaqRouter.patch("/categories/:id", authorize(["ADMIN"]), FaqController.updateFaqCategory);
adminFaqRouter.delete("/categories/:id", authorize(["ADMIN"]), FaqController.deleteFaqCategory);

adminFaqRouter.post("/", authorize(["ADMIN"]), FaqController.createFaq);
adminFaqRouter.patch("/:id", authorize(["ADMIN"]), FaqController.updateFaq);
adminFaqRouter.delete("/:id", authorize(["ADMIN"]), FaqController.deleteFaq);
adminFaqRouter.post("/:id/publish", authorize(["ADMIN"]), FaqController.publishFaq);
adminFaqRouter.post("/:id/unpublish", authorize(["ADMIN"]), FaqController.unpublishFaq);

export default faqRouter;
export { adminFaqRouter };

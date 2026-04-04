import express from "express";
const router = express.Router();
import directMessageController from "./directMessage.controller.js";
import { authorize } from "../../middlewares/auth.js";

router.use(authorize(["SERVICE_PROVIDER", "CAREGIVER"]));

router.post("/", directMessageController.sendMessage);
router.get("/conversations", directMessageController.getConversations);
router.get("/:userId", directMessageController.getMessagesWithUser);
router.put("/:messageId/read", directMessageController.markAsRead);
router.delete("/:messageId", directMessageController.deleteMessage);

export default router;
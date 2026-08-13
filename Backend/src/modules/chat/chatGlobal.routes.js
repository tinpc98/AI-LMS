import { Router } from "express";
import { getUnreadSummary } from "./chatGlobal.controller.js";
import { verifyUser } from "#modules/auth/index.js";

const router = Router();

router.use(verifyUser);

// GET /api/messages/unread-summary
router.get("/unread-summary", getUnreadSummary);

export default router;

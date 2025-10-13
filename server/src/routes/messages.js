import express from "express";
import {
  sendMessage,
  getMessages,
  getChatRooms,
  markMessagesAsRead,
} from "../controllers/messageController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Message routes
router.post("/send", sendMessage);
router.get("/chat-rooms", getChatRooms);
router.get("/:friendId", getMessages);
router.put("/read/:friendId", markMessagesAsRead);

export default router;

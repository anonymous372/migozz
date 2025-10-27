import express from "express";
import {
  sendMessage,
  getMessages,
  getChatRooms,
  markMessagesAsRead,
  uploadFile,
} from "../controllers/messageController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Message routes
router.post("/send", sendMessage);
router.post("/upload", upload.single("file"), uploadFile); // Single file upload
router.get("/chat-rooms", getChatRooms);
router.get("/:friendId", getMessages);
router.put("/read/:friendId", markMessagesAsRead);

export default router;

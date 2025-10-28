import express from "express";
import {
  sendMessage,
  getMessages,
  getChatRooms,
  markMessagesAsRead,
  uploadFile,
  getRoomMessages,
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
router.get("/room/:roomId", getRoomMessages);
// router.get("/:friendId", getMessages);  // <-- 1. OLD (was stable. if error occurs, use it)
router.get("/user/:friendId", getMessages); // <-- 2. CHANGE (to be more specific)
router.put("/read/:friendId", markMessagesAsRead);

export default router;

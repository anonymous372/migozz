import express from "express";
import {
  getUserProfile,
  updateOnlineStatus,
  searchUsers,
  getOnlineFriends,
} from "../controllers/userController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// User routes
router.get("/profile", getUserProfile);
router.put("/online-status", updateOnlineStatus);
router.get("/search", searchUsers);
router.get("/online-friends", getOnlineFriends);

export default router;

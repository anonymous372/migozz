import express from "express";
import {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  removeFriend,
} from "../controllers/friendController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Friend request routes
router.post("/request", sendFriendRequest);
router.get("/requests", getFriendRequests);
router.put("/accept/:requestId", acceptFriendRequest);
router.put("/decline/:requestId", declineFriendRequest);

// Friends management routes
router.get("/", getFriends);
router.delete("/:friendId", removeFriend);

export default router;

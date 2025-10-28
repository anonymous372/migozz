import { Router } from "express";
import {
  createRoom,
  joinRoom,
  getMyRooms,
} from "../controllers/roomController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = Router();

// All room routes are protected
router.use(authenticateToken);

router.get("/", getMyRooms);
router.post("/create", createRoom);
router.post("/join", joinRoom);

export default router;

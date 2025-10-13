import express from "express";
import { register, login } from "../controllers/authController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Auth routes
router.post("/register", register);
router.post("/login", login);

// Protected route example
router.get("/profile", authenticateToken, (req, res) => {
  res.json({
    status: 200,
    data: {
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
      },
    },
    message: "Profile retrieved successfully",
  });
});

export default router;

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { API_RESPONSE } from "../utils/constants.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res
        .status(401)
        .json(
          API_RESPONSE(
            401,
            null,
            "Authentication Error",
            "Access token required"
          )
        );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "hello kitty");
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json(
          API_RESPONSE(
            401,
            null,
            "Authentication Error",
            "Invalid token - user not found"
          )
        );
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json(API_RESPONSE(401, null, "Authentication Error", "Invalid token"));
    }

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json(API_RESPONSE(401, null, "Authentication Error", "Token expired"));
    }

    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Authentication failed"
        )
      );
  }
};

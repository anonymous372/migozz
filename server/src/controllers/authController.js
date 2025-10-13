/**
 * @fileoverview Controller functions for authentication (login and registration).
 * FIX: JWT_SECRET is now read directly from process.env, ensuring it is defined
 * after the dotenv configuration runs in app.js.
 */

// We assume API_RESPONSE is defined and exported from this constants file,
// but we remove the JWT_SECRET import here.
import { API_RESPONSE } from "../utils/constants.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

// --- Configuration ---
// Read the secret directly from process.env, loaded by dotenv in app.js
const JWT_SECRET = process.env.JWT_SECRET;

// CRITICAL CHECK: Ensure the secret is loaded
if (!JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET is not defined. Cannot sign tokens.");
  // In a production app, you might crash the process here: process.exit(1);
}

const createToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json(
          API_RESPONSE(
            400,
            null,
            "Validation Error",
            "Missing required fields."
          )
        );
    }

    const user = await User.create({ username, email, password });
    const token = createToken(user._id);
    const userData = {
      userId: user._id,
      username: user.username,
      email: user.email,
    };
    res
      .status(201)
      .json(
        API_RESPONSE(
          201,
          { user: userData, token },
          null,
          "User registered successfully."
        )
      );
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json(
          API_RESPONSE(
            400,
            null,
            "Database Error",
            "Email or Username already exists."
          )
        );
    }
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to register user :( see Dev logs for more details"
        )
      );
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json(
          API_RESPONSE(
            400,
            null,
            "Validation Error",
            "Please provide email and password."
          )
        );
    }
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json(
          API_RESPONSE(
            401,
            null,
            "Authentication Error",
            "Invalid credentials (User not found)."
          )
        );
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json(
          API_RESPONSE(
            401,
            null,
            "Authentication Error",
            "Invalid credentials (Incorrect password)."
          )
        );
    }
    const token = createToken(user._id);
    res
      .status(200)
      .json(API_RESPONSE(200, { token }, null, "Login successful."));
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to login user :( see Dev logs for more details"
        )
      );
  }
};

/**
 * @fileoverview Controller functions for authentication (login and registration).
 * FIX: JWT_SECRET is now read directly from process.env *inside the function*
 * that uses it, avoiding the ES module load timing conflict.
 */

// Now only importing the static API_RESPONSE function
import { API_RESPONSE } from "../utils/constants.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

// --- Configuration ---
// Removed module-level JWT_SECRET read to avoid ES module timing conflict.
// It will now be read inside createToken().

const createToken = (userId) => {
  const secret = process.env.JWT_SECRET;

  // Re-add the critical check here, which only runs if a token is attempted to be created
  if (!secret) {
    console.error(
      "FATAL ERROR: JWT_SECRET is missing. Check .env configuration."
    );
    // Throw an error to halt the API call and provide a 500 response
    throw new Error("JWT_SECRET is undefined.");
  }

  return jwt.sign({ id: userId }, secret, {
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

    // Check for the specific error thrown by createToken if the secret was missing
    if (error.message === "JWT_SECRET is undefined.") {
      return res
        .status(500)
        .json(
          API_RESPONSE(
            500,
            null,
            "Configuration Error",
            "Server failed to initialize authentication due to missing secret key."
          )
        );
    }

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

    // Check for the specific error thrown by createToken if the secret was missing
    if (error.message === "JWT_SECRET is undefined.") {
      return res
        .status(500)
        .json(
          API_RESPONSE(
            500,
            null,
            "Configuration Error",
            "Server failed to initialize authentication due to missing secret key."
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
          "Failed to login user :( see Dev logs for more details"
        )
      );
  }
};

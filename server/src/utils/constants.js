/**
 * @fileoverview Utility file for static constants and response formatting.
 * FIXED: Removed environment variable reading (PORT, MONGO_URI, JWT_SECRET)
 * to prevent module loading conflicts. Environment variables must be read
 * directly from process.env in the files that need them (app.js or authController.js).
 */
export const API_RESPONSE = (
  status,
  data = null,
  error = null,
  message = ""
) => {
  return {
    status,
    data: data,
    error: error,
    message: message,
  };
};

// NOTE: PORT, MONGO_URI, and JWT_SECRET declarations have been removed from this file.

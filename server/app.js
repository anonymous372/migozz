import * as dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
// Assuming these imports are necessary and paths are correct
import { outGreen, outYellow } from "./src/utils/helpers.js";
import router from "./src/routes/index.js";

// Initialize the Express application
const app = express();

const connectDB = async () => {
  // CRITICAL CHECK: Check here instead of relying on a separate file import
  if (!MONGO_URI) {
    console.error(
      "FATAL ERROR: MONGO_URI is not defined. Check your .env file in the project root."
    );
    process.exit(1);
  }

  try {
    // Optional: Log the masked URI for debugging if needed
    const maskedURI = MONGO_URI.replace(/:([^@]+)@/, ":***@");
    console.log(`[DB] Attempting to connect to: ${maskedURI}`);

    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connection successful!");
  } catch (err) {
    console.log(err);
    console.error("MongoDB connection failed:", err.message);
    // Exit process with failure
    process.exit(1);
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Custom Logger
app.use((req, res, next) => {
  console.log(outGreen(`[${req.method}]`), outYellow(req.path));
  next();
});

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is running smoothly!" });
});

app.use("/api/v1", router);

// Connect to database and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api/v1`);
  });
});

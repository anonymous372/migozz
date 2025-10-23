import * as dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
// Assuming these imports are necessary and paths are correct
import { outGreen, outYellow } from "./src/utils/helpers.js";
import router from "./src/routes/index.js";
import { socketAuth, handleConnection } from "./src/services/socketService.js";
import { PeerServer } from "peer";

// Initialize the Express application
const app = express();
const server = createServer(app);

// client url
// const CLIENT_URL = "http://10.42.0.52:5173";
const CLIENT_URL = "http://localhost:5173";

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.io authentication
io.use(socketAuth);

// Handle socket connections
io.on("connection", handleConnection(io));

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
  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api/v1`);
    console.log(`Socket.io server running on port ${PORT}`);

    const peerServer = PeerServer({
      port: 9000,
      path: "/peerjs",
    });

    console.log("PeerJS server running on port 9000");
  });
});

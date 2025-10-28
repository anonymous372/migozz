import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    required: false,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room", // New field to link to the Room model
    required: false,
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  messageType: {
    type: String,
    enum: ["text", "image", "file", "audio"],
    default: "text",
  },
  // File-specific fields (only populated if messageType is "image" or "file")
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  fileSize: {
    type: Number, // in bytes
  },
  fileMimeType: {
    type: String,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a message has either a receiver OR a room, but not both.
messageSchema.pre("validate", function (next) {
  if (!this.receiver && !this.room) {
    next(new Error("Message must have either a receiver or a room."));
  } else if (this.receiver && this.room) {
    next(new Error("Message cannot have both a receiver and a room."));
  } else {
    next();
  }
});



// Index for efficient querying of messages between two users
messageSchema.index({ sender: 1, receiver: 1, timestamp: -1 });
messageSchema.index({ receiver: 1, isRead: 1 });

// Index for room messages
messageSchema.index({ room: 1, timestamp: -1 });

export default mongoose.model("Message", messageSchema);

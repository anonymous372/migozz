import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  roomCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  lastActivity: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Index for finding user's rooms
roomSchema.index({ members: 1, lastActivity: -1 });

const Room = mongoose.model("Room", roomSchema);
export default Room;
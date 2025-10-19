import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// chatRoomSchema.pre("save", function (next) {
//   if (Array.isArray(this.participants) && this.participants.length > 0) {
//     // Convert ObjectIds to strings and sort to ensure deterministic order
//     this.participants = this.participants
//       .map((p) => (p && p.toString ? p.toString() : p))
//       .sort();
//   }
//   next();
// });

// // For 1:1 chats we index participants.0 and participants.1 (sorted) as a unique pair.
// // Make it sparse so legacy rooms with different shapes do not conflict.
// chatRoomSchema.index(
//   { "participants.0": 1, "participants.1": 1 },
//   { unique: true, sparse: true }
// );

export default mongoose.model("ChatRoom", chatRoomSchema);

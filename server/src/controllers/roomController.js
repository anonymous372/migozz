import Room from "../models/Room.js";
import User from "../models/User.js";
import { API_RESPONSE } from "../utils/constants.js";
import { nanoid } from "nanoid";

const generateRoomCode = async () => {
  let roomCode;
  let roomExists = true;
  while (roomExists) {
    roomCode = nanoid(8); // Generates an 8-character code (e.g., "4f-Gv_Zq")
    roomExists = await Room.findOne({ roomCode });
  }
  return roomCode;
};

export const createRoom = async (req, res) => {
  try {
    const { name } = req.body;
    const adminId = req.user._id; // _id from authMiddleware

    if (!name) {
      return res.status(400).json(API_RESPONSE(400, null, "Validation Error", "Room name is required"));
    }

    const roomCode = await generateRoomCode();

    const newRoom = await Room.create({
      name,
      roomCode,
      admin: adminId,
      members: [adminId], // Creator is the first member
    });

    res.status(201).json(API_RESPONSE(201, { room: newRoom }, null, "Room created successfully"));
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json(API_RESPONSE(500, null, "Internal Server Error", "Failed to create room"));
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.body;
    const userId = req.user._id;

    if (!roomCode) {
      return res.status(400).json(API_RESPONSE(400, null, "Validation Error", "Room code is required"));
    }

    const room = await Room.findOne({ roomCode });
    if (!room) {
      return res.status(404).json(API_RESPONSE(404, null, "Not Found", "Room not found with this code"));
    }

    if (room.members.includes(userId)) {
      // User is already in the room, just return success
      return res.status(200).json(API_RESPONSE(200, { room }, null, "You are already a member of this room"));
    }

    room.members.push(userId);
    await room.save();
    
    const populatedRoom = await Room.findById(room._id)
      .populate("members", "username avatar isOnline")
      .populate("admin", "username");

    res.status(200).json(API_RESPONSE(200, { room: populatedRoom }, null, "Joined room successfully"));
  } catch (error) {
    console.error("Join room error:", error);
    res.status(500).json(API_RESPONSE(500, null, "Internal Server Error", "Failed to join room"));
  }
};

export const getMyRooms = async (req, res) => {
  try {
    const userId = req.user._id;

    const rooms = await Room.find({ members: userId })
      .populate("admin", "username")
      .populate("lastMessage")
      .sort({ lastActivity: -1 });

    res.status(200).json(API_RESPONSE(200, { rooms }, null, "Rooms retrieved successfully"));
  } catch (error) {
    console.error("Get my rooms error:", error);
    res.status(500).json(API_RESPONSE(500, null, "Internal Server Error", "Failed to get rooms"));
  }
};
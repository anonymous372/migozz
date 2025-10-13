import { API_RESPONSE } from "../utils/constants.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import ChatRoom from "../models/ChatRoom.js";

// Send message
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType = "text" } = req.body;
    const senderId = req.user.id;

    if (senderId === receiverId) {
      return res
        .status(400)
        .json(
          API_RESPONSE(
            400,
            null,
            "Validation Error",
            "Cannot send message to yourself"
          )
        );
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res
        .status(404)
        .json(API_RESPONSE(404, null, "Not Found", "Receiver not found"));
    }

    // Check if users are friends
    const sender = await User.findById(senderId);
    if (!sender.friends.includes(receiverId)) {
      return res
        .status(403)
        .json(
          API_RESPONSE(
            403,
            null,
            "Forbidden",
            "You can only message your friends"
          )
        );
    }

    // Create message
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      messageType,
    });

    // Find or create chat room
    let chatRoom = await ChatRoom.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!chatRoom) {
      chatRoom = await ChatRoom.create({
        participants: [senderId, receiverId],
        lastMessage: message._id,
        lastActivity: new Date(),
      });
    } else {
      chatRoom.lastMessage = message._id;
      chatRoom.lastActivity = new Date();
      await chatRoom.save();
    }

    // Populate sender info for response
    await message.populate("sender", "username avatar");

    res
      .status(201)
      .json(API_RESPONSE(201, { message }, null, "Message sent successfully"));
  } catch (error) {
    console.error("Send message error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to send message"
        )
      );
  }
};

// Get messages between two users
export const getMessages = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // Check if users are friends
    const user = await User.findById(userId);
    if (!user.friends.includes(friendId)) {
      return res
        .status(403)
        .json(
          API_RESPONSE(
            403,
            null,
            "Forbidden",
            "You can only view messages with your friends"
          )
        );
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
    })
      .populate("sender", "username avatar")
      .populate("receiver", "username avatar")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      { sender: friendId, receiver: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res
      .status(200)
      .json(
        API_RESPONSE(
          200,
          { messages: messages.reverse() },
          null,
          "Messages retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Get messages error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to get messages"
        )
      );
  }
};

// Get chat rooms for user
export const getChatRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const chatRooms = await ChatRoom.find({
      participants: userId,
      isActive: true,
    })
      .populate("participants", "username email avatar isOnline lastSeen")
      .populate("lastMessage")
      .sort({ lastActivity: -1 });

    res
      .status(200)
      .json(
        API_RESPONSE(
          200,
          { chatRooms },
          null,
          "Chat rooms retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Get chat rooms error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to get chat rooms"
        )
      );
  }
};

// Mark messages as read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    await Message.updateMany(
      { sender: friendId, receiver: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res
      .status(200)
      .json(API_RESPONSE(200, null, null, "Messages marked as read"));
  } catch (error) {
    console.error("Mark messages as read error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to mark messages as read"
        )
      );
  }
};

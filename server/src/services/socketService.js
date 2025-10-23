import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Store connected users
const connectedUsers = new Map();

// Socket.io authentication middleware
export const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return next(new Error("Authentication error: User not found"));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication error: Invalid token"));
  }
};

// Handle socket connections
export const handleConnection = (io) => {
  return (socket) => {
    console.log(`User ${socket.user.username} connected`);

    // Store user connection
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      isOnline: true,
    });

    // Update user online status in database
    User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date(),
    }).exec();

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Notify friends about online status
    socket.broadcast.emit("user_online", {
      userId: socket.userId,
      username: socket.user.username,
      avatar: socket.user.avatar,
    });

    // Handle sending messages (receiving it on server)
    socket.on("send_message", async (data) => {
      try {
        const { receiverId, content, messageType = "text" } = data;

        // Check if users are friends
        const sender = await User.findById(socket.userId);
        if (!sender.friends.includes(receiverId)) {
          socket.emit("error", {
            message: "You can only message your friends",
          });
          return;
        }

        // Get receiver info
        const receiver = await User.findById(receiverId);
        if (!receiver) {
          socket.emit("error", { message: "Receiver not found" });
          return;
        }

        // Create message object
        const message = {
          sender: socket.userId,
          receiver: receiverId,
          content,
          messageType,
          timestamp: new Date(),
          senderInfo: {
            username: socket.user.username,
            avatar: socket.user.avatar,
          },
        };

        // Send to receiver if online (this new_message event will be handled on client side)
        const receiverConnection = connectedUsers.get(receiverId);
        if (receiverConnection) {
          io.to(receiverConnection.socketId).emit("new_message", message);
        }

        // Send confirmation to sender (same client who sent the message)
        socket.emit("message_sent", message);

        // Broadcast to room if it's a group chat (for future implementation)
        // io.to(`chat_${[socket.userId, receiverId].sort().join("_")}`).emit(
        //   "new_message",
        //   message
        // );
      } catch (error) {
        console.error("Send message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle typing indicators
    socket.on("typing_start", (data) => {
      const { receiverId } = data;
      const receiverConnection = connectedUsers.get(receiverId);

      if (receiverConnection) {
        io.to(receiverConnection.socketId).emit("user_typing", {
          userId: socket.userId,
          username: socket.user.username,
        });
      }
    });

    socket.on("typing_stop", (data) => {
      const { receiverId } = data;
      const receiverConnection = connectedUsers.get(receiverId);

      if (receiverConnection) {
        io.to(receiverConnection.socketId).emit("user_stop_typing", {
          userId: socket.userId,
        });
      }
    });

    // Handle friend request notifications
    socket.on("friend_request_sent", (data) => {
      const { recipientId } = data;
      const recipientConnection = connectedUsers.get(recipientId);

      if (recipientConnection) {
        io.to(recipientConnection.socketId).emit("new_friend_request", {
          requesterId: socket.userId,
          requesterUsername: socket.user.username,
          requesterAvatar: socket.user.avatar,
        });
      }
    });

    // Handle read status updates
    socket.on("messages_read", async (data) => {
      try {
        const { senderId } = data;

        // Notify the sender that their messages have been read
        const senderConnection = connectedUsers.get(senderId);
        if (senderConnection) {
          io.to(senderConnection.socketId).emit("messages_read_by", {
            readerId: socket.userId,
            readerUsername: socket.user.username,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error("Read status update error:", error);
      }
    });


    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(`User ${socket.user.username} disconnected`);

      // Remove from connected users
      connectedUsers.delete(socket.userId);

      // Update user offline status in database
      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date(),
      }).exec();

      // Notify friends about offline status
      socket.broadcast.emit("user_offline", {
        userId: socket.userId,
        username: socket.user.username,
      });
    });
  };
};

// Get connected users
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.values());
};

// Get user connection
export const getUserConnection = (userId) => {
  return connectedUsers.get(userId);
};

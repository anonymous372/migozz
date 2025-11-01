import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Room from "../models/Room.js";

// Store connected users
const connectedUsers = new Map();
const tictactoeGames = new Map();
const activeGroupCalls = new Map();

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
  return async (socket) => {
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
    // socket.broadcast.emit("user_online", {
    //   userId: socket.userId,
    //   username: socket.user.username,
    //   avatar: socket.user.avatar,
    // });

    if (socket.user.friends && socket.user.friends.length > 0) {
      const friendRooms = socket.user.friends.map(
        (friendId) => `user_${friendId.toString()}`
      );
      socket.to(friendRooms).emit("user_online", {
        userId: socket.userId,
        username: socket.user.username,
        avatar: socket.user.avatar,
      });
    }

    // --- JOIN USER TO ALL THEIR ROOMS ---
    try {
      const userRooms = await Room.find({ members: socket.userId });
      userRooms.forEach((room) => {
        socket.join(room._id.toString());
        console.log(`User ${socket.user.username} joined room: ${room.name}`);
      });
    } catch (error) {
      console.error("Error joining user to rooms:", error);
    }

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

    // --- Handle Room Messages ---
    socket.on("send_room_message", (data) => {
      try {
        const { roomId, content, messageType, senderInfo } = data;

        // Create message object to broadcast
        const message = {
          sender: socket.userId,
          room: roomId,
          content,
          messageType,
          timestamp: new Date(),
          senderInfo: senderInfo,
          // Note: The API call already saved this to the DB.
          // This socket handler is just for real-time relay.
        };

        // Emit to everyone in the room *except* the sender
        socket.to(roomId).emit("new_room_message", message);
      } catch (error) {
        console.error("Send room message error:", error);
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

    socket.on("room_typing_start", (data) => {
      const { roomId } = data;
      socket.to(roomId).emit("user_typing_in_room", {
        roomId,
        userId: socket.userId,
        username: socket.user.username,
      });
    });

    socket.on("room_typing_stop", (data) => {
      const { roomId } = data;
      socket.to(roomId).emit("user_stop_typing_in_room", {
        roomId,
        userId: socket.userId,
      });
    });

    // Handle file messages
    socket.on("file_message_sent", (data) => {
      try {
        const { receiverId, message } = data;
        const receiverConnection = connectedUsers.get(receiverId);

        if (receiverConnection) {
          io.to(receiverConnection.socketId).emit("new_message", message);
        }
      } catch (error) {
        console.error("File message relay error:", error);
      }
    });

    socket.on("room_file_message_sent", (data) => {
      try {
        const { roomId, message } = data;
        // Emit the full message object (from DB) to others in the room
        socket.to(roomId).emit("new_room_message", message);
      } catch (error) {
        console.error("Room file message relay error:", error);
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

    socket.on("video_call_offer", (data) => {
      const { receiverId, callerInfo } = data;
      const receiverConnection = connectedUsers.get(receiverId);

      if (receiverConnection) {
        io.to(receiverConnection.socketId).emit("video_call_offer", {
          callerInfo, // Contains user object of the caller
        });
      }
      // Optional: Add a "user is offline" emit back to the caller
    });

    // Handle a user accepting a call
    socket.on("video_call_accept", (data) => {
      const { callerId, accepterInfo } = data;
      const callerConnection = connectedUsers.get(callerId);

      if (callerConnection) {
        io.to(callerConnection.socketId).emit("video_call_accept", {
          accepterInfo, // Contains user object of the person who accepted
        });
      }
    });

    // Handle a user rejecting a call
    socket.on("video_call_reject", (data) => {
      const { callerId } = data;
      const callerConnection = connectedUsers.get(callerId);

      if (callerConnection) {
        io.to(callerConnection.socketId).emit("video_call_reject", {
          rejectedBy: socket.user.username,
        });
      }
    });

    socket.on("video_call_end", (data) => {
      const { receiverId } = data;
      const receiverConnection = connectedUsers.get(receiverId);

      if (receiverConnection) {
        // Notify the other user that the call has ended
        io.to(receiverConnection.socketId).emit("video_call_end", {
          enderId: socket.userId,
        });
      }
    });

    socket.on("video_call_cancel", (data) => {
      const { receiverId } = data;
      const receiverConnection = connectedUsers.get(receiverId);

      if (receiverConnection) {
        // Notify the receiver to close their incoming call modal
        io.to(receiverConnection.socketId).emit("video_call_cancel", {
          cancelerId: socket.userId,
        });
      }
    });

    // Handle a user offering an audio call
    socket.on("audio_call_offer", (data) => {
      const { receiverId, callerInfo } = data;
      const receiverConnection = connectedUsers.get(receiverId);

      if (receiverConnection) {
        io.to(receiverConnection.socketId).emit("audio_call_offer", {
          callerInfo,
        });
      }
    });

    // Handle a user accepting an audio call
    socket.on("audio_call_accept", (data) => {
      const { callerId, accepterInfo } = data;
      const callerConnection = connectedUsers.get(callerId);

      if (callerConnection) {
        io.to(callerConnection.socketId).emit("audio_call_accept", {
          accepterInfo,
        });
      }
    });

    // Handle a user rejecting an audio call
    socket.on("audio_call_reject", (data) => {
      const { callerId } = data;
      const callerConnection = connectedUsers.get(callerId);

      if (callerConnection) {
        io.to(callerConnection.socketId).emit("audio_call_reject", {
          rejectedBy: socket.user.username,
        });
      }
    });

    // Handle a user canceling an audio call
    socket.on("audio_call_cancel", (data) => {
      const { receiverId } = data;
      const receiverConnection = connectedUsers.get(receiverId);

      if (receiverConnection) {
        io.to(receiverConnection.socketId).emit("audio_call_cancel", {
          cancelerId: socket.userId,
        });
      }
    });

    // Handle a user ending an audio call
    socket.on("audio_call_end", (data) => {
      const { receiverId } = data;
      const receiverConnection = connectedUsers.get(receiverId);

      if (receiverConnection) {
        io.to(receiverConnection.socketId).emit("audio_call_end", {
          enderId: socket.userId,
        });
      }
    });

    // --- 4. ADD GROUP CALL HANDLERS (Add this entire block) ---
    socket.on("group_call_start", (data) => {
      const { roomId, callType } = data;

      // Set this call as active
      activeGroupCalls.set(roomId, {
        callType,
        members: [{ id: socket.userId, user: socket.user }],
      });

      // Tell the caller they started the call
      socket.emit("group_call_you_started", {
        roomId,
        roomName: data.roomName, // Pass name along
        callType,
        members: [], // No one else is in yet
      });

      // Tell everyone else in the room a call has started
      socket.to(roomId).emit("group_call_offer", {
        roomId,
        roomName: data.roomName,
        callType,
        caller: socket.user,
      });
    });

    socket.on("group_call_join", (data) => {
      const { roomId } = data;
      const call = activeGroupCalls.get(roomId);

      if (!call) return; // Call doesn't exist

      const existingMembers = call.members.map((m) => m.id);

      // Tell the new member who is already in the call
      socket.emit("group_call_you_joined", {
        roomId,
        roomName: data.roomName,
        callType: call.callType,
        members: existingMembers, // Tell new user to call everyone
      });

      // Tell everyone else a new member joined
      socket.to(roomId).emit("group_call_new_member", {
        roomId,
        newMemberId: socket.userId,
      });

      // Add new member to the list
      call.members.push({ id: socket.userId, user: socket.user });
    });

    socket.on("group_call_leave", (data) => {
      const { roomId } = data;
      const call = activeGroupCalls.get(roomId);

      if (!call) return;

      // Remove member from list
      call.members = call.members.filter((m) => m.id !== socket.userId);

      // Tell remaining members who left
      socket.to(roomId).emit("group_call_member_left", {
        roomId,
        userId: socket.userId,
      });

      // If no one is left, end the call
      if (call.members.length === 0) {
        activeGroupCalls.delete(roomId);
      }
    });

    socket.on("group_call_track_state_changed", (data) => {
      const { roomId, trackType, isEnabled } = data;
      // Broadcast to others in the room
      socket.to(roomId).emit("group_call_track_state_changed", {
        peerId: socket.userId, // Tell others *who* changed state
        trackType, // 'audio' or 'video'
        isEnabled, // true or false
      });
    });

    socket.on("tictactoe_create_game", () => {
      try {
        // Generate a random, simple room code
        const roomCode = Math.random()
          .toString(36)
          .substring(2, 8)
          .toUpperCase();

        // Ensure code is unique (highly-unlikely collision, but good practice)
        if (tictactoeGames.has(roomCode)) {
          // You could retry generating, but for now, just send an error
          socket.emit(
            "tictactoe_error",
            "Failed to create room, please try again."
          );
          console.log("Shit went down");
          return;
        }

        // Player X is the creator
        const game = {
          roomCode,
          players: [{ id: socket.userId, user: socket.user, symbol: "X" }],
          squares: Array(9).fill(null),
          turn: "X", // X always starts
          status: "waiting",
        };

        tictactoeGames.set(roomCode, game);
        socket.join(roomCode); // Have the creator join the socket.io room

        // Send the room code back to the creator
        socket.emit("tictactoe_game_created", { roomCode, playerSymbol: "X" });
      } catch (error) {
        console.error("Error creating Tic Tac Toe game:", error);
        socket.emit(
          "tictactoe_error",
          "An error occurred while creating the game."
        );
      }
    });

    socket.on("tictactoe_join_game", (data) => {
      try {
        const { roomCode } = data;
        const game = tictactoeGames.get(roomCode);

        if (!game) {
          socket.emit("tictactoe_error", "Room not found.");
          return;
        }

        if (game.players.length >= 2) {
          socket.emit("tictactoe_error", "Room is full.");
          return;
        }

        // Player O is the joiner
        const playerO = { id: socket.userId, user: socket.user, symbol: "O" };
        game.players.push(playerO);
        game.status = "playing";

        socket.join(roomCode);

        const playerX = game.players[0];

        // Prepare simplified user info for clients
        const payload = {
          roomCode,
          squares: game.squares,
          turn: game.turn,
          players: [
            { user: playerX.user, symbol: playerX.symbol },
            { user: playerO.user, symbol: playerO.symbol },
          ],
        };

        // Emit 'game_start' to EVERYONE in the room (both players)
        io.to(roomCode).emit("tictactoe_game_start", payload);
      } catch (error) {
        console.error("Error joining Tic Tac Toe game:", error);
        socket.emit(
          "tictactoe_error",
          "An error occurred while joining the game."
        );
      }
    });

    socket.on("tictactoe_make_move", (data) => {
      try {
        const { roomCode, index } = data;
        const game = tictactoeGames.get(roomCode);

        if (!game || game.status !== "playing") return;

        // Find which player is making the move
        const player = game.players.find((p) => p.id === socket.userId);
        if (!player) return; // Not a player in this game

        // Validate move
        if (game.turn !== player.symbol || game.squares[index]) {
          // Invalid move (not your turn, or square taken)
          // Optionally emit an error back to the player
          socket.emit("tictactoe_error", "Invalid move.");
          return;
        }

        // Apply move
        game.squares[index] = player.symbol;
        game.turn = player.symbol === "X" ? "O" : "X";

        // Check for winner (you'll need to move calculateWinner to the server or duplicate it)
        // Let's assume you have a calculateWinner function available here
        // const winner = calculateWinner(game.squares);
        // For now, we'll just broadcast the state. Client can calculate winner.

        const payload = {
          squares: game.squares,
          turn: game.turn,
          // winner: winner // (optional: calculate on server)
        };

        // Broadcast the updated state to EVERYONE in the room
        io.to(roomCode).emit("tictactoe_update_state", payload);
      } catch (error) {
        console.error("Error making move:", error);
        socket.emit(
          "tictactoe_error",
          "An error occurred while making your move."
        );
      }
    });

    socket.on("tictactoe_request_rematch", (data) => {
      try {
        const { roomCode } = data;
        // Emit to everyone *else* in the room
        socket.to(roomCode).emit("tictactoe_rematch_requested");
      } catch (error) {
        console.error("Rematch request error:", error);
      }
    });

    socket.on("tictactoe_accept_rematch", (data) => {
      try {
        const { roomCode } = data;
        const game = tictactoeGames.get(roomCode);

        if (game) {
          // Reset the game state
          game.squares = Array(9).fill(null);
          game.turn = Math.random() < 0.5 ? "X" : "O"; // Randomize start
          game.status = "playing";

          const payload = {
            squares: game.squares,
            turn: game.turn,
          };

          // Emit the reset state to *everyone* in the room
          io.to(roomCode).emit("tictactoe_game_reset", payload);
        }
      } catch (error) {
        console.error("Rematch accept error:", error);
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
      // socket.broadcast.emit("user_offline", {
      //   userId: socket.userId,
      //   username: socket.user.username,
      // });

      if (socket.user.friends && socket.user.friends.length > 0) {
        const friendRooms = socket.user.friends.map(
          (friendId) => `user_${friendId.toString()}`
        );
        socket.to(friendRooms).emit("user_offline", {
          userId: socket.userId,
          username: socket.user.username,
        });
      }

      for (const [roomId, call] of activeGroupCalls.entries()) {
        const memberIndex = call.members.findIndex(
          (m) => m.id === socket.userId
        );

        if (memberIndex !== -1) {
          // Remove the member
          call.members.splice(memberIndex, 1);

          // Notify remaining members
          socket.to(roomId).emit("group_call_member_left", {
            roomId,
            userId: socket.userId,
          });

          // If call is now empty, delete it
          if (call.members.length === 0) {
            activeGroupCalls.delete(roomId);
          }
          break; // User can only be in one call at a time
        }
      }

      for (const [roomCode, game] of tictactoeGames.entries()) {
        const playerInGame = game.players.find((p) => p.id === socket.userId);

        if (playerInGame) {
          // Notify the other player
          socket.to(roomCode).broadcast.emit("tictactoe_opponent_left");
          // Remove the game
          tictactoeGames.delete(roomCode);
          break; // User can only be in one game
        }
      }
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

import { io } from "socket.io-client";
import { SOCKET_BASE_URL } from "../constants";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io(SOCKET_BASE_URL, {
      auth: {
        token: token,
      },
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("Connected to server");
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Message events (emit send msg to the server)
  sendMessage(receiverId, content, messageType = "text") {
    if (this.socket && this.isConnected) {
      this.socket.emit("send_message", {
        receiverId,
        content,
        messageType,
      });
    }
  }

  // listens for "new_message" from server (someone sent you a message).
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  onMessageSent(callback) {
    if (this.socket) {
      this.socket.on("message_sent", callback);
    }
  }

  // Typing events
  startTyping(receiverId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_start", { receiverId });
    }
  }

  stopTyping(receiverId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_stop", { receiverId });
    }
  }

  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on("user_typing", callback);
    }
  }

  onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on("user_stop_typing", callback);
    }
  }

  // Friend events
  sendFriendRequest(recipientId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("friend_request_sent", { recipientId });
    }
  }

  onNewFriendRequest(callback) {
    if (this.socket) {
      this.socket.on("new_friend_request", callback);
    }
  }

  // Read status events
  markMessagesAsRead(senderId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("messages_read", { senderId });
    }
  }

  onMessagesRead(callback) {
    if (this.socket) {
      this.socket.on("messages_read", callback);
    }
  }

  onMessagesReadBy(callback) {
    if (this.socket) {
      this.socket.on("messages_read_by", callback);
    }
  }

  // Online status events
  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on("user_online", callback);
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on("user_offline", callback);
    }
  }

  offerVideoCall(receiverId, callerInfo) {
    if (this.socket && this.isConnected) {
      this.socket.emit("video_call_offer", { receiverId, callerInfo });
    }
  }

  acceptVideoCall(callerId, accepterInfo) {
    if (this.socket && this.isConnected) {
      this.socket.emit("video_call_accept", { callerId, accepterInfo });
    }
  }

  rejectVideoCall(callerId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("video_call_reject", { callerId });
    }
  }

  onVideoCallOffer(callback) {
    if (this.socket) {
      this.socket.on("video_call_offer", callback);
    }
  }

  onVideoCallAccept(callback) {
    if (this.socket) {
      this.socket.on("video_call_accept", callback);
    }
  }

  onVideoCallReject(callback) {
    if (this.socket) {
      this.socket.on("video_call_reject", callback);
    }
  }

  endVideoCall(receiverId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("video_call_end", { receiverId });
    }
  }

  onVideoCallEnd(callback) {
    if (this.socket) {
      this.socket.on("video_call_end", callback);
    }
  }

  cancelVideoCall(receiverId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("video_call_cancel", { receiverId });
    }
  }

  onVideoCallCancel(callback) {
    if (this.socket) {
      this.socket.on("video_call_cancel", callback);
    }
  }

  offerAudioCall(receiverId, callerInfo) {
    if (this.socket && this.isConnected) {
      this.socket.emit("audio_call_offer", { receiverId, callerInfo });
    }
  }

  acceptAudioCall(callerId, accepterInfo) {
    if (this.socket && this.isConnected) {
      this.socket.emit("audio_call_accept", { callerId, accepterInfo });
    }
  }

  rejectAudioCall(callerId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("audio_call_reject", { callerId });
    }
  }

  cancelAudioCall(receiverId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("audio_call_cancel", { receiverId });
    }
  }

  endAudioCall(receiverId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("audio_call_end", { receiverId });
    }
  }

  onAudioCallOffer(callback) {
    if (this.socket) {
      this.socket.on("audio_call_offer", callback);
    }
  }

  onAudioCallAccept(callback) {
    if (this.socket) {
      this.socket.on("audio_call_accept", callback);
    }
  }

  onAudioCallReject(callback) {
    if (this.socket) {
      this.socket.on("audio_call_reject", callback);
    }
  }

  onAudioCallCancel(callback) {
    if (this.socket) {
      this.socket.on("audio_call_cancel", callback);
    }
  }

  onAudioCallEnd(callback) {
    if (this.socket) {
      this.socket.on("audio_call_end", callback);
    }
  }

  // --- Tic Tac Toe Emitters ---
  createTicTacToeGame() {
    if (this.socket && this.isConnected) {
      this.socket.emit("tictactoe_create_game");
    }
  }

  joinTicTacToeGame(roomCode) {
    if (this.socket && this.isConnected) {
      this.socket.emit("tictactoe_join_game", { roomCode });
    }
  }

  makeTicTacToeMove(roomCode, index) {
    if (this.socket && this.isConnected) {
      this.socket.emit("tictactoe_make_move", { roomCode, index });
    }
  }

  // --- Tic Tac Toe Listeners ---
  onTicTacToeGameCreated(callback) {
    if (this.socket) {
      this.socket.on("tictactoe_game_created", callback);
    }
  }

  onTicTacToeGameStart(callback) {
    if (this.socket) {
      this.socket.on("tictactoe_game_start", callback);
    }
  }

  onTicTacToeUpdateState(callback) {
    if (this.socket) {
      this.socket.on("tictactoe_update_state", callback);
    }
  }

  onTicTacToeOpponentLeft(callback) {
    if (this.socket) {
      this.socket.on("tictactoe_opponent_left", callback);
    }
  }

  onTicTacToeError(callback) {
    if (this.socket) {
      this.socket.on("tictactoe_error", callback);
    }
  }

  // Helper to remove all game listeners
  removeAllTicTacToeListeners() {
    if (this.socket) {
      this.socket.off("tictactoe_game_created");
      this.socket.off("tictactoe_game_start");
      this.socket.off("tictactoe_update_state");
      this.socket.off("tictactoe_opponent_left");
      this.socket.off("tictactoe_error");
    }
  }

  // Error handling
  onError(callback) {
    if (this.socket) {
      this.socket.on("error", callback);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Remove a specific listener for an event
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketService();

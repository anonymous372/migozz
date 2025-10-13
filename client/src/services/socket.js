import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    this.socket = io("http://localhost:5001", {
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

  // Message events
  sendMessage(receiverId, content, messageType = "text") {
    if (this.socket && this.isConnected) {
      this.socket.emit("send_message", {
        receiverId,
        content,
        messageType,
      });
    }
  }

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
}

export default new SocketService();

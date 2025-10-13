import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import apiService from "../services/api";
import socketService from "../services/socket";
import { useAuth } from "../context/AuthContext";

const ChatWindow = ({ friend, onClose }) => {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await apiService.getMessages(friend._id);
        if (response.status === 200) {
          setMessages(response.data.messages);
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Set up socket listeners for this chat
    const handleNewMessage = (message) => {
      const currentUserId = user._id || user.id;
      // Only add message if it's from the friend or to the friend, and not from current user
      if (
        (message.sender === friend._id || message.receiver === friend._id) &&
        message.sender !== currentUserId
      ) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleUserTyping = (data) => {
      if (data.userId === friend._id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.userId === friend._id) {
        setIsTyping(false);
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);
    socketService.onUserStopTyping(handleUserStopTyping);

    // Mark messages as read
    apiService.markMessagesAsRead(friend._id);

    return () => {
      socketService.removeAllListeners();
    };
  }, [friend._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage("");

    try {
      // Optimistically add message
      const currentUserId = user._id || user.id;
      const tempMessage = {
        _id: Date.now(),
        sender: currentUserId, // Use actual user ID
        receiver: friend._id,
        content: messageContent,
        timestamp: new Date(),
        senderInfo: {
          username: user.username || "You",
          avatar: user.avatar || "",
        },
        // Add a flag to identify this as a temp message
        isTemp: true,
      };

      setMessages((prev) => [...prev, tempMessage]);

      // Send via socket
      socketService.sendMessage(friend._id, messageContent);

      // Also send via API for persistence
      const response = await apiService.sendMessage(friend._id, messageContent);
      if (response.status === 201) {
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg._id === tempMessage._id) {
              return response.data.message;
            }
            return msg;
          })
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg._id !== tempMessage._id));
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!typing) {
      setTyping(true);
      socketService.startTyping(friend._id);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      socketService.stopTyping(friend._id);
    }, 1000);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Helper function to check if message is from current user
  const isCurrentUserMessage = (message) => {
    const currentUserId = user.id || user._id; // Auth context uses 'id', not '_id'

    // Debug logging to understand message structure
    console.log("Message debug:", {
      messageSender: message.sender,
      messageSenderType: typeof message.sender,
      currentUserId,
      currentUserObject: user,
      isTemp: message.isTemp,
    });

    // Handle different message sender formats:
    // 1. Temp messages (from optimistic updates)
    if (message.isTemp === true) {
      return true;
    }

    // 2. Messages with populated sender object (from server)
    if (message.sender && typeof message.sender === "object") {
      return (
        message.sender._id === currentUserId ||
        message.sender.id === currentUserId
      );
    }

    // 3. Messages with sender as string ID (direct comparison)
    return (
      message.sender === currentUserId ||
      message.sender === currentUserId?.toString()
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Loading messages...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 lg:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {friend.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {friend.username}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {friend.isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length > 0 ? (
          messages.map((message, index) => {
            const isCurrentUser = isCurrentUserMessage(message);
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showSenderName =
              !prevMessage ||
              isCurrentUserMessage(prevMessage) !== isCurrentUser ||
              new Date(message.timestamp) - new Date(prevMessage.timestamp) >
                300000; // 5 minutes

            return (
              <div
                key={message._id}
                className={`flex ${
                  isCurrentUser ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex flex-col max-w-xs lg:max-w-md">
                  {/* Sender name - only show when needed */}
                  {showSenderName && (
                    <div
                      className={`text-xs mb-1 ${
                        isCurrentUser
                          ? "text-right text-blue-600 dark:text-blue-400"
                          : "text-left text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {isCurrentUser
                        ? "You"
                        : message.senderInfo?.username || friend.username}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      isCurrentUser
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isCurrentUser
                          ? "text-blue-100"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {friend.username} is typing...
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;

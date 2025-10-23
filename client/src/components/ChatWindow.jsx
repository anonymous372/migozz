import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Send, ArrowLeft, Phone, Video, MoreVertical } from "lucide-react";
import apiService from "../services/api";
import socketService from "../services/socket";
import { useAuth } from "../context/AuthContext";
import peerService from "../services/peerService";
import VideoCallModal from "./VideoCallModal";

const ChatWindow = ({
  friend,
  onClose,
  onUnreadUpdate,
  sidebarCollapsed = false,
}) => {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingVisible, setTypingVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const readTimeoutRef = useRef(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Clear UI synchronously before paint when switching chats to avoid flashing old messages
  useLayoutEffect(() => {
    setLoading(true);
    setMessages([]);
    setUnreadCount(0);
    setIsTyping(false);
  }, [friend._id]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await apiService.getMessages(friend._id);
        if (response.status === 200) {
          const messages = response.data.messages;
          setMessages(messages);

          // Calculate unread count (messages from friend that are not read)
          const unread = messages.filter((msg) => {
            const isFromFriend = !isCurrentUserMessage(msg);
            return isFromFriend && !msg.isRead;
          }).length;

          setUnreadCount(unread);
          // Notify parent component of unread count
          if (onUnreadUpdate) {
            onUnreadUpdate(friend._id, unread);
          }
        }
      } catch (error) {
        console.error("Error loading messages:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();

    // Debounced function to mark messages as read
    const debouncedMarkAsRead = () => {
      // Clear existing timeout
      if (readTimeoutRef.current) {
        clearTimeout(readTimeoutRef.current);
      }

      // Set new timeout to mark as read after a short delay
      readTimeoutRef.current = setTimeout(async () => {
        try {
          await apiService.markMessagesAsRead(friend._id);
          // Update local messages to mark them as read
          setMessages((prev) =>
            prev.map((msg) => {
              const isFromFriendMsg = !isCurrentUserMessage(msg);
              if (isFromFriendMsg && !msg.isRead) {
                return { ...msg, isRead: true, readAt: new Date() };
              }
              return msg;
            })
          );

          // Notify the friend that their messages have been read
          socketService.markMessagesAsRead(friend._id);

          // Reset unread count and notify parent
          setUnreadCount(0);
          if (onUnreadUpdate) {
            onUnreadUpdate(friend._id, 0);
          }
        } catch (error) {
          console.error("Error auto-marking messages as read:", error);
        }
      }, 500); // 500ms delay to allow for multiple rapid messages
    };

    // Set up socket listeners for this chat
    const handleNewMessage = (message) => {
      const currentUserId = user._id || user.id;
      // Only add message if it's from the friend or to the friend, and not from current user
      if (
        (message.sender === friend._id || message.receiver === friend._id) &&
        message.sender !== currentUserId
      ) {
        setMessages((prev) => {
          const newMessages = [...prev, message];
          return newMessages;
        });

        // If message is from friend and not read, increment unread count and schedule read
        const isFromFriend =
          message.sender === friend._id ||
          (typeof message.sender === "object" &&
            message.sender._id === friend._id);
        if (isFromFriend && !message.isRead) {
          setUnreadCount((prev) => {
            const newCount = prev + 1;
            if (onUnreadUpdate) {
              onUnreadUpdate(friend._id, newCount);
            }
            return newCount;
          });

          // Schedule automatic read marking since chat window is open and active
          debouncedMarkAsRead();
        }
      }
    };

    const handleUserTyping = (data) => {
      if (data.userId === friend._id) {
        // Show typing indicator
        setIsTyping(true);
        setTypingVisible(true); // immediately show (for fade-in)

        // Clear any existing hide timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // Hide typing after a short idle period; keep indicator visible for a smooth fade-out
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          // Delay hiding the element slightly to allow CSS fade-out
          setTimeout(() => setTypingVisible(false), 220);
        }, 3000);
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.userId === friend._id) {
        setIsTyping(false);
        // give a small delay before hiding to allow a smooth fade
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        setTimeout(() => setTypingVisible(false), 220);
      }
    };

    // Register listeners and keep references so we can remove only these on cleanup
    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);
    socketService.onUserStopTyping(handleUserStopTyping);

    // Save listener references on the socket service so we can remove them later
    // (socket.io-client uses the same callback reference for off)

    // Handle real-time read status updates
    const handleMessagesReadBy = (data) => {
      // Only update if the reader is the current friend
      if (data.readerId === friend._id) {
        setMessages((prev) =>
          prev.map((msg) => {
            const isFromCurrentUser = isCurrentUserMessage(msg);
            // Update read status for messages sent by current user
            if (isFromCurrentUser && !msg.isRead) {
              return { ...msg, isRead: true, readAt: data.timestamp };
            }
            return msg;
          })
        );
      }
    };

    socketService.onMessagesReadBy(handleMessagesReadBy);

    // Mark messages as read when chat is opened
    const markMessagesAsRead = async () => {
      try {
        await apiService.markMessagesAsRead(friend._id);
        // Update local messages to mark them as read
        setMessages((prev) =>
          prev.map((msg) => {
            const isFromFriend = !isCurrentUserMessage(msg);
            if (isFromFriend && !msg.isRead) {
              return { ...msg, isRead: true, readAt: new Date() };
            }
            return msg;
          })
        );

        // Notify the friend that their messages have been read
        socketService.markMessagesAsRead(friend._id);

        // Reset unread count and notify parent
        setUnreadCount(0);
        if (onUnreadUpdate) {
          onUnreadUpdate(friend._id, 0);
        }
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    // Mark messages as read after a short delay to ensure UI is ready
    const readTimer = setTimeout(markMessagesAsRead, 1000);

    return () => {
      clearTimeout(readTimer);
      clearTimeout(readTimeoutRef.current);
      // Remove only the listeners we added for this chat
      socketService.off("new_message", handleNewMessage);
      socketService.off("user_typing", handleUserTyping);
      socketService.off("user_stop_typing", handleUserStopTyping);
      socketService.off("messages_read_by", handleMessagesReadBy);
    };
  }, [friend._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // When typing indicator appears/disappears, ensure we scroll to show it and then back to last message
  useEffect(() => {
    if (typingVisible) {
      // Wait a small amount for the typing DOM to render then scroll
      setTimeout(() => scrollToBottom(), 60);
    } else {
      // When typing hides, ensure the last real message is at bottom
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [isTyping]);

  // Mark messages as read when user focuses on the chat window
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // User returned to the tab/window, mark messages as read
        setTimeout(async () => {
          try {
            await apiService.markMessagesAsRead(friend._id);
            setMessages((prev) =>
              prev.map((msg) => {
                const isFromFriendMsg = !isCurrentUserMessage(msg);
                if (isFromFriendMsg && !msg.isRead) {
                  return { ...msg, isRead: true, readAt: new Date() };
                }
                return msg;
              })
            );
            socketService.markMessagesAsRead(friend._id);
            setUnreadCount(0);
            if (onUnreadUpdate) {
              onUnreadUpdate(friend._id, 0);
            }
          } catch (error) {
            console.error(
              "Error marking messages as read on visibility change:",
              error
            );
          }
        }, 500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [friend._id]);

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
        isRead: false, // New messages start as unread
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
      // Refocus input so user can continue typing without click
      // Ensure focus is restored after DOM updates; double rAF is robust across browsers
      try {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            inputRef.current?.focus();
          });
        });
      } catch (err) {
        // Fallback
        setTimeout(() => inputRef.current?.focus(), 0);
      }
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

  const handleVideoCall = () => {
    setVideoModalOpen(true);
  };

  // NOTE: don't early-return on loading — keep header and input visible
  // and show a loading UI inside the messages area so the whole chat window
  // (header + messages + input) fits within the 100vh.

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Fixed Chat Header */}
      <div className="h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-between flex-shrink-0">
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
          {/* <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button> */}
          <button
            onClick={handleVideoCall}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 chat-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Loading messages...
              </p>
            </div>
          </div>
        ) : messages.length > 0 ? (
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
                    <div className="flex items-center justify-end mt-1">
                      <p
                        className={`text-[10px] ${
                          isCurrentUser
                            ? "text-blue-100"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                      {/* Read/Unread status for current user's messages */}
                      {isCurrentUser && (
                        <div className="flex items-center ml-2">
                          {message.isRead ? (
                            <div className="relative w-5 h-4">
                              {/* First checkmark */}
                              <svg
                                className="absolute w-4 h-4 text-blue-200"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                style={{
                                  strokeWidth: "2px",
                                  stroke: "currentColor",
                                  fill: "none",
                                }}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 10l3 3 7-7"
                                  strokeWidth="2"
                                />
                              </svg>
                              {/* Second overlapping checkmark */}
                              <svg
                                className="absolute w-4 h-4 text-blue-200"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                style={{
                                  left: "4px",
                                  top: "0px",
                                  strokeWidth: "2px",
                                  stroke: "currentColor",
                                  fill: "none",
                                }}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 10l3 3 7-7"
                                  strokeWidth="2.5"
                                />
                              </svg>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <svg
                                className="w-4 h-4 text-blue-200"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                style={{
                                  strokeWidth: "2px",
                                  stroke: "currentColor",
                                  fill: "none",
                                }}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 10l3 3 7-7"
                                  strokeWidth="2"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={loading ? "Loading messages..." : "Type a message..."}
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || loading}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
      <VideoCallModal
        open={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        friend={friend}
        userId={user._id}
      />
    </div>
  );
};

export default ChatWindow;

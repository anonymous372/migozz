import { useState, useEffect, useRef, useLayoutEffect } from "react";
import {
  Send,
  ArrowLeft,
  Video,
  Phone,
  MoreVertical,
  Paperclip,
  Mic,
  StopCircle,
  Users,
  Link,
  Check,
} from "lucide-react";
import apiService from "../services/api";
import socketService from "../services/socket";
import { useAuth } from "../context/AuthContext";
import FileMessageDisplay from "./FileMessageDisplay";

// 1. PROPS: Changed 'friend' to 'room'
const GroupChatWindow = ({
  room,
  onClose,
  sidebarCollapsed = false,
  // onStartCall, // Group calls are a future feature
  // onStartAudioCall,
  handleStartGroupCall,
}) => {
  const { user } = useAuth();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [typing, setTyping] = useState(false);

  // 2. TYPING: state to hold typing users
  const [typingUsers, setTypingUsers] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 3. EFFECT: Changed dependency to room._id
  useLayoutEffect(() => {
    setLoading(true);
    setMessages([]);
    setTypingUsers([]);
  }, [room._id]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        // 4. API CALL: Changed to getRoomMessages
        const response = await apiService.getRoomMessages(room._id);
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

    // 5. SOCKETS: Updated all listeners for rooms
    const handleNewMessage = (message) => {
      // Check if the message belongs to this room
      if (message.room === room._id) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleUserTyping = (data) => {
      if (data.roomId === room._id) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.userId === data.userId)) {
            return [...prev, { userId: data.userId, username: data.username }];
          }
          return prev;
        });

        // Auto-remove typing user after delay
        setTimeout(() => {
          setTypingUsers((prev) =>
            prev.filter((u) => u.userId !== data.userId)
          );
        }, 3000);
      }
    };

    const handleUserStopTyping = (data) => {
      if (data.roomId === room._id) {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      }
    };

    // Use new room-specific listeners
    socketService.onNewRoomMessage(handleNewMessage);
    socketService.onUserTypingInRoom(handleUserTyping);
    socketService.onUserStopTypingInRoom(handleUserStopTyping);

    return () => {
      // 6. CLEANUP: Remove room-specific listeners
      socketService.off("new_room_message", handleNewMessage);
      socketService.off("user_typing_in_room", handleUserTyping);
      socketService.off("user_stop_typing_in_room", handleUserStopTyping);
    };
  }, [room._id]); // Dependency is room._id

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (typingUsers.length > 0) {
      setTimeout(() => scrollToBottom(), 60);
    }
  }, [typingUsers]);

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
      const tempMessage = {
        _id: Date.now(),
        sender: { _id: user._id, username: user.username, avatar: user.avatar },
        room: room._id,
        content: messageContent,
        messageType: "text",
        timestamp: new Date(),
        isTemp: true,
      };
      setMessages((prev) => [...prev, tempMessage]);

      // 7. SOCKET EMIT: Use sendRoomMessage
      socketService.sendRoomMessage(room._id, messageContent, "text", {
        username: user.username,
        avatar: user.avatar,
      });

      // 8. API CALL: Send with roomId
      const response = await apiService.sendMessage(
        null, // receiverId
        messageContent,
        "text",
        room._id // Pass roomId
      );

      if (response.status === 201) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === tempMessage._id ? response.data.message : msg
          )
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
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
      // 9. SOCKET EMIT: Use startRoomTyping
      socketService.startRoomTyping(room._id);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      // 10. SOCKET EMIT: Use stopRoomTyping
      socketService.stopRoomTyping(room._id);
    }, 1500);
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // 11. API CALL: Use uploadFile with roomId
      const response = await apiService.uploadFile(
        null, // receiverId
        file,
        newMessage,
        room._id // Pass roomId
      );

      if (response.status === 201) {
        const message = response.data.message;
        setMessages((prev) => [...prev, message]);

        // 12. SOCKET EMIT: Use roomFileMessageSent
        socketService.roomFileMessageSent(room._id, message);
        setNewMessage("");
      } else {
        alert(response.message || "Failed to upload files");
      }
    } catch (error) {
      console.error("File upload error:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleStartRecording = async () => {
    if (uploading || loading) return;

    try {
      // Get permission to use microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Check for supported mimetype
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/ogg",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      if (!mimeType) {
        alert("Your browser doesn't support audio recording.");
        return;
      }

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        // Stop all audio tracks to turn off the mic icon in the browser
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const audioFile = new File([audioBlob], "voice-note.webm", {
          type: mimeType,
        });

        setUploading(true);
        try {
          // 13. API CALL: Use uploadFile with roomId for voice note
          const response = await apiService.uploadFile(
            null, // receiverId
            audioFile,
            "", // caption
            room._id // Pass roomId
          );

          if (response.status === 201) {
            const message = response.data.message;
            setMessages((prev) => [...prev, message]);
            // 14. SOCKET EMIT: Use roomFileMessageSent
            socketService.roomFileMessageSent(room._id, message);
          } else {
            alert(response.message || "Failed to send voice note");
          }
        } catch (error) {
          console.error("Voice note upload error:", error);
          alert("Failed to send voice note");
        } finally {
          setUploading(false);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Could not access microphone. Please grant permission.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // 15. HELPER: This logic is the same
  const isCurrentUserMessage = (message) => {
    const currentUserId = user.id || user._id;
    if (message.isTemp === true) return true;
    if (message.sender && typeof message.sender === "object") {
      return message.sender._id === currentUserId;
    }
    return message.sender === currentUserId;
  };

  // 16. RENDER: Get typing users' names
  const getTypingText = () => {
    const names = typingUsers.map((u) => u.username);
    if (names.length === 0) return null;
    if (names.length === 1) return `${names[0]} is typing...`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing...`;
    return `${names.length} users are typing...`;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 17. HEADER: Show room info */}
      <div className="h-16 px-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 ...">
            <Users className="w-5 h-5 ..." />
          </div>
          <div>
            <h3 className="font-semibold ...">{room.name}</h3>
            <p className="text-sm ...">
              {room.members ? `${room.members.length} members` : "Group Chat"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyInviteCode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Copy Invite Code"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Link className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          {/* --- ADD CALL BUTTONS --- */}
          <button
            onClick={() => handleStartGroupCall(room, "audio")}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Start Group Audio Call"
          >
            <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => handleStartGroupCall(room, "video")}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Start Group Video Call"
          >
            <Video className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          {/* --- END CALL BUTTONS --- */}
          {/* Removed call buttons. Group calls are a separate feature. */}
          {/* <button className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"> */}
          {/* <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" /> */}
          {/* </button> */}
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
            // 18. RENDER: Show sender name if different from previous message
            const showSenderName =
              !prevMessage ||
              prevMessage.sender._id !== message.sender._id ||
              new Date(message.timestamp) - new Date(prevMessage.timestamp) >
                300000;

            return (
              <div
                key={message._id}
                className={`flex ${
                  isCurrentUser ? "justify-end" : "justify-start"
                }`}
              >
                <div className="flex flex-col max-w-xs lg:max-w-md">
                  {/* Sender name - Show if not current user and first message in block */}
                  {!isCurrentUser && showSenderName && (
                    <div className="text-xs mb-1 font-semibold mt-2 text-left text-gray-600 dark:text-gray-400">
                      {message.sender?.username ||
                        message.senderInfo?.username ||
                        "Unknown User"}
                    </div>
                  )}

                  {/* 19. RENDER: Use FileMessageDisplay (no changes) */}
                  {message.messageType !== "text" ? (
                    <FileMessageDisplay
                      message={message}
                      isCurrentUser={isCurrentUser}
                    />
                  ) : (
                    <div
                      className={`mb-1 px-4 py-2 rounded-lg ${
                        isCurrentUser
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 ..."
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-end mt-1">
                        <p
                          className={`text-[10px] ${
                            isCurrentUser
                              ? "text-blue-100"
                              : "text-gray-500 ..."
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                        {/* 20. RENDER: No read receipts for group chat */}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center ...">
            <p>No messages yet. Be the first to say something!</p>
          </div>
        )}

        {/* 21. RENDER: Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getTypingText()}
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 22. RENDER: Message Input (no changes) */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip,.mp4,.mp3,.wav"
          />

          {/* File attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || loading || isRecording}
            className="p-3 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder={
              isRecording
                ? "Recording voice note..."
                : uploading
                ? "Uploading file..."
                : loading
                ? "Loading messages..."
                : "Type a message..."
            }
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading || uploading}
          />
          {newMessage.trim() ? (
            <button
              type="submit"
              disabled={
                !newMessage.trim() ||
                sending ||
                loading ||
                uploading ||
                isRecording
              }
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : isRecording ? (
            // Show Stop button when recording
            <button
              type="button"
              onClick={handleStopRecording}
              disabled={loading || uploading}
              className="p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              title="Stop recording"
            >
              <StopCircle className="w-5 h-5" />
            </button>
          ) : (
            // Show Mic button when not recording and input is empty
            <button
              type="button"
              onClick={handleStartRecording}
              disabled={loading || uploading}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              title="Record voice note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
        {uploading && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Uploading file...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupChatWindow;

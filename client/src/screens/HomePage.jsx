import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import FriendsList from "../components/FriendsList";
import ChatWindow from "../components/ChatWindow";
import FriendRequests from "../components/FriendRequests";
import {
  Users,
  MessageCircle,
  UserPlus,
  LogOut,
  LogIn,
  Menu,
  PlusSquare,
  X,
  UserCheck,
  Mail,
  ArrowLeftToLine,
} from "lucide-react";
import Tooltip from "../components/Tooltip";
import AddFriendModal from "../components/AddFriendModal";
import apiService from "../services/api";
import socketService from "../services/socket";
import VideoCallModal from "../components/VideoCallModal";
import IncomingCallModal from "../components/IncomingCallModal";
import OutgoingCallModal from "../components/OutgoingCallModal";
import AudioCallModal from "../components/AudioCallModal";
import IncomingAudioCallModal from "../components/IncomingAudioCallModal";
import OutgoingAudioCallModal from "../components/OutgoingAudioCallModal";
import CreateRoomModal from "../components/CreateRoomModal";
import JoinRoomModal from "../components/JoinRoomModal";
import RoomList from "../components/RoomList";
import GroupChatWindow from "../components/GroupChatWindow";

const HomePage = () => {
  const { user, logout } = useAuth();
  const [selectedFriend, setSelectedFriend] = useState(null);
  const selectedFriendRef = useRef(null);
  const [friends, setFriends] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { callerInfo }
  const [activeCall, setActiveCall] = useState(null); // { friend, isCaller }
  const [outgoingCall, setOutgoingCall] = useState(null); // { friend } (for "ringing..." UI, optional)
  const [incomingAudioCall, setIncomingAudioCall] = useState(null);
  const [activeAudioCall, setActiveAudioCall] = useState(null);
  const [outgoingAudioCall, setOutgoingAudioCall] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [rooms, setRooms] = useState([]); // To store the user's joined rooms
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        // Get user profile
        const profileResponse = await apiService.getUserProfile();
        if (profileResponse.status === 200) {
          // Update user data in context if needed
        }

        // Get friends list
        const friendsResponse = await apiService.getFriends();
        if (friendsResponse.status === 200) {
          setFriends(friendsResponse.data.friends);
        }

        // Get online friends
        const onlineResponse = await apiService.getOnlineFriends();
        if (onlineResponse.status === 200) {
          setOnlineFriends(onlineResponse.data.onlineFriends);
        }

        // Get friend requests
        const requestsResponse = await apiService.getFriendRequests();
        if (requestsResponse.status === 200) {
          setFriendRequests(requestsResponse.data.friendRequests);
        }

        // --- Fetch user's rooms ---
        const roomsResponse = await apiService.getRooms();
        if (roomsResponse.status === 200) {
          setRooms(roomsResponse.data.rooms);
        }

        // Set up socket listeners
        socketService.onUserOnline((data) => {
          setOnlineFriends((prev) => {
            const exists = prev.find((friend) => friend._id === data.userId);
            if (!exists) {
              return [
                ...prev,
                {
                  _id: data.userId,
                  username: data.username,
                  avatar: data.avatar,
                  isOnline: true,
                },
              ];
            }
            return prev;
          });
        });

        socketService.onUserOffline((data) => {
          setOnlineFriends((prev) =>
            prev.filter((friend) => friend._id !== data.userId)
          );
        });

        socketService.onNewFriendRequest((data) => {
          setFriendRequests((prev) => [
            ...prev,
            {
              _id: Date.now(), // temporary ID
              requester: {
                _id: data.requesterId,
                username: data.requesterUsername,
                avatar: data.requesterAvatar,
              },
              status: "pending",
            },
          ]);
        });

        // When a new message arrives and user doesn't have that chat open,
        // increment the unread count for the corresponding friend in the sidebar.
        socketService.onNewMessage((message) => {
          try {
            const senderId =
              typeof message.sender === "object"
                ? message.sender._id || message.sender.id
                : message.sender;

            // If there's no selectedFriend or the message is from someone else,
            // increment unread count for that friend. Use ref to get latest selection.
            const currentSelected = selectedFriendRef.current;
            if (!currentSelected || currentSelected._id !== senderId) {
              setUnreadCounts((prev) => {
                const current = prev[senderId] || 0;
                return { ...prev, [senderId]: current + 1 };
              });
            } else {
              // If the chat is open, ensure the unread count is zero
              setUnreadCounts((prev) => ({ ...prev, [senderId]: 0 }));
            }
          } catch (err) {
            console.error("Error handling sidebar unread increment:", err);
          }
        });

        // Video call listeners
        socketService.onVideoCallOffer((data) => {
          // Check if already in a call
          if (activeCall || activeAudioCall) {
            // Automatically reject if busy
            socketService.rejectVideoCall(data.callerInfo._id);
          } else {
            setIncomingCall(data.callerInfo);
          }
        });

        socketService.onVideoCallAccept((data) => {
          // Call was accepted by the person we were calling
          setOutgoingCall(null); // No longer "ringing"
          setActiveCall({ friend: data.accepterInfo, isCaller: true });
        });

        socketService.onVideoCallReject((data) => {
          // Call was rejected
          setOutgoingCall(null);
          alert(`${data.rejectedBy} rejected the call.`);
        });

        socketService.onVideoCallEnd(() => {
          setActiveCall(null); // Just close the modal
          // You could also add a "Call ended" notification here
        });

        socketService.onVideoCallCancel(() => {
          setIncomingCall(null); // Close the incoming call modal
        });

        // Audio call listeners
        socketService.onAudioCallOffer((data) => {
          // --- BUSY CHECK: Update to check both call types ---
          if (activeCall || activeAudioCall) {
            socketService.rejectAudioCall(data.callerInfo._id);
          } else {
            setIncomingAudioCall(data.callerInfo);
          }
        });

        socketService.onAudioCallAccept((data) => {
          setOutgoingAudioCall(null);
          setActiveAudioCall({ friend: data.accepterInfo, isCaller: true });
        });

        socketService.onAudioCallReject((data) => {
          setOutgoingAudioCall(null);
          alert(`${data.rejectedBy} rejected the call.`);
        });

        socketService.onAudioCallCancel(() => {
          setIncomingAudioCall(null);
        });

        socketService.onAudioCallEnd(() => {
          setActiveAudioCall(null);
        });
        // }

        // Update online status
        // await apiService.updateOnlineStatus(true);
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Cleanup on unmount
    return () => {
      // apiService.updateOnlineStatus(false);
      // socketService.disconnect();
    };
  }, []);

  const handleFriendSelect = (friend) => {
    setSelectedFriend(friend);
    setSelectedRoom(null);
    selectedFriendRef.current = friend;

    // Clear unread count for this friend immediately when opening chat
    setUnreadCounts((prev) => ({ ...prev, [friend._id]: 0 }));
  };

  // Keep the ref in sync with the selectedFriend state so event handlers
  // and socket callbacks can read the latest value.
  useEffect(() => {
    selectedFriendRef.current = selectedFriend;
  }, [selectedFriend]);

  // Clear selected friend when Escape key is pressed
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" || e.key === "Esc") {
        // only update when a friend is actually selected
        if (selectedFriendRef.current) {
          setSelectedFriend(null);
          selectedFriendRef.current = null;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // --- Handler for selecting a room ---
  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setSelectedFriend(null); // <-- Deselect friend
    // Logic to clear unread messages for the room will go here
  };

  const handleUnreadUpdate = (friendId, count) => {
    setUnreadCounts((prev) => ({
      ...prev,
      [friendId]: count,
    }));
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    // apiService.updateOnlineStatus(false);
    // socketService.disconnect();
    logout();
  };

  const handleStartCall = (friend) => {
    // user is from useAuth()
    const callerInfo = {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
    };
    socketService.offerVideoCall(friend._id, callerInfo);
    setOutgoingCall({ friend });
    // Note: We don't open VideoCallModal *until* the call is accepted.
    // You can show a simple "Ringing..." modal here using `outgoingCall` state.
    console.log(`Calling ${friend.username}...`); // Placeholder for "Ringing" UI
  };

  const handleAcceptCall = () => {
    const accepterInfo = {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
    };
    socketService.acceptVideoCall(incomingCall._id, accepterInfo);
    // Set active call for the receiver
    setActiveCall({ friend: incomingCall, isCaller: false });
    setIncomingCall(null);
  };

  const handleRejectCall = () => {
    socketService.rejectVideoCall(incomingCall._id);
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    if (activeCall) {
      // Notify the other user that we are ending the call
      socketService.endVideoCall(activeCall.friend._id);
    }
    setActiveCall(null); // Close our own modal
  };

  const handleCancelCall = () => {
    if (outgoingCall) {
      // Notify the receiver that we are canceling
      socketService.cancelVideoCall(outgoingCall.friend._id);
    }
    setOutgoingCall(null); // Close our own "Ringing" modal
  };

  // Audio call handlers
  const handleStartAudioCall = (friend) => {
    const callerInfo = {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
    };
    socketService.offerAudioCall(friend._id, callerInfo);
    setOutgoingAudioCall({ friend });
  };

  const handleAcceptAudioCall = () => {
    const accepterInfo = {
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
    };
    socketService.acceptAudioCall(incomingAudioCall._id, accepterInfo);
    setActiveAudioCall({ friend: incomingAudioCall, isCaller: false });
    setIncomingAudioCall(null);
  };

  const handleRejectAudioCall = () => {
    socketService.rejectAudioCall(incomingAudioCall._id);
    setIncomingAudioCall(null);
  };

  const handleCancelAudioCall = () => {
    if (outgoingAudioCall) {
      socketService.cancelAudioCall(outgoingAudioCall.friend._id);
    }
    setOutgoingAudioCall(null);
  };

  const handleEndAudioCall = () => {
    if (activeAudioCall) {
      socketService.endAudioCall(activeAudioCall.friend._id);
    }
    setActiveAudioCall(null);
  };

  const handleRoomCreated = (newRoom) => {
    setRooms((prevRooms) => [newRoom, ...prevRooms]);
    setSelectedRoom(newRoom); // Automatically select the new room
    setSelectedFriend(null);
  };

  const handleRoomJoined = (joinedRoom) => {
    // Check if user is already in the room list to avoid duplicates
    setRooms((prevRooms) => {
      const alreadyExists = prevRooms.find((r) => r._id === joinedRoom._id);
      if (alreadyExists) return prevRooms;
      return [joinedRoom, ...prevRooms];
    });
    setSelectedRoom(joinedRoom); // Automatically select the joined room
    setSelectedFriend(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-56px)] bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 h-[calc(100vh-56px)] bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Left Sidebar - Friends List */}
      <div
        className={`${
          sidebarCollapsed ? "w-16" : "w-80"
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out relative h-full`}
      >
        {/* Header */}
        <div className="h-16 px-4 flex items-center justify-between flex-shrink-0 bg-white dark:bg-transparent">
          <div className="flex items-center gap-3">
            {!sidebarCollapsed && (
              <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-opacity duration-300">
                Chats
              </h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!sidebarCollapsed && (
              <>
                <Tooltip label="Add friend">
                  <button
                    onClick={() => setShowAddFriendModal(true)}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
                    aria-label="Add Friend"
                  >
                    <UserPlus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </Tooltip>

                <Tooltip label="Friend requests">
                  <button
                    onClick={() => setShowFriendRequests(!showFriendRequests)}
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
                    aria-label="Friend Requests"
                  >
                    <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    {friendRequests.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {friendRequests.length}
                      </span>
                    )}
                  </button>
                </Tooltip>
              </>
            )}

            {/* Sidebar Toggle Button */}
            {/* <Tooltip
              label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            > */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              // title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ArrowLeftToLine className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
            {/* </Tooltip> */}
          </div>
        </div>

        {/* Friend Requests Panel */}
        {showFriendRequests && !sidebarCollapsed && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <FriendRequests
              friendRequests={friendRequests}
              setFriendRequests={setFriendRequests}
            />
          </div>
        )}

        {/* Friends List */}
        {/* <div className="flex-1 min-h-0 overflow-y-auto">
          <FriendsList
            friends={friends}
            onlineFriends={onlineFriends}
            onFriendSelect={handleFriendSelect}
            selectedFriend={selectedFriend}
            unreadCounts={unreadCounts}
            collapsed={sidebarCollapsed}
          />
        </div> */}

        {/* --- MODIFIED: Sidebar Content (Scrollable Sections) --- */}
        <div className="flex-1 min-h-0 flex flex-col">
          {/* --- Friends Section --- */}
          {!sidebarCollapsed && (
            <h2 className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Friends
            </h2>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar">
            <FriendsList
              friends={friends}
              onlineFriends={onlineFriends}
              onFriendSelect={handleFriendSelect}
              selectedFriend={selectedFriend}
              unreadCounts={unreadCounts}
              collapsed={sidebarCollapsed}
            />
          </div>

          {/* --- Rooms Section --- */}
          {!sidebarCollapsed && (
            <h2 className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-t border-gray-200 dark:border-gray-700">
              Rooms
            </h2>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar border-t border-gray-200 dark:border-gray-700">
            <RoomList
              rooms={rooms}
              onRoomSelect={handleRoomSelect}
              selectedRoom={selectedRoom}
              collapsed={sidebarCollapsed}
            />
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      {/* <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {selectedFriend ? (
          <ChatWindow
            friend={selectedFriend}
            onClose={() => setSelectedFriend(null)}
            onUnreadUpdate={handleUnreadUpdate}
            sidebarCollapsed={sidebarCollapsed}
            onStartCall={handleStartCall}
            onStartAudioCall={handleStartAudioCall}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Welcome to Migozz
              </h2>
              <p className="text-gray-500 dark:text-gray-500">
                Select a friend to start chatting
              </p>
            </div>
          </div>
        )}
      </div> */}

      {/*  Updated Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {selectedFriend ? (
          <ChatWindow
            friend={selectedFriend}
            onClose={() => setSelectedFriend(null)}
            onUnreadUpdate={handleUnreadUpdate}
            sidebarCollapsed={sidebarCollapsed}
            onStartCall={handleStartCall}
            onStartAudioCall={handleStartAudioCall}
          />
        ) : selectedRoom ? (
          // --- NEW: This is where your GroupChatWindow will go ---
          <GroupChatWindow
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            sidebarCollapsed={sidebarCollapsed}
          />
        ) : (
          // --- MODIFIED: Welcome Screen ---
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Welcome to Migozz
              </h2>
              <p className="text-gray-500 dark:text-gray-500 mb-6">
                Select a friend to start chatting...
                <br />
                ...or create and join a room.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setShowCreateRoomModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <PlusSquare className="w-5 h-5" />
                  Create Room
                </button>
                <button
                  onClick={() => setShowJoinRoomModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  <LogIn className="w-5 h-5" />
                  Join Room
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      <AddFriendModal
        open={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
      />

      {/* Video Call Modals */}
      <IncomingCallModal
        caller={incomingCall}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />

      {outgoingCall && (
        <OutgoingCallModal
          receiver={outgoingCall.friend}
          onCancel={handleCancelCall}
        />
      )}

      {activeCall && (
        <VideoCallModal
          open={!!activeCall}
          onClose={handleEndCall}
          friend={activeCall.friend}
          userId={user._id}
          isCaller={activeCall.isCaller}
        />
      )}

      {/* Audio Call Modals */}
      <IncomingAudioCallModal
        caller={incomingAudioCall}
        onAccept={handleAcceptAudioCall}
        onReject={handleRejectAudioCall}
      />
      {outgoingAudioCall && (
        <OutgoingAudioCallModal
          receiver={outgoingAudioCall.friend}
          onCancel={handleCancelAudioCall}
        />
      )}
      {activeAudioCall && (
        <AudioCallModal
          open={!!activeAudioCall}
          onClose={handleEndAudioCall}
          friend={activeAudioCall.friend}
          userId={user._id}
          isCaller={activeAudioCall.isCaller}
        />
      )}

      {/* Room Modals */}
      <CreateRoomModal
        open={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        onRoomCreated={handleRoomCreated}
      />
      <JoinRoomModal
        open={showJoinRoomModal}
        onClose={() => setShowJoinRoomModal(false)}
        onRoomJoined={handleRoomJoined}
      />
    </div>
  );
};

export default HomePage;

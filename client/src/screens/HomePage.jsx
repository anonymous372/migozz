import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import FriendsList from "../components/FriendsList";
import ChatWindow from "../components/ChatWindow";
import FriendRequests from "../components/FriendRequests";
import peerService from "../services/peerService";
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
  User,
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
import GroupCallModal from "../components/GroupCallModal";
import ProfileModal from "../components/ProfileModal";

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
  const [activeGroupCall, setActiveGroupCall] = useState(null);
  const [incomingGroupCall, setIncomingGroupCall] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    // If there is no user, do nothing.
    if (!user) {
      setLoading(false);
      return;
    }

    // --- 1. Define all event handlers ---
    const handleUserOnline = (data) => {
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
    };

    const handleUserOffline = (data) => {
      setOnlineFriends((prev) =>
        prev.filter((friend) => friend._id !== data.userId)
      );
    };

    const handleNewFriendRequest = (data) => {
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
    };

    const handleNewMessage = (message) => {
      try {
        const senderId =
          typeof message.sender === "object"
            ? message.sender._id || message.sender.id
            : message.sender;
        const currentSelected = selectedFriendRef.current;
        if (!currentSelected || currentSelected._id !== senderId) {
          setUnreadCounts((prev) => {
            const current = prev[senderId] || 0;
            return { ...prev, [senderId]: current + 1 };
          });
        } else {
          setUnreadCounts((prev) => ({ ...prev, [senderId]: 0 }));
        }
      } catch (err) {
        console.error("Error handling sidebar unread increment:", err);
      }
    };

    // Video call listeners
    const handleVideoCallOffer = (data) => {
      if (activeCall || activeAudioCall || activeGroupCall) {
        // Check group call
        socketService.rejectVideoCall(data.callerInfo._id);
      } else {
        setIncomingCall(data.callerInfo);
      }
    };
    const handleVideoCallAccept = (data) => {
      setOutgoingCall(null);
      setActiveCall({ friend: data.accepterInfo, isCaller: true });
    };
    const handleVideoCallReject = (data) => {
      setOutgoingCall(null);
      alert(`${data.rejectedBy} rejected the call.`);
    };
    const handleVideoCallEnd = () => {
      setActiveCall(null);
    };
    const handleVideoCallCancel = () => {
      setIncomingCall(null);
    };

    // Audio call listeners
    const handleAudioCallOffer = (data) => {
      if (activeCall || activeAudioCall || activeGroupCall) {
        // Check group call
        socketService.rejectAudioCall(data.callerInfo._id);
      } else {
        setIncomingAudioCall(data.callerInfo);
      }
    };
    const handleAudioCallAccept = (data) => {
      setOutgoingAudioCall(null);
      setActiveAudioCall({ friend: data.accepterInfo, isCaller: true });
    };
    const handleAudioCallReject = (data) => {
      setOutgoingAudioCall(null);
      alert(`${data.rejectedBy} rejected the call.`);
    };
    const handleAudioCallCancel = () => {
      setIncomingAudioCall(null);
    };
    const handleAudioCallEnd = () => {
      setActiveAudioCall(null);
    };

    // --- ADDED: Group Call Handlers ---
    const handleGroupCallYouStarted = (data) => {
      peerService.init(user._id); // Init our peer
      peerService.getLocalStream(data.callType).then(() => {
        setActiveGroupCall(data); // Open the call modal
      });
    };

    const handleGroupCallOffer = (data) => {
      if (activeCall || activeAudioCall || activeGroupCall) {
        // socketService.rejectGroupCall(data.roomId); // Optional: add reject
        return;
      }
      setIncomingGroupCall(data);
    };

    const handleGroupCallYouJoined = (data) => {
      peerService.init(user._id); // Init our peer
      peerService.getLocalStream(data.callType).then((stream) => {
        setActiveGroupCall(data); // Open the call modal
        // Call all existing members
        data.members.forEach((member) => {
          if (member.peerId !== user._id) {
            peerService.callPeer(member.peerId, stream);
          }
        });
      });
    };

    const handleGroupCallNewMember = (data) => {
      // A new user joined, let's call them
      if (peerService.localStream) {
        peerService.callPeer(data.peerId, peerService.localStream);
      }
      setActiveGroupCall((prev) => ({
        ...prev,
        members: [...(prev?.members || []), data],
      }));
    };

    const handleGroupCallMemberLeft = (data) => {
      peerService.closeConnection(data.peerId);
      setActiveGroupCall((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.peerId !== data.peerId),
      }));
    };
    // --- END: Group Call Handlers ---

    // --- 2. Function to attach all listeners ---
    const setupSocketListeners = () => {
      // 1-on-1 Calls
      socketService.onUserOnline(handleUserOnline);
      socketService.onUserOffline(handleUserOffline);
      socketService.onNewFriendRequest(handleNewFriendRequest);
      socketService.onNewMessage(handleNewMessage);
      socketService.onVideoCallOffer(handleVideoCallOffer);
      socketService.onVideoCallAccept(handleVideoCallAccept);
      socketService.onVideoCallReject(handleVideoCallReject);
      socketService.onVideoCallEnd(handleVideoCallEnd);
      socketService.onVideoCallCancel(handleVideoCallCancel);
      socketService.onAudioCallOffer(handleAudioCallOffer);
      socketService.onAudioCallAccept(handleAudioCallAccept);
      socketService.onAudioCallReject(handleAudioCallReject);
      socketService.onAudioCallCancel(handleAudioCallCancel);
      socketService.onAudioCallEnd(handleAudioCallEnd);

      // --- ADDED: Group Call Listeners ---
      socketService.onGroupCallYouStarted(handleGroupCallYouStarted);
      socketService.onGroupCallOffer(handleGroupCallOffer);
      socketService.onGroupCallYouJoined(handleGroupCallYouJoined);
      socketService.onGroupCallNewMember(handleGroupCallNewMember);
      socketService.onGroupCallMemberLeft(handleGroupCallMemberLeft);
    };

    // --- 3. Main initialization function ---
    const initializeData = async () => {
      setLoading(true);
      try {
        // Wait for the socket to be connected by Layout.jsx
        let retries = 0;
        while (!socketService.isConnected && retries < 50) {
          await new Promise((resolve) => setTimeout(resolve, 100));
          retries++;
        }

        if (!socketService.isConnected) {
          console.error("Socket failed to connect after 5 seconds.");
          setLoading(false);
          return;
        }

        // --- Socket is connected, proceed ---

        // 1. Attach all event listeners
        setupSocketListeners();

        // 1b. Initialize PeerJS *once*
        peerService.init(user._id);

        // 2. Fetch all API data in parallel
        const [profile, friends, online, requests, rooms] = await Promise.all([
          apiService.getUserProfile(),
          apiService.getFriends(),
          apiService.getOnlineFriends(),
          apiService.getFriendRequests(),
          apiService.getRooms(),
        ]);

        // 3. Set all state
        if (profile.status === 200) {
          /* ... */
        }
        if (friends.status === 200) setFriends(friends.data.friends);
        if (online.status === 200) setOnlineFriends(online.data.onlineFriends);
        if (requests.status === 200)
          setFriendRequests(requests.data.friendRequests);
        if (rooms.status === 200) setRooms(rooms.data.rooms);
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // --- 4. Cleanup function ---
    return () => {
      // Remove all 1-on-1 listeners
      socketService.off("user_online", handleUserOnline);
      socketService.off("user_offline", handleUserOffline);
      socketService.off("new_friend_request", handleNewFriendRequest);
      socketService.off("new_message", handleNewMessage);
      socketService.off("video_call_offer", handleVideoCallOffer);
      socketService.off("video_call_accept", handleVideoCallAccept);
      socketService.off("video_call_reject", handleVideoCallReject);
      socketService.off("video_call_end", handleVideoCallEnd);
      socketService.off("video_call_cancel", handleVideoCallCancel);
      socketService.off("audio_call_offer", handleAudioCallOffer);
      socketService.off("audio_call_accept", handleAudioCallAccept);
      socketService.off("audio_call_reject", handleAudioCallReject);
      socketService.off("audio_call_cancel", handleAudioCallCancel);
      socketService.off("audio_call_end", handleAudioCallEnd);

      // --- ADDED: Group Call Cleanup ---
      socketService.off("group_call_you_started", handleGroupCallYouStarted);
      socketService.off("group_call_offer", handleGroupCallOffer);
      socketService.off("group_call_you_joined", handleGroupCallYouJoined);
      socketService.off("group_call_new_member", handleGroupCallNewMember);
      socketService.off("group_call_member_left", handleGroupCallMemberLeft);
    };
  }, [user]); // This effect now correctly depends on the user

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
        if (selectedFriendRef.current || selectedRoom) {
          setSelectedFriend(null);
          setSelectedRoom(null);
          selectedFriendRef.current = null;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedRoom]);

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
    peerService.closeAllConnections();
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
    peerService.closeAllConnections();
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

  // --- 4. ADD NEW GROUP CALL HANDLERS ---
  const handleStartGroupCall = (room, callType) => {
    console.log("here");
    socketService.startGroupCall(room._id, room.name, callType);
  };

  const handleJoinGroupCall = () => {
    socketService.joinGroupCall(
      incomingGroupCall.roomId,
      incomingGroupCall.roomName
    );
    setIncomingGroupCall(null);
  };

  const handleRejectGroupCall = () => {
    setIncomingGroupCall(null);
  };

  const handleLeaveGroupCall = () => {
    if (activeGroupCall) {
      socketService.leaveGroupCall(activeGroupCall.roomId);
    }
    // --- FIX FOR BUG 2 ---
    // Explicitly stop all streams and destroy the peer
    peerService.closeAllConnections();
    setActiveGroupCall(null);
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
          <div className="flex-1 min-h-0 overflow-y-auto chat-scrollbar dark:border-gray-700">
            <RoomList
              rooms={rooms}
              onRoomSelect={handleRoomSelect}
              selectedRoom={selectedRoom}
              collapsed={sidebarCollapsed}
            />
          </div>
        </div>
        <div className="flex-shrink-0 p-4">
          {/* Profile Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mb-2 ${
              sidebarCollapsed ? "justify-center" : "justify-start"
            }`}
            title="Profile"
          >
            <User className="h-5 w-5 flex-shrink-0 text-gray-600 dark:text-gray-400" />
            {!sidebarCollapsed && (
              <span className="font-medium text-gray-600 dark:text-gray-400">
                Profile
              </span>
            )}
          </button>
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
            onRoomJoined={handleRoomJoined}
          />
        ) : selectedRoom ? (
          // --- NEW: This is where your GroupChatWindow will go ---
          <GroupChatWindow
            room={selectedRoom}
            onClose={() => setSelectedRoom(null)}
            sidebarCollapsed={sidebarCollapsed}
            handleStartGroupCall={handleStartGroupCall}
          />
        ) : false ? (
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
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="flex flex-col items-center max-w-lg w-full text-center p-8">
              {/* 1. Larger, lighter icon */}
              <MessageCircle
                className="w-24 h-24 text-gray-300 dark:text-gray-700 mb-6"
                strokeWidth={1.5}
              />

              {/* 2. Bigger Title */}
              <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                Welcome to Migozz
              </h2>

              {/* 3. Bigger, clearer subtitle */}
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-10">
                Select a friend or join a room to start chatting
              </p>

              {/* 4. Larger, responsive "Call to Action" buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                {/* Primary Action: Create Room */}
                <button
                  onClick={() => setShowCreateRoomModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-blue-500/30"
                >
                  <PlusSquare className="w-5 h-5" />
                  <span className="text-base font-medium">Create Room</span>
                </button>

                {/* Secondary Action: Join Room */}
                <button
                  onClick={() => setShowJoinRoomModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-800 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 hover:shadow-gray-500/10"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="text-base font-medium">Join Room</span>
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

      {/* --- 6. ADD GROUP CALL MODALS --- */}
      {incomingGroupCall && (
        <IncomingCallModal
          caller={incomingGroupCall.caller} // Re-use 1-on-1 modal
          onAccept={handleJoinGroupCall}
          onReject={handleRejectGroupCall}
        />
        // You can create a custom IncomingGroupCallModal later
      )}

      {activeGroupCall && (
        <GroupCallModal
          open={!!activeGroupCall}
          callInfo={activeGroupCall}
          onClose={handleLeaveGroupCall}
          user={user} // Pass the current user
          callType={activeGroupCall.callType}
          members={activeGroupCall.members || []}
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
      <ProfileModal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default HomePage;

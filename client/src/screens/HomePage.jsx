import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import FriendsList from "../components/FriendsList";
import ChatWindow from "../components/ChatWindow";
import FriendRequests from "../components/FriendRequests";
import { Users, MessageCircle, UserPlus, LogOut } from "lucide-react";
import apiService from "../services/api";
import socketService from "../services/socket";

const HomePage = () => {
  const { user, logout } = useAuth();
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friends, setFriends] = useState([]);
  const [onlineFriends, setOnlineFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [loading, setLoading] = useState(true);

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

        // Connect to socket
        const token = localStorage.getItem("token");
        if (token) {
          socketService.connect(token);

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
        }

        // Update online status
        await apiService.updateOnlineStatus(true);
      } catch (error) {
        console.error("Error initializing data:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeData();

    // Cleanup on unmount
    return () => {
      apiService.updateOnlineStatus(false);
      socketService.disconnect();
    };
  }, []);

  const handleFriendSelect = (friend) => {
    setSelectedFriend(friend);
  };

  const handleLogout = () => {
    apiService.updateOnlineStatus(false);
    socketService.disconnect();
    logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Left Sidebar - Friends List */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Migozz
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFriendRequests(!showFriendRequests)}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors relative"
              >
                <UserPlus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {friendRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {friendRequests.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Friend Requests Panel */}
        {showFriendRequests && (
          <div className="border-b border-gray-200 dark:border-gray-700">
            <FriendRequests
              friendRequests={friendRequests}
              setFriendRequests={setFriendRequests}
            />
          </div>
        )}

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto">
          <FriendsList
            friends={friends}
            onlineFriends={onlineFriends}
            onFriendSelect={handleFriendSelect}
            selectedFriend={selectedFriend}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedFriend ? (
          <ChatWindow
            friend={selectedFriend}
            onClose={() => setSelectedFriend(null)}
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
      </div>
    </div>
  );
};

export default HomePage;

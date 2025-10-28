import { useState } from "react";
import { Search, MoreVertical } from "lucide-react";
import apiService from "../services/api";

const FriendsList = ({
  friends,
  onlineFriends,
  onFriendSelect,
  selectedFriend,
  unreadCounts,
  collapsed = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await apiService.searchUsers(query);
      if (response.status === 200) {
        setSearchResults(response.data.users);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      const response = await apiService.sendFriendRequest(userId);
      if (response.status === 201) {
        // Remove from search results
        setSearchResults((prev) => prev.filter((user) => user._id !== userId));
        alert("Friend request sent!");
      } else {
        alert(response.message || "Failed to send friend request");
      }
    } catch (error) {
      console.error("Send friend request error:", error);
      alert("Failed to send friend request");
    }
  };

  const filteredFriends = friends.filter((friend) =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isOnline = (friendId) => {
    return onlineFriends.some((friend) => friend._id === friendId);
  };

  if (collapsed) {
    return (
      <div className="flex flex-col h-full">
        <h2 className="py-2 text-center text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Friends
        </h2>
        {/* Collapsed Friends List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
          <div className="p-2">
            <div className="space-y-2">
              {friends.slice(0, 6).map((friend) => (
                <div
                  key={friend._id}
                  onClick={() => onFriendSelect(friend)}
                  className={`relative w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 ${
                    selectedFriend?._id === friend._id
                      ? "ring-2 ring-blue-500"
                      : "hover:bg-gray-400 dark:hover:bg-gray-500"
                  }`}
                  title={friend.username}
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {friend.username.charAt(0).toUpperCase()}
                  </span>

                  {/* Online indicator */}
                  {isOnline(friend._id) && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                  )}

                  {/* Unread count indicator */}
                  {unreadCounts[friend._id] > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium min-w-[20px]">
                      {unreadCounts[friend._id] >= 10
                        ? "10+"
                        : unreadCounts[friend._id]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <h2 className="p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Friends
      </h2>
      <div className="px-4 py-1 border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search friends..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Search Results */}
      {searchQuery && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Search Results
          </h3>
          {searching ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendFriendRequest(user._id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No users found
            </p>
          )}
        </div>
      )}

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
        <div className="p-4">
          {/* <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
            Friends ({friends.length})
          </h3> */}
          {filteredFriends.length > 0 ? (
            <div className="space-y-1">
              {filteredFriends.map((friend) => (
                <div
                  key={friend._id}
                  onClick={() => onFriendSelect(friend)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedFriend?._id === friend._id
                      ? "bg-blue-100 dark:bg-blue-900"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {friend.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {isOnline(friend._id) && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {friend.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isOnline(friend._id) ? "Online" : "Offline"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Unread message indicator */}
                    {unreadCounts[friend._id] > 0 && (
                      <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadCounts[friend._id] >= 10
                          ? "10+"
                          : unreadCounts[friend._id]}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No friends found
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FriendsList;

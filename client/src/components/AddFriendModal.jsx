import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import apiService from "../services/api";

const AddFriendModal = ({ open, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const handleSearch = async (q) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await apiService.searchUsers(q);
      if (response.status === 200) {
        setResults(response.data.users || []);
      }
    } catch (err) {
      console.error("Search users error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      const response = await apiService.sendFriendRequest(userId);
      if (response.status === 201) {
        setResults((prev) => prev.filter((u) => u._id !== userId));
        alert("Friend request sent");
      } else {
        alert(response.message || "Failed to send friend request");
      }
    } catch (err) {
      console.error("Send friend request error:", err);
      alert("Failed to send friend request");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-4 z-10 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add Friend
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {searching ? (
            <div className="text-center py-4">Searching...</div>
          ) : results.length > 0 ? (
            <div className="space-y-2">
              {results.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
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
                    onClick={() => handleSendRequest(user._id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400">
              No users found
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFriendModal;

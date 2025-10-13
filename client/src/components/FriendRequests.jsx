import { useState } from "react";
import { Check, X, Clock } from "lucide-react";
import apiService from "../services/api";

const FriendRequests = ({ friendRequests, setFriendRequests }) => {
  const [processing, setProcessing] = useState(new Set());

  const handleAccept = async (requestId) => {
    setProcessing((prev) => new Set([...prev, requestId]));
    try {
      const response = await apiService.acceptFriendRequest(requestId);
      if (response.status === 200) {
        setFriendRequests((prev) =>
          prev.filter((req) => req._id !== requestId)
        );
        alert("Friend request accepted!");
      } else {
        alert(response.message || "Failed to accept friend request");
      }
    } catch (error) {
      console.error("Accept friend request error:", error);
      alert("Failed to accept friend request");
    } finally {
      setProcessing((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleDecline = async (requestId) => {
    setProcessing((prev) => new Set([...prev, requestId]));
    try {
      const response = await apiService.declineFriendRequest(requestId);
      if (response.status === 200) {
        setFriendRequests((prev) =>
          prev.filter((req) => req._id !== requestId)
        );
        alert("Friend request declined");
      } else {
        alert(response.message || "Failed to decline friend request");
      }
    } catch (error) {
      console.error("Decline friend request error:", error);
      alert("Failed to decline friend request");
    } finally {
      setProcessing((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  if (friendRequests.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No pending friend requests</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        Friend Requests ({friendRequests.length})
      </h3>
      <div className="space-y-3">
        {friendRequests.map((request) => (
          <div
            key={request._id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {request.requester.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {request.requester.username}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Wants to be your friend
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAccept(request._id)}
                disabled={processing.has(request._id)}
                className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDecline(request._id)}
                disabled={processing.has(request._id)}
                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendRequests;

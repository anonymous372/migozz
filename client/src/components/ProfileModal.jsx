import { X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ProfileModal = ({ open, onClose }) => {
  const { user } = useAuth(); // Get user info from your auth context

  if (!open || !user) {
    return null;
  }

  return (
    // Backdrop - Reduced opacity
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 flex items-center justify-center shadow-lg bg-opacity-10 transition-opacity"
    >
      {/* Modal Content */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 rounded-full bg-gray-700 p-1 text-white shadow-lg hover:bg-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Profile Content */}
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-blue-500">
            <span className="text-6xl font-semibold">
              {user.username ? user.username.charAt(0).toUpperCase() : "U"}
            </span>
          </div>

          {/* Username */}
          <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
            {user.username || "Username"}
          </h2>

          {/* Email */}
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {user.email || "user@example.com"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;

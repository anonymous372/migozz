import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import socketService from "../services/socket";
import apiService from "../services/api";
import Navbar from "./Navbar";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // This useEffect manages the *entire* socket connection lifecycle
  useEffect(() => {
    // 3. Check if the user object exists
    if (user) {
      const token = localStorage.getItem("token");

      // Only connect if we have a token and are not already connected
      if (token && !socketService.isConnected) {
        console.log("Auth state updated: Connecting socket...");

        // 1. Connect to socket
        socketService.connect(token);

        // 2. Set online status in DB
        apiService.updateOnlineStatus(true);
      }
    }

    // This cleanup runs when the 'user' object becomes null (on logout)
    return () => {
      if (socketService.isConnected) {
        console.log("Auth state changed: Disconnecting socket...");
        apiService.updateOnlineStatus(false);
        socketService.disconnect();
      }
    };
  }, [user]);

  const handleProperLogout = () => {
    // This is the *correct* way to log out
    apiService.updateOnlineStatus(false);
    socketService.disconnect();
    logout();
    navigate("/login");
  };

  return (
    // Layout no longer forces full viewport height globally; pages control their own height
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-500">
      <Navbar handleLogout={handleProperLogout} />
      <main className="flex-1 min-h-0">
        {/* min-h-0 is important so inner flex children can overflow internally without creating page scroll */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;

import { API_BASE_URL } from "../constants";

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// API service class
class ApiService {
  // Auth endpoints
  async login(email, password) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }

  async register(username, email, password) {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    return response.json();
  }

  // User endpoints
  async getUserProfile() {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  }

  async updateOnlineStatus(isOnline) {
    const response = await fetch(`${API_BASE_URL}/users/online-status`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ isOnline }),
    });
    return response.json();
  }

  async searchUsers(query) {
    const response = await fetch(
      `${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.json();
  }

  async getOnlineFriends() {
    const response = await fetch(`${API_BASE_URL}/users/online-friends`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  }

  // Friend endpoints
  async sendFriendRequest(recipientId) {
    const response = await fetch(`${API_BASE_URL}/friends/request`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ recipientId }),
    });
    return response.json();
  }

  async getFriendRequests() {
    const response = await fetch(`${API_BASE_URL}/friends/requests`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  }

  async acceptFriendRequest(requestId) {
    const response = await fetch(
      `${API_BASE_URL}/friends/accept/${requestId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      }
    );
    return response.json();
  }

  async declineFriendRequest(requestId) {
    const response = await fetch(
      `${API_BASE_URL}/friends/decline/${requestId}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
      }
    );
    return response.json();
  }

  async getFriends() {
    const response = await fetch(`${API_BASE_URL}/friends`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  }

  async removeFriend(friendId) {
    const response = await fetch(`${API_BASE_URL}/friends/${friendId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.json();
  }

  // Message endpoints
  async sendMessage(receiverId, content, messageType = "text") {
    const response = await fetch(`${API_BASE_URL}/messages/send`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ receiverId, content, messageType }),
    });
    return response.json();
  }

  async getMessages(friendId, page = 1, limit = 50) {
    const response = await fetch(
      `${API_BASE_URL}/messages/${friendId}?page=${page}&limit=${limit}`,
      {
        headers: getAuthHeaders(),
      }
    );
    return response.json();
  }

  async getChatRooms() {
    const response = await fetch(`${API_BASE_URL}/messages/chat-rooms`, {
      headers: getAuthHeaders(),
    });
    return response.json();
  }

  async markMessagesAsRead(friendId) {
    const response = await fetch(`${API_BASE_URL}/messages/read/${friendId}`, {
      method: "PUT",
      headers: getAuthHeaders(),
    });
    return response.json();
  }

  // Upload file
  async uploadFile(receiverId, file, caption = "") {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("receiverId", receiverId);
    if (caption) formData.append("content", caption);

    const token = localStorage.getItem("token");
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData, browser will set it with boundary

    const response = await fetch(`${API_BASE_URL}/messages/upload`, {
      method: "POST",
      headers,
      body: formData,
    });
    return response.json();
  }
}

export default new ApiService();

# Migozz - Real-time Chat Application

A full-stack real-time chat application with friend management and messaging features.

## Features

- ✅ User Authentication (Login/Register)
- ✅ Real-time messaging with Socket.io
- ✅ Friend management (add, accept, decline requests)
- ✅ Online status tracking
- ✅ Typing indicators
- ✅ Message history
- ✅ Responsive design

## Setup Instructions

### 1. Backend Setup

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory with:

   ```env
   MONGO_URI=mongodb://localhost:27017/migozz
   JWT_SECRET=your_super_secret_jwt_key_here
   PORT=5001
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

4. Start MongoDB (make sure it's running on your system)

5. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Setup

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/v1/register` - Register new user
- `POST /api/v1/login` - Login user

### Users

- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/online-status` - Update online status
- `GET /api/v1/users/search?query=` - Search users
- `GET /api/v1/users/online-friends` - Get online friends

### Friends

- `POST /api/v1/friends/request` - Send friend request
- `GET /api/v1/friends/requests` - Get friend requests
- `PUT /api/v1/friends/accept/:requestId` - Accept friend request
- `PUT /api/v1/friends/decline/:requestId` - Decline friend request
- `GET /api/v1/friends` - Get friends list
- `DELETE /api/v1/friends/:friendId` - Remove friend

### Messages

- `POST /api/v1/messages/send` - Send message
- `GET /api/v1/messages/:friendId` - Get messages with friend
- `GET /api/v1/messages/chat-rooms` - Get chat rooms
- `PUT /api/v1/messages/read/:friendId` - Mark messages as read

## Socket.io Events

### Client to Server

- `send_message` - Send a message
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator
- `friend_request_sent` - Send friend request notification

### Server to Client

- `new_message` - Receive new message
- `message_sent` - Message sent confirmation
- `user_typing` - User is typing
- `user_stop_typing` - User stopped typing
- `user_online` - User came online
- `user_offline` - User went offline
- `new_friend_request` - New friend request received

## Database Models

### User

- username, email, password
- avatar, isOnline, lastSeen
- friends (array of user IDs)

### Friend

- requester, recipient
- status (pending, accepted, declined, blocked)
- timestamps

### Message

- sender, receiver, content
- messageType, isRead, readAt
- timestamp

### ChatRoom

- participants (array of user IDs)
- lastMessage, lastActivity
- isActive

## Usage

1. Start both server and client
2. Register a new account or login
3. Search for users and send friend requests
4. Accept friend requests from other users
5. Start chatting with your friends in real-time!

## Technologies Used

### Backend

- Node.js & Express
- MongoDB & Mongoose
- Socket.io
- JWT Authentication
- bcryptjs for password hashing

### Frontend

- React
- React Router
- Socket.io Client
- Tailwind CSS
- Lucide React Icons

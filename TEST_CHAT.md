# Chat Functionality Test Guide

## Quick Test Steps

### 1. Start the Backend

```bash
cd server
# Create .env file with the environment variables from SERVER_SETUP.md
npm start
```

### 2. Start the Frontend

```bash
cd client
npm run dev
```

### 3. Test the Chat Flow

1. **Open two browser windows/tabs**
2. **Register two different users:**

   - User 1: username: "alice", email: "alice@test.com", password: "password123"
   - User 2: username: "bob", email: "bob@test.com", password: "password123"

3. **Send Friend Request:**

   - In Alice's window: Search for "bob" and send friend request
   - In Bob's window: Accept the friend request

4. **Start Chatting:**
   - Click on the friend in the friends list
   - Send messages back and forth
   - Test typing indicators
   - Test online/offline status

## Expected Behavior

✅ **Login/Register**: Should work and redirect to home page
✅ **Friend Management**: Search, add, accept friend requests
✅ **Real-time Chat**: Messages should appear instantly
✅ **Typing Indicators**: Should show when someone is typing
✅ **Online Status**: Should show green dot for online friends
✅ **Message History**: Should load previous messages

## Troubleshooting

### If chat doesn't work:

1. **Check Browser Console** for JavaScript errors
2. **Check Server Logs** for backend errors
3. **Verify Socket Connection** - should see "Connected to server" in console
4. **Check Network Tab** - API calls should return 200 status
5. **Verify MongoDB** is running and accessible

### Common Issues:

- **Socket connection fails**: Check if server is running on port 5001
- **API calls fail**: Check if CORS is properly configured
- **Messages not saving**: Check MongoDB connection
- **Real-time not working**: Check Socket.io connection

## Debug Information

Open browser console and look for:

- "Connected to server" - Socket.io connection successful
- "Login successful, navigating to /home" - Authentication working
- "ProtectedRoute - isAuthenticated: true" - Auth state correct
- Any error messages in red

# Server Setup Instructions

## Required Environment Variables

Create a `.env` file in the `server` directory with the following content:

```env
MONGO_URI=mongodb://localhost:27017/migozz
JWT_SECRET=your_super_secret_jwt_key_here_make_it_very_long_and_secure
PORT=5001
CLIENT_URL=http://localhost:5174
NODE_ENV=development
```

## Prerequisites

1. **MongoDB**: Make sure MongoDB is running on your system
2. **Node.js**: Ensure Node.js is installed

## Start the Server

```bash
cd server
npm install
npm start
```

## Start the Client

```bash
cd client
npm install
npm run dev
```

## Test the Chat Functionality

1. Open two browser tabs/windows
2. Register two different users
3. Send friend requests between them
4. Accept the friend requests
5. Start chatting in real-time!

## Troubleshooting

- Check if MongoDB is running: `mongod --version`
- Check server logs for any errors
- Ensure both client and server are running on different ports
- Check browser console for any JavaScript errors

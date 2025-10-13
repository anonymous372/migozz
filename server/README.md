# Migozz Server

A Node.js/Express server with MongoDB and JWT authentication.

## Features

- User registration and login
- JWT token authentication
- Password hashing with bcrypt
- MongoDB integration
- CORS enabled for client communication
- Protected routes with middleware

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the server directory:

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/migozz
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

3. Make sure MongoDB is running on your system

4. Start the server:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/v1/register` - Register a new user
- `POST /api/v1/login` - Login user
- `GET /api/v1/profile` - Get user profile (protected)

### Example Usage

**Register:**

```bash
curl -X POST http://localhost:5001/api/v1/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
```

**Login:**

```bash
curl -X POST http://localhost:5001/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Access Protected Route:**

```bash
curl -X GET http://localhost:5001/api/v1/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Testing

Run the test script to verify all endpoints:

```bash
node test-auth.js
```

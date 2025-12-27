# Secret Santa Application

A full-stack Secret Santa web application built with Node.js, Express, MongoDB, and Vanilla JavaScript.

## Features

- User registration and authentication
- Secure password hashing
- JWT-based session management
- Secret Santa participant selection (one-time, unique)
- Task/message assignment to selected participants
- Public tasks page displaying all assignments

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or remote connection)

## Installation

1. Install dependencies:
```
npm install
```

2. Configure environment variables in `.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/secretsanta
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
```

3. Start MongoDB (if running locally)

4. Run the application:
```
npm start
```

For development with auto-reload:
```
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Register a new account
2. Login with your credentials
3. Select a Secret Santa participant from the dashboard
4. Send a task/message to your selected participant
5. View all public tasks on the tasks page

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Protected API routes
- Input validation
- Duplicate selection prevention

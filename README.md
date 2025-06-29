# SoftTalks - One-to-One Chat Application

[![CI/CD Pipeline](https://github.com/JaydevVadachhak/softtalksapp/actions/workflows/main.yml/badge.svg)](https://github.com/JaydevVadachhak/softtalksapp/actions/workflows/main.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

A real-time one-to-one chat application built with Node.js, Socket.io, Redis, and Firebase Authentication.

## Features

- User authentication with Firebase (email/password)
- Real-time messaging using Socket.io
- Direct one-to-one messaging between users
- Online/offline status indicators
- Message persistence using Redis
- Unread message notifications
- User profiles with photos
- Password reset functionality
- Responsive UI design
- Docker support for easy deployment

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.io
- **Authentication**: Firebase Authentication
- **Message Storage**: Redis
- **Containerization**: Docker

## Prerequisites

- Node.js (v14 or higher)
- Redis server (local or remote)
- Firebase project with Authentication enabled
- Docker and Docker Compose (optional)

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/JaydevVadachhak/softtalksapp.git
cd softtalksapp

# Configure Firebase
# Edit public/js/firebase-config.js with your Firebase project settings

# Start the application with Docker
npm run docker:up
# or use the script
./run.sh docker  # Linux/macOS
run.bat docker   # Windows
```

### Local Development

```bash
# Clone the repository
git clone https://github.com/JaydevVadachhak/softtalksapp.git
cd softtalksapp

# Install dependencies
npm install

# Configure Firebase
# Edit public/js/firebase-config.js with your Firebase project settings

# Create .env file (or use the scripts to create it automatically)
echo "PORT=3000" > .env
echo "REDIS_HOST=localhost" >> .env
echo "REDIS_PORT=6379" >> .env
echo "REDIS_PASSWORD=" >> .env

# Start Redis (if not already running)
npm run redis:start

# Start the application
npm run dev
```

Open your browser and navigate to `http://localhost:3000`

## Firebase Configuration

To use this application, you need to create a Firebase project and enable Authentication:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password method)
4. Get your Firebase config object
5. Set up your environment variables:

   a. Copy the example environment file:
   ```bash
   # On Windows
   create-env.bat
   
   # On Unix/Linux/Mac
   ./create-env.sh
   ```
   
   b. Edit the `.env` file with your Firebase configuration:
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

> **Note**: The `.env` file is ignored by Git to keep your API keys secure.

## Setup Instructions - Docker

1. Clone the repository
2. Configure Firebase as described above
3. Make sure Docker and Docker Compose are installed
4. Run the application using Docker Compose:

   ```bash
   npm run docker:up
   # or
   docker-compose up -d
   ```

5. Open your browser and navigate to `http://localhost:3000`
6. To stop the application:

   ```bash
   npm run docker:down
   # or
   docker-compose down
   ```

## Setup Instructions - Local Development

1. Clone the repository
2. Configure Firebase as described above
3. Create a `.env` file in the root directory with the following variables:

   ```
   PORT=3000
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   ```

   Note: Leave REDIS_PASSWORD empty if your Redis server doesn't have authentication enabled.
   If your Redis server has a password, add it to the REDIS_PASSWORD field.

4. Install dependencies:

   ```bash
   npm install
   ```

5. Start the application:

   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

6. Open your browser and navigate to `http://localhost:3000`

## Running Redis Standalone

If you want to run just the Redis instance separately:

```bash
npm run redis:start
# or
docker run --name soft-talks-redis-instance -p 6379:6379 -v ./data:/data -d redis redis-server --save 60 1 --loglevel warning
```

Note: The default Docker Redis image doesn't have authentication enabled. If you need to enable password authentication, you'll need to modify the command to include `--requirepass yourpassword`.

## How It Works

The application uses Socket.io for real-time communication between clients and the server. Firebase handles user authentication, and Redis is used to store messages for persistence.

### User Authentication

Users can sign up or log in using email/password authentication via Firebase. Once authenticated, the user's profile information (username, email, photo URL) is sent to the server and stored in Redis.

### One-to-One Chat

Users can start a chat with any other online user by clicking on their name in the active users list. Messages are delivered in real-time if both users are online. If a user is offline, messages are stored and delivered when they come back online.

### Message Persistence

All messages between users are stored in Redis using a consistent naming pattern to ensure the same conversation can be retrieved regardless of which user initiates the chat. When a user opens a chat with another user, they receive the most recent messages from that conversation (up to 100 messages).

### Notifications

When a user receives a message while chatting with someone else, a notification appears next to the sender's name in the active users list.

## Available Scripts

- `npm start` - Start the application
- `npm run dev` - Start the application with nodemon for development
- `npm run docker:up` - Start the application with Docker Compose
- `npm run docker:down` - Stop the Docker containers
- `npm run redis:start` - Start Redis standalone with Docker
- `npm run redis:stop` - Stop and remove the Redis container

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Socket.io](https://socket.io/) for real-time communication
- [Firebase](https://firebase.google.com/) for authentication
- [Redis](https://redis.io/) for data persistence
- [Express](https://expressjs.com/) for the web server
- [Docker](https://www.docker.com/) for containerization

## Production Deployment

To prepare the application for production deployment, follow these steps:

### Environment Setup

1. Create a `.env` file based on the `.env.example.txt` template:
   ```bash
   copy .env.example.txt .env
   ```

2. Configure your environment variables in the `.env` file, especially:
   - `REDIS_PASSWORD` for secure Redis connection
   - `NODE_ENV=production` to enable production optimizations
   - Firebase configuration if applicable

### Docker Deployment

The application is containerized and ready for production deployment using Docker:

```bash
# Build and start containers in detached mode
docker-compose up -d

# Check container status
docker-compose ps

# View logs
docker-compose logs -f
```

### Scaling

For production scaling:

1. Use a Redis cluster instead of a single instance
2. Deploy multiple application instances behind a load balancer
3. Consider using container orchestration like Kubernetes for automated scaling

### Monitoring

The application includes:
- Health check endpoint at `/health`
- Structured logging with Winston
- Rate limiting to prevent abuse

### Security Considerations

- All Redis passwords should be strong and unique
- The application runs as a non-root user in Docker
- Helmet.js is configured for secure HTTP headers
- Rate limiting is enabled to prevent abuse

### Backup Strategy

Regular Redis data backups are configured with:
```
redis-server --save 60 1
```

This saves the dataset if at least 1 key changes in 60 seconds. 
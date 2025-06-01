# SoftTalks - Real-Time Chat Application

[![CI/CD Pipeline](https://github.com/JaydevVadachhak/softtalksapp/actions/workflows/main.yml/badge.svg)](https://github.com/JaydevVadachhak/softtalksapp/actions/workflows/main.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

A real-time chat application built with Node.js, Socket.io, and Redis Pub/Sub.

## Features

- Real-time messaging using Socket.io
- Multiple chat rooms
- One-to-one private messaging
- Active user list with status indicators
- Redis Pub/Sub for message broadcasting between server instances
- Message persistence using Redis for both room and private chats
- Responsive UI design
- Docker support for easy deployment

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Real-time Communication**: Socket.io
- **Message Broadcasting & Storage**: Redis Pub/Sub
- **Containerization**: Docker

## Prerequisites

- Node.js (v14 or higher)
- Redis server (local or remote)
- Docker and Docker Compose (optional)

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/JaydevVadachhak/softtalksapp.git
cd softtalksapp

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

## Setup Instructions - Docker

1. Clone the repository
2. Make sure Docker and Docker Compose are installed
3. Run the application using Docker Compose:

   ```bash
   npm run docker:up
   # or
   docker-compose up -d
   ```

4. Open your browser and navigate to `http://localhost:3000`
5. To stop the application:

   ```bash
   npm run docker:down
   # or
   docker-compose down
   ```

## Setup Instructions - Local Development

1. Clone the repository
2. Create a `.env` file in the root directory with the following variables:

   ```
   PORT=3000
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   ```

   Note: Leave REDIS_PASSWORD empty if your Redis server doesn't have authentication enabled.
   If your Redis server has a password, add it to the REDIS_PASSWORD field.

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the application:

   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Running Redis Standalone

If you want to run just the Redis instance separately:

```bash
npm run redis:start
# or
docker run --name soft-talks-redis-instance -p 6379:6379 -v ./data:/data -d redis redis-server --save 60 1 --loglevel warning
```

Note: The default Docker Redis image doesn't have authentication enabled. If you need to enable password authentication, you'll need to modify the command to include `--requirepass yourpassword`.

## How It Works

The application uses Socket.io for real-time communication between clients and the server. Redis Pub/Sub is used to broadcast messages between different server instances, allowing the application to scale horizontally.

### Room Chat

When a user sends a message in a chat room, the message is published to a Redis channel specific to that room and also stored in a Redis list for persistence. All server instances subscribe to these channels and broadcast the messages to the connected clients in the respective rooms.

When a user joins a room, they receive the most recent messages from that room (up to 50 messages).

### Private Chat

Users can initiate private conversations by clicking on a user's name in the active users list. Private messages are stored in Redis using a consistent naming pattern to ensure the same conversation can be retrieved regardless of which user initiates the chat.

Private messages are delivered directly to the recipient's socket if they are online, and notifications are shown if the private chat window is not currently open.

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
- [Redis](https://redis.io/) for pub/sub and data persistence
- [Express](https://expressjs.com/) for the web server
- [Docker](https://www.docker.com/) for containerization 
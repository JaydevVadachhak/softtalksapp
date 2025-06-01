#!/bin/bash

# SoftTalks Run Script

echo "SoftTalks Chat Application"
echo "--------------------------"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo "PORT=3000" > .env
    echo "REDIS_HOST=localhost" >> .env
    echo "REDIS_PORT=6379" >> .env
    echo "REDIS_PASSWORD=" >> .env
    echo ".env file created."
fi

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "Docker does not seem to be running, start it first and try again."
        exit 1
    fi
}

# Function to start the application with Docker
start_docker() {
    check_docker
    echo "Starting SoftTalks with Docker..."
    docker-compose up -d
    echo "SoftTalks is now running."
    echo "Open your browser and navigate to http://localhost:3000"
}

# Function to start the application without Docker
start_local() {
    echo "Starting SoftTalks locally..."
    echo "Make sure Redis is running at $(grep REDIS_HOST .env | cut -d= -f2):$(grep REDIS_PORT .env | cut -d= -f2)"
    npm install
    node server.js
}

# Function to stop the Docker containers
stop_docker() {
    check_docker
    echo "Stopping SoftTalks Docker containers..."
    docker-compose down
    echo "SoftTalks has been stopped."
}

# Function to start Redis standalone
start_redis() {
    check_docker
    echo "Starting Redis standalone..."
    mkdir -p data
    docker run --name soft-talks-redis-instance -p 6379:6379 -v ./data:/data -d redis redis-server --save 60 1 --loglevel warning
    echo "Redis is now running on port 6379."
}

# Main menu
case "$1" in
    docker)
        start_docker
        ;;
    local)
        start_local
        ;;
    stop)
        stop_docker
        ;;
    redis)
        start_redis
        ;;
    *)
        echo "Usage: $0 {docker|local|stop|redis}"
        echo ""
        echo "  docker - Start the application with Docker Compose"
        echo "  local  - Start the application locally (requires Redis)"
        echo "  stop   - Stop the Docker containers"
        echo "  redis  - Start Redis standalone with Docker"
        exit 1
esac

exit 0
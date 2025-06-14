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

# Function to display usage information
show_usage() {
    echo "Usage: $0 [options]"
    echo "Options:"
    echo "  -h, --help       Show this help message"
    echo "  -d, --dev        Run in development mode"
    echo "  -p, --prod       Run in production mode"
    echo "  --docker         Run using Docker"
    echo "  --docker-down    Stop Docker containers"
    echo "  --redis-only     Run only Redis container"
}

# Parse command-line arguments
if [ $# -eq 0 ]; then
    show_usage
    exit 1
fi

# Process arguments
while [ $# -gt 0 ]; do
    case "$1" in
        -h|--help)
            show_usage
            exit 0
            ;;
        -d|--dev)
            echo "Starting application in development mode..."
            npm run dev
            exit 0
            ;;
        -p|--prod)
            echo "Starting application in production mode..."
            npm run start:prod
            exit 0
            ;;
        --docker)
            echo "Starting Docker containers..."
            docker-compose up -d
            echo "Docker containers started. Access the application at http://localhost:3000"
            exit 0
            ;;
        --docker-down)
            echo "Stopping Docker containers..."
            docker-compose down
            exit 0
            ;;
        --redis-only)
            echo "Starting only Redis container..."
            npm run redis:start
            echo "Redis container started on port 6379"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
    shift
done

# Default behavior if we reach here
show_usage
exit 1
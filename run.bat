@echo off
setlocal

echo SoftTalks Chat Application
echo --------------------------

rem Check if .env file exists
if not exist .env (
    echo Creating .env file...
    echo PORT=3000 > .env
    echo REDIS_HOST=localhost >> .env
    echo REDIS_PORT=6379 >> .env
    echo REDIS_PASSWORD= >> .env
    echo .env file created.
)

rem Function to check if Docker is running
docker info > nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Docker does not seem to be running, start it first and try again.
    exit /b 1
)

if "%1"=="docker" (
    echo Starting SoftTalks with Docker...
    docker-compose up -d
    echo SoftTalks is now running.
    echo Open your browser and navigate to http://localhost:3000
) else if "%1"=="local" (
    echo Starting SoftTalks locally...
    echo Make sure Redis is running at localhost:6379
    call npm install
    node server.js
) else if "%1"=="stop" (
    echo Stopping SoftTalks Docker containers...
    docker-compose down
    echo SoftTalks has been stopped.
) else if "%1"=="redis" (
    echo Starting Redis standalone...
    mkdir data 2>nul
    docker run --name soft-talks-redis-instance -p 6379:6379 -v ./data:/data -d redis redis-server --save 60 1 --loglevel warning
    echo Redis is now running on port 6379.
) else (
    echo Usage: %0 {docker^|local^|stop^|redis}
    echo.
    echo   docker - Start the application with Docker Compose
    echo   local  - Start the application locally (requires Redis)
    echo   stop   - Stop the Docker containers
    echo   redis  - Start Redis standalone with Docker
    exit /b 1
)

exit /b 0
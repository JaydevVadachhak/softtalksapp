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

REM Function to display usage information
:show_usage
echo Usage: %0 [options]
echo Options:
echo   /h, /help       Show this help message
echo   /d, /dev        Run in development mode
echo   /p, /prod       Run in production mode
echo   /docker         Run using Docker
echo   /docker-down    Stop Docker containers
echo   /redis-only     Run only Redis container
goto :eof

REM Parse command-line arguments
if "%~1"=="" (
    call :show_usage
    exit /b 1
)

REM Process arguments
:parse_args
if "%~1"=="" goto :end_parse

if /i "%~1"=="/h" (
    call :show_usage
    exit /b 0
) else if /i "%~1"=="/help" (
    call :show_usage
    exit /b 0
) else if /i "%~1"=="/d" (
    echo Starting application in development mode...
    npm run dev
    exit /b 0
) else if /i "%~1"=="/dev" (
    echo Starting application in development mode...
    npm run dev
    exit /b 0
) else if /i "%~1"=="/p" (
    echo Starting application in production mode...
    npm run start:prod
    exit /b 0
) else if /i "%~1"=="/prod" (
    echo Starting application in production mode...
    npm run start:prod
    exit /b 0
) else if /i "%~1"=="/docker" (
    echo Starting Docker containers...
    docker-compose up -d
    echo Docker containers started. Access the application at http://localhost:3000
    exit /b 0
) else if /i "%~1"=="/docker-down" (
    echo Stopping Docker containers...
    docker-compose down
    exit /b 0
) else if /i "%~1"=="/redis-only" (
    echo Starting only Redis container...
    npm run redis:start
    echo Redis container started on port 6379
    exit /b 0
) else (
    echo Unknown option: %~1
    call :show_usage
    exit /b 1
)

shift
goto :parse_args

:end_parse
call :show_usage
exit /b 1
@echo off
echo Creating .env file from .env.example...

if exist .env (
    echo .env file already exists.
    echo If you want to recreate it, please delete it first.
    exit /b 1
)

if not exist .env.example (
    echo .env.example file not found!
    exit /b 1
)

copy .env.example .env
echo .env file created successfully.
echo Please edit the .env file and replace the placeholder values with your actual Firebase configuration.
echo.
echo Your Firebase configuration:
echo FIREBASE_API_KEY=AIzaSyBH2IBLdXjcTKE0Z590PRs2EDXqm5jxGcU
echo FIREBASE_AUTH_DOMAIN=softtalks-aeab0.firebaseapp.com
echo FIREBASE_PROJECT_ID=softtalks-aeab0
echo FIREBASE_STORAGE_BUCKET=softtalks-aeab0.appspot.com
echo FIREBASE_MESSAGING_SENDER_ID=238294991463
echo FIREBASE_APP_ID=1:238294991463:web:2d93f8652ffc20dc67cac2
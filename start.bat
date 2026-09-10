@echo off
setlocal
set PORT=3000
set URL=http://localhost:%PORT%

echo =========================================
echo    Starting Chinese Reader GU...
echo =========================================

:: Check if node_modules exists
if not exist "node_modules\" (
    echo Node dependencies not detected. Installing via npm install...
    call npm install
)

:: Launch a background helper to wait and open default browser
start "" cmd /c "timeout /t 2 /nobreak >nul & start %URL%"

:: Start the application dev server
npm run dev

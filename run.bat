@echo off
REM ============================================================
REM Air Quality Monitoring Application Launcher
REM ============================================================
REM This script starts the Flask development server.
REM Usage: run.bat
REM ============================================================

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║         🌍 Air Quality Monitoring Application                    ║
echo ║         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━                    ║
echo ║         Real-time AQI ^& Weather for Indian Cities               ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.

REM Get current time
for /f "tokens=1-3 delims=:." %%a in ("%time%") do (
    set "TIMESTAMP=%%a:%%b:%%c"
)

echo %TIMESTAMP% [INFO] Initializing application...
echo %TIMESTAMP% [INFO] Loading environment configuration...
echo %TIMESTAMP% [INFO] Starting Flask development server...
echo.

REM Navigate to core directory and run npm
cd /d "%~dp0.core"

REM Check if npm exists
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm not found. Please install Node.js first.
    pause
    exit /b 1
)

REM Run the development server
npm run dev

REM If we get here, the server stopped
echo.
echo [INFO] Server stopped.
pause

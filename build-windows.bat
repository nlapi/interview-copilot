@echo off
echo ===================================================
echo   Interview Copilot - Windows Desktop App Builder
echo ===================================================
echo.
echo This script will build a Windows desktop application with:
echo  - Auto-hide when screen sharing is detected
echo  - System tray access for discreet control
echo  - Global keyboard shortcuts
echo.
echo Building process will take a few minutes...
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo and run this script again.
    echo.
    pause
    exit /b 1
)

:: Check if npm is available
where npm >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm is not available
    echo Please ensure npm is installed with Node.js
    echo.
    pause
    exit /b 1
)

:: Check for dependencies
echo [1/5] Checking for dependencies...
call npm list electron-builder >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo - Installing required build dependencies...
    call npm install --save-dev electron-builder
)

:: Clean previous build output
echo [2/5] Cleaning previous builds...
IF EXIST "electron-dist" rmdir /s /q "electron-dist"
IF EXIST "dist" rmdir /s /q "dist"

:: Build Vue.js application
echo [3/5] Building Vue.js application...
call npm run build

if %ERRORLEVEL% neq 0 (
    echo ERROR: Vue.js build failed with error code %ERRORLEVEL%
    echo Please check for errors above.
    echo.
    pause
    exit /b %ERRORLEVEL%
)

:: Build Electron application with custom config
echo [4/5] Building Electron Windows application...
call npx electron-builder build --win --config electron-builder.json

if %ERRORLEVEL% neq 0 (
    echo ERROR: Electron build failed with error code %ERRORLEVEL%
    echo Please check for errors above.
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo [5/5] Build complete!
echo.
echo ===================================================
echo   Success! Your application has been built.
echo ===================================================
echo.
echo The installer can be found at:
echo electron-dist\Interview-Copilot-Setup-*.exe
echo.
echo The portable version can be found at:
echo electron-dist\Interview-Copilot-Portable-*.exe
echo.
echo After installing, remember to:
echo 1. Enter your OpenAI API key in the Settings
echo 2. Use Ctrl+Shift+I to hide/show during interviews
echo 3. Access from system tray when hidden
echo.
echo Thank you for using Interview Copilot!
echo.
pause
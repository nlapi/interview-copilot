@echo off
echo Building Interview Copilot Desktop App for Windows...

:: Clean previous build output
echo Cleaning previous builds...
IF EXIST "electron-dist" rmdir /s /q "electron-dist"
IF EXIST "dist" rmdir /s /q "dist"

:: Build Vue.js application
echo Building Vue.js application...
call npm run build

:: Build Electron application with custom config
echo Building Electron application...
call npx electron-builder build --win --config electron-builder.json

echo Build complete! The installer can be found in the electron-dist folder.
echo.
pause

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { detectDisplayCapture } = require('detect-display-capture');

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 900,
    height: 680,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'public/icon.png'),
    title: 'Interview Copilot'
  });

  // Load the app
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:5000'
      : `file://${path.join(__dirname, 'dist/index.html')}`
  );

  // Open DevTools in development mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Set up screen capture detection
  setupScreenCaptureDetection(mainWindow);
}

// Set up screen capture detection
function setupScreenCaptureDetection(window) {
  // Check for screen sharing every 5 seconds
  const detectionInterval = setInterval(async () => {
    try {
      const isScreenBeingCaptured = await detectDisplayCapture();
      window.webContents.send('screen-sharing-status', isScreenBeingCaptured);
    } catch (error) {
      console.error('Error detecting screen capture:', error);
    }
  }, 5000);

  window.on('closed', () => {
    clearInterval(detectionInterval);
  });
}

// Create window when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

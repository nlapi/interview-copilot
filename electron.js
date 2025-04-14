
const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const desktopCapturer = require('electron').desktopCapturer;

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow;
let tray = null;
let isHidden = false;

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

  // Setup tray icon
  createTray();

  // Setup global shortcuts for hiding/showing
  setupShortcuts();

  // Setup screen capture detection
  setupScreenCaptureDetection(mainWindow);
}

// Create tray icon
function createTray() {
  const iconPath = path.join(__dirname, 'public/icon.png');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Show/Hide App', 
      click: () => toggleWindowVisibility() 
    },
    { 
      label: 'Quit', 
      click: () => app.quit() 
    }
  ]);
  
  tray.setToolTip('Interview Copilot');
  tray.setContextMenu(contextMenu);
  
  // Double-click on tray icon to toggle window
  tray.on('double-click', () => {
    toggleWindowVisibility();
  });
}

// Toggle window visibility
function toggleWindowVisibility() {
  if (isHidden) {
    mainWindow.show();
    isHidden = false;
  } else {
    mainWindow.hide();
    isHidden = true;
  }
}

// Setup global shortcuts
function setupShortcuts() {
  // Register Ctrl+Shift+I to toggle window visibility
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    toggleWindowVisibility();
  });
}

// Setup screen capture detection
function setupScreenCaptureDetection(window) {
  // Check for screen capture every 5 seconds
  const detectionInterval = setInterval(async () => {
    try {
      // Use desktopCapturer to get all sources
      const sources = await desktopCapturer.getSources({ types: ['screen'] });
      
      // Check if any source is currently being captured
      let isScreenBeingCaptured = false;
      for (const source of sources) {
        if (source.display_id && source.name.includes('Screen')) {
          // This is a heuristic approach - not 100% reliable but provides a signal
          // If we detect a screen sharing is active, hide the window
          isScreenBeingCaptured = true;
          if (!isHidden) {
            mainWindow.hide();
            isHidden = true;
          }
          break;
        }
      }
      
      // Send status to renderer process
      window.webContents.send('screen-sharing-status', isScreenBeingCaptured);
    } catch (error) {
      console.error('Error detecting screen capture:', error);
    }
  }, 5000);

  window.on('closed', () => {
    clearInterval(detectionInterval);
  });
}

// Set up IPC listeners for window control
function setupIPCListeners() {
  // Listen for toggle window visibility request
  ipcMain.on('toggle-window-visibility', () => {
    toggleWindowVisibility();
  });
  
  // Handle get window state request
  ipcMain.handle('get-window-state', () => {
    return {
      isVisible: mainWindow && !mainWindow.isMinimized() && mainWindow.isVisible(),
      isHidden: isHidden
    };
  });
}

// Create window when Electron is ready
app.whenReady().then(() => {
  createWindow();
  setupIPCListeners();
});

// Emit window visibility event when shown
app.on('browser-window-focus', () => {
  if (mainWindow) {
    mainWindow.webContents.send('window-visibility-change', true);
  }
});

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

// Clean up global shortcuts when app is about to quit
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

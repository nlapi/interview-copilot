
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
let autoShowAfterScreenShare = false; // Default is not to auto-show after screen sharing ends

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
  
  const updateContextMenu = () => {
    const contextMenu = Menu.buildFromTemplate([
      { 
        label: isHidden ? 'Show App' : 'Hide App', 
        click: () => toggleWindowVisibility() 
      },
      { type: 'separator' },
      {
        label: 'Interview Mode',
        submenu: [
          {
            label: 'Auto-hide on Screen Share',
            type: 'checkbox',
            checked: true, // Always enabled by default
            enabled: false // Cannot be disabled for safety
          },
          {
            label: 'Auto-show after Screen Share Ends',
            type: 'checkbox',
            checked: autoShowAfterScreenShare,
            click: () => {
              autoShowAfterScreenShare = !autoShowAfterScreenShare;
              updateContextMenu();
            }
          }
        ]
      },
      { type: 'separator' },
      {
        label: 'Start Recording',
        click: () => {
          if (!isHidden && mainWindow) {
            mainWindow.webContents.send('tray-start-recording');
          }
        }
      },
      {
        label: 'Stop Recording',
        click: () => {
          if (!isHidden && mainWindow) {
            mainWindow.webContents.send('tray-stop-recording');
          }
        }
      },
      {
        label: 'Ask GPT',
        click: () => {
          if (!isHidden && mainWindow) {
            mainWindow.webContents.send('tray-ask-gpt');
          }
        }
      },
      { type: 'separator' },
      { 
        label: 'Quit Interview Copilot', 
        click: () => app.quit() 
      }
    ]);
    
    tray.setContextMenu(contextMenu);
  };
  
  updateContextMenu();
  
  // Store updateContextMenu function for later use
  tray.updateContextMenu = updateContextMenu;
  
  tray.setToolTip('Interview Copilot');
  
  // Double-click on tray icon to toggle window
  tray.on('double-click', () => {
    toggleWindowVisibility();
    tray.updateContextMenu();
  });
}

// Toggle window visibility
function toggleWindowVisibility() {
  if (isHidden) {
    mainWindow.show();
    isHidden = false;
    tray.setToolTip('Interview Copilot');
  } else {
    mainWindow.hide();
    isHidden = true;
    tray.setToolTip('Interview Copilot (Hidden)');
  }
  
  // Update the tray menu to reflect the new state
  if (tray && tray.updateContextMenu) {
    tray.updateContextMenu();
  }
}

// Setup global shortcuts
function setupShortcuts() {
  // Register Ctrl+Shift+I to toggle window visibility (main shortcut)
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    toggleWindowVisibility();
  });
  
  // Alternative shortcut: Ctrl+Alt+H (Hide/Show)
  globalShortcut.register('CommandOrControl+Alt+H', () => {
    toggleWindowVisibility();
  });
  
  // Ctrl+Alt+R to start recording
  globalShortcut.register('CommandOrControl+Alt+R', () => {
    if (!isHidden && mainWindow) {
      mainWindow.webContents.send('tray-start-recording');
    }
  });
  
  // Ctrl+Alt+S to stop recording
  globalShortcut.register('CommandOrControl+Alt+S', () => {
    if (!isHidden && mainWindow) {
      mainWindow.webContents.send('tray-stop-recording');
    }
  });
  
  // Ctrl+Alt+G to ask GPT
  globalShortcut.register('CommandOrControl+Alt+G', () => {
    if (!isHidden && mainWindow) {
      mainWindow.webContents.send('tray-ask-gpt');
    }
  });
}

// Setup screen capture detection
function setupScreenCaptureDetection(window) {
  // Check for screen capture more frequently (every 2 seconds)
  const detectionInterval = setInterval(async () => {
    try {
      // Use desktopCapturer to get all sources
      const sources = await desktopCapturer.getSources({ 
        types: ['screen', 'window'],
        thumbnailSize: { width: 0, height: 0 }  // Don't need thumbnails, improves performance
      });
      
      // Check if any source is currently being captured
      let isScreenBeingCaptured = false;
      
      // Several indicators can suggest screen sharing is happening
      const systemDisplays = sources.filter(source => 
        source.display_id || 
        source.name.includes('Screen') || 
        source.name.includes('Display') ||
        source.name.includes('Entire')
      );
      
      // If we have multiple system display sources, it's likely screen sharing is happening
      if (systemDisplays.length > 1) {
        isScreenBeingCaptured = true;
      }
      
      // Additional heuristics for common video conference apps
      const conferenceWindows = sources.filter(source => 
        source.name.includes('Zoom') || 
        source.name.includes('Teams') || 
        source.name.includes('Meet') ||
        source.name.includes('Webex') ||
        source.name.includes('Skype')
      );
      
      if (conferenceWindows.length > 0) {
        // Conference software is running, be more cautious
        isScreenBeingCaptured = true;
      }
      
      // Take action if screen is being captured
      if (isScreenBeingCaptured && !isHidden) {
        mainWindow.hide();
        isHidden = true;
        // Show notification in tray (tooltip only)
        tray.setToolTip('Interview Copilot (Hidden - Screen sharing detected)');
      } else if (!isScreenBeingCaptured && isHidden && autoShowAfterScreenShare) {
        // Only auto-show if the setting is enabled
        mainWindow.show();
        isHidden = false;
        tray.setToolTip('Interview Copilot');
      }
      
      // Send status to renderer process
      window.webContents.send('screen-sharing-status', isScreenBeingCaptured);
    } catch (error) {
      console.error('Error detecting screen capture:', error);
    }
  }, 2000);

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
  
  // Listen for window show request
  ipcMain.on('show-window', () => {
    if (isHidden) {
      mainWindow.show();
      isHidden = false;
      if (tray && tray.updateContextMenu) {
        tray.updateContextMenu();
      }
    }
  });
  
  // Listen for window hide request
  ipcMain.on('hide-window', () => {
    if (!isHidden) {
      mainWindow.hide();
      isHidden = true;
      if (tray && tray.updateContextMenu) {
        tray.updateContextMenu();
      }
    }
  });
  
  // Listen for toggle auto-show after screen share
  ipcMain.on('toggle-auto-show', (event, value) => {
    autoShowAfterScreenShare = value === undefined ? !autoShowAfterScreenShare : !!value;
    if (tray && tray.updateContextMenu) {
      tray.updateContextMenu();
    }
  });
  
  // Listen for any screen-sharing-related messages
  ipcMain.on('screen-sharing-detected', (event, isDetected) => {
    if (isDetected && !isHidden) {
      mainWindow.hide();
      isHidden = true;
      tray.setToolTip('Interview Copilot (Hidden - Screen sharing detected)');
      if (tray && tray.updateContextMenu) {
        tray.updateContextMenu();
      }
    }
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

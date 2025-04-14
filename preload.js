
const { ipcRenderer, contextBridge } = require('electron');

// Expose IPC APIs to renderer process via contextBridge for security
contextBridge.exposeInMainWorld('electron', {
  // Expose ipcRenderer for event handling
  ipcRenderer: {
    // Allow sending messages to main process
    send: (channel, data) => {
      const validChannels = [
        'toggle-window-visibility', 
        'show-window', 
        'hide-window',
        'toggle-auto-show',
        'screen-sharing-detected'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    
    // Allow receiving messages from main process
    on: (channel, func) => {
      const validChannels = [
        'screen-sharing-status', 
        'window-visibility-change',
        'tray-start-recording',
        'tray-stop-recording',
        'tray-ask-gpt'
      ];
      if (validChannels.includes(channel)) {
        // Remove existing listeners to avoid duplicates
        ipcRenderer.removeAllListeners(channel);
        // Add new listener
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    
    // Allow removing listeners
    removeAllListeners: (channel) => {
      const validChannels = [
        'screen-sharing-status', 
        'window-visibility-change',
        'tray-start-recording',
        'tray-stop-recording',
        'tray-ask-gpt'
      ];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
      }
    },
    
    // Allow invoking main process functions and getting results
    invoke: (channel, ...args) => {
      const validChannels = ['get-window-state'];
      if (validChannels.includes(channel)) {
        return ipcRenderer.invoke(channel, ...args);
      }
      return Promise.reject(new Error(`Unauthorized IPC invoke to ${channel}`));
    }
  },
  
  // Add helper functions for common operations
  app: {
    // Check if app is in electron environment
    isElectron: true,
    
    // Get current window state
    getWindowState: async () => {
      return ipcRenderer.invoke('get-window-state');
    },
    
    // Toggle window visibility
    toggleWindowVisibility: () => {
      ipcRenderer.send('toggle-window-visibility');
    },
    
    // Show window
    showWindow: () => {
      ipcRenderer.send('show-window');
    },
    
    // Hide window
    hideWindow: () => {
      ipcRenderer.send('hide-window');
    }
  }
});

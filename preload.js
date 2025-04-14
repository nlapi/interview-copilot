
const { ipcRenderer, contextBridge } = require('electron');

// Expose IPC APIs to renderer process
window.addEventListener('DOMContentLoaded', () => {
  window.electronAPI = {
    // Screen sharing status change events
    onScreenSharingStatusChange: (callback) => {
      ipcRenderer.on('screen-sharing-status', (_, isScreenBeingCaptured) => {
        callback(isScreenBeingCaptured);
      });
    },
    
    // Window visibility change events
    onWindowVisibilityChange: (callback) => {
      ipcRenderer.on('window-visibility-change', (_, isVisible) => {
        callback(isVisible);
      });
    },
    
    // Toggle window visibility via IPC
    toggleWindowVisibility: () => {
      ipcRenderer.send('toggle-window-visibility');
    },
    
    // Get current window state
    getWindowState: async () => {
      return ipcRenderer.invoke('get-window-state');
    }
  };
});

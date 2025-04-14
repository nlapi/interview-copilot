
const { ipcRenderer } = require('electron');

// Expose screen sharing detection to renderer process
window.addEventListener('DOMContentLoaded', () => {
  window.electronAPI = {
    onScreenSharingStatusChange: (callback) => {
      ipcRenderer.on('screen-sharing-status', (_, isScreenBeingCaptured) => {
        callback(isScreenBeingCaptured);
      });
    }
  };
});

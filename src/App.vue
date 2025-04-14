<template>
  <div id="app" :class="{ 'stealth-mode': isStealthMode }">
    <div class="stealth-indicator" v-if="isScreenShared">
      Screen is being shared! Stealth mode activated.
    </div>
    <el-menu :default-active="$router.currentRoute.path" mode="horizontal" :router="true">
      <el-menu-item index="/">Interview Copilot</el-menu-item>
      <el-menu-item index="/setting">Setting</el-menu-item>
    </el-menu>
    <router-view class="router_view"/>
    
    <!-- Notification component for app status -->
    <HideNotification 
      :visible.sync="notificationVisible"
      :type="notificationType"
      :title="notificationTitle"
      :message="notificationMessage"
      :duration="5000"
    />
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  transition: opacity 0.3s ease, background-color 0.3s ease;
}

/* Stealth mode styles */
#app.stealth-mode {
  opacity: 0.6;
  background-color: rgba(255, 255, 255, 0.9);
}

.stealth-indicator {
  position: fixed;
  top: 10px;
  right: 10px;
  background-color: rgba(255, 0, 0, 0.7);
  color: white;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 12px;
  z-index: 9999;
}

.router_view {
  margin-top: 10px;
}

/* Keyboard shortcut indicator */
.keyboard-shortcut {
  display: inline-block;
  padding: 2px 4px;
  background: #f1f1f1;
  border-radius: 3px;
  border: 1px solid #ddd;
  color: #333;
  font-family: monospace;
  margin: 0 2px;
}
</style>
<script>
import { mapGetters } from 'vuex';
import HideNotification from '@/components/HideNotification.vue';

export default {
  name: 'App',
  components: {
    HideNotification
  },
  computed: {},
  data() {
    return {
      activeIndex: "/",
      isScreenShared: false,
      isStealthMode: false,
      notificationVisible: false,
      notificationType: 'info',
      notificationTitle: '',
      notificationMessage: '',
    }
  },
  methods: {
    showNotification(type, title, message) {
      this.notificationType = type;
      this.notificationTitle = title;
      this.notificationMessage = message;
      this.notificationVisible = true;
    },
    toggleStealthMode() {
      this.isStealthMode = !this.isStealthMode;
      console.log('Stealth mode toggled:', this.isStealthMode);
      
      if (this.isStealthMode) {
        this.showNotification(
          'warning',
          'Stealth Mode Activated', 
          'The application appearance has been dimmed. Press Ctrl+Alt+S to toggle.'
        );
      } else {
        this.showNotification(
          'success',
          'Stealth Mode Deactivated', 
          'Application returned to normal appearance.'
        );
      }
    }
  },
  mounted() {
    console.log("App mounted");
    
    // Check if we're in Electron environment
    if (window.electronAPI) {
      console.log("Electron API detected");
      
      // Listen for screen sharing status changes
      window.electronAPI.onScreenSharingStatusChange((isSharing) => {
        console.log('Screen sharing detected:', isSharing);
        
        // Only show notification if the state has changed
        if (isSharing && !this.isScreenShared) {
          this.showNotification(
            'warning',
            'Screen Sharing Detected',
            'Application will be automatically hidden. The window will reappear when screen sharing ends.'
          );
        } else if (!isSharing && this.isScreenShared) {
          this.showNotification(
            'info',
            'Screen Sharing Ended',
            'Application visibility has been restored.'
          );
        }
        
        this.isScreenShared = isSharing;
        this.isStealthMode = isSharing;
      });
      
      // Listen for window visibility changes
      window.electronAPI.onWindowVisibilityChange((isVisible) => {
        console.log('Window visibility changed:', isVisible);
        
        if (isVisible) {
          this.showNotification(
            'success',
            'Window Visible',
            'Press Ctrl+Shift+I to hide the window during an interview.'
          );
        }
      });
    }

    // Add keyboard shortcut for toggling stealth mode manually (Ctrl+Alt+S)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.altKey && e.key === 's') {
        this.toggleStealthMode();
      }
    });
    
    // Show initial notification about keyboard shortcuts
    setTimeout(() => {
      this.showNotification(
        'info',
        'Keyboard Shortcuts',
        'Use <span class="keyboard-shortcut">Ctrl+Shift+I</span> to hide/show window. ' +
        'Use <span class="keyboard-shortcut">Ctrl+Alt+S</span> to toggle stealth mode (dimmed appearance).'
      );
    }, 2000);
  }
}
</script>